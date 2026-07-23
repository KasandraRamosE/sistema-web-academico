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

## 3. ~~Frontend — limpieza de comentarios innecesarios (11 archivos)~~ [RESUELTO 2026-07-22]

Hecho en esta sesión, mismo criterio que los 20 archivos anteriores. De paso,
al revisar cada archivo para limpiar comentarios se hizo una pasada de
"¿esto está bien implementado?" — ver sección 5 con lo que salió de ahí.

---

## 4. Cosas menores que aparecieron de pasada

1. ~~**`frontend/src/views/public/Home.vue`**: el `computed` `activityNames`
   no se usaba en el `<template>`.~~ **[RESUELTO 2026-07-22]** Confirmado:
   ninguno de los dos usos de `<ActivityFilters>` en Home.vue le pasaba la
   prop `activityNames`. Se conectó (`:activity-names="activityNames"` en
   ambos), lo que además reactiva el autocompletado de búsqueda que ya
   estaba programado en `ActivityFilters.vue` pero nunca recibía datos.
2. **`frontend/src/utils/mockData.ts`**: los arrays `mockCareers` y
   `mockActivities` podrían ser código muerto — `Home.vue` ya carga datos
   reales del backend (`loadActivities()`) y solo importa la función
   `filterActivities` de este archivo, no los arrays de datos mock.
   Confirmar que nada más los usa antes de borrarlos. **(sigue sin
   confirmar, no se tocó en esta sesión)**

---

## 5. Hallazgos de la limpieza de comentarios (2026-07-22)

Encontrados al revisar los 11 archivos de la sección 3. Ordenados por
importancia.

### 5.1 ~~CRÍTICO — "Cambiar Contraseña" en Usuarios.vue es un mock completo~~ [RESUELTO 2026-07-22]

`admin/Usuarios.vue`, función `guardarPassword()`: no llamaba a ningún
endpoint, solo hacía `console.log` y mostraba
`alert('Contraseña actualizada exitosamente')` sin cambiar nada de verdad.

Se implementó el flujo real, restringido a usuarios **externos** (los
internos/UMSA no tienen password local — vienen de "Usuarios Umsa", de
donde solo tendremos acceso de lectura):
- Backend: nuevo endpoint `PUT /usuarios/{id}/password`
  (`AdminCambiarPasswordRequest.java`, `UsuarioService.cambiarPasswordAdmin`),
  restringido a `ADMINISTRADOR` vía `@PreAuthorize`. Reutiliza el helper
  `validarExterno()` que ya existía (el mismo que usa el autoservicio
  `/usuarios/me/password`) para rechazar con 403 si el usuario es INTERNO.
  A diferencia del autoservicio, no exige `passwordActual` (quien ejecuta
  la acción es el admin, no el dueño de la cuenta).
- Frontend: `guardarPassword()` ahora llama a ese endpoint de verdad. El
  frontend ya bloqueaba abrir el modal para usuarios INTERNO
  (`openPasswordModal`); ahora el backend también lo bloquea de forma
  independiente (defensa en profundidad, no solo confiar en el frontend).

**Pendiente a futuro, no bloqueante:** decidir si este cambio de contraseña
por admin debería invalidar sesiones activas del usuario afectado y/o
quedar registrado en un log de auditoría.

### 5.2 Bug de plantilla repetido — Pagination rompía la cadena v-if/v-else

Patrón encontrado en `Actividades.vue`, `admin/Certificados.vue`,
`Inscripciones.vue` y `Usuarios.vue`:

```html
<div v-else-if="items.length > 0">...</div>
<Pagination v-if="totalItems > 0" ... />   <!-- entre medio -->
<div v-else class="text-center py-12">Sin resultados</div>
```

Vue arma las cadenas `v-if/v-else-if/v-else` con hermanos **contiguos**. El
`<Pagination v-if>` metido en el medio corta la cadena original en dos: el
`v-else` final termina ligado al `v-if` de `Pagination`, no al de la tabla.
En la práctica casi nunca se nota porque `usePagination` mantiene
`currentPage` sincronizado con `totalItems`, pero es frágil (cualquier
cambio en ese orden de elementos, o en el composable, puede dejar la
pantalla en blanco sin tabla y sin mensaje de "sin resultados").

**Corregido** en los 4 archivos moviendo `<Pagination>` dentro de la rama
`v-else-if` (o envolviendo en `<template v-else-if>` cuando había varios
hermanos). `DashboardAdmin.vue` no tenía este problema porque no hay un
`v-if` previo que rompa la cadena.

**Mismo patrón, no revisado hoy** (fuera de los 11 archivos): vale la pena
mirar las vistas de `coordinator/` y `disenador/` que también usan
`Pagination` + estado vacío.

### 5.3 ~~Bug de token roto en descargas/uploads tras la migración a cookies~~ [RESUELTO 2026-07-22]

`localStorage.getItem('token')` para armar el header `Authorization` en
descargas de certificados y subida de imágenes — pero desde el cambio a
cookies HttpOnly de esta misma sesión, `localStorage.setItem('token', ...)`
ya no se llama en ningún lado. El token real vive en el store de Pinia
(`useAuthStore().token`), que es lo que ya usa `utils/api.ts` para las
llamadas normales (`getAuthToken()`, antes privada).

