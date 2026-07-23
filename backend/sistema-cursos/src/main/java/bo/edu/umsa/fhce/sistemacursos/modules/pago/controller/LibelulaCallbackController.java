package bo.edu.umsa.fhce.sistemacursos.modules.pago.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.service.InscripcionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// Callback público de Libélula (Guía de Integración v2.145, sección "PAGO EXITOSO").
// Libélula hace un GET simple a esta URL con el transaction_id — SIN firma ni
// monto. Por eso nunca se confirma el pago aquí directamente: este endpoint
// solo dispara una verificación server-to-server contra Libélula
// (InscripcionService.confirmarPagoLibelula), que es la única fuente confiable.
//
// Debe quedar público en SecurityConfig: Libélula no envía JWT.
@RestController
@RequestMapping("/payments/libelula")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pagos", description = "Callback público de la pasarela Libélula")
public class LibelulaCallbackController {

    private final InscripcionService inscripcionService;

    @GetMapping("/callback")
    @Operation(summary = "Callback de Libélula tras un pago exitoso (uso interno de Libélula)")
    public ResponseEntity<Void> pagoExitoso(@RequestParam("transaction_id") String transactionId) {
        log.info("Callback de Libélula recibido — transaction_id={}", transactionId);
        inscripcionService.confirmarPagoLibelula(transactionId);
        return ResponseEntity.noContent().build();
    }
}
