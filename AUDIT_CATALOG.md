# Nature-Forward Therapy — Site Structure & Design System Audit

**Audit date:** 2026-07-23  
**Scope:** Read-only catalog of existing HTML/CSS, Tailwind theme, routes/sections, and static media. No application code was changed.  
**Site type:** Single-page static marketing site for Nicole Garcia, LCSW-C (Towson, MD).  
**Canonical domain (CNAME):** `flockoffox.org`

---

## 1. Design System

### 1.1 Color palette

Colors are defined in two places: CSS custom properties / inline styles in `index.html`, and an extended palette in `tailwind.config.js`. Hex values below are the authoritative design tokens as declared in source.

#### Primary (forest / deep green)

| Token | Hex | RGB | Where defined | Usage |
| --- | --- | --- | --- | --- |
| `--forest` / `forest` | `#162221` | `rgb(22, 34, 33)` | `:root` in `index.html`; `tailwind.config.js` | Primary brand dark, button text on gold, section bg (`bg-forest`), footer bg |
| `forest.light` | `#1e2d2b` | `rgb(30, 45, 43)` | `tailwind.config.js`; body gradient mid-stops | Body gradient stops |
| `--forest-soft` / `forest.soft` | `#2d3a35` | `rgb(45, 58, 53)` | `:root`; config | Soft section backgrounds (`bg-forest-soft/*`), card surfaces |

#### Secondary (sage)

| Token | Hex | RGB | Where defined | Usage |
| --- | --- | --- | --- | --- |
| `--sage` / `sage` | `#7d9b8a` | `rgb(125, 155, 138)` | `:root`; config | Brand secondary green (CSS var; limited direct use) |
| `sage.light` | `#9ab5a5` | `rgb(154, 181, 165)` | config | Nav links, supporting copy (`text-sage-light`) |
| `sage.dark` | `#5a7266` | `rgb(90, 114, 102)` | config | Borders, muted footer text, icon wells (`border-sage-dark/*`) |

#### Accent (gold)

| Token | Hex / value | RGB / notes | Where defined | Usage |
| --- | --- | --- | --- | --- |
| `--gold` / `gold` | `#d4af37` | `rgb(212, 175, 55)` | `:root`; config | Primary accent: headings, pills, numbered steps, botanical line |
| Gold button mid | `#b8962e` | `rgb(184, 150, 46)` | `.btn-gold` gradient | Darker gold in CTA gradient |
| `--gold-glow` | `rgba(212, 175, 55, 0.35)` | — | `:root` | Button / headshot glow |
| `gold.glow` | `rgba(212, 175, 55, 0.4)` | — | config | Config glow (slightly stronger than CSS var) |

Additional gold alphas used inline: `0.15` (nav border, outline hover), `0.2` (card hover ring, pill bg), `0.5` (button hover glow), `0.6` (headshot ring).

#### Background & body text

| Role | Hex / value | RGB | Notes |
| --- | --- | --- | --- |
| Page background | Gradient `165deg`: `#162221` → `#1e2d2b` → `#2d3a35` → `#1e2d2b` | — | `background-attachment: fixed` on `body` |
| Body text | `#e8eae6` | `rgb(232, 234, 230)` | Soft off-white / sage mist |
| White headings | `#ffffff` | `rgb(255, 255, 255)` | `text-white` on H1/H2 |
| Nav glass | `rgba(22, 34, 33, 0.75)` | forest @ 75% | Plus `backdrop-filter: blur(14px)` |
| Hero overlay | forest/soft rgba stack @ ~0.75–0.9 | — | Over Unsplash forest photo |

#### Supporting neutrals (Tailwind config only)

| Token | Hex | RGB | Intended use (from class names) |
| --- | --- | --- | --- |
| `sand` | `#c4b8a8` | `rgb(196, 184, 168)` | Body paragraphs (`text-sand`) |
| `taupe` | `#a89888` | `rgb(168, 152, 136)` | Declared; **not referenced** in current HTML |

#### Black shadow utilities (non-brand)

- `rgba(0,0,0,0.25)` — button / card shadows  
- `rgba(0,0,0,0.3)` — button hover shadow  

---

