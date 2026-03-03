# API-Only

This folder contains the backend-only Rails application.

## Structure

- `app/controllers` API endpoints and transport-level request handling
- `app/services` business workflows and orchestration logic
- `app/models` WordPress-compatible data layer and domain entities
- `app/middleware` Rack middleware for request/response concerns
- `app/utilities` shared backend helpers and reusable support modules
- `app/graphql` GraphQL schema, types, and resolvers
- `app/serializers` JSON serialization contracts for API responses

## Naming Conventions

- Ruby files use `snake_case`
- Ruby classes/modules use `PascalCase`
- Controller namespaces follow route namespaces
- Service objects end with `Service`
- Utility modules end with `Helper` or `Utility`
