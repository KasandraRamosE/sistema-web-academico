# Architecture

## System context
The backend is a modular monolith that exposes a REST API consumed by a web
frontend. It persists data in MySQL and integrates with external services for
email delivery and payments.

Primary components:
- REST API (Spring Web MVC)
- MySQL database
- File storage for templates and generated certificates
- Payment gateway abstraction (Libelula)
- Email delivery (Spring Mail)

## Architectural style
The project follows a layered, domain-centered modular monolith:
- Each domain module lives under bo.edu.umsa.fhce.sistemacursos.modules.<module>
- Cross-cutting concerns live under config, exception, and security packages
- Controllers expose HTTP endpoints and delegate to services
- Services implement business rules and orchestration
- Repositories encapsulate persistence via Spring Data JPA

## Package layout
- config: Jackson, ModelMapper, Security configuration
- exception: business exceptions and global handler
- security: JWT filter, token provider, user details
- modules: domain modules

## Domain model (high level)
- usuario: base user entity, roles, docente, participante
- carrera: academic careers
- curso: courses and parallels
- evento: events and assistants
- inscripcion: enrollment + payment tracking
- evaluacion: grades, history, and issuance requests
- certificado: certificate issuance and annulments
- plantilla: template versions and approvals
- auth: login, registration, and verification codes

## Key workflows

### Registration and email verification
1) User registers (external) and gets role PARTICIPANTE
2) Verification code is generated and emailed
3) User verifies code to activate the account

### Enrollment and payment
1) Participant enrolls in a course or event
2) System computes pricing by participant type (UMSA/EXTERNO)
3) Payment is initiated via Libelula client (mock in dev)
4) Enrollment is confirmed when payment is approved

### Grades, approvals, and certificate issuance
1) Docente records grades for a parallel
2) Docente confirms notes, generating a solicitud de emision
3) Coordinador/admin processes the request
4) Certificates are generated using the approved template

### Templates lifecycle
1) Disenador uploads a PDF template for a course/event
2) Coordinador/admin reviews and approves or rejects
3) Approved template becomes VIGENTE for certificate generation

### Public verification
1) QR points to /api/certificados/verificar/{codigo}
2) Endpoint returns a verification DTO and status (VALIDO, ANULADO, REEMITIDO)

## Persistence and database rules
The SQL schema is defined in
backend/sistema-cursos/src/main/resources/db/init.sql.

Key patterns:
- Many-to-many user-role relation (usuario_rol)
- Separate tables for docente and participante
- Composite key for paralelo (id_curso, codigo)
- State fields on curso, evento, inscripcion, certificado
- Triggers enforce automatic state transitions and validations

## Integrations
- Email: Spring Mail with dev SMTP (Mailtrap)
- Payments: LibelulaClient (Mock in dev, Real pending for prod)
- PDF generation: iText with fixed-position template layout
- QR generation: ZXing

## Configuration profiles
- dev: mock integrations, verbose logging
- prod: real integrations, env-based secrets

Profile selection is controlled via spring.profiles.active in application.yml.
