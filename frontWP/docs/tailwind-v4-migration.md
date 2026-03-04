# Tailwind CSS v4 Migration Guide (frontWP)

## Summary

`frontWP` (formerly CMU-UI) migrated from inline styles and a minimal global stylesheet to Tailwind CSS v4 using a CSS-first setup.

## What Changed

- Added Tailwind CSS v4 tooling with `tailwindcss` and `@tailwindcss/cli`.
- Introduced build scripts in `frontWP/package.json`:
  - `npm run build:css`
  - `npm run watch:css`
- Converted `frontWP/assets/styles/application.css` into Tailwind source:
  - `@import "tailwindcss"`
  - `@source` directives for ERB/JS files
  - `@theme` custom brand palette tokens
- Generated production stylesheet:
  - `frontWP/assets/styles/application.tailwind.css`
- Updated ERB templates to replace inline style attributes with Tailwind utility classes:
  - `frontWP/components/layouts/application.html.erb`
  - `frontWP/pages/posts/index.html.erb`
  - `frontWP/pages/posts/show.html.erb`
- Updated layout stylesheet include to use the generated Tailwind bundle.

## New Styling Model

- Source of truth: `frontWP/assets/styles/application.css`
- Generated output: `frontWP/assets/styles/application.tailwind.css`
- Component styling: utility classes in ERB templates
- Brand colors:
  - `brand-500`
  - `brand-700`

## Developer Workflow

1. Install dependencies:

```bash
cd frontWP
npm install
```

2. Build CSS once:

```bash
npm run build:css
```

3. Run watcher during UI edits:

```bash
npm run watch:css
```

## Mapping from Old to New

- Header inline styles → utility classes (`px-5 py-5 bg-slate-100 border-b border-slate-200`)
- Main content width/margins → utility classes (`max-w-3xl mx-auto px-5`)
- Date and metadata text colors/sizes → utility classes (`text-sm text-slate-500`)
- Links and accents → brand token classes (`text-brand-700 hover:text-brand-500`)
- Post content spacing and nested element styling → arbitrary variant utilities (`[&_p]:mb-4`, `[&_a]:underline`)

## Verification Checklist

- CSS builds with Tailwind v4 CLI.
- Generated CSS file includes only used utilities plus base/theme layers.
- Pages preserve prior spacing hierarchy and typography scale.
- Link affordance and interactive states remain visible.
- Templates render without inline `style=""` attributes.

## Browser and Responsive Validation Guidance

Validate rendered pages in:

- Chrome (latest)
- Safari (latest)
- Firefox (latest)

Validate at widths:

- 375px
- 768px
- 1280px

Focus checks:

- Header spacing and link contrast
- Post list rhythm and borders
- Post detail content readability
- Back-link visibility and hover behavior
