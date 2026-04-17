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
| `logo-social-circle.svg` | 720x720 circular profile image. TikTok, Discord, any circle-crop platform. |
| `logo-social-square.svg` | 1080x1080 solid square profile image. Instagram, X, LinkedIn, Facebook. |

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

## Social Media Profile Pictures

| File | Size | Use for |
|---|---|---|
| `logo-social-circle.svg` | 720x720 | TikTok, Discord, any platform that crops to a circle. |
| `logo-social-square.svg` | 1080x1080 | Instagram, X, LinkedIn, Facebook. |

Both need to be exported to PNG before uploading (most social platforms don't accept SVG profile uploads).

### PNG Export Instructions

1. Open the SVG in your browser at the deployed URL (e.g. `ascentra.finance/logo-social-circle.svg`)
2. Use [cloudconvert.com](https://cloudconvert.com), [svgtopng.com](https://svgtopng.com), or similar free converter
3. Set output resolution:
   - **TikTok**: 720x720 PNG
   - **Instagram**: 1080x1080 PNG
   - **X / Twitter**: 400x400 PNG
   - **LinkedIn**: 400x400 PNG
   - **Discord**: 512x512 PNG
4. Download and upload to the platform

## Usage

| Context | File |
|---|---|
| TikTok / Discord profile | `logo-social-circle.svg` (export to PNG) |
| Instagram / X / LinkedIn profile | `logo-social-square.svg` (export to PNG) |
| Website header | Already uses inline SVG (see `src/components/ui/DashboardSidebar.tsx`) |
| Email signatures | `logo-full.svg` |
| Pitch decks (light slide) | `logo-full.svg` |
| Pitch decks (dark slide) | `logo-full-light.svg` |
| Link previews (OG tags) | `og-image.svg` (convert to PNG for meta tags) |
