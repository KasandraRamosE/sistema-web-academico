package bo.edu.umsa.fhce.sistemacursos.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VerificarCodigoResetRequest {
    @NotBlank(message = "El username es requerido")
    private String username;

    @NotBlank(message = "El código es requerido")
    @Pattern(regexp = "\\d{6}", message = "El código debe tener exactamente 6 dígitos")
    private String codigo;
}
