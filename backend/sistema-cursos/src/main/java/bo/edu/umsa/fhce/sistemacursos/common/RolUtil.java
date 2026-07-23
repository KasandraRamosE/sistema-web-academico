package bo.edu.umsa.fhce.sistemacursos.common;

import java.text.Normalizer;

// Normaliza nombres de rol para compararlos de forma consistente: quita el
// prefijo "ROLE_" de las GrantedAuthority de Spring Security (no-op sobre
// nombres de rol "crudos" que vienen de la BD) y los acentos/diéresis
// (DISEÑADOR / DISENADOR deben compararse igual). Antes reimplementado con
// variantes ligeramente distintas en 7 services distintos.
public final class RolUtil {

    private RolUtil() {
    }

    public static String normalizar(String nombreRol) {
        if (nombreRol == null) {
            return "";
        }
        String sinPrefijo = nombreRol.replace("ROLE_", "").trim();
        String sinAcentos = Normalizer.normalize(sinPrefijo, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        return sinAcentos.toUpperCase();
    }
}
