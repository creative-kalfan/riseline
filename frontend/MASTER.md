# CareerOS — Master Design Specification (Neo-Brutalist)
**Authoritative Visual & UX Specification**
**Standard:** Neo-Brutalism + Technical Precision + Serious Career Intelligence

---

## 1. Design Direction & POV

CareerOS is an AI-powered Career Operating System for software engineers and technical candidates.
Its design language balances **technical authority**, **tactile precision**, and **structural clarity**.

- **Anti-Reference:** Faux-translucent glassmorphism, floating blurry shadows, arbitrary 24px/32px rounded bubbles, decorative non-semantic gradients, low-contrast hairline borders.
- **Core Aesthetic:** Controlled Neo-Brutalism. Bold structural borders, solid high-contrast surfaces, intentional hard offset shadows, mechanical tactile interactions, and technical typography.
- **Core Rule:** Color and contrast communicate meaning and state; they do not merely decorate.

---

## 2. Typography

| Role | Font Family | Size / Weight | Letter Spacing | Purpose |
|------|-------------|---------------|----------------|---------|
| **Display / Page H1** | Inter Variable | 1.5rem–2rem / 800 (Bold/Extrabold) | `-0.03em` | Primary view headers |
| **Section H2 / H3** | Inter Variable | 1rem–1.25rem / 700 (Bold) | `-0.02em` | Card & container headers |
| **Body / Copy** | Inter Variable | 0.875rem (14px) / 400–500 | Normal | Descriptions, bullet points |
| **Telemetry / Numbers** | Fira Code Variable | 0.75rem–1.125rem / 600–700 | `-0.01em` | Match %, salaries, dates, stats |
| **Metadata / Badges** | Fira Code Variable | 0.6875rem–0.75rem / 600 | `+0.02em` uppercase | Status tags, tiers, filters |
| **Micro Labels** | Inter Variable | 0.6875rem (11px) / 600 | `+0.04em` uppercase | Form field headers, breadcrumbs |

---

## 3. Geometry & Radii

Excessive pill shapes and oversized `rounded-2xl` / `rounded-3xl` containers are eliminated from product UI.

- **Controls (Buttons, Inputs, Selects, Checkboxes):** `rounded-md` (~5–6px)
- **Cards & Data Panels:** `rounded-lg` (~8px)
- **Dialogs, Drawers & Sheets:** `rounded-xl` (~10–12px)
- **Badges & Inline Chips:** `rounded-md` (~4px)
- **Pills:** Reserved solely for circular status dots or compact count indicators.

---

## 4. Borders & Structure

Structural boundaries replace fuzzy elevation.

- **Base Structural Borders:** `1.5px` to `2px` solid (`border-2` or `border-[1.5px]`).
- **Interactive Controls (Default):** `border-2 border-input` or `border-2 border-border`.
- **Active / Selected State:** `border-2 border-primary`.
- **Divider Lines:** `1.5px` solid `border-border`.
- **No Translucent Borders:** Avoid `border-border/30` used to simulate blurred glass; use opaque, high-contrast borders.

---

## 5. Hard Offset Shadows (Brutal Shadows)

Diffuse, ambient box-shadows are replaced with hard-edge offset shadows:

```css
/* Hard brutal shadow tokens */
--shadow-brutal-xs: 1px 1px 0px 0px var(--border);
--shadow-brutal-sm: 2px 2px 0px 0px var(--border);
--shadow-brutal-md: 4px 4px 0px 0px var(--border);
--shadow-brutal-lg: 6px 6px 0px 0px var(--border);
--shadow-brutal-primary: 3px 3px 0px 0px var(--primary);
--shadow-brutal-primary-md: 5px 5px 0px 0px var(--primary);
```

### Usage Policy
- **Dense Lists (Job Cards, Applications, Notifications):** Use solid surface + 2px border. Do NOT apply heavy shadows to every item at rest.
- **Hover / Focus / Selection:** Apply `shadow-brutal-sm` or `shadow-brutal-primary` to draw focus without layout shifts.
- **Floating Modals / Dialogs:** Apply `shadow-brutal-lg`.
- **Primary Action Buttons:** Default `shadow-brutal-sm`, transitioning to mechanical depression on active press.

---

## 6. Color Architecture

### Dark Mode (Primary Workstation Palette)
- **Canvas / Background:** `#090a0f`
- **Surface (Cards, Lists):** `#11141c`
- **Surface Elevated (Hover, Popovers):** `#171b26`
- **Surface Instrument (Inputs, Sub-bars):** `#0c0e14`
- **Border:** `#2b3345` (Structural contrast `> 3.5:1`)
- **Foreground:** `#f4f6fa`
- **Muted Foreground:** `#848ea3`
- **Primary (CareerOS Electric Blue):** `#315cff` (Hover `#446dff`)
- **Success (Match / Green):** `#10b981` / `#22c55e`
- **Warning (Attention / Amber):** `#f59e0b`
- **Destructive (Error / Gap):** `#ef4444`

### Light Mode
- **Canvas / Background:** `#f4f5f8`
- **Surface:** `#ffffff`
- **Surface Elevated:** `#eaecf2`
- **Border:** `#1f242e`
- **Foreground:** `#0f1218`
- **Muted Foreground:** `#525b6c`
- **Primary:** `#2552e8`

---

## 7. Tactile Motion System

- **Button Mechanical Press:**
  - `transition: transform 100ms ease-out, box-shadow 100ms ease-out;`
  - Active: `transform: translate(2px, 2px); box-shadow: none;`
- **Card Hover:**
  - Slight upward or rightward offset: `hover:-translate-y-0.5 hover:shadow-brutal-sm`
- **Dialogs & Drawers:**
  - Crisp scale (`98% -> 100%`) or slide without diffuse blur delays.
- **Accessibility:**
  - Enforce `@media (prefers-reduced-motion: reduce)` disabling all transforms and non-opacity transitions.

---

## 8. Surface-Specific Rules

### 1. Resume Studio
- **STRICT ENFORCEMENT:** The A4 preview document (`PreviewPane`, `PdfCanvasPreview`) is a real job-application document. It must **NEVER** receive Neo-Brutalist borders, hard shadows, or quirky UI decorations.
- The Studio **shell, AI intelligence left pane, suggestion cards, toolbars, and dialogs** receive full Neo-Brutalist styling.

### 2. Job Intelligence
- Search input & filters bar: crisp 2px borders with clear focus rings.
- Job list: scannable cards with high-contrast role titles, Fira Code telemetry, and `border-2 border-border`.
- Selected job view: dominant action buttons (`Apply Now`, `Tailor Resume`) with `shadow-brutal-primary`.

### 3. Dashboard
- Live metrics ribbon with Fira Code numerals.
- 3D Topology canvas framed in 2px structural border with solid header.

### 4. Copilot & Interview Prep
- Crisp chat/question cards, clear distinction between user input and AI output via structural borders.
