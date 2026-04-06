// src/main/java/.../modules/inscripcion/repository/InscripcionRepository.java

package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.entity.Inscripcion;

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
}