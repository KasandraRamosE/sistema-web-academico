package bo.edu.umsa.fhce.sistemacursos.modules.auth.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

// Bean separado a propósito: el incremento del contador de intentos
// fallidos necesita confirmarse en su PROPIA transacción (REQUIRES_NEW),
// sin importar que AuthService.login() termine lanzando una
// BusinessException justo después (credenciales inválidas). Si este código
// viviera dentro de AuthService y AuthService.login() fuera @Transactional,
// el rollback de esa excepción deshacía también el incremento del
// contador — dejando el bloqueo por fuerza bruta inoperante.
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIntentoFallido(Long idUsuario, int maxIntentosFallidos, long bloqueoMinutos) {
        // UPDATE atómico a nivel de BD — evita que intentos concurrentes
        // pisen el contador entre sí (lectura-incremento-escritura en
        // memoria permitía perder incrementos bajo requests paralelos).
        usuarioRepository.incrementarIntentosFallidos(idUsuario);

        int intentos = usuarioRepository.findById(idUsuario)
            .map(Usuario::getIntentosFallidos)
            .orElse(0);

        if (intentos >= maxIntentosFallidos) {
            usuarioRepository.bloquearHasta(idUsuario, LocalDateTime.now().plusMinutes(bloqueoMinutos));
        }
    }
}
