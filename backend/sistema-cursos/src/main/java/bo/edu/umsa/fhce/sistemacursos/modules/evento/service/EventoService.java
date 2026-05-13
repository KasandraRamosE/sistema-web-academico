package bo.edu.umsa.fhce.sistemacursos.modules.evento.service;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.exception.ResourceNotFoundException;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.entity.Carrera;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.entity.CoordinadorCarrera;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.repository.CarreraRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.repository.CoordinadorCarreraRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.AsignarAuxiliarRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.AsignarDisenadorRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.AuxiliarResumenDto;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.EventoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.EventoRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.AuxiliarEvento;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.AuxiliarEventoId;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.Evento;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.repository.AuxiliarEventoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.repository.EventoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository.InscripcionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventoService {

    private final EventoRepository        eventoRepository;
    private final AuxiliarEventoRepository auxiliarEventoRepository;
    private final CarreraRepository       carreraRepository;
    private final CoordinadorCarreraRepository coordinadorCarreraRepository;
    private final UsuarioRepository       usuarioRepository;
    private final InscripcionRepository inscripcionRepository;

    // ── Listar eventos abiertos (catálogo) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<EventoDto> listarAbiertos(Long idCarrera) {
        return eventoRepository.findAbiertos(idCarrera)
            .stream()
            .map(this::toEventoDto)
            .toList();
    }

    // ── Listar todos (admin y coordinador) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<EventoDto> listarTodos(Long idCarrera) {
        Usuario actual = getUsuarioActual();
        if (esAdmin(actual)) {
            List<Evento> eventos = (idCarrera != null)
                ? eventoRepository.findByCarrera_IdCarrera(idCarrera)
                : eventoRepository.findAll();
            return eventos.stream().map(this::toEventoDto).toList();
        }

        requireCoordinador(actual);
        List<Long> carrerasAsignadas = getCarrerasAsignadas(actual.getIdUsuario());
        if (idCarrera != null && !carrerasAsignadas.contains(idCarrera)) {
            throw new BusinessException("No tienes permisos para ver eventos de esta carrera", 403);
        }

        List<Evento> eventos = (idCarrera != null)
            ? eventoRepository.findByCarrera_IdCarrera(idCarrera)
            : eventoRepository.findAll().stream()
                .filter(evento -> carrerasAsignadas.contains(evento.getCarrera().getIdCarrera()))
                .toList();
        return eventos.stream().map(this::toEventoDto).toList();
    }

    // ── Listar eventos asignados al disenador ──────────────────────────────
    @Transactional(readOnly = true)
    public List<EventoDto> listarAsignadosDisenador() {
        Usuario actual = getUsuarioActual();
        List<Evento> eventos = eventoRepository.findByDisenador_IdUsuario(actual.getIdUsuario());
        return eventos.stream().map(this::toEventoDto).toList();
    }

    // ── Obtener evento por id ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public EventoDto obtener(Long idEvento) {
        return toEventoDto(buscarEvento(idEvento));
    }

    // ── Crear evento ─────────────────────────────────────────────────────────
    @Transactional
    public EventoDto crear(EventoRequest request) {
        Carrera carrera = carreraRepository.findById(request.getIdCarrera())
            .orElseThrow(() -> new ResourceNotFoundException("Carrera", request.getIdCarrera()));

        Usuario organizador = getUsuarioActual();
        verificarAccesoCarrera(organizador, carrera);

        Evento evento = Evento.builder()
            .carrera(carrera)
            .organizador(organizador)
            .nombre(request.getNombre())
            .descripcion(request.getDescripcion())
            .lugar(request.getLugar())
            .imagen(request.getImagen())
            .cargaHoraria(request.getCargaHoraria())
            .modalidad(Evento.Modalidad.valueOf(request.getModalidad()))
            .fechaHora(request.getFechaHora())
            .cupoMaximo(request.getCupoMaximo())
            .costoExterno(request.getCostoExterno())
            .costoUmsa(request.getCostoUmsa())
            .estado(Evento.EstadoEvento.ABIERTO)
            .link(request.getLink())
            .build();

        evento = eventoRepository.save(evento);
        log.info("Evento creado: {} por {}", evento.getNombre(), organizador.getUsername());
        return toEventoDto(evento);
    }

    // ── Actualizar evento ────────────────────────────────────────────────────
    @Transactional
    public EventoDto actualizar(Long idEvento, EventoRequest request) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());

        Carrera carrera = carreraRepository.findById(request.getIdCarrera())
            .orElseThrow(() -> new ResourceNotFoundException("Carrera", request.getIdCarrera()));

        evento.setCarrera(carrera);
        evento.setNombre(request.getNombre());
        evento.setDescripcion(request.getDescripcion());
        evento.setLugar(request.getLugar());
        evento.setImagen(request.getImagen());
        evento.setCargaHoraria(request.getCargaHoraria());
        evento.setModalidad(Evento.Modalidad.valueOf(request.getModalidad()));
        evento.setFechaHora(request.getFechaHora());
        evento.setCupoMaximo(request.getCupoMaximo());
        evento.setCostoExterno(request.getCostoExterno());
        evento.setCostoUmsa(request.getCostoUmsa());
        evento.setLink(request.getLink());

        eventoRepository.save(evento);
        return toEventoDto(evento);
    }

    // ── Cambiar estado ───────────────────────────────────────────────────────
    @Transactional
    public EventoDto cambiarEstado(Long idEvento, String estado) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());
        try {
            evento.setEstado(Evento.EstadoEvento.valueOf(estado));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                "Estado inválido. Use: ABIERTO, LLENO o FINALIZADO", 400);
        }
        eventoRepository.save(evento);
        return toEventoDto(evento);
    }

    // ── Asignar disenador a evento ────────────────────────────────────────
    @Transactional
    public EventoDto asignarDisenador(Long idEvento, AsignarDisenadorRequest request) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());

        if (request.getIdDisenador() == null) {
            evento.setDisenador(null);
            eventoRepository.save(evento);
            return toEventoDto(evento);
        }

        Usuario disenador = usuarioRepository.findById(request.getIdDisenador())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Usuario", request.getIdDisenador()));

        boolean esDisenador = disenador.getRoles().stream()
            .anyMatch(r -> normalizeRolName(r.getNombre()).equals("DISENADOR"));
        if (!esDisenador) {
            throw new BusinessException(
                "El usuario no tiene el rol DISENADOR", 400);
        }

        evento.setDisenador(disenador);
        eventoRepository.save(evento);
        return toEventoDto(evento);
    }

    // ── Eliminar evento ─────────────────────────────────────────────────────
    @Transactional
    public void eliminar(Long idEvento) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());
        eventoRepository.delete(evento);
        log.info("Evento eliminado: {}", idEvento);
    }

    // ── Asignar auxiliar a evento ────────────────────────────────────────────
    @Transactional
    public void asignarAuxiliar(Long idEvento, AsignarAuxiliarRequest request) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());

        Usuario auxiliar = usuarioRepository.findById(request.getIdAuxiliar())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Usuario", request.getIdAuxiliar()));

        // Verificar que tenga rol AUXILIAR
        boolean esAuxiliar = auxiliar.getRoles().stream()
            .anyMatch(r -> r.getNombre().equals("AUXILIAR"));
        if (!esAuxiliar) {
            throw new BusinessException(
                "El usuario no tiene el rol AUXILIAR", 400);
        }

        // Verificar que no esté ya asignado
        AuxiliarEventoId pk = new AuxiliarEventoId(
            auxiliar.getIdUsuario(), idEvento);
        if (auxiliarEventoRepository.existsById(pk)) {
            throw new BusinessException(
                "El auxiliar ya está asignado a este evento", 409);
        }

        AuxiliarEvento asignacion = new AuxiliarEvento(auxiliar, evento);
        auxiliarEventoRepository.save(asignacion);
        log.info("Auxiliar {} asignado al evento {}",
            auxiliar.getUsername(), evento.getNombre());
    }

    // ── Remover auxiliar de evento ───────────────────────────────────────────
    @Transactional
    public void removerAuxiliar(Long idEvento, Long idAuxiliar) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());
        AuxiliarEventoId pk = new AuxiliarEventoId(idAuxiliar, idEvento);
        if (!auxiliarEventoRepository.existsById(pk)) {
            throw new BusinessException(
                "El auxiliar no está asignado a este evento", 404);
        }
        auxiliarEventoRepository.deleteById(pk);
    }

    // ── Listar auxiliares de un evento ───────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AuxiliarResumenDto> listarAuxiliares(Long idEvento) {
        Evento evento = buscarEvento(idEvento);
        verificarAccesoCarrera(getUsuarioActual(), evento.getCarrera());
        return auxiliarEventoRepository.findByIdEvento(idEvento)
            .stream()
            .map(ae -> {
                Usuario auxiliar = ae.getAuxiliar();
                AuxiliarResumenDto dto = new AuxiliarResumenDto();
                dto.setIdUsuario(auxiliar.getIdUsuario());
                dto.setUsername(auxiliar.getUsername());
                dto.setNombres(auxiliar.getNombres());
                dto.setApellidos(auxiliar.getApellidos());
                return dto;
            })
            .toList();
    }

    // ── Listar eventos asignados al auxiliar actual ─────────────────────────
    @Transactional(readOnly = true)
    public List<EventoDto> listarAsignadosAuxiliar() {
        Usuario usuario = getUsuarioActual();
        boolean esAuxiliar = usuario.getRoles().stream()
            .anyMatch(r -> r.getNombre().equals("AUXILIAR"));
        if (!esAuxiliar) {
            throw new BusinessException(
                "El usuario no tiene el rol AUXILIAR", 403);
        }

        return auxiliarEventoRepository.findByIdAuxiliar(usuario.getIdUsuario())
            .stream()
            .map(AuxiliarEvento::getEvento)
            .map(this::toEventoDto)
            .toList();
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    private Evento buscarEvento(Long idEvento) {
        return eventoRepository.findById(idEvento)
            .orElseThrow(() -> new ResourceNotFoundException("Evento", idEvento));
    }

    private Usuario getUsuarioActual() {
        CustomUserDetails userDetails = (CustomUserDetails)
            SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return usuarioRepository.findById(userDetails.getIdUsuario())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Usuario", userDetails.getIdUsuario()));
    }

    private void verificarAccesoCarrera(Usuario usuario, Carrera carrera) {
        if (esAdmin(usuario)) return;

        requireCoordinador(usuario);
        boolean tieneCarrera = coordinadorCarreraRepository
            .existsByCoordinador_IdUsuarioAndCarrera_IdCarrera(
                usuario.getIdUsuario(), carrera.getIdCarrera()
            );
        if (!tieneCarrera) {
            throw new BusinessException("No tienes permisos para gestionar esta carrera", 403);
        }
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario.getRoles().stream().anyMatch(r -> r.getNombre().equals("ADMINISTRADOR"));
    }

    private void requireCoordinador(Usuario usuario) {
        boolean esCoordinador = usuario.getRoles().stream()
            .anyMatch(r -> r.getNombre().equals("COORDINADOR"));
        if (!esCoordinador) {
            throw new BusinessException("No tienes permisos para gestionar eventos", 403);
        }
    }

    private List<Long> getCarrerasAsignadas(Long idUsuario) {
        return coordinadorCarreraRepository.findByIdCoordinador(idUsuario)
            .stream()
            .map(CoordinadorCarrera::getCarrera)
            .map(Carrera::getIdCarrera)
            .toList();
    }

    private EventoDto toEventoDto(Evento e) {
        EventoDto dto = new EventoDto();
        dto.setIdEvento(e.getIdEvento());
        dto.setIdCarrera(e.getCarrera().getIdCarrera());
        dto.setNombreCarrera(e.getCarrera().getNombre());
        dto.setNombreOrganizador(
            e.getOrganizador().getNombres() + " " + e.getOrganizador().getApellidos());
        if (e.getDisenador() != null) {
            dto.setIdDisenador(e.getDisenador().getIdUsuario());
            dto.setNombreDisenador(
                e.getDisenador().getNombres() + " " + e.getDisenador().getApellidos());
        }
        dto.setNombre(e.getNombre());
        dto.setDescripcion(e.getDescripcion());
        dto.setLugar(e.getLugar());
        dto.setImagen(e.getImagen());
        dto.setCargaHoraria(e.getCargaHoraria());
        dto.setModalidad(e.getModalidad().name());
        dto.setFechaHora(e.getFechaHora());
        dto.setCupoMaximo(e.getCupoMaximo());
        dto.setCostoExterno(e.getCostoExterno());
        dto.setCostoUmsa(e.getCostoUmsa());
        dto.setEstado(e.getEstado().name());
        dto.setFechaCreacion(e.getFechaCreacion());
        dto.setLink(e.getLink());

        int inscritos = inscripcionRepository.contarConfirmadasEnEvento(e.getIdEvento());
        dto.setInscritos(inscritos);
        if (e.getCupoMaximo() != null) {
            dto.setCuposDisponibles(Math.max(0, e.getCupoMaximo() - inscritos));
        }

        return dto;
    }

    private String normalizeRolName(String nombreRol) {
        if (nombreRol == null) return "";
        return nombreRol.replace("Ñ", "N").replace("ñ", "n").toUpperCase();
    }
}