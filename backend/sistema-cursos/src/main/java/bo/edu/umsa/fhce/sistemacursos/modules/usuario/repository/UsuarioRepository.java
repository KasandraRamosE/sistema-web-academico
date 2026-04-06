package bo.edu.umsa.fhce.sistemacursos.modules.usuario.repository;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// JpaRepository<Entidad, TipoDeLaPK> nos da gratis:
// findById, findAll, save, delete, count, existsById, etc.
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Spring genera el SQL automáticamente a partir del nombre del método
    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // JPQL con JOIN FETCH para cargar roles en la misma query
    // (evita el problema N+1 de Hibernate)
    @Query("SELECT u FROM Usuario u JOIN FETCH u.roles WHERE u.username = :username")
    Optional<Usuario> findByUsernameWithRoles(@Param("username") String username);
}