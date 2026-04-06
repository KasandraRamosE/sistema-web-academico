package bo.edu.umsa.fhce.sistemacursos.modules.certificado.event;

import bo.edu.umsa.fhce.sistemacursos.modules.certificado.entity.Certificado;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.repository.CertificadoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.certificado.service.CertificadoPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class CertificadoPdfGenerationListener {

    private final CertificadoRepository certificadoRepository;
    private final CertificadoPdfService pdfService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCertificadoEmitido(CertificadoEmitidoEvent event) {
        Certificado certificado = certificadoRepository
            .findById(event.certificadoId())
            .orElse(null);

        if (certificado == null) {
            log.warn("Certificado {} no encontrado para generar PDF", event.certificadoId());
            return;
        }

        try {
            String rutaPdf = pdfService.generarYGuardar(certificado, event.rutaPlantilla());
            certificado.setArchivoGenerado(rutaPdf);
            certificadoRepository.save(certificado);
        } catch (RuntimeException e) {
            log.error("Error generando PDF del certificado {}",
                event.certificadoId(), e);
        }
    }
}
