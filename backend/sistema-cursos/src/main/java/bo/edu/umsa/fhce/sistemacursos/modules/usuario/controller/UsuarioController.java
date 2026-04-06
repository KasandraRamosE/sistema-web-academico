package bo.edu.umsa.fhce.sistemacursos.modules.usuario.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.AsignarRolRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.CambiarEstadoRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.RolDto;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.UsuarioDetalleDto;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.UsuarioResumenDto;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de usuarios y roles")
public class UsuarioController {

    private final UsuarioService usuarioService;

    // GET /api/usuarios
    // Solo ADMINISTRADOR puede listar todos los usuarios
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Listar todos los usuarios")
    public ResponseEntity<List<UsuarioResumenDto>> listar(
            // Filtro opcional por rol: /api/usuarios?rol=DOCENTE
            @RequestParam(required = false) String rol) {

        List<UsuarioResumenDto> usuarios = (rol != null)
            ? usuarioService.listarPorRol(rol)
            : usuarioService.listarUsuarios();

        return ResponseEntity.ok(usuarios);
    }

    // GET /api/usuarios/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Ver detalle de un usuario")
    public ResponseEntity<UsuarioDetalleDto> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerDetalle(id));
    }

    // PATCH /api/usuarios/{id}/estado
    // PATCH es correcto aquí porque solo modificamos un campo, no el recurso completo
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Activar o desactivar un usuario")
    public ResponseEntity<UsuarioResumenDto> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoRequest request) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id, request));
    }

    // POST /api/usuarios/{id}/roles
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Asignar rol a usuario",
               description = "Para DOCENTE requiere 'titulo'. Para PARTICIPANTE requiere 'tipoParticipante'.")
    public ResponseEntity<UsuarioDetalleDto> asignarRol(
            @PathVariable Long id,
            @Valid @RequestBody AsignarRolRequest request) {
        return ResponseEntity.ok(usuarioService.asignarRol(id, request));
    }

    // DELETE /api/usuarios/{id}/roles/{nombreRol}
    @DeleteMapping("/{id}/roles/{nombreRol}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Revocar rol de usuario")
    public ResponseEntity<UsuarioDetalleDto> revocarRol(
            @PathVariable Long id,
            @PathVariable String nombreRol) {
        return ResponseEntity.ok(usuarioService.revocarRol(id, nombreRol));
    }

    // GET /api/usuarios/roles
    // Disponible para ADMINISTRADOR y COORDINADOR (para saber qué roles existen)
    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'COORDINADOR')")
    @Operation(summary = "Listar todos los roles disponibles")
    public ResponseEntity<List<RolDto>> listarRoles() {
        return ResponseEntity.ok(usuarioService.listarRoles());
    }
}