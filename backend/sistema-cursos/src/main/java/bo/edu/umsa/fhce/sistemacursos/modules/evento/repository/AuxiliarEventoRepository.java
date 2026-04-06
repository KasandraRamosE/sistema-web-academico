// src/main/java/.../modules/evento/repository/AuxiliarEventoRepository.java

package bo.edu.umsa.fhce.sistemacursos.modules.evento.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.AuxiliarEvento;
import bo.edu.umsa.fhce.sistemacursos.modules.evento.entity.AuxiliarEventoId;

public interface AuxiliarEventoRepository
        extends JpaRepository<AuxiliarEvento, AuxiliarEventoId> {

    @Query("SELECT ae FROM AuxiliarEvento ae WHERE ae.evento.idEvento = :idEvento")
    List<AuxiliarEvento> findByIdEvento(@Param("idEvento") Long idEvento);

    @Query("SELECT ae FROM AuxiliarEvento ae WHERE ae.auxiliar.idUsuario = :idAuxiliar")
    List<AuxiliarEvento> findByIdAuxiliar(@Param("idAuxiliar") Long idAuxiliar);

    // Verifica si un auxiliar está asignado a un evento específico
    // — lo usaremos en el módulo de asistencia para validar permisos
    boolean existsByAuxiliar_IdUsuarioAndEvento_IdEvento(
        Long idAuxiliar, Long idEvento);
}