package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

// Respuesta de POST /rest/deuda/registrar (Guía de Integración Libélula v2.145, sección 1)
@Getter @Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class LibelulaRegistrarDeudaResponse {

    @JsonProperty("error")
    private Boolean error;

    @JsonProperty("mensaje")
    private String mensaje;

    @JsonProperty("url_pasarela_pagos")
    private String urlPasarelaPagos;

    @JsonProperty("id_transaccion")
    private String idTransaccion;

    @JsonProperty("qr_simple_url")
    private String qrSimpleUrl;
}
