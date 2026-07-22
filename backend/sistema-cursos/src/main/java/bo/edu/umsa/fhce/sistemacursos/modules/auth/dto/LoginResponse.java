package bo.edu.umsa.fhce.sistemacursos.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

// Lo que devolvemos al cliente después de un login exitoso
@Getter
@AllArgsConstructor
public class LoginResponse {
    private String token;        // JWT para usar en los siguientes requests
    private String tipo;         // siempre "Bearer"

    // El controller lo lee para setear la cookie HttpOnly, pero @JsonIgnore
    // evita que viaje en el body — nunca queda expuesto a JS en el frontend.
    @JsonIgnore
    private String refreshToken;
    private Long idUsuario;
    private String username;
    private String nombres;
    private String apellidos;
    private String tipoParticipante; // UMSA o EXTERNO si existe perfil participante
    private List<String> roles;  // ["ROLE_COORDINADOR", "ROLE_DOCENTE"]
}