### 1.2 Typography

| Role | Family | Weights loaded / used | Source |
| --- | --- | --- | --- |
| Body | **Inter**, `system-ui`, sans-serif | Google Fonts: `400`, `500`, `600`; HTML uses medium/semibold via utilities | `index.html` Google Fonts link + `body` rule; config `fontFamily.body` |
| Headings | **Montserrat**, sans-serif | Google Fonts: `600`, `700`; H1–H3 set to Montserrat; buttons/labels use `font-heading font-semibold` / `font-bold` | Inline CSS `h1,h2,h3`; config `fontFamily.heading` |

#### Scale (as used in markup)

| Element | Classes / sizes |
| --- | --- |
| H1 (hero name) | `text-4xl` → `md:text-5xl` → `lg:text-6xl` (2.25rem / 3rem / 3.75rem), `font-bold` |
| H2 (section titles) | `text-3xl` → `md:text-4xl` (1.875rem / 2.25rem), `font-bold` |
| H3 (cards / contact) | `text-xl` (1.25rem), `font-bold` or `font-semibold` |
| H4 (sub-labels) | `font-semibold` + gold accent (no explicit size class → inherits) |
| Lead / hero subcopy | `text-lg` → `md:text-xl` |
| Body | `text-lg` (about) or default / `text-sm` (lists, steps) |
| Nav | `font-medium` (weight 500) |
| Footer | `text-sm` / `text-xs` |
| Line height | `leading-relaxed` (1.625) on primary paragraphs |

---

### 1.3 Layout dimensions & spacing

| Token / pattern | Value | Role |
| --- | --- | --- |
| Content max width (nav, specialties, contact) | `max-w-5xl` = **64rem (1024px)** | Primary site column |
| Content max width (hero, about) | `max-w-4xl` = **56rem (896px)** | Narrower narrative column |
| Nested image / copy | `max-w-2xl` = **42rem (672px)** | About image, hero tagline |
| Horizontal padding | `px-6` (1.5rem) | Section / nav gutters |
| Section vertical padding | `py-20` / `md:py-28` (5rem / 7rem) | About, specialties, contact |
| Hero | `min-h-screen`, `pt-20`, `pb-16` | Full viewport; clears fixed nav |
| Nav | `fixed`, `z-50`, `py-4` | Glass sticky header |
| Grids | `md:grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-3`, `sm:grid-cols-2` | Specialties & contact |
| Gaps | `gap-4`–`gap-16` (1rem–4rem) | Component spacing |
| Radii | `rounded-lg` (0.5rem), `rounded-2xl` (1rem), `rounded-full` | Buttons, cards, avatars/icons |
| Headshot | `w-40 h-40` → `md:w-48 md:h-48` (160→192px) | Circular hero portrait |
| Icon wells | `w-12 h-12` or `w-14 h-14` | Specialty card icons |
| Breakpoints in use | `sm` 40rem, `md` 48rem, `lg` 64rem | Tailwind v4 defaults |

---

### 1.4 Core visual components

#### Navigation
- **Location:** Fixed `<header>` + `<nav>` at top of `index.html`.
- **Style:** `.nav-glass` — translucent forest, blur 14px, gold-tinted bottom border.
- **Links:** In-page anchors `#about`, `#specialties`, `#contact` (no brand/logo in nav).
- **Behavior:** Inline script toggles `shadow-lg` on header when `scrollY > 60`.
- **Separators:** Pipe characters between links (`hidden sm:inline`).

#### Hero
- **Section:** `#hero`, `.hero-bg`, full viewport.
- **Background:** Unsplash forest photo + dark forest gradient overlay; `background-attachment: fixed` from `md` up.
- **Content:** Circular headshot (`.headshot-ring`), name H1, location line, `.botanical-line`, tagline, dual CTAs.
- **Motion:** Staggered `.animate-fade-in` / `.animate-slide-up` with `.delay-1`–`.delay-4`.

#### Buttons / CTAs
- **`.btn-gold`:** Gold linear gradient, forest text, glow shadow, lift on hover. Used for Headway booking.
- **`.btn-outline`:** 2px gold border, transparent fill, gold wash on hover. Used for Psychology Today.
- **No native `<form>` or submit buttons** on the site.

