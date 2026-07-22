package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration.dto;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Getter;

// Cuerpo del POST /rest/deuda/registrar (Guía de Integración Libélula v2.145, sección 1)
@Getter
@Builder
public class LibelulaRegistrarDeudaRequest {

    @JsonProperty("appkey")
    private String appkey;

    @JsonProperty("email_cliente")
    private String emailCliente;

    // OJO: la tabla de parámetros del manual lo llama "identificador_deuda",
    // pero el ejemplo JSON de la propia guía usa la clave "identificador".
    // Se sigue el ejemplo (es el que Libélula realmente probó) — confirmar
    // contra el ambiente de pruebas apenas se tenga el appkey.
    @JsonProperty("identificador")
    private String identificador;

    @JsonProperty("descripcion")
    private String descripcion;

    @JsonProperty("callback_url")
    private String callbackUrl;

    @JsonProperty("nombre_cliente")
    private String nombreCliente;

    @JsonProperty("apellido_cliente")
    private String apellidoCliente;

    @JsonProperty("ci")
    private String ci;

    @JsonProperty("moneda")
    private String moneda;

    @JsonProperty("lineas_detalle_deuda")
    private List<Linea> lineasDetalleDeuda;

    @Getter
    @Builder
    public static class Linea {
        @JsonProperty("concepto")
        private String concepto;

        @JsonProperty("cantidad")
        private Integer cantidad;

        @JsonProperty("costo_unitario")
        private BigDecimal costoUnitario;
    }
}
