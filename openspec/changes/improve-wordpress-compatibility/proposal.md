## Why

The current Rails WP Monorepo implements a WordPress-compatible system but has gaps in behavior and features compared to actual WordPress. While the database schema is preserved, certain WordPress-specific behaviors, APIs, and admin functionalities are either missing or implemented differently. This change aims to close these gaps while maintaining the clean separation of backWP and frontWP architectures.

## What Changes

- Enhance API endpoints to match WordPress REST API behavior exactly
- Improve admin panel functionality to match WordPress wp-admin experience
- Add missing WordPress-specific features (revisions, post formats, custom fields handling)
- Ensure behavioral compatibility in areas like comment handling, media management, and user roles
- Maintain backward compatibility where possible, mark breaking changes explicitly

## Capabilities

### New Capabilities
- `wordpress-api-behavior`: Ensuring API endpoints match WordPress REST API responses and behavior
- `wordpress-admin-enhancement`: Improving admin panel to match WordPress wp-admin UX and functionality
- `wordpress-feature-completeness`: Adding missing WordPress features like post revisions, formats, and advanced meta handling

### Modified Capabilities
- `frontend-types`: May need updates to align with WordPress-specific data structures
- `graphql-admin-queries`: May need enhancements for WordPress-compatible admin operations

## Impact

- **backWP**: API controllers, services, and potentially model behaviors
- **frontWP**: Admin panel modules and potentially public frontend components
- **Database**: No schema changes, but potential additions to how data is handled
- **APIs**: REST and GraphQL endpoints may see behavior changes to match WordPress
- **Dependencies**: Minimal impact, mostly internal implementation changes