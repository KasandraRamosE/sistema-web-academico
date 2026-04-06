# Security

## Authentication model
- Stateless JWT authentication
- Tokens are generated after login and sent in the Authorization header
  as: Bearer <token>
- Each request is authenticated by a JWT filter

## JWT claims
- subject: username
- roles: list of role names
- userId: internal user id

## Password hashing
- BCrypt with strength 12 is used for user passwords

## Authorization
- Endpoint access is controlled with @PreAuthorize at controller level
- All non-public endpoints require authentication

## Public endpoints
- /auth/**
- /verificar/**
- /certificados/verificar/**
- /swagger-ui/**, /swagger-ui.html
- /api-docs/**, /v3/api-docs/**

## CORS
Allowed origins for local development:
- http://localhost:5173
- http://localhost:4173

## Session policy
- Session creation policy is STATELESS
- CSRF is disabled (API uses JWT, not cookies)

## Secrets and configuration
- JWT secret and expiration are configured in application.yml
- For production, move secrets to environment variables or a vault

## Recommended practices
- Rotate JWT secret periodically
- Use HTTPS in all environments
- Set a strong, random JWT secret (>= 256 bits)
- Restrict CORS to the production frontend domain
