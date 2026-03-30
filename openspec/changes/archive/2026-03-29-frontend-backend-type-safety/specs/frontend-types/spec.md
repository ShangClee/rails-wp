## ADDED Requirements

### Requirement: Generate JSDoc typedefs from GraphQL schema
The system SHALL provide a mechanism to automatically generate JSDoc typedef files from the Rails GraphQL schema to enable type safety in the vanilla JavaScript frontend.

#### Scenario: Schema introspection generates typedefs
- **WHEN** the `rake jsdoc:generate` task is executed
- **THEN** the system introspects the GraphQL schema and generates JSDoc typedefs for core domain types
- **AND** the generated typedefs are written to `frontWP/jsdoc/types.js`
- **AND** the typedefs include proper JSDoc annotations for IDE consumption

### Requirement: Enhance API helpers with JSDoc type annotations
The system SHALL provide enhanced API helper functions with JSDoc type annotations to improve developer experience when consuming GraphQL data in the frontend admin panel.

#### Scenario: API helpers include type information
- **WHEN** a developer opens `frontWP/adminWP/shared/js/api-helpers.js`
- **THEN** they see JSDoc typedef imports and type annotations on functions
- **AND** their IDE provides autocompletion for GraphQL response properties
- **AND** type mismatches are caught during development (not at runtime)