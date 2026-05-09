package bo.edu.umsa.fhce.sistemacursos.modules.reporte.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteAcademicoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Reportes academicos, financieros y estadisticas")
public class ReporteController {

    private final ReporteService reporteService;

    // GET /api/reportes/academicos
    @GetMapping("/academicos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR')")
    @Operation(summary = "Reporte academico de cursos, eventos e inscripciones")
    public ResponseEntity<ReporteAcademicoDto> academicos(
            @RequestParam(required = false) Long idCarrera,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.reporteAcademico(idCarrera, desde, hasta));
    }

    // GET /api/reportes/financieros
    @GetMapping("/financieros")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Reporte financiero por actividad y tipo de participante")
    public ResponseEntity<ReporteFinancieroDto> financieros(
            @RequestParam(required = false) Long idCarrera,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.reporteFinanciero(idCarrera, desde, hasta));
    }

    // GET /api/reportes/participacion
    @GetMapping("/participacion")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR')")
    @Operation(summary = "Estadisticas de participacion por carrera y tipo de usuario")
    public ResponseEntity<ReporteParticipacionDto> participacion(
            @RequestParam(required = false) Long idCarrera,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.reporteParticipacion(idCarrera, desde, hasta));
    }
}
