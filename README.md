# Sistema de Cursos y Eventos — FHCE

Plataforma web para la Facultad de Humanidades y Ciencias de la Educación
(UMSA) para publicar cursos y eventos, gestionar inscripciones y pagos,
asistencia, calificaciones, y emisión/verificación de certificados.

## Stack

- **Backend**: Java 21, Spring Boot, Spring Security, Spring Data JPA, MySQL 8
- **Frontend**: Vue 3 + Vite + TypeScript
- **Infraestructura**: Docker / Docker Compose, Nginx como proxy reverso

## Cómo levantarlo

Requiere Docker y Docker Compose.

1. Copiar `.env` (ver variables abajo) en la raíz del proyecto.
2. Levantar todo:

   ```bash
   docker compose up -d --build
   ```

3. Verificar que los contenedores estén sanos:

   ```bash
   docker compose ps
   ```

4. Acceder desde el navegador a `http://localhost` (o la IP/dominio del
   servidor donde esté desplegado).

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DB_ROOT_PASSWORD` | Password root de MySQL |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciales de la BD de la app |
| `JWT_SECRET` | Secreto para firmar JWT (largo y aleatorio) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Cuenta SMTP para correos transaccionales |
| `APP_BASE_URL` | URL pública del sistema (usada en links de correos) |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS (dejar vacío si todo es same-origin vía Nginx) |
| `COOKIE_SECURE` | `true` solo si el servidor tiene HTTPS |
| `LIBELULA_APPKEY` / `LIBELULA_CALLBACK_BASE_URL` | Credenciales de la pasarela de pagos Libélula |

## Estructura del proyecto

```
backend/sistema-cursos/   API Spring Boot
frontend/                 SPA Vue 3
db/init/init.sql          Schema inicial de la base de datos
docker-compose.yml        Orquestación de los 3 servicios (mysql, backend, frontend)
deploy.sh                 Script de conveniencia para (re)desplegar
```
