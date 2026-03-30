## Context

The Rails WP Monorepo consists of:
- Backend: Ruby/Rails 8.1.2 with GraphQL-Ruby API at `http://localhost:8888/graphql`
- Frontend: Vanilla JavaScript SPA admin panel at `http://localhost:8080/admin/`
- Communication: Frontend modules make direct GraphQL requests via `shell.gqlRequest()` in `admin-shell.js`
- Current State: No type safety between frontend GraphQL queries/mutations and backend schema; frontend relies on runtime object shape checking

The admin panel modules (cms-posts.js, cms-pages.js, etc.) define GraphQL queries as string constants and parse responses manually, making them susceptible to breakage when the GraphQL schema evolves.

## Goals / Non-Goals

**Goals:**
- Provide frontend developers with type safety and IDE autocompletion for GraphQL data
- Generate accurate JSDoc typedefs from the existing GraphQL schema
- Enhance API helper functions with meaningful type annotations
- Maintain 100% backward compatibility with existing vanilla JavaScript code
- Require zero build steps or transpilation for frontend developers

**Non-Goals:**
- Migrating frontend to TypeScript or any compile-to-JS language
- Changing the GraphQL schema or backend API contracts
- Adding runtime type validation or contract testing
- Creating a shared type system between Ruby and JavaScript

## Decisions

### JSDoc over TypeScript Migration
**Chosen:** Generate JSDoc typedefs from GraphQL schema
**Reasons:**
- Zero build step required for existing vanilla JS workflow
- Works with current frontend tooling (no TS config needed)
- Provides immediate IDE benefits in VS Code/WebStorm
- Can be incrementally adopted per-file
**Alternatives Considered:**
- TypeScript migration: Rejected due to significant frontend rewrite effort
- Runtime type validation (e.g., zod, yup): Rejected as runtime overhead doesn't prevent DX issues
- Manual JSDoc maintenance: Rejected as error-prone and not scalable

### Schema Introspection Approach
**Chosen:** Ruby-based Rake task using GraphQL::Schema introspection
**Reasons:**
- Leverages existing Ruby/Rails backend infrastructure
- No new external dependencies needed
- Can reuse schema definition from `AppSchema`
- Easy to integrate into existing development workflow
**Alternatives Considered:**
- Separate Node.js script: Rejected as adds frontend tooling complexity
- GraphQL CLI introspection: Rejected as requires additional deployment step
- Runtime schema fetching: Rejected as inappropriate for build-time type generation

### Selective Typedef Generation
**Chosen:** Generate typedefs for frequently-used domain types (Post, User, Page, TermTaxonomy)
**Reasons:**
- Provides 80% of benefit with 20% of effort
- Avoids overwhelming developers with rarely-used internal types
- Focuses on types actually consumed in admin panel modules
**Alternatives Considered:**
- Full schema export: Rejected as creates noise and maintenance burden
- On-demand typedef generation: Rejected as complicates developer experience

### Helper Function Enhancement Strategy
**Chosen:** Annotate existing `api-helpers.js` functions and add new typed wrappers
**Reasons:**
- Maximizes reuse of existing battle-tested helper functions
- Provides gradual migration path for modules
- Keeps core networking logic centralized
**Alternatives Considered:**
- Create entirely new typed API layer: Rejected as duplicates existing functionality
- Only generate typedefs without helper enhancements: Rejected as misses opportunity to improve DX

## Risks / Trade-offs

[Generated typedefs may become outdated] → Mitigation: Add `rake jsdoc:generate` to development setup instructions and consider adding file watcher in future

[IDE JSDoc support varies] → Mitigation: Test with VS Code and WebStorm; document any IDE-specific limitations

[Generated typedefs might be overly verbose] → Mitigation: Focus on core domain types first; refine based on developer feedback

[Maintenance overhead of generation script] → Mitigation: Keep script simple and tightly coupled to existing schema definition

## Open Questions

1. Should we generate typedefs for input types (mutation arguments) as well as output types?
2. How should we handle GraphQL interfaces and unions in the JSDoc typedefs?
3. Should we add a development mode warning when typedefs are potentially stale?