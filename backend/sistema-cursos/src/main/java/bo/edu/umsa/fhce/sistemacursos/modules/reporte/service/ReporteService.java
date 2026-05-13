package bo.edu.umsa.fhce.sistemacursos.modules.reporte.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.exception.ResourceNotFoundException;
import bo.edu.umsa.fhce.sistemacursos.modules.carrera.repository.CoordinadorCarreraRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.entity.Curso;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.repository.CursoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.repository.ParaleloRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository.AsistenciaRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository.EvaluacionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.Evento;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.repository.EventoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.entity.Inscripcion;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository.InscripcionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteActividadDetalleDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteAcademicoCursoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteAcademicoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteAcademicoEventoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroActividadDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionCarreraDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionDto;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final CursoRepository cursoRepository;
    private final EventoRepository eventoRepository;
    private final InscripcionRepository inscripcionRepository;
    private final CoordinadorCarreraRepository coordinadorCarreraRepository;
    private final UsuarioRepository usuarioRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final ParaleloRepository paraleloRepository;

    @Transactional(readOnly = true)
    public ReporteAcademicoDto reporteAcademico(Long idCarrera, LocalDate desde, LocalDate hasta) {
        Filtros filtros = construirFiltros(idCarrera);

        if (filtros.carrerasPermitidas() != null && filtros.carrerasPermitidas().isEmpty()) {
            ReporteAcademicoDto dto = new ReporteAcademicoDto();
            dto.setCursos(List.of());
            dto.setEventos(List.of());
            return dto;
        }

        List<ReporteAcademicoCursoDto> cursos = cursoRepository.reporteAcademicoCursos(
            filtros.idCarrera(), filtros.carrerasPermitidas(), desde, hasta);

        List<ReporteAcademicoEventoDto> eventos = eventoRepository.reporteAcademicoEventos(
            filtros.idCarrera(), filtros.carrerasPermitidas(),
            toInicioDia(desde), toFinDia(hasta));

        ReporteAcademicoDto dto = new ReporteAcademicoDto();
        dto.setCursos(cursos);
        dto.setEventos(eventos);
        return dto;
    }

    @Transactional(readOnly = true)
    public ReporteFinancieroDto reporteFinanciero(Long idCarrera, LocalDate desde, LocalDate hasta) {
        Filtros filtros = construirFiltrosAdmin(idCarrera);
        Inscripcion.TipoPrecio umsa = Inscripcion.TipoPrecio.UMSA;
        Inscripcion.TipoPrecio externo = Inscripcion.TipoPrecio.EXTERNO;

        LocalDateTime desdeDt = toInicioDia(desde);
        LocalDateTime hastaDt = toFinDia(hasta);

        List<ReporteFinancieroActividadDto> cursos = inscripcionRepository
            .reporteFinancieroCursos(filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        List<ReporteFinancieroActividadDto> eventos = inscripcionRepository
            .reporteFinancieroEventos(filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        ReporteFinancieroDto dto = new ReporteFinancieroDto();
        dto.setCursos(cursos);
        dto.setEventos(eventos);

        BigDecimal totalUmsa = sumarIngresos(cursos, eventos, true);
        BigDecimal totalExterno = sumarIngresos(cursos, eventos, false);
        dto.setTotalUmsa(totalUmsa);
        dto.setTotalExterno(totalExterno);
        dto.setTotalGeneral(totalUmsa.add(totalExterno));
        return dto;
    }

    @Transactional(readOnly = true)
    public ReporteFinancieroDto reporteFinancieroCoordinador(Long idCarrera, LocalDate desde, LocalDate hasta) {
        Filtros filtros = construirFiltros(idCarrera);

        if (filtros.carrerasPermitidas() != null && filtros.carrerasPermitidas().isEmpty()) {
            ReporteFinancieroDto dto = new ReporteFinancieroDto();
            dto.setCursos(List.of());
            dto.setEventos(List.of());
            dto.setTotalUmsa(BigDecimal.ZERO);
            dto.setTotalExterno(BigDecimal.ZERO);
            dto.setTotalGeneral(BigDecimal.ZERO);
            return dto;
        }

        Inscripcion.TipoPrecio umsa = Inscripcion.TipoPrecio.UMSA;
        Inscripcion.TipoPrecio externo = Inscripcion.TipoPrecio.EXTERNO;

        LocalDateTime desdeDt = toInicioDia(desde);
        LocalDateTime hastaDt = toFinDia(hasta);

        List<ReporteFinancieroActividadDto> cursos = inscripcionRepository
            .reporteFinancieroCursos(filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        List<ReporteFinancieroActividadDto> eventos = inscripcionRepository
            .reporteFinancieroEventos(filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        ReporteFinancieroDto dto = new ReporteFinancieroDto();
        dto.setCursos(cursos);
        dto.setEventos(eventos);

        BigDecimal totalUmsa = sumarIngresos(cursos, eventos, true);
        BigDecimal totalExterno = sumarIngresos(cursos, eventos, false);
        dto.setTotalUmsa(totalUmsa);
        dto.setTotalExterno(totalExterno);
        dto.setTotalGeneral(totalUmsa.add(totalExterno));
        return dto;
    }

    @Transactional(readOnly = true)
    public ReporteParticipacionDto reporteParticipacion(Long idCarrera, LocalDate desde, LocalDate hasta) {
        Filtros filtros = construirFiltros(idCarrera);

        if (filtros.carrerasPermitidas() != null && filtros.carrerasPermitidas().isEmpty()) {
            ReporteParticipacionDto dto = new ReporteParticipacionDto();
            dto.setCarreras(List.of());
            dto.setTotalUmsa(0);
            dto.setTotalExterno(0);
            dto.setTotalGeneral(0);
            return dto;
        }
        Inscripcion.TipoPrecio umsa = Inscripcion.TipoPrecio.UMSA;
        Inscripcion.TipoPrecio externo = Inscripcion.TipoPrecio.EXTERNO;

        LocalDateTime desdeDt = toInicioDia(desde);
        LocalDateTime hastaDt = toFinDia(hasta);

        List<ReporteParticipacionCarreraDto> cursos = inscripcionRepository
            .reporteParticipacionPorCarreraCursos(
                filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        List<ReporteParticipacionCarreraDto> eventos = inscripcionRepository
            .reporteParticipacionPorCarreraEventos(
                filtros.idCarrera(), filtros.carrerasPermitidas(),
                desdeDt, hastaDt, umsa, externo);

        Map<Long, ReporteParticipacionCarreraDto> merged = new HashMap<>();
        mergeParticipacion(merged, cursos);
        mergeParticipacion(merged, eventos);

        List<ReporteParticipacionCarreraDto> carreras = new ArrayList<>(merged.values());
        carreras.sort((a, b) -> a.getCarrera().compareToIgnoreCase(b.getCarrera()));

        ReporteParticipacionDto dto = new ReporteParticipacionDto();
        dto.setCarreras(carreras);

        long totalUmsa = carreras.stream().mapToLong(ReporteParticipacionCarreraDto::getParticipantesUmsa).sum();
        long totalExterno = carreras.stream().mapToLong(ReporteParticipacionCarreraDto::getParticipantesExterno).sum();
        dto.setTotalUmsa(totalUmsa);
        dto.setTotalExterno(totalExterno);
        dto.setTotalGeneral(totalUmsa + totalExterno);
        return dto;
    }

    @Transactional(readOnly = true)
    public ReporteActividadDetalleDto reporteDetalleActividad(String tipo, Long idActividad) {
        if (tipo == null || idActividad == null) {
            throw new BusinessException("Tipo e idActividad son requeridos", 400);
        }

        String tipoNormalizado = tipo.trim().toUpperCase();
        if ("CURSO".equals(tipoNormalizado)) {
            Curso curso = cursoRepository.findById(idActividad)
                .orElseThrow(() -> new ResourceNotFoundException("Curso", idActividad));

            validarAccesoCarrera(curso.getCarrera().getIdCarrera());

            long inscritos = inscripcionRepository.countByCurso_IdCursoAndEstado(
                curso.getIdCurso(), Inscripcion.EstadoInscripcion.CONFIRMADA);
            Integer cupoMaximoRaw = paraleloRepository.sumarCupoMaximo(curso.getIdCurso());
            long cupoMaximo = cupoMaximoRaw != null ? cupoMaximoRaw.longValue() : 0L;
            long cuposDisponibles = Math.max(0, cupoMaximo - inscritos);

            long internos = inscripcionRepository.contarConfirmadasCursoPorTipo(
                curso.getIdCurso(), Inscripcion.TipoPrecio.UMSA);
            long externos = inscripcionRepository.contarConfirmadasCursoPorTipo(
                curso.getIdCurso(), Inscripcion.TipoPrecio.EXTERNO);

            long aprobados = evaluacionRepository.contarAprobadosPorCurso(curso.getIdCurso());

            BigDecimal ingresosUmsa = inscripcionRepository.sumarSaldoCursoPorTipo(
                curso.getIdCurso(), Inscripcion.TipoPrecio.UMSA);
            BigDecimal ingresosExterno = inscripcionRepository.sumarSaldoCursoPorTipo(
                curso.getIdCurso(), Inscripcion.TipoPrecio.EXTERNO);

            ReporteActividadDetalleDto dto = new ReporteActividadDetalleDto();
            dto.setTipo("CURSO");
            dto.setIdActividad(curso.getIdCurso());
            dto.setNombre(curso.getNombre());
            dto.setCarrera(curso.getCarrera().getNombre());
            dto.setEstado(curso.getEstado().name());
            dto.setInscritosConfirmados(inscritos);
            dto.setCupoMaximo(cupoMaximo);
            dto.setCuposDisponibles(cuposDisponibles);
            dto.setParticipantesUmsa(internos);
            dto.setParticipantesExterno(externos);
            dto.setAprobados(aprobados);
            dto.setAsistidos(0L);
            dto.setIngresosUmsa(ingresosUmsa);
            dto.setIngresosExterno(ingresosExterno);
            dto.setIngresosTotal(ingresosUmsa.add(ingresosExterno));
            return dto;
        }

        if ("EVENTO".equals(tipoNormalizado)) {
            Evento evento = eventoRepository.findById(idActividad)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", idActividad));

            validarAccesoCarrera(evento.getCarrera().getIdCarrera());

            long inscritos = inscripcionRepository.countByEvento_IdEventoAndEstado(
                evento.getIdEvento(), Inscripcion.EstadoInscripcion.CONFIRMADA);
            long cupoMaximo = evento.getCupoMaximo() != null ? evento.getCupoMaximo().longValue() : 0L;
            long cuposDisponibles = Math.max(0, cupoMaximo - inscritos);

            long internos = inscripcionRepository.contarConfirmadasEventoPorTipo(
                evento.getIdEvento(), Inscripcion.TipoPrecio.UMSA);
            long externos = inscripcionRepository.contarConfirmadasEventoPorTipo(
                evento.getIdEvento(), Inscripcion.TipoPrecio.EXTERNO);

            long asistidos = asistenciaRepository.countByInscripcion_Evento_IdEvento(evento.getIdEvento());

            BigDecimal ingresosUmsa = inscripcionRepository.sumarSaldoEventoPorTipo(
                evento.getIdEvento(), Inscripcion.TipoPrecio.UMSA);
            BigDecimal ingresosExterno = inscripcionRepository.sumarSaldoEventoPorTipo(
                evento.getIdEvento(), Inscripcion.TipoPrecio.EXTERNO);

            ReporteActividadDetalleDto dto = new ReporteActividadDetalleDto();
            dto.setTipo("EVENTO");
            dto.setIdActividad(evento.getIdEvento());
            dto.setNombre(evento.getNombre());
            dto.setCarrera(evento.getCarrera().getNombre());
            dto.setEstado(evento.getEstado().name());
            dto.setInscritosConfirmados(inscritos);
            dto.setCupoMaximo(cupoMaximo);
            dto.setCuposDisponibles(cuposDisponibles);
            dto.setParticipantesUmsa(internos);
            dto.setParticipantesExterno(externos);
            dto.setAprobados(0L);
            dto.setAsistidos(asistidos);
            dto.setIngresosUmsa(ingresosUmsa);
            dto.setIngresosExterno(ingresosExterno);
            dto.setIngresosTotal(ingresosUmsa.add(ingresosExterno));
            return dto;
        }

        throw new BusinessException("Tipo de actividad no valido", 400);
    }

    private void mergeParticipacion(
            Map<Long, ReporteParticipacionCarreraDto> merged,
            List<ReporteParticipacionCarreraDto> rows) {
        for (ReporteParticipacionCarreraDto row : rows) {
            ReporteParticipacionCarreraDto actual = merged.get(row.getIdCarrera());
            if (actual == null) {
                merged.put(row.getIdCarrera(), row);
            } else {
                actual.setParticipantesUmsa(actual.getParticipantesUmsa() + row.getParticipantesUmsa());
                actual.setParticipantesExterno(actual.getParticipantesExterno() + row.getParticipantesExterno());
                actual.setTotal(actual.getParticipantesUmsa() + actual.getParticipantesExterno());
            }
        }
    }

    private BigDecimal sumarIngresos(
            List<ReporteFinancieroActividadDto> cursos,
            List<ReporteFinancieroActividadDto> eventos,
            boolean umsa) {
        BigDecimal total = BigDecimal.ZERO;
        for (ReporteFinancieroActividadDto row : cursos) {
            total = total.add(umsa ? row.getIngresosUmsa() : row.getIngresosExterno());
        }
        for (ReporteFinancieroActividadDto row : eventos) {
            total = total.add(umsa ? row.getIngresosUmsa() : row.getIngresosExterno());
        }
        return total;
    }

    private Filtros construirFiltros(Long idCarrera) {
        Usuario usuario = getUsuarioActual();
        boolean esAdmin = tieneRol(usuario, "ADMINISTRADOR");
        boolean esCoordinador = tieneRol(usuario, "COORDINADOR");

        if (!esAdmin && !esCoordinador) {
            throw new BusinessException("No tienes permisos para acceder a reportes", 403);
        }

        if (esAdmin) {
            return new Filtros(idCarrera, null);
        }

        List<Long> carreras = coordinadorCarreraRepository
            .findByIdCoordinador(usuario.getIdUsuario())
            .stream()
            .map(cc -> cc.getCarrera().getIdCarrera())
            .toList();

        if (idCarrera != null && !carreras.contains(idCarrera)) {
            throw new BusinessException("No tienes permisos para esta carrera", 403);
        }

        if (idCarrera != null) {
            return new Filtros(idCarrera, List.of(idCarrera));
        }

        return new Filtros(null, carreras);
    }

    private Filtros construirFiltrosAdmin(Long idCarrera) {
        Usuario usuario = getUsuarioActual();
        boolean esAdmin = tieneRol(usuario, "ADMINISTRADOR");
        if (!esAdmin) {
            throw new BusinessException("Solo el administrador puede acceder a reportes financieros", 403);
        }
        return new Filtros(idCarrera, null);
    }

    private void validarAccesoCarrera(Long idCarrera) {
        construirFiltros(idCarrera);
    }

    private boolean tieneRol(Usuario usuario, String rol) {
        return usuario.getRoles().stream().anyMatch(r -> r.getNombre().equals(rol));
    }

    private Usuario getUsuarioActual() {
        CustomUserDetails userDetails = (CustomUserDetails)
            SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return usuarioRepository.findById(userDetails.getIdUsuario())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Usuario", userDetails.getIdUsuario()));
    }

    private LocalDateTime toInicioDia(LocalDate date) {
        return date == null ? null : date.atStartOfDay();
    }

    private LocalDateTime toFinDia(LocalDate date) {
        return date == null ? null : date.atTime(LocalTime.MAX);
    }

    private record Filtros(Long idCarrera, List<Long> carrerasPermitidas) {}
}
