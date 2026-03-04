# frontWP (CMU-UI)

This directory contains the frontend-facing UI assets and page artifacts, formerly known as `CMU-UI`.

## Structure

- `pages` page-level templates and route-oriented UI files
- `components` reusable UI building blocks and shared layouts
- `assets` static resources such as CSS and JavaScript entry files
- `hooks` reusable client-side behavior modules
- `state` centralized state containers and selectors

## Naming Conventions

- folder names use `kebab-case` or lowercase
- JavaScript files use `camelCase` or `kebab-case`
- page and component exports are aggregated through `index.js` files

## Styling

- Tailwind CSS v4 powers UI styling.
- Tailwind source file: `assets/styles/application.css`
- Generated CSS file: `assets/styles/application.tailwind.css`

## Build Commands

```bash
cd frontWP
npm install
npm run build:css
```

Use watch mode during development:

```bash
npm run watch:css
```

## Migration Docs

- `docs/tailwind-v4-migration.md`