**Corregido en los 4 archivos originales** exportando `getAuthToken` desde
`api.ts` y usándola en `MisInscripciones.vue`, `MisCertificados.vue`,
`admin/Certificados.vue`, `admin/Actividades.vue`.

**Corregido también en los 8 archivos restantes** (mismo fix, mismo patrón):
`coordinator/Cursos.vue`, `coordinator/Reportes.vue`,
`coordinator/Eventos.vue`, `coordinator/Dashboard.vue`,
`coordinator/Bandeja.vue`, `coordinator/Inscritos.vue`,
`disenador/MisPlantillas.vue`, `disenador/Plantillas.vue` (este último
tenía el bug duplicado, en `subirPlantilla()` y en `verPlantilla()` — esta
última función además estaba muerta, ver 5.4). De paso se limpiaron los
comentarios de estos 8 archivos con el mismo criterio de la sección 3
(la mayoría no tenía casi ninguno; `Inscritos.vue` tenía algunos
`console.debug(...)` de depuración que también se quitaron).

### 5.4 Otros arreglos menores hechos de paso

- `admin/Usuarios.vue`: encabezado de tabla tenía dos columnas "Email" —
  la segunda en realidad correspondía al ícono de verificado, ahora dice
  "Verificado".
- `admin/DashboardAdmin.vue`: el botón "ver" de la tabla "Actividades
  Recientes" no tenía `@click` (no hacía nada al hacer clic). Ahora navega
  a `activity-detail`, igual que en `Actividades.vue`.
- `admin/Actividades.vue`: `toDateInput()` tenía un hueco de tipos
  (`noUncheckedIndexedAccess`) en `value.split(...)[0]`; no rompía nada en
  runtime pero lo dejaba marcado como error de compilación.
- `participant/Perfil.vue`: `datosOriginales` estaba tipado `any`; ahora
  usa `typeof formData`.
- `disenador/Plantillas.vue`: código muerto eliminado —
  `currentUserId`/`authStore` (sin uso), `plantillasRevisadas` (sin uso),
  `verPlantilla()` (duplicada de la que ya existe en `MisPlantillas.vue`,
  ya no se llamaba desde este archivo), `estadoPlantillaBadge` y
  `estadoPlantillaHint` (duplicados exactos de `estadoRevisionBadge`/
  `estadoRevisionHint`). También se corrigieron dos huecos de tipos
  (`data[data.length - 1]` y `input.files[0]` con `noUncheckedIndexedAccess`).
- `coordinator/Inscritos.vue`: `formatDateTime()` no se usaba (dead code,
  quitado junto con el import). También tenía 4 `console.debug(...)`
  imprimiendo respuestas crudas del API — quitados.
- `coordinator/Dashboard.vue`: un `watch()` con el callback vacío que no
  hacía nada (los `computed` ya se recalculan solos al cambiar
  `selectedCarreraId`, no necesitan un watcher) — quitado junto con el
  import de `watch`.
- Consola limpia para producción: se sacaron los `console.log`/
  `console.warn` con emoji que eran solo mensajes informativos de
  depuración (`✅ Sesión restaurada`, `✅ Navegando a: ...`, `⚠️ Acceso
  denegado...`, etc.) en `auth.store.ts`, `router/guards.ts` y
  `participant/Dashboard.vue` (este último tenía además un `onMounted`
  que solo contenía ese `console.log`, se quitó completo). Se dejaron los
  `console.error`/`console.warn` que sí reportan una condición de error real.

### 5.5 Cosas que NO se arreglaron, solo quedan documentadas

- `admin/Asistencias.vue`: el campo "Observaciones" del modal de editar
  asistencia se captura en el formulario pero `guardarAsistencia()` nunca
  lo manda al backend — y el backend tampoco tiene columna para guardarlo
  (`AsistenciaAdminDto` no tiene ese campo). Lo que el admin escribe ahí se
  pierde en silencio. Requiere decisión de si vale la pena agregar la
  columna/campo en backend.
- `admin/Certificados.vue` y `admin/Calificaciones.vue`: la columna email
  del participante siempre muestra "-". No es bug de frontend — los DTOs
  del backend (`CertificadoDto`, `EvaluacionDto`) no incluyen ese campo.
- `admin/Inscripciones.vue`: el badge "Tipo de Usuario" (INTERNO/EXTERNO)
  en la tabla y en el modal de detalle siempre muestra "N/A" — mismo caso,
  `InscripcionDto` no expone ese dato.
- `participant/MisCertificados.vue`: el bloque de "Código QR" es un ícono
  decorativo fijo, no un QR real ni vinculado a `codigo_verificacion`. El
  comentario `(placeholder)` que lo marcaba se dejó a propósito. La
  verificación real ya existe por otro lado (botón que abre
  `/verificar/{codigo}`), así que esto es cosmético, no bloqueante.

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
- Comentarios innecesarios en los 11 archivos restantes (ver sección 3) +
  hallazgos de la revisión de buenas prácticas que salió de esa limpieza
  (ver sección 5, especialmente 5.1: "Cambiar Contraseña" en Usuarios.vue
  no está conectado al backend).
