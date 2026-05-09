// src/main/java/.../modules/inscripcion/repository/InscripcionRepository.java

package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.entity.Inscripcion;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroActividadDto;
import bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionCarreraDto;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {

    // Todas las inscripciones de un participante
    List<Inscripcion> findByParticipante_IdUsuario(Long idUsuario);

    // Verificar si ya está inscrito a un curso
    boolean existsByParticipante_IdUsuarioAndCurso_IdCurso(
        Long idUsuario, Long idCurso);

    // Verificar si ya está inscrito a un evento
    boolean existsByParticipante_IdUsuarioAndEvento_IdEvento(
        Long idUsuario, Long idEvento);

    // Inscripciones de un curso — para el coordinador/docente
    List<Inscripcion> findByCurso_IdCurso(Long idCurso);

    // Inscripciones de un paralelo específico
    @Query("""
        SELECT i FROM Inscripcion i
        WHERE i.curso.idCurso = :idCurso
        AND i.codigoParalelo = :codigo
        AND i.estado = 'CONFIRMADA'
        """)
    List<Inscripcion> findConfirmadasPorParalelo(
        @Param("idCurso") Long idCurso,
        @Param("codigo") String codigo
    );

    // Inscripciones de un evento
    List<Inscripcion> findByEvento_IdEvento(Long idEvento);

    // Contar confirmadas en un paralelo — para control de cupo
    @Query("""
        SELECT COUNT(i) FROM Inscripcion i
        WHERE i.curso.idCurso = :idCurso
        AND i.codigoParalelo = :codigo
        AND i.estado = 'CONFIRMADA'
        """)
    int contarConfirmadasEnParalelo(
        @Param("idCurso") Long idCurso,
        @Param("codigo") String codigo
    );

    // Contar confirmadas en un evento
    @Query("""
        SELECT COUNT(i) FROM Inscripcion i
        WHERE i.evento.idEvento = :idEvento
        AND i.estado = 'CONFIRMADA'
        """)
    int contarConfirmadasEnEvento(@Param("idEvento") Long idEvento);

    long countByEstado(Inscripcion.EstadoInscripcion estado);

    long countByCurso_IdCursoAndEstado(Long idCurso, Inscripcion.EstadoInscripcion estado);

    long countByEvento_IdEventoAndEstado(Long idEvento, Inscripcion.EstadoInscripcion estado);

    @Query("""
        SELECT new bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroActividadDto(
            'CURSO',
            c.idCurso,
            c.nombre,
            c.carrera.nombre,
            SUM(CASE WHEN i.tipoPrecio = :umsa THEN i.saldo ELSE 0 END),
            SUM(CASE WHEN i.tipoPrecio = :externo THEN i.saldo ELSE 0 END)
        )
        FROM Inscripcion i
        JOIN i.curso c
        WHERE i.estado = 'CONFIRMADA'
          AND (:idCarrera IS NULL OR c.carrera.idCarrera = :idCarrera)
          AND (:carreras IS NULL OR c.carrera.idCarrera IN :carreras)
          AND (:desde IS NULL OR i.fechaInscripcion >= :desde)
          AND (:hasta IS NULL OR i.fechaInscripcion <= :hasta)
        GROUP BY c.idCurso, c.nombre, c.carrera.nombre
        ORDER BY c.nombre ASC
        """)
    List<ReporteFinancieroActividadDto> reporteFinancieroCursos(
        @Param("idCarrera") Long idCarrera,
        @Param("carreras") List<Long> carreras,
        @Param("desde") java.time.LocalDateTime desde,
        @Param("hasta") java.time.LocalDateTime hasta,
        @Param("umsa") Inscripcion.TipoPrecio umsa,
        @Param("externo") Inscripcion.TipoPrecio externo
    );

    @Query("""
        SELECT new bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteFinancieroActividadDto(
            'EVENTO',
            e.idEvento,
            e.nombre,
            e.carrera.nombre,
            SUM(CASE WHEN i.tipoPrecio = :umsa THEN i.saldo ELSE 0 END),
            SUM(CASE WHEN i.tipoPrecio = :externo THEN i.saldo ELSE 0 END)
        )
        FROM Inscripcion i
        JOIN i.evento e
        WHERE i.estado = 'CONFIRMADA'
          AND (:idCarrera IS NULL OR e.carrera.idCarrera = :idCarrera)
          AND (:carreras IS NULL OR e.carrera.idCarrera IN :carreras)
          AND (:desde IS NULL OR i.fechaInscripcion >= :desde)
          AND (:hasta IS NULL OR i.fechaInscripcion <= :hasta)
        GROUP BY e.idEvento, e.nombre, e.carrera.nombre
        ORDER BY e.nombre ASC
        """)
    List<ReporteFinancieroActividadDto> reporteFinancieroEventos(
        @Param("idCarrera") Long idCarrera,
        @Param("carreras") List<Long> carreras,
        @Param("desde") java.time.LocalDateTime desde,
        @Param("hasta") java.time.LocalDateTime hasta,
        @Param("umsa") Inscripcion.TipoPrecio umsa,
        @Param("externo") Inscripcion.TipoPrecio externo
    );

    @Query("""
        SELECT new bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionCarreraDto(
            c.carrera.idCarrera,
            c.carrera.nombre,
            SUM(CASE WHEN i.tipoPrecio = :umsa THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.tipoPrecio = :externo THEN 1 ELSE 0 END)
        )
        FROM Inscripcion i
        JOIN i.curso c
        WHERE i.estado = 'CONFIRMADA'
          AND (:idCarrera IS NULL OR c.carrera.idCarrera = :idCarrera)
          AND (:carreras IS NULL OR c.carrera.idCarrera IN :carreras)
          AND (:desde IS NULL OR i.fechaInscripcion >= :desde)
          AND (:hasta IS NULL OR i.fechaInscripcion <= :hasta)
        GROUP BY c.carrera.idCarrera, c.carrera.nombre
        """)
    List<ReporteParticipacionCarreraDto> reporteParticipacionPorCarreraCursos(
        @Param("idCarrera") Long idCarrera,
        @Param("carreras") List<Long> carreras,
        @Param("desde") java.time.LocalDateTime desde,
        @Param("hasta") java.time.LocalDateTime hasta,
        @Param("umsa") Inscripcion.TipoPrecio umsa,
        @Param("externo") Inscripcion.TipoPrecio externo
    );

    @Query("""
        SELECT new bo.edu.umsa.fhce.sistemacursos.modules.reporte.dto.ReporteParticipacionCarreraDto(
            e.carrera.idCarrera,
            e.carrera.nombre,
            SUM(CASE WHEN i.tipoPrecio = :umsa THEN 1 ELSE 0 END),
            SUM(CASE WHEN i.tipoPrecio = :externo THEN 1 ELSE 0 END)
        )
        FROM Inscripcion i
        JOIN i.evento e
        WHERE i.estado = 'CONFIRMADA'
          AND (:idCarrera IS NULL OR e.carrera.idCarrera = :idCarrera)
          AND (:carreras IS NULL OR e.carrera.idCarrera IN :carreras)
          AND (:desde IS NULL OR i.fechaInscripcion >= :desde)
          AND (:hasta IS NULL OR i.fechaInscripcion <= :hasta)
        GROUP BY e.carrera.idCarrera, e.carrera.nombre
        """)
    List<ReporteParticipacionCarreraDto> reporteParticipacionPorCarreraEventos(
        @Param("idCarrera") Long idCarrera,
        @Param("carreras") List<Long> carreras,
        @Param("desde") java.time.LocalDateTime desde,
        @Param("hasta") java.time.LocalDateTime hasta,
        @Param("umsa") Inscripcion.TipoPrecio umsa,
        @Param("externo") Inscripcion.TipoPrecio externo
    );
}