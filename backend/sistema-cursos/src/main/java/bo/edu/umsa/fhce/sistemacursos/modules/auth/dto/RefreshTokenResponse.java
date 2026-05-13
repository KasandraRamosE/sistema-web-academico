package bo.edu.umsa.fhce.sistemacursos.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RefreshTokenResponse {
    private String token;
    private String tipo;
    private String refreshToken;
}
