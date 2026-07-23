# Manual de Usuario — Sistema de Cursos y Eventos FHCE

> Guía de referencia para armar el manual final (Word/PDF). Cada sección indica
> qué capturas tomar y en qué punto exacto del texto van. Los textos entre
> `[...]` son ejemplos o instrucciones para vos, no texto final del manual.

---

## Cómo usar esta plantilla

- Cada bloque `📷 CAPTURA` marca dónde va una imagen. Incluye: la URL/pantalla
  exacta, qué debe verse en el recuadro (marcado o resaltado si hace falta),
  y con qué usuario/rol tomarla.
- Los pasos numerados son el texto que acompaña cada captura — copialos tal
  cual o ajustalos a tu redacción.
- Sugerido: capturas a 1280×800 o el ancho real de tu monitor, navegador sin
  barras de marcadores, zoom al 100%.

---

## 0. Portada e índice

- Logo FHCE, nombre del sistema, versión/fecha, autor.
- Índice con los 6 bloques de este documento.

---

## 1. Introducción

1.1. Qué es el sistema (1 párrafo): plataforma web de la FHCE-UMSA para
publicar cursos y eventos, gestionar inscripciones, pagos, asistencia,
calificaciones y emisión de certificados.

1.2. Roles que existen y qué hace cada uno (tabla resumen):

| Rol | Puede hacer |
|---|---|
| Participante | Explorar actividades, inscribirse, pagar, ver certificados |
| Coordinador | Gestionar cursos/eventos de su carrera, aprobar solicitudes, ver reportes |
| Diseñador | Subir y gestionar plantillas de certificados |
| Administrador | Gestión completa: usuarios, roles, actividades, inscripciones, certificados |

> 📷 **CAPTURA 1.1** — Home pública (`http://<servidor>/`), sin sesión
> iniciada. Mostrar el catálogo de actividades con al menos una tarjeta
> visible.

1.3. Requisitos para usar el sistema: navegador (Chrome/Edge/Firefox
recientes), conexión a internet, correo electrónico válido para
verificación de cuenta.

---

## 2. Flujos comunes a todos los usuarios

### 2.1. Registro de cuenta (usuario externo)

1. Desde la home, clic en **"Registrarse"**.
2. Completar usuario, CI, nombres, apellidos, correo y contraseña.
3. Clic en **"Crear mi cuenta"**.
4. Revisar el correo y hacer clic en el enlace de verificación.

> 📷 **CAPTURA 2.1a** — Formulario de registro vacío (`/auth/registro`).
> 📷 **CAPTURA 2.1b** — Correo de verificación recibido (captura del inbox,
> tapar/censurar otros correos si el buzón es personal).
> 📷 **CAPTURA 2.1c** — Pantalla de "cuenta verificada" tras hacer clic en el
> enlace.

### 2.2. Inicio de sesión

1. Desde la home, clic en **"Iniciar Sesión"**.
2. Ingresar usuario (o RU si sos UMSA) y contraseña.
3. Clic en **"Entrar"**.

> 📷 **CAPTURA 2.2** — Formulario de login (`/auth/login`).

Nota para el manual: aclarar que los usuarios UMSA (internos) inician
sesión con sus credenciales institucionales una vez que el sistema tenga
acceso habilitado a Usuarios UMSA; mientras tanto solo se prueba con
cuentas externas.

### 2.3. Recuperar contraseña

1. En login, clic en **"¿Olvidaste tu contraseña?"**.
2. Ingresar el correo registrado.
3. Seguir el enlace recibido por correo y definir una nueva contraseña.

> 📷 **CAPTURA 2.3** — Formulario de "Olvidé mi contraseña".

### 2.4. Cambiar de rol (usuarios con más de un rol)

Un mismo usuario puede tener varios roles asignados (ej. Participante +
Coordinador + Diseñador). Se cambia desde el menú superior:

1. Clic en el nombre del rol actual (arriba a la derecha).
2. Seleccionar el rol al que se quiere cambiar.

> 📷 **CAPTURA 2.4** — Menú "Cambiar rol" desplegado, mostrando varias
> opciones (capturado con un usuario multi-rol, ej. `sergio`).

---

## 3. Manual del Participante

Base URL de esta sección: `/participante/...`

### 3.1. Explorar actividades y filtrar

1. En la home (o `/participante`), usar los filtros: tipo (curso/evento),
   modalidad, carrera, gratuitos, con cupo.
2. Usar el buscador por nombre.
3. Ordenar por fecha, nombre, precio o cupos.

> 📷 **CAPTURA 3.1** — Panel de filtros abierto con al menos un filtro
> aplicado y resultados visibles.

### 3.2. Ver detalle de una actividad e inscribirse

1. Clic en **"Ver detalle"** de una tarjeta.
2. Revisar paralelos disponibles, docente, horario, cupos y precios
   (UMSA vs. Externo).
