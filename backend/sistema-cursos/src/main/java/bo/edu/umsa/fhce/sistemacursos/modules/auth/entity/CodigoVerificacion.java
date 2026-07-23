package bo.edu.umsa.fhce.sistemacursos.modules.auth.entity;

import bo.edu.umsa.fhce.sistemacursos.modules.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "codigo_verificacion")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodigoVerificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_codigo")
    private Long idCodigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    // 6 dígitos: "847291"
    @Column(name = "codigo", nullable = false, length = 6)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoCodigo tipo;

    @Column(name = "usado", nullable = false)
    private boolean usado = false;

    // Intentos fallidos de este código — protección contra fuerza bruta
    // (probar los 10^6 valores posibles antes de que expire)
    @Column(name = "intentos", nullable = false)
    @Builder.Default
    private int intentos = 0;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    // Válido por 24 horas desde la creación
    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    // Momento en que el usuario ingresó el código
    @Column(name = "fecha_uso")
    private LocalDateTime fechaUso;

    @PrePersist
    protected void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        // fechaExpiracion la setea el Service — tiene el valor configurable
    }

    public static final int MAX_INTENTOS = 5;

    // Verifica si el código todavía puede usarse
    public boolean esValido() {
        return !usado && intentos < MAX_INTENTOS && LocalDateTime.now().isBefore(fechaExpiracion);
    }

    public enum TipoCodigo {
        EMAIL, REGISTRO, RESET_PASSWORD
    }
}