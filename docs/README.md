# Backend Documentation

This documentation covers the backend for the academic courses system.

## Scope
- General system overview and setup basics
- Architecture and module boundaries
- Security model and authentication

## Tech stack
- Java 21
- Spring Boot 4.0.4
- Spring Web MVC, Spring Security, Spring Data JPA
- MySQL
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
- evaluacion: evaluations and attendance
- certificado: certificates and verification
- plantilla: certificate templates
- pago: payments module

## Configuration
- Default profile is dev (see application.yml)
- API base path is /api
- Swagger UI is exposed at /api/swagger-ui.html

## Database
- Schema and seed data live in src/main/resources/db/init.sql

## How to run (local)
- Build: mvn clean package
- Run: mvn spring-boot:run
- Database: see docker-compose.yml for local MySQL

## Related docs
- Architecture: ARCHITECTURE.md
- Security: SECURITY.md
