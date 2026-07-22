package bo.edu.umsa.fhce.sistemacursos.modules.auth.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bo.edu.umsa.fhce.sistemacursos.modules.auth.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenAndRevocadoFalse(String token);

    @Modifying
    @Query("update RefreshToken rt set rt.revocado = true where rt.token = :token")
    int revocarPorToken(@Param("token") String token);

    @Modifying
    @Query("update RefreshToken rt set rt.revocado = true where rt.usuario.idUsuario = :idUsuario and rt.revocado = false")
    int revocarPorUsuario(@Param("idUsuario") Long idUsuario);

    // Filas sin ningún valor: revocadas (rotadas o deslogueadas) o ya
    // expiradas. Ninguna de las dos puede volver a usarse — se pueden borrar.
    @Modifying
    @Query("delete from RefreshToken rt where rt.revocado = true or rt.fechaExpiracion < :ahora")
    int eliminarRevocadosOExpirados(@Param("ahora") LocalDateTime ahora);
}
