// src/main/java/.../modules/usuario/service/UsuarioService.java

package bo.edu.umsa.fhce.sistemacursos.modules.usuario.service;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.exception.ResourceNotFoundException;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto.*;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.*;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository    usuarioRepository;
    private final RolRepository        rolRepository;
    private final DocenteRepository    docenteRepository;
    private final ParticipanteRepository participanteRepository;
    private final ModelMapper          modelMapper;

    // ── Listar todos los usuarios ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UsuarioResumenDto> listarUsuarios() {
        return usuarioRepository.findAll().stream()
            .map(this::toResumenDto)
            .toList();
    }

    // ── Listar usuarios por rol ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UsuarioResumenDto> listarPorRol(String nombreRol) {
        return usuarioRepository.findAll().stream()
            .filter(u -> u.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals(nombreRol)))
            .map(this::toResumenDto)
            .toList();
    }

    // ── Ver detalle de un usuario ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UsuarioDetalleDto obtenerDetalle(Long idUsuario) {
        Usuario usuario = buscarUsuario(idUsuario);
        return toDetalleDto(usuario);
    }

    // ── Cambiar estado ACTIVO / INACTIVO ────────────────────────────────────
    @Transactional
    public UsuarioResumenDto cambiarEstado(Long idUsuario, CambiarEstadoRequest request) {
        Usuario usuario = buscarUsuario(idUsuario);

        Usuario.EstadoUsuario nuevoEstado;
        try {
            nuevoEstado = Usuario.EstadoUsuario.valueOf(request.getEstado());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                "Estado inválido: " + request.getEstado() + ". Use ACTIVO o INACTIVO", 400);
        }

        usuario.setEstado(nuevoEstado);
        usuarioRepository.save(usuario);

        log.info("Estado del usuario {} cambiado a {}", usuario.getUsername(), nuevoEstado);
        return toResumenDto(usuario);
    }

    // ── Asignar rol a usuario ────────────────────────────────────────────────
    @Transactional
    public UsuarioDetalleDto asignarRol(Long idUsuario, AsignarRolRequest request) {
        Usuario usuario = buscarUsuario(idUsuario);

        // Verificar que el rol existe
        Rol rol = rolRepository.findByNombre(request.getNombreRol())
            .orElseThrow(() -> new BusinessException(
                "Rol no encontrado: " + request.getNombreRol(), 404));

        // Verificar que no tenga el rol ya
        boolean yaLoTiene = usuario.getRoles().stream()
            .anyMatch(r -> r.getNombre().equals(request.getNombreRol()));
        if (yaLoTiene) {
            throw new BusinessException(
                "El usuario ya tiene el rol " + request.getNombreRol(), 409);
        }

        // Lógica especial según el rol asignado
        switch (request.getNombreRol()) {

            case "DOCENTE" -> {
                // Requiere título académico
                if (request.getTitulo() == null || request.getTitulo().isBlank()) {
                    throw new BusinessException(
                        "El título académico es obligatorio para el rol DOCENTE", 400);
                }
                Docente docente = new Docente();
                docente.setUsuario(usuario);
                docente.setTitulo(request.getTitulo());
                docenteRepository.save(docente);
            }

            case "PARTICIPANTE" -> {
                // Requiere tipo (UMSA o EXTERNO)
                if (request.getTipoParticipante() == null || request.getTipoParticipante().isBlank()) {
                    throw new BusinessException(
                        "El tipo de participante (UMSA/EXTERNO) es obligatorio", 400);
                }
                // Verificar que no tenga ya perfil de participante
                if (!participanteRepository.findById(idUsuario).isPresent()) {
                    Participante participante = new Participante();
                    participante.setUsuario(usuario);
                    participante.setTipoParticipante(
                        Participante.TipoParticipante.valueOf(request.getTipoParticipante()));
                    participanteRepository.save(participante);
                }
            }
        }

        usuario.getRoles().add(rol);
        usuarioRepository.save(usuario);

        log.info("Rol {} asignado al usuario {}", request.getNombreRol(), usuario.getUsername());
        return toDetalleDto(usuario);
    }

    // ── Revocar rol de usuario ───────────────────────────────────────────────
    @Transactional
    public UsuarioDetalleDto revocarRol(Long idUsuario, String nombreRol) {
        Usuario usuario = buscarUsuario(idUsuario);

        // No permitir quitarle el último rol
        if (usuario.getRoles().size() <= 1) {
            throw new BusinessException(
                "No se puede revocar el último rol del usuario", 400);
        }

        Rol rol = rolRepository.findByNombre(nombreRol)
            .orElseThrow(() -> new BusinessException("Rol no encontrado: " + nombreRol, 404));

        boolean tienEelRol = usuario.getRoles().removeIf(
            r -> r.getNombre().equals(nombreRol));

        if (!tienEelRol) {
            throw new BusinessException(
                "El usuario no tiene el rol " + nombreRol, 400);
        }

        // Si se revoca DOCENTE, eliminar perfil de docente
        if (nombreRol.equals("DOCENTE")) {
            docenteRepository.deleteById(idUsuario);
        }

        usuarioRepository.save(usuario);

        log.info("Rol {} revocado del usuario {}", nombreRol, usuario.getUsername());
        return toDetalleDto(usuario);
    }

    // ── Listar todos los roles disponibles ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<RolDto> listarRoles() {
        return rolRepository.findAll().stream()
            .map(r -> modelMapper.map(r, RolDto.class))
            .toList();
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    private Usuario buscarUsuario(Long idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", idUsuario));
    }

    // Convierte Usuario → UsuarioResumenDto manualmente
    // (ModelMapper no resuelve bien la lista de roles porque es Set<Rol>)
    private UsuarioResumenDto toResumenDto(Usuario u) {
        UsuarioResumenDto dto = new UsuarioResumenDto();
        dto.setIdUsuario(u.getIdUsuario());
        dto.setUsername(u.getUsername());
        dto.setNombres(u.getNombres());
        dto.setApellidos(u.getApellidos());
        dto.setEmail(u.getEmail());
        dto.setTipoUsuario(u.getPasswordHash() == null ? "INTERNO" : "EXTERNO");
        dto.setEmailVerificado(u.isEmailVerificado());
        dto.setEstado(u.getEstado().name());
        dto.setFechaRegistro(u.getFechaRegistro());
        dto.setRoles(u.getRoles().stream()
            .map(Rol::getNombre)
            .toList());
        return dto;
    }

    private UsuarioDetalleDto toDetalleDto(Usuario u) {
        UsuarioDetalleDto dto = new UsuarioDetalleDto();
        dto.setIdUsuario(u.getIdUsuario());
        dto.setUsername(u.getUsername());
        dto.setNombres(u.getNombres());
        dto.setApellidos(u.getApellidos());
        dto.setEmail(u.getEmail());
        dto.setTipoUsuario(u.getPasswordHash() == null ? "INTERNO" : "EXTERNO");
        dto.setEmailVerificado(u.isEmailVerificado());
        dto.setEstado(u.getEstado().name());
        dto.setFechaRegistro(u.getFechaRegistro());
        dto.setRoles(u.getRoles().stream()
            .map(r -> modelMapper.map(r, RolDto.class))
            .toList());

        // Perfil docente (si tiene el rol)
        docenteRepository.findById(u.getIdUsuario())
            .ifPresent(d -> dto.setTitulo(d.getTitulo()));

        // Perfil participante (si tiene el rol)
        participanteRepository.findById(u.getIdUsuario())
            .ifPresent(p -> dto.setTipoParticipante(p.getTipoParticipante().name()));

        return dto;
    }
}