#### Cards
- **Pattern:** `.card-hover` + `bg-forest-soft/90` (or `/80`) + `border border-sage-dark/30` + `rounded-2xl` + padding.
- **Hover:** Translate up 4px + deeper shadow + gold hairline ring.
- **Variants:**
  - Key Focus Areas strip with gold pill chips (Trauma, ADHD, Depression, Anxiety).
  - Three centered specialty cards (Anxiety & Stress, Life Transitions, Clinical Support) with emoji icon circles.
  - Three larger info cards: Top Specialties & Expertise (lists), Payment & Insurance, Treatment Preferences.
- **Imagery “cards”:** Rounded image frames (`rounded-2xl overflow-hidden shadow-2xl`) — atmospheric Unsplash photos, not interactive.

#### Forms
- **None present.** Contact/booking is outbound links only (Headway, Psychology Today / Google share). No email capture, no contact form fields.

#### Footer
- Centered, `bg-forest`, top border `border-sage-dark/40`.
- Lines: practitioner + location; “Powered by SAGE Federation”.

#### Decorative / motion utilities
- `.botanical-line` — horizontal gold fade gradient accent under titles.
- `.curve-bottom` — elliptical `clip-path` on About section.
- Keyframe animations: `fadeIn`, `slideUp` (0.8s ease-out).

---

### 1.5 Design-system wiring note (audit finding)

`tailwind.config.js` extends `forest`, `sage`, `sand`, `taupe`, `gold`, and `fontFamily.heading` / `body`. The HTML extensively references utilities such as `text-sage-light`, `text-gold`, `bg-forest`, `bg-forest-soft/80`, `font-heading`, etc.

The compiled artifact `styles/tailwind.css` (Tailwind **v4.2.1**) currently contains **no** matches for those custom color/font tokens. Effective branding that does render comes primarily from:

1. The large inline `<style>` block in `index.html` (CSS variables + component classes), and  
2. Standard Tailwind utilities that *are* compiled (`text-white`, spacing, grids, etc.).

**Implication:** Custom theme utilities may not be applying as intended until the Tailwind v4 theme is wired (e.g. CSS `@theme` / config discovery) and CSS is rebuilt. Palette values in this audit remain the intended design system regardless.

---

## 2. Site Architecture

### 2.1 Tech stack & build

| Layer | Detail |
| --- | --- |
| Markup | Single `index.html` (~442 lines) |
| CSS entry | `styles/app.css` → `@import "tailwindcss"` |
| CSS output | `styles/tailwind.css` (built, minified) |
| Build script | `npm run build:css` → `@tailwindcss/cli` |
| Theme config | `tailwind.config.js` (`content: ['./index.html']`) |
| Runtime JS | Inline IIFE in `index.html` (nav shadow on scroll only) |
| Deploy | GitHub Pages–style `CNAME`; optional Nginx Docker image |
| Container | `Dockerfile` (nginx:alpine) + `nginx.conf` (SPA `try_files` → `index.html`) |

### 2.2 HTML pages & routes

| Path / route | File | Type |
| --- | --- | --- |
| `/` (and any deep link via Nginx fallback) | `index.html` | Only HTML page |
| `/styles/tailwind.css` | `styles/tailwind.css` | Stylesheet |
| `/favicon.png` | `favicon.png` | Favicon |

**No additional HTML pages** (no `/about.html`, blog, privacy, etc.). Navigation is **hash-based single-page sections**, not separate routes.

Nginx `try_files $uri $uri/ /index.html` treats unknown paths as the landing page (SPA-style), but there is no client-side router.

### 2.3 Structural sections (in-page)

| Order | ID / landmark | Purpose |
| --- | --- | --- |
| 1 | `<header>` / `<nav>` | Fixed glass nav → About, Specialties, Contact |
| 2 | `#hero` | Identity, headshot, primary CTAs |
| 3 | `#about` | Practice intro + nature image |
| 4 | `#specialties` | Focus areas, specialty cards, expertise/payment/therapy lists + nature image |
| 5 | `#contact` | “The Path” 3-step process + profile CTAs + nature image |
| 6 | `<footer>` | Name, location, SAGE Federation credit |

