## Why

The Rails WP Monorepo has a Ruby/Rails 8.1.2 backend with GraphQL API and a vanilla JavaScript frontend admin panel. Currently, there is no type safety between the frontend and backend, leading to potential runtime errors when frontend code makes assumptions about GraphQL response shapes that may change. This creates fragility in the admin panel modules that directly consume GraphQL data.

## What Changes

- Add JSDoc typedef generation from GraphQL schema to provide type safety for frontend developers
- Create a Ruby Rake task that introspects the GraphQL schema and generates JSDoc typedef files
- Enhance existing API helper functions with JSDoc type annotations for better IDE support
- Maintain backward compatibility with existing vanilla JavaScript code
- No changes to backend Rails/GraphQL implementation required

## Capabilities

### New Capabilities
- `frontend-types`: Introduces type safety for frontend-backend communication via JSDoc typedefs generated from the GraphQL schema

### Modified Capabilities
- (No existing capability requirements are changing - this is an additive type safety enhancement)

## Impact

- **Frontend**: `frontWP/adminWP/shared/js/api-helpers.js` will be enhanced with JSDoc type annotations
- **Build Process**: New `rake jsdoc:generate` task added to backend
- **File System**: New `frontWP/jsdoc/types.js` directory for generated typedefs
- **Developer Experience**: Improved IDE autocompletion and type checking for GraphQL data consumption
- **Runtime**: Zero impact - all changes are compile-time/developer experience only