package bo.edu.umsa.fhce.sistemacursos.modules.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ActualizarUsuarioAdminRequest {

    @NotBlank(message = "El carnet de identidad es obligatorio")
    @Size(max = 20, message = "El carnet de identidad es demasiado largo")
    private String ci;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellidos;

    // Email y estado son opcionales: el frontend solo los manda para
    // usuarios EXTERNO (los INTERNO/UMSA no pueden cambiar estos datos aquí).
    @Email(message = "El email no tiene un formato válido")
    @Size(max = 120, message = "Email demasiado largo")
    private String email;

    // Valores: ACTIVO, INACTIVO
    private String estado;
}
