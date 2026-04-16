# Design System Document

## 1. Overview & Creative North Star: The Editorial Canvas
This design system rejects the "industrial grid" of traditional project management. Instead, it embraces **The Editorial Canvas**—a creative North Star that treats the digital workspace as a high-end, curated environment. We are moving away from the "boxy" SaaS aesthetic toward a signature experience defined by intentional asymmetry, breathing room, and tonal depth.

The system utilizes the core DNA of agile organization but elevates it through **Tonal Layering** and **Sophisticated Overlays**. By removing rigid borders and embracing fluid, glass-like surfaces, we create a tool that feels less like a utility and more like a premium studio space.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the heritage of productivity but refined for a high-end editorial feel. We utilize a sophisticated Material-style token system to manage depth.

### Core Palette
- **Primary (Trello Blue):** `primary` (#005f98) / `primary_container` (#0079bf). Used for high-impact actions and brand presence.
- **Surface Foundations:** `surface` (#f9f9ff), `surface_container_low` (#f1f3ff), and `surface_container_highest` (#d7e2ff).
- **The Label Palette:** For categorization, use the curated tonal set including `#61BD4F` (Success), `#EB5A46` (Danger), and `#C377E0` (Nuance).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:
1.  **Background Color Shifts:** Placing a `surface_container_low` element against a `surface` background.
2.  **Tonal Transitions:** Using the `surface_container` hierarchy to denote nesting.
3.  **Vertical Space:** Utilizing the 4-pt spacing scale to create separation.

### The "Glass & Gradient" Rule
To elevate beyond the "standard" look, floating elements (Modals, Popovers, and Navbars) should utilize **Glassmorphism**. Apply `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 12px. For Primary CTAs, use a subtle linear gradient from `primary` to `primary_container` (Top-to-Bottom) to provide a "tactile" soul that flat colors lack.

---

## 3. Typography: The Curated Voice
We use **Inter** as our typographic workhorse, balanced with high-contrast scales to create an editorial hierarchy.

- **Display (Display-LG 3.5rem):** Reserved for board titles and high-level milestones. Should feel authoritative and spacious.
- **Headlines (Headline-SM 1.5rem):** Used for list headers and section titles.
- **Body (Body-MD 0.875rem):** The standard for card content. It provides optimal legibility without crowding the "Canvas."
- **Labels (Label-SM 0.6875rem):** Used for metadata and badges.

**Editorial Tip:** Use `display-md` for empty states or onboarding moments. The large, airy type creates a "magazine" feel that reduces the anxiety of a blank task list.

---

## 4. Elevation & Depth
Hierarchy in this system is achieved through **Tonal Layering** rather than structural lines.

### The Layering Principle
Treat the UI as a series of physical layers.
- **Level 0 (Background):** Solid board colors or `surface`.
- **Level 1 (The Column):** `surface_container_low` with a `lg` (1rem) radius.
- **Level 2 (The Card):** `surface_container_lowest` (#FFFFFF). This creates a soft, natural lift.

### Ambient Shadows
Shadows must be "breathable." 
- **Resting Card:** `0 1px 0 rgba(9,30,66,0.25)` (The classic Trello tactile anchor).
- **Hover/Floating:** Use an extra-diffused shadow: `0 12px 24px -4px rgba(4, 27, 60, 0.08)`. The shadow color is a tinted version of `on_surface` to mimic natural light.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**: the `outline_variant` token at 15% opacity. Never use 100% opaque high-contrast borders.

---

## 5. Components

### Buttons
- **Primary:** `primary_container` background, `on_primary` text. Radius: `sm` (0.25rem) for a precise, professional look.
- **Ghost Action:** No background or border. Use `primary` text. On hover, apply `surface_container_high` background.

### Editorial Cards
- **Construction:** `surface_container_lowest` background, `DEFAULT` (0.5rem) radius.
- **Content:** Forbid divider lines within cards. Use 12px (`spacing-12`) of vertical white space to separate the card title from metadata or attachments.

### Lists (Columns)
- **Background:** `surface_container` (#EBECF0).
- **Radius:** `md` (0.75rem).
- **Spacing:** 8px internal padding for a "tight but airy" card stack.

### Glass Popovers
- **Style:** `surface_container_lowest` with 85% opacity and `backdrop-blur`.
- **Shadow:** `0 8px 16px -4px rgba(9,30,66,0.25)`.
- **Radius:** `lg` (1rem).

### Form Inputs
- **Style:** `surface_container_highest` background with a subtle 2px bottom-accent of `primary` when focused. Forbid the 4-sided box border; let the surface color define the input area.

---

## 6. Do's and Don'ts

### Do
- **Do** use intentional asymmetry. A list can be slightly offset or have varying top-margins to feel less like a "template."
- **Do** prioritize white space. If a layout feels "busy," increase the spacing token by one level (e.g., move from 16pt to 20pt).
- **Do** use `full` round avatars for a soft, human touch against the geometric card shapes.

### Don't
- **Don't** use 1px dividers `#DFE1E6`. If you need to separate content, use a 4pt or 8pt height `surface_container_low` block or simple white space.
- **Don't** use pure black for text. Always use `on_surface` (#041b3c) to maintain the premium tonal balance.
- **Don't** crowd the board. Ensure the "Board Background" is visible between columns to maintain the "Canvas" metaphor.