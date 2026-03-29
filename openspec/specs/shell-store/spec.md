## ADDED Requirements

### Requirement: AdminShell exposes a client-side data store
The system SHALL add a `store` object to `AdminShell` with `set`, `get`, `find`, and `invalidate` methods. The store SHALL use a plain `Map` internally. There SHALL be no TTL — data persists until explicitly invalidated by a mutation.

#### Scenario: Module stores fetched data
- **WHEN** a module calls `shell.store.set('posts', postsArray)`
- **THEN** `shell.store.get('posts')` returns that array on subsequent calls

#### Scenario: Store returns null for unknown key
- **WHEN** `shell.store.get('unknown')` is called
- **THEN** `null` is returned

#### Scenario: find returns matching record by ID
- **WHEN** `shell.store.find('posts', '42')` is called and a post with ID `42` exists
- **THEN** that post object is returned

#### Scenario: find uses loose equality for ID matching
- **WHEN** `shell.store.find('posts', '42')` is called
- **THEN** it matches records where `.ID == 42` (string-to-int safe comparison)

#### Scenario: Mutation invalidates store entry
- **WHEN** a module calls `shell.store.invalidate('posts')` after a mutation
- **THEN** `shell.store.get('posts')` returns `null`
- **AND** the next module load triggers a fresh API fetch

### Requirement: AdminShell exposes a GraphQL client method
The system SHALL add a `gqlRequest(query, variables)` method to `AdminShell` that POSTs to `http://localhost:8888/graphql` with the JWT Bearer token. The method SHALL extract `data` from the response. The method SHALL call `showToast` and throw on GraphQL errors.

#### Scenario: Successful GraphQL query
- **WHEN** `shell.gqlRequest(QUERY, { id: '1' })` is called with a valid token
- **THEN** the resolved `data` object is returned

#### Scenario: GraphQL error triggers toast
- **WHEN** the GraphQL response contains an `errors` array
- **THEN** `shell.showToast(errors[0].message, 'error')` is called and the error is thrown
