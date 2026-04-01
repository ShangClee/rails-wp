## ADDED Requirements

### Requirement: Implement WordPress post revisions system
The system SHALL provide a post revisions feature that matches WordPress behavior.

#### Scenario: Post updates create revisions automatically
- **WHEN** a published post is updated via API or admin panel
- **THEN** the system automatically saves a revision of the previous post content
- **AND** the revision is stored as a wp_posts entry with post_type='revision' and post_parent pointing to the original post
- **AND** revisions are ordered by post_date descending
- **AND** the number of revisions kept follows WordPress default or site configuration

#### Scenario: Revisions are accessible via API
- **WHEN** a GET request is made to /api/v2/posts/:id/revisions
- **THEN** the response includes all revisions for the post in WordPress REST API format
- **AND** each revision includes standard WordPress revision fields
- **AND** the response supports WP-standard parameters like _wp_post_revision_fields

#### Scenario: Users can restore post revisions
- **WHEN** a POST request is made to /api/v2/revisions/:restoreId/restore
- **THEN** the current post content is replaced with the revision content
- **AND** a new revision is created representing the state before restore
- **AND** the response matches WordPress REST API behavior for revision restoration

### Requirement: Support WordPress post formats
The system SHALL support WordPress post formats for categorizing posts by type.

#### Scenario: Post formats are available as a taxonomy
- **WHEN** requesting available taxonomies for posts
- **THEN** 'post_format' is listed as an available taxonomy
- **AND** the post_format taxonomy behaves like other WordPress taxonomies
- **AND** standard WordPress post formats (standard, aside, image, video, quote, link, gallery, status, audio, chat) are supported

#### Scenario: Posts can be assigned post formats
- **WHEN** creating or updating a post via API or admin panel
- **THEN** the post can be assigned a post_format term
- **AND** the post format is stored and retrieved correctly
- **AND** the post format affects display and behavior as in WordPress themes

#### Scenario: Post format API endpoints work correctly
- **WHEN** requesting posts filtered by post format
- **THEN** the response includes only posts with the specified format
- **AND** post format assignments appear correctly in post responses
- **AND** the post format taxonomy supports standard WP operations (get terms, assign, etc.)

### Requirement: Enhance metadata handling to match WordPress conventions
The system SHALL handle post, user, comment, and term metadata in ways that match WordPress behavior.

#### Scenario: Metadata follows WP serialization and storage conventions
- **WHEN** saving metadata through API or admin panel
- **THEN** the system handles serialization appropriately for different data types
- **AND** metadata keys with leading underscore (_) are treated as protected (not shown in custom fields UI by default)
- **AND** metadata operations match WordPress add/update/delete/get patterns

#### Scenario: Metadata API endpoints are WP-compatible
- **WHEN** accessing metadata through REST API endpoints
- **THEN** the response format matches WordPress REST API for meta
- **AND** metadata can be created, updated, and deleted via standard WP API patterns
- **AND** protected metadata (_ keys) requires appropriate permissions to access

#### Scenario: Meta boxes and custom fields UI work as expected
- **WHEN** using admin panel to edit metadata
- **THEN** the interface shows custom fields in a manner similar to WordPress
- **AND** users can add, edit, and delete custom fields
- **AND** metadata validation and sanitization matches WordPress behavior

### Requirement: Implement WordPress-compatible comment handling
The system SHALL handle comments in ways that match WordPress default behavior and APIs.

#### Scenario: Comment approval follows WP defaults
- **WHEN** a comment is created by an unauthenticated user
- **THEN** the comment is held for moderation (comment_approved='0') if site settings require moderation
- **AND** comments by authenticated users are auto-approved based on their role and site settings
- **AND** the comment_approved field values match WordPress (0/1/spam/trash-etc.)

#### Scenario: Comment API endpoints match WP REST API
- **WHEN** accessing comment endpoints
- **THEN** responses include WordPress-standard comment fields
- **AND** comment context, password, and other WP-specific fields are handled correctly
- **AND** comment queries support WP-standard parameters (post_id, author, status, etc.)

#### Scenario: Comment counts are updated correctly
- **WHEN** comments are created, approved, or deleted
- **THEN** the comment_count on the associated post is updated to match WordPress behavior
- **AND** comment count updates happen immediately and accurately
- **AND** the system handles edge cases like deleting all comments from a post

### Requirement: Ensure media handling matches WordPress conventions
The system SHALL handle media uploads, attachments, and metadata in ways that match WordPress.

#### Scenario: Media uploads follow WP file organization
- **WHEN** a file is uploaded through media endpoints
- **THEN** the file is stored in wp-content/uploads/year/month/ folders as in WordPress
- **AND** the _wp_attached_file metadata is set correctly
- **AND** image metadata (width, height, file) is generated and stored as in WordPress

#### Scenario: Attachment metadata matches WP standards
- **WHEN** retrieving attachment data
- **THEN** the response includes WordPress-standard attachment fields
- **AND** image metadata includes sizes array matching WordPress generated intermediate sizes
- **AND** EXIF, IPTC, and other metadata is handled as in WordPress when applicable

#### Scenario: Media library reflects actual uploads
- **WHEN** listing media items
- **THEN** the response includes all attachments with correct metadata
- **AND** filtering by media type (image, video, audio, etc.) works as in WordPress
- **AND** pagination and search work correctly for large media libraries