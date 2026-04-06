// src/main/java/.../config/SecurityConfig.java

package bo.edu.umsa.fhce.sistemacursos.config;

import bo.edu.umsa.fhce.sistemacursos.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

@Configuration
@EnableWebSecurity
// @PreAuthorize("hasRole('ADMIN')") en controllers funcionará gracias a esto:
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // ── Endpoints PÚBLICOS — no requieren JWT ────────────────────────────────
    private static final String[] PUBLIC_ENDPOINTS = {
        "/auth/**",              // login, registro, verificación de email
        "/verificar/**",         // verificación pública de certificados por QR
        "/certificados/verificar/**",
        "/swagger-ui/**",        // documentación API en desarrollo
        "/swagger-ui.html",
        "/api-docs/**",
        "/v3/api-docs/**"
    };

    // ── Cadena de filtros de seguridad ───────────────────────────────────────
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilitar CSRF: no necesario para APIs REST con JWT
            // (CSRF protege formularios HTML con sesiones — no aplica aquí)
            .csrf(AbstractHttpConfigurer::disable)

            // Configurar CORS para permitir peticiones desde Vue (localhost:5173)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Sin sesiones: cada request se autentica por JWT
            // STATELESS = Spring nunca crea ni usa HttpSession
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Reglas de autorización por endpoint
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos: acceso sin token
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                // Verificación de certificados: GET público
                .requestMatchers(HttpMethod.GET, "/certificados/verificar/**").permitAll()

                // Todo lo demás requiere autenticación
                // La autorización por ROL se maneja con @PreAuthorize en los controllers
                .anyRequest().authenticated()
            )

            // Agregar el filtro JWT ANTES del filtro de usuario/contraseña de Spring
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

    // ── CORS: permite que Vue (puerto 5173) llame al backend (puerto 8080) ───
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // En producción cambiar por el dominio real del frontend
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",  // Vite dev server
            "http://localhost:4173"   // Vite preview
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}