### 2.4 External destinations (CTAs)

| Label | URL |
| --- | --- |
| Book via Headway / Headway | `https://care.headway.co/providers/nicole-garcia-5?utm_source=pem&utm_medium=direct_link&utm_campaign=191873` |
| View Psychology Today Profile / Psychology Today | `https://share.google/fnqjdCLYmiedRj42E` |

### 2.5 Repository layout (application-relevant)

```
/
├── index.html              # Entire page + design tokens + components
├── favicon.png
├── CNAME                   # flockoffox.org
├── Dockerfile
├── nginx.conf
├── package.json
├── package-lock.json
├── tailwind.config.js
├── images/
│   ├── nicole.jpg
│   └── README.md
└── styles/
    ├── app.css             # Tailwind entry (2 lines)
    └── tailwind.css        # Compiled utilities
```

---

## 3. Static Media Assets

### 3.1 Local assets

| Path | Type | Dimensions / size | Role |
| --- | --- | --- | --- |
| `images/nicole.jpg` | JPEG | 951×960, ~186 KB | Hero circular headshot |
| `favicon.png` | PNG | 1376×768, ~846 KB | Site favicon (`/favicon.png`) |
| `images/README.md` | Markdown | — | Notes suggested `hero-bg.jpg` / `nicole-headshot.jpg` (not present as those names) |

**Documents (PDF, etc.):** none.  
**Icons (SVG/ICO packs):** none — specialty icons are Unicode emoji in HTML.  
**Local fonts:** none — Inter & Montserrat loaded from Google Fonts CDN.

### 3.2 Remote (Unsplash) images referenced in HTML

| Context | URL (query params abbreviated) | Alt / intent |
| --- | --- | --- |
| Hero background (CSS) | `photo-1441974231531-c6227db76b6e?w=1920&q=80` | Forest canopy |
| About section | `photo-1511497584788-876760111969?w=800&q=80` | Sunlight through trees |
| Specialties footer image | `photo-1476610182048-b716b8518aae?w=1200&q=80` | Flowing water |
| Contact sidebar | `photo-1448375240586-882707db888b?w=800&q=80` | Sagebrush / calm landscape |

### 3.3 Docker packaging gap (audit finding)

`Dockerfile` copies `index.html`, `styles/`, and `nginx.conf` only. It does **not** copy `images/` or `favicon.png`. A container-only deploy would miss the headshot and favicon unless those layers are added.

---

## 4. Content inventory (specialties section)

Useful for future IA work; not separate pages.

**Key focus chips:** Trauma, ADHD, Depression, Anxiety  

**Primary specialty cards:** Anxiety & Stress; Life Transitions; Clinical Support  

**Listed expertise topics:** Behavioral Issues, Body Image, Caregivers, Codependency, Coping Skills, Grief, Developmental Disorders, Divorce, Life Transitions, OCD, Parenting, Peer Relationships  

**Payment methods:** AmEx, Discover, Mastercard, Visa  

**Insurance:** Aetna, Ascension, BlueCross and BlueShield, CareFirst, Carelon Behavioral Health, Cigna and Evernorth, Kaiser (Out-of-Network), Medicaid, Quest Behavioral Health  

**Therapy types:** CBT, Compassion Focused, Culturally Sensitive, Expressive Arts, Family / Marital, Family Systems, Feminist, Multicultural, Person-Centered, Psychoanalytic, Psychodynamic, Trauma Focused  

---

## 5. Summary verdict

Nature-Forward Therapy is a **single-page, Tailwind-assisted static site** with a dark forest / sage / gold visual system, Montserrat + Inter typography, glass navigation, full-bleed nature hero, and card-based specialties/contact content. Branding is concentrated in `index.html` (inline CSS + structure) and mirrored in `tailwind.config.js`, with a **compilation gap** between declared Tailwind theme tokens and the current `styles/tailwind.css` output. Media footprint is small locally (one headshot + oversized favicon) and relies on Unsplash for atmospheric photography; there are **no forms** and **no multi-page routes**.

---

*End of audit catalog. Generated for documentation only; no application code modified.*
