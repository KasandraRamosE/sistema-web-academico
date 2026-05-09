package bo.edu.umsa.fhce.sistemacursos.modules.curso.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class CursoRequest {

    @NotNull(message = "La carrera es obligatoria")
    private Long idCarrera;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
    private String nombre;

    private String descripcion;

    @Size(max = 255, message = "El lugar no puede superar 255 caracteres")
    private String lugar;

    @Size(max = 255, message = "La imagen no puede superar 255 caracteres")
    private String imagen;

    @NotNull(message = "La carga horaria es obligatoria")
    @Positive(message = "La carga horaria debe ser mayor a 0")
    private Integer cargaHoraria;

    @NotNull(message = "La fecha de inicio es obligatoria")
    @FutureOrPresent(message = "La fecha de inicio no puede ser en el pasado")
    private LocalDate fechaInicio;

    @NotNull(message = "El costo externo es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo externo no puede ser negativo")
    private BigDecimal costoExterno;

    @NotNull(message = "El costo UMSA es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo UMSA no puede ser negativo")
    private BigDecimal costoUmsa;

    @NotNull(message = "La nota de aprobación es obligatoria")
    @DecimalMin(value = "0.00", message = "La nota mínima no puede ser negativa")
    @DecimalMax(value = "100.00", message = "La nota mínima no puede superar 100")
    private BigDecimal notaAprobacion;
}