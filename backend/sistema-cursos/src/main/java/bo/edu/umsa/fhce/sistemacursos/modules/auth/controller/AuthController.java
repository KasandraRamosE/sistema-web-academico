package bo.edu.umsa.fhce.sistemacursos.modules.auth.controller;

import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.LoginRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.LoginResponse;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.MensajeResponse;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.RefreshTokenResponse;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.VerificarEmailRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.RegistroRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.SolicitarResetPasswordRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.VerificarCodigoResetRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.CambiarPasswordRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.dto.ReenviarCodigoRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.auth.service.AuthService;
import bo.edu.umsa.fhce.sistemacursos.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

// AuthController.java — versión completa

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Login, registro y verificación de usuarios")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthService authService;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    // false por defecto: hoy el servidor se sirve por HTTP plano. Activar
    // vía COOKIE_SECURE=true apenas se agregue HTTPS — sin volver a tocar código.
    @Value("${app.jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Devuelve JWT para usuarios UMSA y externos; el refresh token se setea como cookie HttpOnly")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);
        setRefreshCookie(response, loginResponse.getRefreshToken());
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar token", description = "Lee el refresh token de la cookie HttpOnly y devuelve un nuevo JWT")
    public ResponseEntity<RefreshTokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshTokenCookie,
            HttpServletResponse response) {
        RefreshTokenResponse refreshResponse = authService.refreshToken(refreshTokenCookie);
        setRefreshCookie(response, refreshResponse.getRefreshToken());
        return ResponseEntity.ok(refreshResponse);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revoca el refresh token de la cookie y la limpia")
    public ResponseEntity<MensajeResponse> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshTokenCookie,
            HttpServletResponse response) {
        MensajeResponse mensaje = authService.logout(refreshTokenCookie);
        clearRefreshCookie(response);
        return ResponseEntity.ok(mensaje);
    }

    // ── Cookie del refresh token ──────────────────────────────────────────
    // HttpOnly: inaccesible desde JS (protege contra robo vía XSS).
    // SameSite=Strict: el navegador no la manda en requests iniciados desde
    // otro sitio (mitiga CSRF sobre /auth/refresh y /auth/logout).
    // Path=/api: coincide con server.servlet.context-path, se manda en toda
    // la API pero no se filtra a rutas fuera de ella.
    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/api")
            .maxAge(refreshExpirationMs / 1000)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/api")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/registro")
    @Operation(summary = "Registro de usuario externo")
    public ResponseEntity<MensajeResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        // 201 Created para creación de recursos
        return ResponseEntity.status(201).body(authService.registrar(request));
    }

    @PostMapping("/verificar-email")
    @Operation(summary = "Verificar email con código de 6 dígitos")
    public ResponseEntity<MensajeResponse> verificarEmail(
            @Valid @RequestBody VerificarEmailRequest request) {
        return ResponseEntity.ok(authService.verificarEmail(request));
    }

    @PostMapping("/reenviar-codigo")
    @Operation(summary = "Reenviar código de verificación")
    public ResponseEntity<MensajeResponse> reenviarCodigo(
            @Valid @RequestBody ReenviarCodigoRequest request) {
        return ResponseEntity.ok(authService.reenviarCodigo(request.getUsername()));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario autenticado actual")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        response.put("idUsuario",  user.getIdUsuario());
        response.put("username",   user.getUsername());
        response.put("nombres",    user.getNombres());
        response.put("apellidos",  user.getApellidos());
        response.put("roles", user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority).toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/solicitar-reset-password")
    @Operation(summary = "Solicitar código para resetear contraseña")
    public ResponseEntity<MensajeResponse> solicitarResetPassword(
            @Valid @RequestBody SolicitarResetPasswordRequest request) {
        return ResponseEntity.ok(authService.solicitarResetPassword(request));
    }

    @PostMapping("/verificar-codigo-reset")
    @Operation(summary = "Verificar código de reset de contraseña")
    public ResponseEntity<MensajeResponse> verificarCodigoReset(
            @Valid @RequestBody VerificarCodigoResetRequest request) {
        return ResponseEntity.ok(authService.verificarCodigoReset(request));
    }

    @PostMapping("/cambiar-password")
    @Operation(summary = "Cambiar contraseña con código verificado")
    public ResponseEntity<MensajeResponse> cambiarPassword(
            @Valid @RequestBody CambiarPasswordRequest request) {
        return ResponseEntity.ok(authService.cambiarPassword(request));
    }
}