3. Seleccionar paralelo y clic en **"Ir a pago"**.

> 📷 **CAPTURA 3.2a** — Detalle de actividad completo (`/actividad/:id`),
> con los precios UMSA/Externo visibles.
> 📷 **CAPTURA 3.2b** — Ventana/pantalla de pago que se abre al continuar.

### 3.3. Pagar la inscripción

1. Se abre la pasarela de pago (Libélula) en una ventana nueva.
2. Completar el pago según el método ofrecido.
3. Al confirmar, la inscripción pasa de "Pendiente de pago" a "Confirmada".

> 📷 **CAPTURA 3.3** — Estado "Pendiente de pago" en Mis Inscripciones,
> y luego "Confirmada" tras completar el pago (dos capturas, antes/después).

> **Nota para quien arme el manual con datos reales**: esta captura solo se
> puede tomar completa una vez que la pasarela Libélula esté configurada con
> el appkey real; mientras tanto el sistema muestra el mensaje "La pasarela
> de pagos Libélula todavía no está configurada".

### 3.4. Ver mis inscripciones

1. Ir a **"Mis Inscripciones"**.
2. Filtrar por Todas / Activas / Completadas / Cursos / Eventos.

> 📷 **CAPTURA 3.4** — Lista de inscripciones con al menos un ítem.

### 3.5. Ver y descargar mis certificados

1. Ir a **"Mis Certificados"**.
2. Clic en un certificado para ver el detalle o descargar el PDF.
3. Usar el código de verificación para validarlo públicamente en
   `/verificar/:codigo`.

> 📷 **CAPTURA 3.5a** — Lista de certificados del participante.
> 📷 **CAPTURA 3.5b** — PDF del certificado descargado (o vista previa).
> 📷 **CAPTURA 3.5c** — Pantalla pública de verificación de certificado por
> código.

### 3.6. Editar mi perfil

1. Ir a **"Mi perfil"**.
2. Clic en **"Editar Perfil"** para modificar datos personales.
3. Usar **"Cambiar contraseña"** para actualizar la clave.

> 📷 **CAPTURA 3.6** — Pantalla de perfil con las estadísticas
> (inscripciones, certificados, horas totales) visibles.

---

## 4. Manual del Coordinador

Base URL: `/coordinador/...`. Recordar aclarar que un coordinador solo ve
datos de la(s) carrera(s) que el administrador le asignó.

### 4.1. Panel principal

> 📷 **CAPTURA 4.1** — Dashboard de coordinador (`/coordinador`) con
> números reales en "Cursos Activos", "Eventos Activos", etc.

### 4.2. Gestionar cursos de mi carrera

1. Ir a **"Cursos"**.
2. Crear un curso nuevo con **"Nuevo curso"**, o editar/eliminar uno
   existente.
3. Asignar docente a un paralelo desde **"Paralelos"**.

> 📷 **CAPTURA 4.2a** — Listado de cursos de la carrera.
> 📷 **CAPTURA 4.2b** — Formulario de creación/edición de curso.
> 📷 **CAPTURA 4.2c** — Asignación de docente a un paralelo.

### 4.3. Gestionar eventos de mi carrera

Mismo flujo que 4.2 pero en **"Eventos"**, asignando auxiliares en vez de
docentes.

> 📷 **CAPTURA 4.3** — Listado de eventos y asignación de auxiliar.

### 4.4. Ver inscritos

1. Ir a **"Inscritos"**.
2. Consultar la lista de participantes por actividad.

> 📷 **CAPTURA 4.4** — Listado de inscritos de una actividad.

### 4.5. Bandeja de solicitudes y plantillas

1. Ir a **"Bandeja"**.
2. Aprobar o rechazar solicitudes de certificado y plantillas pendientes
   de diseñadores.

> 📷 **CAPTURA 4.5** — Bandeja con al menos una solicitud o plantilla
> pendiente (real o de prueba).

### 4.6. Asignar diseñador a una actividad

1. Ir a **"Diseñadores"**.
2. Asignar un usuario con rol Diseñador a un curso/evento específico.

> 📷 **CAPTURA 4.6** — Pantalla de asignación de diseñador.

### 4.7. Emitir certificados

1. Ir a **"Emitir Certificados"**.
2. Seleccionar la actividad y emitir certificados de aprobación o
   participación según corresponda.

> 📷 **CAPTURA 4.7** — Pantalla de emisión de certificados con al menos un
> registro.

### 4.8. Reportes

1. Ir a **"Reportes"**.
2. Filtrar por fecha, tipo, estado o actividad.
3. Descargar el PDF de reporte académico o de ingresos.

> 📷 **CAPTURA 4.8a** — Reporte académico con datos reales.
> 📷 **CAPTURA 4.8b** — Reporte de ingresos (UMSA/Externo/Total).

---

## 5. Manual del Diseñador

Base URL: `/disenador/...`

### 5.1. Ver actividades asignadas

