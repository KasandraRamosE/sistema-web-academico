# Security

## Security model
The API is stateless and secured with JWT. Authentication is performed via
Spring Security with a custom JWT filter that validates tokens on every request.

## Authentication flow
1) User logs in with username + password
2) Backend issues a JWT signed with HS256
3) Client sends the token in Authorization header as: Bearer <token>
4) JwtAuthFilter validates the token and loads user roles

## JWT claims
- subject: username
- roles: list of role names
- userId: internal user id

## Password hashing
- BCrypt with strength 12

## Authorization
Endpoint access is enforced via @PreAuthorize annotations in controllers.
All non-public endpoints require authentication.

Role model:
- ADMINISTRADOR: full access
- COORDINADOR: manage careers, courses, events, and certificate approvals
- DOCENTE: register grades and confirm parallels
- PARTICIPANTE: enroll, pay, view own certificates
- AUXILIAR: register attendance in assigned events
- DISEÑADOR: upload certificate templates

## Public endpoints
The following paths are public (no JWT required). Actual URLs include the
/api prefix because of server.servlet.context-path.

- /auth/**
- /verificar/**
- /certificados/verificar/**
- /swagger-ui/**, /swagger-ui.html
- /api-docs/**, /v3/api-docs/**

## CORS
Local development origins:
- http://localhost:5173
- http://localhost:4173

## Session policy
- Session creation policy is STATELESS
- CSRF is disabled (API uses JWT, not cookies)

## Secrets and configuration
- JWT secret and expiration are in application.yml for dev
- For prod, use environment variables (JWT_SECRET, DB_*), not source control

## Audit and traceability
- Grade changes are stored in evaluacion.Historial
- Template reviews create approval records
- Certificate annulments create audit records with reason and actor

## Operational recommendations
- Use HTTPS everywhere
- Rotate JWT secret periodically
- Restrict CORS to the real frontend domain in prod
- Monitor login, payment, and certificate issuance events
