package bo.edu.umsa.fhce.sistemacursos.modules.evento.service;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.exception.ResourceNotFoundException;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.entity.Carrera;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.repository.CarreraRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.dto.AsignarAuxiliarRequest;
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
        List<Evento> eventos = (idCarrera != null)
            ? eventoRepository.findByCarrera_IdCarrera(idCarrera)
            : eventoRepository.findAll();
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

        Evento evento = Evento.builder()
            .carrera(carrera)
            .organizador(organizador)
            .nombre(request.getNombre())
            .descripcion(request.getDescripcion())
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

        Carrera carrera = carreraRepository.findById(request.getIdCarrera())
            .orElseThrow(() -> new ResourceNotFoundException("Carrera", request.getIdCarrera()));

        evento.setCarrera(carrera);
        evento.setNombre(request.getNombre());
        evento.setDescripcion(request.getDescripcion());
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
        try {
            evento.setEstado(Evento.EstadoEvento.valueOf(estado));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                "Estado inválido. Use: ABIERTO, LLENO o FINALIZADO", 400);
        }
        eventoRepository.save(evento);
        return toEventoDto(evento);
    }

    // ── Asignar auxiliar a evento ────────────────────────────────────────────
    @Transactional
    public void asignarAuxiliar(Long idEvento, AsignarAuxiliarRequest request) {
        Evento evento = buscarEvento(idEvento);

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
        AuxiliarEventoId pk = new AuxiliarEventoId(idAuxiliar, idEvento);
        if (!auxiliarEventoRepository.existsById(pk)) {
            throw new BusinessException(
                "El auxiliar no está asignado a este evento", 404);
        }
        auxiliarEventoRepository.deleteById(pk);
    }

    // ── Listar auxiliares de un evento ───────────────────────────────────────
    @Transactional(readOnly = true)
    public List<String> listarAuxiliares(Long idEvento) {
        buscarEvento(idEvento);
        return auxiliarEventoRepository.findByIdEvento(idEvento)
            .stream()
            .map(ae -> ae.getAuxiliar().getNombres()
                + " " + ae.getAuxiliar().getApellidos())
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

    private EventoDto toEventoDto(Evento e) {
        EventoDto dto = new EventoDto();
        dto.setIdEvento(e.getIdEvento());
        dto.setIdCarrera(e.getCarrera().getIdCarrera());
        dto.setNombreCarrera(e.getCarrera().getNombre());
        dto.setNombreOrganizador(
            e.getOrganizador().getNombres() + " " + e.getOrganizador().getApellidos());
        dto.setNombre(e.getNombre());
        dto.setDescripcion(e.getDescripcion());
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
        dto.setInscritos(0);

        return dto;
    }
}