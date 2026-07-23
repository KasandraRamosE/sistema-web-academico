package bo.edu.umsa.fhce.sistemacursos.modules.carrera.controller;

import bo.edu.umsa.fhce.sistemacursos.modules.carrera.dto.*;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.service.CarreraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/carreras")
@RequiredArgsConstructor
@Tag(name = "Carreras", description = "Gestión de carreras académicas")
public class CarreraController {

    private final CarreraService carreraService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar carreras activas")
    public ResponseEntity<List<CarreraDto>> listar() {
        return ResponseEntity.ok(carreraService.listarActivas());
    }

    @GetMapping("/todas")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Listar todas las carreras incluidas las inactivas")
    public ResponseEntity<List<CarreraDto>> listarTodas() {
        return ResponseEntity.ok(carreraService.listarTodas());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Crear carrera")
    public ResponseEntity<CarreraDto> crear(@Valid @RequestBody CarreraRequest request) {
        return ResponseEntity.status(201).body(carreraService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Actualizar nombre de carrera")
    public ResponseEntity<CarreraDto> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CarreraRequest request) {
        return ResponseEntity.ok(carreraService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Activar o desactivar carrera")
    public ResponseEntity<CarreraDto> cambiarEstado(
            @PathVariable Long id,
            @RequestParam String estado) {
        return ResponseEntity.ok(carreraService.cambiarEstado(id, estado));
    }

    @PostMapping("/{id}/coordinadores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Asignar coordinador a carrera")
    public ResponseEntity<Void> asignarCoordinador(
            @PathVariable Long id,
            @Valid @RequestBody AsignarCoordinadorRequest request) {
        carreraService.asignarCoordinador(id, request);
        return ResponseEntity.status(201).build();
    }

    @DeleteMapping("/{id}/coordinadores/{idCoordinador}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Remover coordinador de carrera")
    public ResponseEntity<Void> removerCoordinador(
            @PathVariable Long id,
            @PathVariable Long idCoordinador) {
        carreraService.removerCoordinador(id, idCoordinador);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/coordinadores")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR')")
    @Operation(summary = "Listar coordinadores de una carrera")
    public ResponseEntity<List<String>> listarCoordinadores(@PathVariable Long id) {
        return ResponseEntity.ok(carreraService.listarCoordinadores(id));
    }
}