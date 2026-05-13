package bo.edu.umsa.fhce.sistemacursos.modules.curso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ParaleloRequest {

    @NotBlank(message = "El código del paralelo es obligatorio")
    @Size(max = 10, message = "El código no puede superar 10 caracteres")
    private String codigo;

    // Puede ser null — docente se asigna después
    private Long idDocente;

    @NotNull(message = "La modalidad es obligatoria")
    private String modalidad; // PRESENCIAL, VIRTUAL, MIXTO

    @Positive(message = "El cupo debe ser mayor a 0")
    private Integer cupoMaximo; // null = sin límite

    @Size(max = 255)
    private String horarioDescripcion;

    @Size(max = 255)
    private String lugar;

    @Size(max = 255)
    private String link;
}