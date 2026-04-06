# Backend Documentation

This is the backend for the FHCE academic system. It manages courses and events,
registrations and payments, grading and attendance, and certificate issuance and
verification. The API is consumed by a separate frontend and is designed as a
modular monolith with strict domain boundaries.

## What this system does
- User onboarding (external users) with email verification
- Authentication and JWT-based access control
- Academic structure management (careers, courses, events, parallels)
- Enrollment and payment initiation (Libelula integration)
- Attendance tracking for events and grading for courses
- Certificate emission, PDF generation, QR verification, and re-issuance
- Template lifecycle for certificates (upload, review, approval)

## Tech stack
- Java 21
- Spring Boot 4.0.4
- Spring Web MVC, Spring Security, Spring Data JPA
- MySQL 8
- JWT (jjwt)
- OpenAPI/Swagger UI (springdoc)
- Lombok, ModelMapper
- iText (PDF), ZXing (QR)

## Modules (by package)
- auth: login, registration, email verification
- usuario: users, roles, docentes, participantes
- carrera: careers and coordinators
- curso: courses and parallels
- evento: events and assistants
- inscripcion: enrollments and payments integration
- evaluacion: grades, approvals, and issuance requests
- certificado: certificates, PDF, QR verification
- plantilla: certificate templates
- pago: payments (placeholder package)

## API entry points
- Base path: /api
- Swagger UI: /api/swagger-ui.html

## Configuration
Profiles are defined in:
- backend/sistema-cursos/src/main/resources/application.yml
- backend/sistema-cursos/src/main/resources/application-dev.yml
- backend/sistema-cursos/src/main/resources/application-prod.yml

Key application settings:
- JWT: app.jwt.secret, app.jwt.expiration-ms
- Email: app.email.from, app.email.base-url
- Certificates: app.certificados.directorio
- Templates: app.plantillas.directorio

## Database
- Schema, seed data, and triggers are in:
	backend/sistema-cursos/src/main/resources/db/init.sql

## Running locally
Prerequisites: Java 21, Maven, Docker (optional for DB).

Option A: Run backend only (DB in backend docker-compose)
- Start DB: docker compose -f backend/sistema-cursos/docker-compose.yml up -d
- Run: mvn -f backend/sistema-cursos/pom.xml spring-boot:run

Option B: Full stack (root docker-compose)
- Copy .env and set DB/JWT variables
- Run: docker compose up -d

## Related docs
- Architecture: ARCHITECTURE.md
- Security: SECURITY.md
