package bo.edu.umsa.fhce.sistemacursos.modules.evento.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EventoDto {
    private Long idEvento;
    private Long idCarrera;
    private String nombreCarrera;
    private String nombreOrganizador;
    private String nombre;
    private String descripcion;
    private Integer cargaHoraria;
    private String modalidad;
    private LocalDateTime fechaHora;
    private Integer cupoMaximo;
    private Integer inscritos;        // calculado
    private Integer cuposDisponibles; // cupoMaximo - inscritos
    private BigDecimal costoExterno;
    private BigDecimal costoUmsa;
    private String estado;
    private LocalDateTime fechaCreacion;
    private String link;
}