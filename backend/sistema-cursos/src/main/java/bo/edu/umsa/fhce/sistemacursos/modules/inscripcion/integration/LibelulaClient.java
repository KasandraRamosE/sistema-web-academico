package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration;

import java.math.BigDecimal;

// Interfaz que abstrae la pasarela de pagos Libélula, según
// "GUÍA DE INTEGRACIÓN PARA EMPRESAS v2.145".
// En dev: MockLibelulaClient — simula la plataforma en memoria.
// En prod: RealLibelulaClient — llama a la API real (requiere appkey).
public interface LibelulaClient {

    // Servicio "REGISTRAR DEUDA" — POST /rest/deuda/registrar
    // Devuelve la URL de la pasarela a la que hay que redirigir al participante.
    DeudaRegistrada registrarDeuda(RegistrarDeudaParams params);

    // Servicio "CONSULTAR DEUDAS POR IDENTIFICADOR" — POST /rest/deuda/consultar_deudas/por_identificador
    // Es la fuente de verdad server-to-server: el callback GET de Libélula no trae
    // firma ni monto, así que nunca se confirma un pago sin esta verificación.
    ConsultaDeuda consultarDeuda(String identificadorDeuda);

    record RegistrarDeudaParams(
        String identificadorDeuda,   // nuestro ID único de la deuda (no el de Libélula)
        BigDecimal monto,
        String descripcion,
        String emailCliente,
        String nombreCliente,
        String apellidoCliente,
        String ci,
        String callbackUrl
    ) {}

    record DeudaRegistrada(
        String idTransaccionLibelula, // id_transaccion devuelto por Libélula
        String urlPasarelaPagos       // URL a la que se redirige al participante para pagar
    ) {}

    record ConsultaDeuda(
        boolean pagado,
        BigDecimal valorTotal,
        String formaPago
    ) {}
}
