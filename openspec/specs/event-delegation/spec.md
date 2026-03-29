## ADDED Requirements

### Requirement: All modules use event delegation instead of window globals
Every admin module SHALL attach a single `click` listener to the `content` div and dispatch actions via `data-action` and `data-id` attributes on buttons. No module SHALL assign handlers to `window.*` properties. The `window.shell = shell` global assignment SHALL be removed from all modules.

#### Scenario: Edit button triggers edit handler
- **WHEN** a user clicks a button with `data-action="edit" data-id="42"`
- **THEN** the module's edit handler is called with id `"42"`
- **AND** no `window.*` global is involved

#### Scenario: Delete button triggers delete handler
- **WHEN** a user clicks a button with `data-action="delete" data-id="42"`
- **THEN** the module's delete handler is called with id `"42"`

#### Scenario: Unrecognized action is ignored
- **WHEN** a click event has no `data-action` attribute on any ancestor
- **THEN** no handler is invoked and no error is thrown

#### Scenario: window.shell is not set
- **WHEN** any module is loaded
- **THEN** `window.shell` is not assigned
- **AND** `window.cmsPosts_*`, `window.cmsPages_*`, etc. are not assigned
