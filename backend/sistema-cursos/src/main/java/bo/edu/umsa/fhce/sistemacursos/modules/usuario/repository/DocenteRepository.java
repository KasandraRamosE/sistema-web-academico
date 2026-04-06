package bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Docente;

public interface DocenteRepository extends JpaRepository<Docente, Long> {
}