package bo.edu.umsa.fhce.sistemacursos.modules.curso.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ParaleloDto {
    private String codigo;
    private Long idCurso;
    private String nombreDocente;   // nombre completo del docente (puede ser null)
    private String tituloDocente;   // titulo academico del docente (puede ser null)
    private String modalidad;
    private Integer cupoMaximo;
    private Integer inscritos;      // calculado en el servicio
    private Integer cuposDisponibles; // cupoMaximo - inscritos (null si sin límite)
    private String horarioDescripcion;
    private String lugar;
    private String link;
}