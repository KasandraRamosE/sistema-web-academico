# Pendientes — Sistema Cursos FHCE

Plan de continuación tras la sesión del 2026-07-22. Todo lo listado acá quedó
**identificado y sin tocar** (o parcialmente tocado, según se indica) — no son
sospechas, son puntos concretos con ubicación exacta.

---

## 1. Backend — migración a Flyway (lo más grande pendiente)

**Por qué importa:** hoy no hay Flyway ni Liquibase. El schema depende de
`ddl-auto` (`validate` en dev, `update` en prod) + los scripts SQL sueltos
(`estructura.sql`, `db/init/init.sql`, `backend/sistema-cursos/src/main/resources/db/init.sql`).
En esta misma sesión tuvimos que aplicar `ALTER TABLE` a mano **dos veces**
directo contra la BD de dev porque no hay mecanismo de migración. En
producción, el `docker-compose.yml` raíz ni siquiera monta un script inicial
— Hibernate crea el schema solo, sin los triggers de negocio del SQL.

**Qué hacer:**
1. Agregar dependencia `flyway-core` al `pom.xml`.
2. Convertir `estructura.sql` en migraciones incrementales (`V1__init.sql`,
   etc.) dentro de `src/main/resources/db/migration`.
3. Incluir los 9 triggers y el `UNIQUE KEY` de código de verificación
   (sección 4.1 del informe de seguridad original) en esas migraciones.
4. Una vez migrado, `ddl-auto: validate` en todos los perfiles (ya está así
   en dev; falta confirmar que Flyway sea la única fuente de verdad).
5. Corregir el `docker-compose.yml` raíz para que el volumen de MySQL en
   producción realmente inicialice desde las migraciones (o confirmar que
   Flyway corre automáticamente al arrancar el backend, que es lo estándar).

**Tamaño estimado:** grande — es un cambio de infraestructura, no un fix
puntual. Conviene hacerlo en una sesión dedicada, probando contra una BD
de prueba antes de tocar dev/prod reales.

---

## 2. Backend — mock de autenticación UMSA en producción

**Estado:** identificado, **no corregido a propósito** — se dejó pendiente
de que llegue el manual/acceso real de UMSA (mismo patrón que se usó hoy
con Libélula).

**Qué hacer cuando llegue el acceso:**
- `backend/sistema-cursos/src/main/resources/application-prod.yml`:
  cambiar `app.mocks.umsa-auth: true` → `false` (ya existe
  `DisabledUmsaAuthClient` para ese caso, no hace falta escribir nada nuevo
  solo para desactivar el mock).
- Implementar un `RealUmsaAuthClient` (mismo patrón que
  `RealLibelulaClient.java` de hoy: leer credenciales de variables de
  entorno, fallar con 503 claro si no están configuradas, no con un error
  genérico).

---

## 3. Frontend — limpieza de comentarios innecesarios (11 archivos)

Mismo criterio aplicado hoy en los otros 20 archivos: sacar comentarios que
solo repiten lo que el código ya dice, mantener los que explican un
porqué no obvio (regla de negocio, seguridad, workaround).

**Grandes — requieren más cuidado por su tamaño, ir de a uno:**
| Archivo | Comentarios | Líneas totales |
|---|---|---|
| `frontend/src/views/admin/Usuarios.vue` | 58 | 1768 |
| `frontend/src/views/admin/Calificaciones.vue` | 15 | 762 |
| `frontend/src/views/admin/Inscripciones.vue` | 31 | 831 |
| `frontend/src/views/admin/Asistencias.vue` | 25 | 582 |
| `frontend/src/views/admin/Certificados.vue` | 27 | 532 |

**Medianos:**
| Archivo | Comentarios |
|---|---|
| `frontend/src/components/activities/ActivityFilters.vue` | 39 |
| `frontend/src/views/participant/Perfil.vue` | 34 |

**Chicos — rápidos de terminar:**
| Archivo | Comentarios |
|---|---|
| `frontend/src/views/participant/MisInscripciones.vue` | 13 |
| `frontend/src/views/admin/DashboardAdmin.vue` | 12 |
| `frontend/src/views/admin/Actividades.vue` | 12 |
| `frontend/src/views/participant/MisCertificados.vue` | 9 |

**Sugerencia de orden:** empezar por los "chicos" (ganancia rápida), después
los "medianos", y dejar `Usuarios.vue` para el final por su tamaño — quizás
conviene dividirlo en 2-3 pasadas en vez de una sola.

---

## 4. Cosas menores que aparecieron de pasada, sin confirmar

Encontradas mientras se revisaba otra cosa — quedan para verificar, no son
fixes urgentes:

1. **`frontend/src/views/public/Home.vue`**: el `computed` `activityNames`
   (cerca de la línea 240) no parece usarse en el `<template>`. Verificar
   con una búsqueda de uso real y, si efectivamente no se usa, eliminarlo.
2. **`frontend/src/utils/mockData.ts`**: los arrays `mockCareers` y
   `mockActivities` podrían ser código muerto — `Home.vue` ya carga datos
   reales del backend (`loadActivities()`) y solo importa la función
   `filterActivities` de este archivo, no los arrays de datos mock.
   Confirmar que nada más los usa antes de borrarlos.

---

## Ya resuelto en esta sesión (para referencia, no repetir)

- Integración real con Libélula (antes era un webhook inventado que no
  correspondía al protocolo real documentado).
- CORS abierto (`allowedOriginPatterns("*")` + `allowCredentials(true)`).
- Autorización de coordinador por carrera incompleta (`EventoService`,
  paralelos de `CursoService`, emisión de certificados).
- RF-21B incompleto (anulación de certificado al corregir nota).
- Tokens en `localStorage` → cookies HttpOnly + limpieza automática de
  `refresh_token`.
- Hallazgos menores del informe original (validación de código de 6
  dígitos, `printStackTrace` en el manejador global de excepciones,
  validación de imágenes solo por Content-Type).
- Bug de desborde en Chrome (`ActivityCard.vue`, desfase `-mx-4`/`px-6`).
- Límites de caracteres en formularios de login/registro/reset.
- `.js`/`.vue.js` compilados en el lugar tapando el código real (faltaba
  `noEmit: true` en `tsconfig.json`) — causaba que ediciones en `.ts`/`.vue`
  no se reflejaran en el navegador.
- Carrera de condición en el guard del router (deslogueo falso al recargar
  la página) — destapada por el fix anterior.
- Comentarios innecesarios en 20 de 31 archivos identificados.
