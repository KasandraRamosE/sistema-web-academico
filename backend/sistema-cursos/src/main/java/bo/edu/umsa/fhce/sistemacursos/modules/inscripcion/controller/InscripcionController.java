package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.controller;

import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.dto.*;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.service.InscripcionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inscripciones")
@RequiredArgsConstructor
@Tag(name = "Inscripciones", description = "Inscripciones y pagos de cursos y eventos")
public class InscripcionController {

    private final InscripcionService inscripcionService;

    @PostMapping
    @PreAuthorize("hasRole('PARTICIPANTE')")
    @Operation(summary = "Inscribirse a un curso o evento")
    public ResponseEntity<InscripcionDto> inscribirse(
            @Valid @RequestBody InscripcionRequest request) {
        return ResponseEntity.status(201)
            .body(inscripcionService.inscribirse(request));
    }

    @PostMapping("/pago")
    @PreAuthorize("hasRole('PARTICIPANTE')")
    @Operation(summary = "Iniciar pago de una inscripción mediante Libélula")
    public ResponseEntity<PagoDto> iniciarPago(
            @Valid @RequestBody PagoIniciarRequest request) {
        return ResponseEntity.ok(inscripcionService.iniciarPago(request));
    }

    // Confirmación MANUAL, solo para soporte/administración — la confirmación
    // normal ocurre en LibelulaCallbackController tras verificar contra Libélula.
    // No es de uso del participante: nunca confirma sin haber recibido el dinero.
    @PostMapping("/pago/confirmar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Confirmar pago de una inscripción manualmente (solo soporte/administración)")
    public ResponseEntity<PagoDto> confirmarPago(
            @Valid @RequestBody PagoConfirmarRequest request) {
        return ResponseEntity.ok(inscripcionService.confirmarPago(request));
    }

    @GetMapping("/mis-inscripciones")
    @PreAuthorize("hasRole('PARTICIPANTE')")
    @Operation(summary = "Ver mis inscripciones")
    public ResponseEntity<List<InscripcionDto>> misInscripciones() {
        return ResponseEntity.ok(inscripcionService.misInscripciones());
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('PARTICIPANTE', 'ADMINISTRADOR')")
    @Operation(summary = "Cancelar inscripción")
    public ResponseEntity<InscripcionDto> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(inscripcionService.cancelar(id));
    }

    @GetMapping("/curso/{idCurso}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR', 'DOCENTE')")
    @Operation(summary = "Ver inscripciones de un curso")
    public ResponseEntity<List<InscripcionDto>> porCurso(@PathVariable Long idCurso) {
        return ResponseEntity.ok(inscripcionService.inscripcionesDeCurso(idCurso));
    }

    @GetMapping("/evento/{idEvento}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR', 'AUXILIAR')")
    @Operation(summary = "Ver inscripciones de un evento")
    public ResponseEntity<List<InscripcionDto>> porEvento(@PathVariable Long idEvento) {
        return ResponseEntity.ok(inscripcionService.inscripcionesDeEvento(idEvento));
    }
}