1. Ir a **"Plantillas"**.
2. Ver el listado de actividades que un coordinador le asignó, con el
   estado de su plantilla (Sin plantilla / Pendiente / Aprobada /
   Rechazada).

> 📷 **CAPTURA 5.1** — Listado de actividades asignadas al diseñador.
> Si no tiene ninguna, capturar el estado vacío "No tienes actividades
> asignadas" y aclarar en el texto que es el estado normal antes de que un
> coordinador le asigne trabajo.

### 5.2. Subir una plantilla de certificado

1. Elegir la actividad y clic en **"Subir plantilla"**.
2. Seleccionar el archivo PDF.
3. Confirmar el envío — queda en estado "Pendiente" hasta que el
   coordinador la revise.

> 📷 **CAPTURA 5.2** — Formulario de subida de plantilla.

### 5.3. Ver historial de mis plantillas

1. Ir a **"Mis Plantillas"**.
2. Revisar versiones anteriores y su estado de aprobación.

> 📷 **CAPTURA 5.3** — Historial de plantillas con al menos una versión.

---

## 6. Manual del Administrador

Base URL: `/admin/...`

### 6.1. Panel principal

> 📷 **CAPTURA 6.1** — Dashboard de administrador (`/admin`) con las 4
> tarjetas de totales (Usuarios, Actividades, Inscripciones, Certificados)
> y la tabla de actividades recientes.

### 6.2. Gestión de usuarios y roles

1. Ir a **"Usuarios"**.
2. Buscar/filtrar por tipo, rol, estado o verificación.
3. Clic en **"Editar"** para asignar o quitar roles.
4. Si se asigna el rol Coordinador, asignar también sus carreras desde
   **"Gestionar carreras"** (se abre automáticamente tras guardar roles).
5. Usar **"Acciones"** para: editar datos, cambiar contraseña (solo
   usuarios externos) o desactivar el usuario.

> 📷 **CAPTURA 6.2a** — Listado de usuarios con filtros aplicados.
> 📷 **CAPTURA 6.2b** — Modal "Gestionar Roles de Usuario" con checkboxes.
> 📷 **CAPTURA 6.2c** — Modal "Gestionar Carreras" para un coordinador.

### 6.3. Gestión de actividades (cursos y eventos)

1. Ir a **"Actividades"**.
2. Crear, editar o dar de baja cursos/eventos de cualquier carrera.

> 📷 **CAPTURA 6.3** — Listado de actividades con filtros por carrera,
> tipo y estado.

### 6.4. Gestión de inscripciones

1. Ir a **"Inscripciones"**.
2. Revisar estado (confirmada/pendiente/cancelada), buscar por usuario o
   actividad.

> 📷 **CAPTURA 6.4** — Listado de inscripciones con los totales de arriba
> (Total, Confirmadas, Pendientes, Ingresos) visibles.

### 6.5. Calificaciones

1. Ir a **"Calificaciones"**.
2. Consultar o corregir notas de un curso.

> 📷 **CAPTURA 6.5** — Listado de calificaciones de un curso.

### 6.6. Asistencias

1. Ir a **"Asistencias"**.
2. Registrar o editar la asistencia de un evento.

> 📷 **CAPTURA 6.6** — Registro de asistencia de un evento.

### 6.7. Certificados

1. Ir a **"Certificados"**.
2. Ver certificados emitidos, anulados y reemitidos por actividad.

> 📷 **CAPTURA 6.7** — Listado de certificados con los totales (Emitidos,
> Anulados, Reemitidos) visibles.

### 6.8. Carreras

1. Ir a **"Carreras"**.
2. Administrar el listado de carreras disponibles en el sistema.

> 📷 **CAPTURA 6.8** — Listado de carreras.

---

## 7. Preguntas frecuentes / soporte básico

- **No me llega el correo de verificación**: revisar spam; reenviar desde
  la pantalla de login si hay opción; confirmar que el correo esté bien
  escrito.
- **No puedo pagar mi inscripción**: la pasarela de pagos puede estar
  temporalmente fuera de servicio; contactar a la administración.
- **Olvidé mi contraseña**: usar "¿Olvidaste tu contraseña?" en el login.
- **Soy de la UMSA pero no puedo entrar con mis credenciales
  institucionales**: esta integración depende de un acceso que la FHCE
  está gestionando con DTIC; mientras tanto, usar una cuenta externa.

---

## Checklist final antes de entregar el manual

- [ ] Todas las capturas tomadas con datos reales (no placeholders vacíos
      salvo donde el texto lo aclara, como 5.1).
- [ ] Datos sensibles tapados en las capturas (correos personales, montos
      reales si aplica, nombres si se pidió anonimizar).
- [ ] Capturas tomadas todas con el mismo tamaño de ventana para que se
      vean consistentes.
- [ ] Revisar que las URLs mencionadas coincidan con el dominio/IP final
      del servidor donde quede desplegado el sistema.
