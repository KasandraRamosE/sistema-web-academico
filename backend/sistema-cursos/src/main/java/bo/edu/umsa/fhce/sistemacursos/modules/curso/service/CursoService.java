// src/main/java/.../modules/curso/service/CursoService.java

package bo.edu.umsa.fhce.sistemacursos.modules.curso.service;

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
import bo.edu.umsa.fhce.sistemacursos.modules.curso.dto.CursoDto;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.dto.CursoRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.dto.AsignarDisenadorRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.dto.ParaleloDto;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.dto.ParaleloRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.entity.Curso;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.entity.Paralelo;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.entity.ParaleloId;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.repository.CursoRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.curso.repository.ParaleloRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository.InscripcionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.DocenteRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository.UsuarioRepository;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CursoService {

    private final CursoRepository    cursoRepository;
    private final ParaleloRepository paraleloRepository;
    private final CarreraRepository  carreraRepository;
    private final CoordinadorCarreraRepository coordinadorCarreraRepository;
    private final UsuarioRepository  usuarioRepository;
    private final DocenteRepository  docenteRepository;
    private final InscripcionRepository inscripcionRepository;

    // ── Listar cursos abiertos (catálogo público autenticado) ────────────────
    @Transactional(readOnly = true)
    public List<CursoDto> listarAbiertos(Long idCarrera) {
        return cursoRepository.findAbiertos(idCarrera)
            .stream()
            .map(this::toCursoDto)
            .toList();
    }

    // ── Listar todos (admin y coordinador) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<CursoDto> listarTodos(Long idCarrera) {
        Usuario actual = getUsuarioActual();
        if (esAdmin(actual)) {
            List<Curso> cursos = (idCarrera != null)
                ? cursoRepository.findByCarrera_IdCarrera(idCarrera)
                : cursoRepository.findAll();
            return cursos.stream().map(this::toCursoDto).toList();
        }

        requireCoordinador(actual);

        List<Long> carrerasAsignadas = getCarrerasAsignadas(actual.getIdUsuario());
        if (idCarrera != null && !carrerasAsignadas.contains(idCarrera)) {
            throw new BusinessException("No tienes permisos para ver cursos de esta carrera", 403);
        }

        List<Curso> cursos = (idCarrera != null)
            ? cursoRepository.findByCarrera_IdCarrera(idCarrera)
            : cursoRepository.findAll().stream()
                .filter(curso -> carrerasAsignadas.contains(curso.getCarrera().getIdCarrera()))
                .toList();
        return cursos.stream().map(this::toCursoDto).toList();
    }

    // ── Listar cursos asignados al disenador ───────────────────────────────
    @Transactional(readOnly = true)
    public List<CursoDto> listarAsignadosDisenador() {
        Usuario actual = getUsuarioActual();
        List<Curso> cursos = cursoRepository.findByDisenador_IdUsuario(actual.getIdUsuario());
        return cursos.stream().map(this::toCursoDto).toList();
    }

    // ── Obtener curso por id ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public CursoDto obtener(Long idCurso) {
        return toCursoDto(buscarCurso(idCurso));
    }

    // ── Crear curso ──────────────────────────────────────────────────────────
    @Transactional
    public CursoDto crear(CursoRequest request) {
        Carrera carrera = carreraRepository.findById(request.getIdCarrera())
            .orElseThrow(() -> new ResourceNotFoundException("Carrera", request.getIdCarrera()));

        // El organizador es el usuario autenticado actual
        Usuario organizador = getUsuarioActual();

        // Verificar que el coordinador gestione esa carrera
        // (el admin puede crear en cualquier carrera)
        verificarAccesoCarrera(organizador, carrera);

        Curso curso = Curso.builder()
            .carrera(carrera)
            .organizador(organizador)
            .nombre(request.getNombre())
            .descripcion(request.getDescripcion())
            .imagen(request.getImagen())
            .cargaHoraria(request.getCargaHoraria())
            .fechaInicio(request.getFechaInicio())
            .costoExterno(request.getCostoExterno())
            .costoUmsa(request.getCostoUmsa())
            .notaAprobacion(request.getNotaAprobacion())
            .estado(Curso.EstadoCurso.ABIERTO)
            .build();

        curso = cursoRepository.save(curso);
        log.info("Curso creado: {} por {}", curso.getNombre(), organizador.getUsername());
        return toCursoDto(curso);
    }

    // ── Actualizar curso ─────────────────────────────────────────────────────
    @Transactional
    public CursoDto actualizar(Long idCurso, CursoRequest request) {
        Curso curso = buscarCurso(idCurso);
        verificarAccesoCarrera(getUsuarioActual(), curso.getCarrera());

        Carrera carrera = carreraRepository.findById(request.getIdCarrera())
            .orElseThrow(() -> new ResourceNotFoundException("Carrera", request.getIdCarrera()));

        curso.setCarrera(carrera);
        curso.setNombre(request.getNombre());
        curso.setDescripcion(request.getDescripcion());
        curso.setImagen(request.getImagen());
        curso.setCargaHoraria(request.getCargaHoraria());
        curso.setFechaInicio(request.getFechaInicio());
        curso.setCostoExterno(request.getCostoExterno());
        curso.setCostoUmsa(request.getCostoUmsa());
        curso.setNotaAprobacion(request.getNotaAprobacion());

        cursoRepository.save(curso);
        return toCursoDto(curso);
    }

    // ── Cambiar estado manualmente (ABIERTO / FINALIZADO) ───────────────────
    @Transactional
    public CursoDto cambiarEstado(Long idCurso, String estado) {
        Curso curso = buscarCurso(idCurso);
        verificarAccesoCarrera(getUsuarioActual(), curso.getCarrera());
        try {
            curso.setEstado(Curso.EstadoCurso.valueOf(estado));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                "Estado inválido. Use: ABIERTO, LLENO o FINALIZADO", 400);
        }
        cursoRepository.save(curso);
        return toCursoDto(curso);
    }

    // ── Asignar disenador a curso ─────────────────────────────────────────
    @Transactional
    public CursoDto asignarDisenador(Long idCurso, AsignarDisenadorRequest request) {
        Curso curso = buscarCurso(idCurso);
        verificarAccesoCarrera(getUsuarioActual(), curso.getCarrera());

        if (request.getIdDisenador() == null) {
            curso.setDisenador(null);
            cursoRepository.save(curso);
            return toCursoDto(curso);
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

        curso.setDisenador(disenador);
        cursoRepository.save(curso);
        return toCursoDto(curso);
    }

    // ── Eliminar curso ─────────────────────────────────────────────────────
    @Transactional
    public void eliminar(Long idCurso) {
        Curso curso = buscarCurso(idCurso);
        verificarAccesoCarrera(getUsuarioActual(), curso.getCarrera());
        cursoRepository.delete(curso);
        log.info("Curso eliminado: {}", idCurso);
    }

    // ── Agregar paralelo a un curso ──────────────────────────────────────────
    @Transactional
    public ParaleloDto agregarParalelo(Long idCurso, ParaleloRequest request) {
        Curso curso = buscarCurso(idCurso);
        verificarAccesoCarrera(getUsuarioActual(), curso.getCarrera());

        // Verificar que el código no esté repetido en ese curso
        ParaleloId pk = new ParaleloId(idCurso, request.getCodigo());
        if (paraleloRepository.existsById(pk)) {
            throw new BusinessException(
                "Ya existe un paralelo con código '" + request.getCodigo()
                + "' en este curso", 409);
        }

        Paralelo paralelo = new Paralelo(curso, request.getCodigo());
        paralelo.setModalidad(Paralelo.Modalidad.valueOf(request.getModalidad()));
        paralelo.setCupoMaximo(request.getCupoMaximo());
        paralelo.setHorarioDescripcion(request.getHorarioDescripcion());
        paralelo.setLugar(request.getLugar());
        paralelo.setLink(request.getLink());

        // Asignar docente si se especificó
        if (request.getIdDocente() != null) {
            Usuario docente = usuarioRepository.findById(request.getIdDocente())
                .orElseThrow(() -> new ResourceNotFoundException("Docente", request.getIdDocente()));

            // Verificar que tenga rol DOCENTE
            boolean esDocente = docente.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("DOCENTE"));
            if (!esDocente) {
                throw new BusinessException(
                    "El usuario no tiene el rol DOCENTE", 400);
            }
            paralelo.setDocente(docente);
        }

        paralelo = paraleloRepository.save(paralelo);
        log.info("Paralelo {} agregado al curso {}", request.getCodigo(), idCurso);
        return toParaleloDto(paralelo);
    }

    // ── Actualizar paralelo ──────────────────────────────────────────────────
    @Transactional
    public ParaleloDto actualizarParalelo(Long idCurso, String codigo, ParaleloRequest request) {
        ParaleloId pk = new ParaleloId(idCurso, codigo);
        Paralelo paralelo = paraleloRepository.findById(pk)
            .orElseThrow(() -> new BusinessException(
                "Paralelo '" + codigo + "' no encontrado en el curso " + idCurso, 404));

        verificarAccesoCarrera(getUsuarioActual(), paralelo.getCurso().getCarrera());

        paralelo.setModalidad(Paralelo.Modalidad.valueOf(request.getModalidad()));
        paralelo.setCupoMaximo(request.getCupoMaximo());
        paralelo.setHorarioDescripcion(request.getHorarioDescripcion());
        paralelo.setLugar(request.getLugar());
        paralelo.setLink(request.getLink());

        if (request.getIdDocente() != null) {
            Usuario docente = usuarioRepository.findById(request.getIdDocente())
                .orElseThrow(() -> new ResourceNotFoundException("Docente", request.getIdDocente()));
            paralelo.setDocente(docente);
        } else {
            paralelo.setDocente(null); // permite desasignar docente
        }

        paraleloRepository.save(paralelo);
        return toParaleloDto(paralelo);
    }

    // ── Eliminar paralelo ────────────────────────────────────────────────────
    @Transactional
    public void eliminarParalelo(Long idCurso, String codigo) {
        ParaleloId pk = new ParaleloId(idCurso, codigo);
        Paralelo paralelo = paraleloRepository.findById(pk)
            .orElseThrow(() -> new BusinessException(
                "Paralelo '" + codigo + "' no encontrado", 404));
        verificarAccesoCarrera(getUsuarioActual(), paralelo.getCurso().getCarrera());
        paraleloRepository.delete(paralelo);
        log.info("Paralelo {} eliminado del curso {}", codigo, idCurso);
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    private Curso buscarCurso(Long idCurso) {
        return cursoRepository.findById(idCurso)
            .orElseThrow(() -> new ResourceNotFoundException("Curso", idCurso));
    }

    // Obtiene el usuario autenticado del SecurityContext
    private Usuario getUsuarioActual() {
        CustomUserDetails userDetails = (CustomUserDetails)
            SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return usuarioRepository.findById(userDetails.getIdUsuario())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Usuario", userDetails.getIdUsuario()));
    }

    // Verifica que el usuario pueda gestionar la carrera
    // Admin puede todo — coordinador solo su carrera asignada
    private void verificarAccesoCarrera(Usuario usuario, Carrera carrera) {
        if (esAdmin(usuario)) return; // admin tiene acceso a todo

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
            throw new BusinessException("No tienes permisos para gestionar cursos", 403);
        }
    }

    private List<Long> getCarrerasAsignadas(Long idUsuario) {
        return coordinadorCarreraRepository.findByIdCoordinador(idUsuario)
            .stream()
            .map(CoordinadorCarrera::getCarrera)
            .map(Carrera::getIdCarrera)
            .toList();
    }

    // Convierte Curso → CursoDto incluyendo sus paralelos
    private CursoDto toCursoDto(Curso c) {
        CursoDto dto = new CursoDto();
        dto.setIdCurso(c.getIdCurso());
        dto.setIdCarrera(c.getCarrera().getIdCarrera());
        dto.setNombreCarrera(c.getCarrera().getNombre());
        dto.setNombreOrganizador(
            c.getOrganizador().getNombres() + " " + c.getOrganizador().getApellidos());
        if (c.getDisenador() != null) {
            dto.setIdDisenador(c.getDisenador().getIdUsuario());
            dto.setNombreDisenador(
                c.getDisenador().getNombres() + " " + c.getDisenador().getApellidos());
        }
        dto.setNombre(c.getNombre());
        dto.setDescripcion(c.getDescripcion());
        dto.setImagen(c.getImagen());
        dto.setCargaHoraria(c.getCargaHoraria());
        dto.setFechaInicio(c.getFechaInicio());
        dto.setCostoExterno(c.getCostoExterno());
        dto.setCostoUmsa(c.getCostoUmsa());
        dto.setNotaAprobacion(c.getNotaAprobacion());
        dto.setEstado(c.getEstado().name());
        dto.setFechaCreacion(c.getFechaCreacion());
        dto.setParalelos(c.getParalelos().stream()
            .map(this::toParaleloDto)
            .toList());
        return dto;
    }

    private String normalizeRolName(String nombreRol) {
        if (nombreRol == null) return "";
        return nombreRol.replace("Ñ", "N").replace("ñ", "n").toUpperCase();
    }

    private ParaleloDto toParaleloDto(Paralelo p) {
        ParaleloDto dto = new ParaleloDto();
        dto.setCodigo(p.getId().getCodigo());
        dto.setIdCurso(p.getId().getIdCurso());
        dto.setModalidad(p.getModalidad().name());
        dto.setCupoMaximo(p.getCupoMaximo());
        dto.setHorarioDescripcion(p.getHorarioDescripcion());
        dto.setLugar(p.getLugar());
        dto.setLink(p.getLink());

        if (p.getDocente() != null) {
            dto.setNombreDocente(
                p.getDocente().getNombres() + " " + p.getDocente().getApellidos());

            docenteRepository.findById(p.getDocente().getIdUsuario())
                .ifPresent(docente -> dto.setTituloDocente(docente.getTitulo()));
        }

        // Calcular inscritos y cupos disponibles
        int inscritos = inscripcionRepository.contarConfirmadasEnParalelo(
            p.getId().getIdCurso(), p.getId().getCodigo());
        dto.setInscritos(inscritos);

        if (p.getCupoMaximo() != null) {
            dto.setCuposDisponibles(Math.max(0, p.getCupoMaximo() - inscritos));
        }

        return dto;
    }
}