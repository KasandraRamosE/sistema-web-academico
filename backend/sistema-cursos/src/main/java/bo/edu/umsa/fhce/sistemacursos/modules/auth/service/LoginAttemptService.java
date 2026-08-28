package bo.edu.umsa.fhce.sistemacursos.modules.auth.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIntentoFallido(Long idUsuario, int maxIntentosFallidos, long bloqueoMinutos) {
        usuarioRepository.incrementarIntentosFallidos(
            idUsuario, maxIntentosFallidos, LocalDateTime.now().plusMinutes(bloqueoMinutos));
    }
}
