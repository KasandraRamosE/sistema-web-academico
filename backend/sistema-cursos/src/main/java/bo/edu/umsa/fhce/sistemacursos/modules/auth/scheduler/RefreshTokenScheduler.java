package bo.edu.umsa.fhce.sistemacursos.modules.auth.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import bo.edu.umsa.fhce.sistemacursos.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenScheduler {

    private final AuthService authService;

    // Una vez al día alcanza: la tabla solo acumula filas muertas (revocadas
    // o expiradas), nada urgente depende de que se borren rápido.
    @Scheduled(cron = "${app.jwt.limpieza-cron:0 0 3 * * *}")
    public void limpiarTokensVencidos() {
        int eliminados = authService.limpiarRefreshTokensVencidos();
        if (eliminados > 0) {
            log.info("Scheduler de refresh tokens: {} filas revocadas/expiradas eliminadas", eliminados);
        }
    }
}
