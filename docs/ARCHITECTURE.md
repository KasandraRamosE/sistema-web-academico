# Architecture

## Overview
The backend follows a modular monolith design. Each domain module lives under
bo.edu.umsa.fhce.sistemacursos.modules.<module>, with a consistent layered structure.
Cross-cutting concerns (config, security, exceptions) live under the root package.

## Layers
Each module typically contains:
- controller: REST endpoints and request/response mapping
- service: business logic and orchestration
- repository: persistence via Spring Data JPA
- entity: JPA entities mapped to the relational schema
- dto: request/response objects

## Package layout
- config: Spring configuration (Jackson, ModelMapper, Security)
- exception: domain exceptions and global handler
- security: JWT filter, token provider, user details
- modules: domain modules

## Module boundaries
- auth: authentication, registration, email verification
- usuario: users and roles
- carrera: careers and coordinators
- curso: courses and parallels
- evento: events and assistants
- inscripcion: enrollments and payment gateway integration
- evaluacion: attendance and grades
- certificado: certificates, PDF, and QR
- plantilla: certificate templates
- pago: payments

## Data flow (typical request)
1) HTTP request hits controller
2) Controller validates DTOs and calls service
3) Service applies rules and calls repository
4) Repository persists or fetches entities
5) Service maps entities to DTOs and returns

## Integrations
- Email: Spring Mail abstraction
- Payments: Libelula client (real and mock implementations)
- PDFs: iText
- QR: ZXing

## Configuration profiles
- dev: default profile
- prod: production profile

Profile selection is configured via spring.profiles.active in application.yml.
