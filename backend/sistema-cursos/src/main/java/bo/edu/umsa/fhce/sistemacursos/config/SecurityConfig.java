// src/main/java/.../config/SecurityConfig.java

package bo.edu.umsa.fhce.sistemacursos.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import bo.edu.umsa.fhce.sistemacursos.security.JwtAuthFilter;
import bo.edu.umsa.fhce.sistemacursos.security.RestAccessDeniedHandler;
import bo.edu.umsa.fhce.sistemacursos.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
// @PreAuthorize("hasRole('ADMIN')") en controllers funcionará gracias a esto:
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    // Orígenes permitidos para CORS, separados por coma.
    // En dev: localhost del servidor de Vite. En prod: SIN default — debe
    // venir de ALLOWED_ORIGINS con el dominio real una vez desplegado.
    // Si queda vacío, no se permite ningún origen cross-origin (falla cerrado,
    // no abierto): la API sigue funcionando, solo el navegador bloquea el CORS.
    @Value("${app.cors.allowed-origins:}")
    private String allowedOriginsRaw;

    // ── Endpoints PÚBLICOS — no requieren JWT ────────────────────────────────
    private static final String[] PUBLIC_ENDPOINTS = {
        "/auth/**",              // login, registro, verificación de email
        "/verificar/**",         // verificación pública de certificados por QR
        "/certificados/verificar/**",
        "/uploads/**",
        "/swagger-ui/**",        // documentación API en desarrollo
        "/swagger-ui.html",
        "/api-docs/**",
        "/v3/api-docs/**",
        // Context path /api
        "/api/swagger-ui/**",
        "/api/swagger-ui.html",
        "/api/v3/api-docs/**",
        "/api/api-docs/**"
    };

    // ── Cadena de filtros de seguridad ───────────────────────────────────────
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Respuestas consistentes: 401 sin autenticacion y 403 sin permisos
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler))

            // Reglas de autorización por endpoint
            .authorizeHttpRequests(auth -> auth
                // Perfil actual: requiere JWT válido
                .requestMatchers(HttpMethod.GET, "/auth/me").authenticated()

                // Endpoints públicos: acceso sin token
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                // Verificación de certificados: GET público
                .requestMatchers(HttpMethod.GET, "/certificados/verificar/**").permitAll()

                // Callback de Libélula: lo llama el servidor de Libélula, sin JWT.
                // La seguridad NO depende de este permitAll — depende de que
                // InscripcionService.confirmarPagoLibelula() vuelve a consultar
                // a Libélula (server-to-server, con appkey) antes de confirmar nada.
                .requestMatchers(HttpMethod.GET, "/payments/libelula/callback").permitAll()

                // Catálogo público
                .requestMatchers(HttpMethod.GET, "/cursos/**", "/eventos/**", "/carreras/**").permitAll()

                .anyRequest().authenticated()
            )

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── BCrypt para hashear contraseñas de usuarios externos ────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Factor de costo 12: balance entre seguridad y velocidad
        // (10 es el default, 12 es más seguro, 14+ es muy lento para login)
        return new BCryptPasswordEncoder(12);
    }

    

    // ── AuthenticationManager: lo usan los controllers de auth para autenticar
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ── CORS: solo los orígenes de app.cors.allowed-origins (ver arriba) ────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> allowedOrigins = Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList();
        // Lista explícita (no patrón "*"): es la única forma de combinar
        // orígenes concretos con allowCredentials(true) de forma segura.
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}