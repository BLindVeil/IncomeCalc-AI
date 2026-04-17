# Ascentra Brand Assets

All logos are SVG (vector) and scale to any size.

## Files

| File | Description |
|---|---|
| `logo-mark.svg` | Brand mark only (rounded square with "A"). Use for favicons, app icons, and small spaces. |
| `logo-mark-dark.svg` | Solid dark version of the mark, for light backgrounds where gradient might wash out. |
| `logo-full.svg` | Mark + "Ascentra" wordmark. Dark text, use on light backgrounds. |
| `logo-full-light.svg` | Mark + "Ascentra" wordmark. White text, use on dark backgrounds. |
| `favicon.svg` | Browser tab icon (same design as logo-mark, smaller viewBox). |
| `og-image.svg` | 1200x630 social sharing image for Twitter/LinkedIn/Facebook link previews. |

## Colors

| Token | Hex | Usage |
|---|---|---|
| Primary gradient start | `#1B4332` (ev-800) | Top-left of gradient |
| Primary gradient end | `#52B788` (ev-500) | Bottom-right of gradient |
| Solid brand | `#1B4332` (ev-800) | Used in logo-mark-dark, favicon |
| Text dark | `#0F1A14` | Wordmark on light backgrounds |
| Text light | `#FFFFFF` | Wordmark on dark backgrounds |

## Typography

- Font: Geist Sans (fallback: -apple-system, BlinkMacSystemFont, Inter, sans-serif)
- Weight: 600
- Letter spacing: -0.02em

## Usage

| Context | File |
|---|---|
| Social media profile | `logo-mark.svg` or export to PNG at 1024x1024 |
| Website header | Already uses inline SVG (see `src/components/ui/DashboardSidebar.tsx`) |
| Email signatures | `logo-full.svg` |
| Pitch decks (light slide) | `logo-full.svg` |
| Pitch decks (dark slide) | `logo-full-light.svg` |
| Link previews (OG tags) | `og-image.svg` (convert to PNG for meta tags) |
