package bo.edu.umsa.fhce.sistemacursos.modules.certificado.service;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.dto.EmitirCertificadoRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.entity.Certificado;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.repository.AnulacionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.repository.CertificadoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.repository.CoordinadorCarreraRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository.AsistenciaRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository.EvaluacionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.Evento;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.entity.Inscripcion;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository.InscripcionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.plantilla.service.PlantillaService;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Rol;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificadoServiceTest {

    @Mock
    private CertificadoRepository certificadoRepository;

    @Mock
    private AnulacionRepository anulacionRepository;

    @Mock
    private InscripcionRepository inscripcionRepository;

    @Mock
    private EvaluacionRepository evaluacionRepository;

    @Mock
    private AsistenciaRepository asistenciaRepository;

    @Mock
    private CoordinadorCarreraRepository coordinadorCarreraRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CertificadoPdfService pdfService;

    @Mock
    private PlantillaService plantillaService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private CertificadoService certificadoService;

    @BeforeEach
    void setUpSecurityContext() {
        Usuario admin = buildUserWithRole("ADMINISTRADOR");
        CustomUserDetails details = new CustomUserDetails(admin);
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void emitir_shouldRejectDuplicateCertificate() {
        EmitirCertificadoRequest request = new EmitirCertificadoRequest();
        request.setIdInscripcion(10L);

        Inscripcion inscripcion = Inscripcion.builder()
            .idInscripcion(10L)
            .build();

        Certificado existente = Certificado.builder()
            .estadoEmision(Certificado.EstadoEmision.GENERADO)
            .build();

        when(inscripcionRepository.findByIdForUpdate(10L)).thenReturn(inscripcion);
        when(certificadoRepository.findByInscripcion_IdInscripcion(10L))
            .thenReturn(Optional.of(existente));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> certificadoService.emitir(request));

        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    void emitir_eventWithoutAttendance_shouldFail() {
        EmitirCertificadoRequest request = new EmitirCertificadoRequest();
        request.setIdInscripcion(20L);

        Usuario admin = buildUserWithRole("ADMINISTRADOR");
        when(usuarioRepository.findById(admin.getIdUsuario()))
            .thenReturn(Optional.of(admin));

        Evento evento = Evento.builder().idEvento(99L).build();
        Inscripcion inscripcion = Inscripcion.builder()
            .idInscripcion(20L)
            .evento(evento)
            .build();

        when(inscripcionRepository.findByIdForUpdate(20L)).thenReturn(inscripcion);
        when(certificadoRepository.findByInscripcion_IdInscripcion(20L))
            .thenReturn(Optional.empty());
        when(asistenciaRepository.existsByInscripcion_IdInscripcion(20L))
            .thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
            () -> certificadoService.emitir(request));

        assertEquals(400, ex.getHttpStatus());
    }

    private Usuario buildUserWithRole(String roleName) {
        Rol rol = new Rol();
        rol.setNombre(roleName);

        return Usuario.builder()
            .idUsuario(1L)
            .username("admin")
            .nombres("Admin")
            .apellidos("User")
            .email("admin@example.com")
            .roles(Set.of(rol))
            .build();
    }
}
