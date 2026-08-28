package bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.entity.SolicitudEmision;

public interface SolicitudEmisionRepository
        extends JpaRepository<SolicitudEmision, Long> {

    // Solicitudes pendientes — bandeja del coordinador
    @Query("""
        SELECT s FROM SolicitudEmision s
        LEFT JOIN FETCH s.curso c
        LEFT JOIN FETCH c.carrera
        LEFT JOIN FETCH s.evento e
        LEFT JOIN FETCH e.carrera
        LEFT JOIN FETCH s.docente
        WHERE s.estado = :estado
        ORDER BY s.fechaSolicitud ASC
        """)
    List<SolicitudEmision> findByEstadoOrderByFechaSolicitudAsc(
        @Param("estado") SolicitudEmision.EstadoSolicitud estado);

    @Query("""
        SELECT s FROM SolicitudEmision s
        LEFT JOIN FETCH s.curso c
        LEFT JOIN FETCH c.carrera
        LEFT JOIN FETCH s.evento e
        LEFT JOIN FETCH e.carrera
        LEFT JOIN FETCH s.docente
        ORDER BY s.fechaSolicitud DESC
        """)
    List<SolicitudEmision> findAllByOrderByFechaSolicitudDesc();

    // Solicitudes de un docente específico
    List<SolicitudEmision> findByDocente_IdUsuario(Long idDocente);

    boolean existsByEvento_IdEventoAndEstado(
        Long idEvento,
        SolicitudEmision.EstadoSolicitud estado
    );

    boolean existsByCurso_IdCursoAndCodigoParaleloAndEstado(
        Long idCurso,
        String codigoParalelo,
        SolicitudEmision.EstadoSolicitud estado
    );

    boolean existsByCurso_IdCursoAndCodigoParalelo(
        Long idCurso,
        String codigoParalelo
    );

    long countByEstado(SolicitudEmision.EstadoSolicitud estado);
}