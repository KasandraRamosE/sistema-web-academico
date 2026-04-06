package bo.edu.umsa.fhce.sistemacursos.modules.auth.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.LoginRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.LoginResponse;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.MensajeResponse;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.RegistroRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.VerificarEmailRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.entity.CodigoVerificacion;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.repository.CodigoVerificacionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Participante;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Rol;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.ParticipanteRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.RolRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import bo.edu.umsa.fhce.sistemacursos.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    private final ParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CodigoVerificacionRepository codigoRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.verificacion.expiracion-horas:24}")
    private int expiracionHoras;

    public LoginResponse login(LoginRequest request) {
        // 1. Delegar la autenticación a Spring Security
        //    Spring internamente llama a CustomUserDetailsService.loadUserByUsername
        //    y luego verifica la contraseña con BCrypt
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        // 2. Generar el JWT con los datos del usuario autenticado
        String jwt = tokenProvider.generateToken(authentication);

        // 3. Construir la respuesta con los datos del usuario
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();

        // Nota: nombres y apellidos los cargamos por separado en el controller
        // o podemos extender CustomUserDetails — por ahora lo simplificamos
        return new LoginResponse(
            jwt,
            "Bearer",
            userDetails.getIdUsuario(),
            userDetails.getUsername(),
            userDetails.getNombres(),
            userDetails.getApellidos(),
            roles
        );

        
    }
    // ── Registro de usuario externo ──────────────────────────────────────────
    @Transactional
    public MensajeResponse registrar(RegistroRequest request) {

        // 1. Validar unicidad
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username '" + request.getUsername() + "' ya está en uso", 409);
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El email '" + request.getEmail() + "' ya está registrado", 409);
        }

        // 2. Buscar rol PARTICIPANTE antes de crear el usuario
        Rol rolParticipante = rolRepository.findByNombre("PARTICIPANTE")
            .orElseThrow(() -> new RuntimeException("Rol PARTICIPANTE no encontrado en BD"));

        // 3. Crear y guardar el usuario
        Usuario usuario = Usuario.builder()
            .username(request.getUsername())
            .nombres(request.getNombres())
            .apellidos(request.getApellidos())
            .email(request.getEmail())
            .emailVerificado(false)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .estado(Usuario.EstadoUsuario.ACTIVO)
            .build();

        usuario.getRoles().add(rolParticipante);
        usuario = usuarioRepository.save(usuario);  // aquí se genera el ID

        // 4. Crear perfil participante DESPUÉS del save (ya tiene ID)
        Participante participante = new Participante();
        participante.setUsuario(usuario);  // @MapsId toma el ID de aquí
        participante.setTipoParticipante(
            Participante.TipoParticipante.valueOf(request.getTipoParticipante())
        );
        participanteRepository.save(participante);

        // 5. Generar y guardar código de verificación
        codigoRepository.invalidarCodigosAnteriores(
            usuario.getIdUsuario(), CodigoVerificacion.TipoCodigo.REGISTRO);

        String codigo = generarCodigo6Digitos();
        CodigoVerificacion codigoVerificacion = CodigoVerificacion.builder()
            .usuario(usuario)
            .codigo(codigo)
            .tipo(CodigoVerificacion.TipoCodigo.REGISTRO)
            .fechaCreacion(LocalDateTime.now())
            .fechaExpiracion(LocalDateTime.now().plusHours(expiracionHoras))
            .usado(false)
            .build();
        codigoRepository.save(codigoVerificacion);

        // 6. Enviar email (async)
        emailService.enviarCodigoVerificacion(
            usuario.getEmail(), usuario.getNombres(), codigo);

        log.info("Usuario registrado: {} — código enviado a {}",
                usuario.getUsername(), usuario.getEmail());

        return new MensajeResponse(
            "Registro exitoso. Revisa tu correo " + request.getEmail() +
            " para verificar tu cuenta."
        );
    }
   
    // ── Verificación de email ────────────────────────────────────────────────
    @Transactional
    public MensajeResponse verificarEmail(VerificarEmailRequest request) {

        // 1. Buscar el usuario
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new BusinessException("Usuario no encontrado", 404));

        // 2. Verificar que no esté ya verificado
        if (usuario.isEmailVerificado()) {
            return new MensajeResponse("Tu cuenta ya está verificada. Puedes iniciar sesión.");
        }

        // 3. Buscar código activo
        CodigoVerificacion codigo = codigoRepository
            .findUltimoCodigoActivo(usuario.getIdUsuario(), CodigoVerificacion.TipoCodigo.REGISTRO)
            .orElseThrow(() -> new BusinessException(
                "No hay un código de verificación activo. Solicita uno nuevo.", 400));

        // 4. Verificar que el código coincida y no haya expirado
        if (!codigo.getCodigo().equals(request.getCodigo())) {
            throw new BusinessException("Código de verificación incorrecto", 400);
        }
        if (!codigo.esValido()) {
            throw new BusinessException("El código ha expirado. Solicita uno nuevo.", 400);
        }

        // 5. Activar cuenta y marcar código como usado
        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);

        codigo.setUsado(true);
        codigo.setFechaUso(LocalDateTime.now());
        codigoRepository.save(codigo);

        log.info("Email verificado para usuario: {}", usuario.getUsername());

        return new MensajeResponse("¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.");
    }

    // ── Reenviar código ──────────────────────────────────────────────────────
    @Transactional
    public MensajeResponse reenviarCodigo(String username) {

        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("Usuario no encontrado", 404));

        if (usuario.isEmailVerificado()) {
            throw new BusinessException("Esta cuenta ya está verificada.", 400);
        }

        // Invalidar anteriores y generar nuevo
        codigoRepository.invalidarCodigosAnteriores(
            usuario.getIdUsuario(), CodigoVerificacion.TipoCodigo.REGISTRO);

        String nuevoCodigo = generarCodigo6Digitos();

        CodigoVerificacion codigo = CodigoVerificacion.builder()
            .usuario(usuario)
            .codigo(nuevoCodigo)
            .tipo(CodigoVerificacion.TipoCodigo.REGISTRO)
            .usado(false)
            .fechaCreacion(LocalDateTime.now())
            .fechaExpiracion(LocalDateTime.now().plusHours(expiracionHoras))
            .build();
        codigoRepository.save(codigo);

        emailService.enviarCodigoVerificacion(
            usuario.getEmail(), usuario.getNombres(), nuevoCodigo);

        return new MensajeResponse("Se envió un nuevo código a " + usuario.getEmail());
    }

    // ── Utilidad: genera código numérico de 6 dígitos ───────────────────────
    private String generarCodigo6Digitos() {
        // SecureRandom es criptográficamente seguro (mejor que Math.random())
        SecureRandom random = new SecureRandom();
        int numero = 100000 + random.nextInt(900000); // rango: 100000–999999
        return String.valueOf(numero);
    }
}