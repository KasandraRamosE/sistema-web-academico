package bo.edu.umsa.fhce.sistemacursos.modules.curso.repository;

import bo.edu.umsa.fhce.sistemacursos.modules.curso.entity.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CursoRepository extends JpaRepository<Curso, Long> {

    // Cursos por carrera
    List<Curso> findByCarrera_IdCarrera(Long idCarrera);

    // Cursos abiertos de una carrera — para el catálogo de participantes
    @Query("""
        SELECT c FROM Curso c
        WHERE c.estado = 'ABIERTO'
        AND (:idCarrera IS NULL OR c.carrera.idCarrera = :idCarrera)
        ORDER BY c.fechaInicio ASC
        """)
    List<Curso> findAbiertos(@Param("idCarrera") Long idCarrera);

    // Cursos gestionados por un coordinador específico
    List<Curso> findByOrganizador_IdUsuario(Long idUsuario);
}