package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.JsonNode;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration.dto.LibelulaRegistrarDeudaRequest;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration.dto.LibelulaRegistrarDeudaResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

// Implementación real de la pasarela Libélula, según
// "GUÍA DE INTEGRACIÓN PARA EMPRESAS v2.145".
// Se activa solo con el perfil "prod". Mientras UMSA/FHCE no reciba el
// appkey de Libélula, cualquier intento de pago falla con un 503 claro
// en vez de un error genérico o un pago fantasma.
@Component
@Profile("prod")
@Slf4j
public class RealLibelulaClient implements LibelulaClient {

    @Value("${app.libelula.appkey:}")
    private String appkey;

    @Value("${app.libelula.base-url:https://api.libelula.bo}")
    private String baseUrl;

    private RestClient restClient;

    @PostConstruct
    void init() {
        if (appkey == null || appkey.isBlank()) {
            log.warn("app.libelula.appkey no está configurado — la pasarela de pagos "
                + "responderá 503 hasta que UMSA/FHCE reciba el appkey de Libélula.");
        }

        // NOTA: usa los timeouts por defecto de RestClient (JDK HttpClient).
        // Si en producción se detectan cuelgues por lentitud de red hacia
        // Libélula, configurar un ClientHttpRequestFactory con timeouts explícitos.
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .build();
    }

    @Override
    public DeudaRegistrada registrarDeuda(RegistrarDeudaParams params) {
        requireAppkeyConfigurado();

        LibelulaRegistrarDeudaRequest body = LibelulaRegistrarDeudaRequest.builder()
            .appkey(appkey)
            .emailCliente(params.emailCliente())
            .identificador(params.identificadorDeuda())
            .descripcion(params.descripcion())
            .callbackUrl(params.callbackUrl())
            .nombreCliente(params.nombreCliente())
            .apellidoCliente(params.apellidoCliente())
            .ci(params.ci())
            .moneda("BOB")
            .lineasDetalleDeuda(List.of(
                LibelulaRegistrarDeudaRequest.Linea.builder()
                    .concepto(params.descripcion())
                    .cantidad(1)
                    .costoUnitario(params.monto())
                    .build()
            ))
            .build();

        LibelulaRegistrarDeudaResponse response;
        try {
            response = restClient.post()
                .uri("/rest/deuda/registrar")
                .body(body)
                .retrieve()
                .body(LibelulaRegistrarDeudaResponse.class);
        } catch (RestClientException ex) {
            log.error("Error de red al registrar deuda en Libélula", ex);
            throw new BusinessException("La pasarela de pagos no está disponible en este momento", 503);
        }

        if (response == null || Boolean.TRUE.equals(response.getError())) {
            String mensaje = response != null ? response.getMensaje() : "sin respuesta";
            log.error("Libélula rechazó el registro de deuda: {}", mensaje);
            throw new BusinessException("No se pudo iniciar el pago: " + mensaje, 502);
        }

        return new DeudaRegistrada(response.getIdTransaccion(), response.getUrlPasarelaPagos());
    }

    @Override
    public ConsultaDeuda consultarDeuda(String identificadorDeuda) {
        requireAppkeyConfigurado();

        JsonNode raiz;
        try {
            raiz = restClient.post()
                .uri("/rest/deuda/consultar_deudas/por_identificador")
                .body(java.util.Map.of("appkey", appkey, "identificador", identificadorDeuda))
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.error("Error de red al consultar deuda en Libélula: {}", identificadorDeuda, ex);
            throw new BusinessException("No se pudo verificar el pago con la pasarela", 503);
        }

        if (raiz == null) {
            throw new BusinessException("Respuesta vacía de Libélula al verificar el pago", 502);
        }

        // El manual no muestra un ejemplo de respuesta para este servicio puntual.
        // Otros servicios similares (CONSULTAR DEUDAS POR FECHAS) envuelven el
        // resultado en "datos": [ ... ]; se soportan ambas formas por seguridad.
        JsonNode deuda = raiz;
        if (raiz.has("datos") && raiz.get("datos").isArray() && !raiz.get("datos").isEmpty()) {
            deuda = raiz.get("datos").get(0);
        }

        boolean pagado = deuda.path("pagado").asBoolean(false);
        BigDecimal valorTotal = deuda.has("valor_total") && !deuda.get("valor_total").isNull()
            ? new BigDecimal(deuda.get("valor_total").asText())
            : null;
        String formaPago = deuda.path("forma_pago").asText(null);

        return new ConsultaDeuda(pagado, valorTotal, formaPago);
    }

    private void requireAppkeyConfigurado() {
        if (appkey == null || appkey.isBlank()) {
            throw new BusinessException(
                "La pasarela de pagos Libélula todavía no está configurada (falta LIBELULA_APPKEY)", 503);
        }
    }
}
