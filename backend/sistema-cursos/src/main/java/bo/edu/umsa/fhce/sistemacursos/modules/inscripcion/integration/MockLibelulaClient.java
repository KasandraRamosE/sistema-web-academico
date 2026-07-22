package bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.integration;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

// Solo se activa con el perfil "dev"
// En prod Spring inyecta RealLibelulaClient en su lugar
//
// Simula la plataforma de Libélula en memoria: "registrar" guarda el monto
// esperado, y "consultar" siempre responde que esa deuda ya fue pagada por
// el monto exacto. Así el flujo de callback + verificación se ejerce igual
// que en producción — solo cambia quién responde a la consulta.
@Component
@Profile("dev")
@Slf4j
public class MockLibelulaClient implements LibelulaClient {

    private final Map<String, BigDecimal> deudasRegistradas = new ConcurrentHashMap<>();

    @Override
    public DeudaRegistrada registrarDeuda(RegistrarDeudaParams params) {
        String idFalso = "MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        deudasRegistradas.put(params.identificadorDeuda(), params.monto());

        log.info("[MOCK Libélula] Deuda registrada — identificador: {} — monto: {} — id simulado: {}",
            params.identificadorDeuda(), params.monto(), idFalso);
        log.info("[MOCK Libélula] Para simular el pago, llamar a: "
            + "GET /api/payments/libelula/callback?transaction_id={}", idFalso);

        String urlFalsa = "http://localhost:5173/pago-simulado?identificador=" + params.identificadorDeuda();
        return new DeudaRegistrada(idFalso, urlFalsa);
    }

    @Override
    public ConsultaDeuda consultarDeuda(String identificadorDeuda) {
        BigDecimal monto = deudasRegistradas.get(identificadorDeuda);
        log.info("[MOCK Libélula] Consultando deuda: {} — monto registrado: {}", identificadorDeuda, monto);
        return new ConsultaDeuda(monto != null, monto, "MOCK");
    }
}
