# LectureQuest Design Guidelines

## Design Philosophy

LectureQuest follows a "quiet luxury" aesthetic inspired by modern editorial design. The visual language balances **warmth and professionalism**, creating an inviting learning environment that feels sophisticated yet approachable.

### Core Principles
- **Editorial elegance** - Every element serves emotional or cognitive clarity
- **Warm minimalism** - Clean layouts with purposeful whitespace
- **Human-centered** - Feels welcoming, not clinical or cold
- **Restrained, bold when needed** - Subtle by default, impactful at key moments

---

## Color Palette

### Light Mode
| Role | Color | HSL |
|------|-------|-----|
| Background | Warm Cream | `43 60% 98%` (#FFFDF9) |
| Primary | Forest Green | `171 93% 16%` (#034F46) |
| Accent | Soft Lavender | `282 60% 94%` (#F0D7FF) |
| Text | Near Black | `0 0% 10%` (#1A1A1A) |
| Card | Warm White | `43 40% 97%` |
| Muted | Cream Gray | `43 20% 92%` |
| Gold (XP) | Warm Gold | `40 85% 55%` |
| Success | Teal Green | `160 60% 35%` |

### Dark Mode
| Role | Color | HSL |
|------|-------|-----|
| Background | Deep Forest | `170 15% 8%` |
| Primary | Bright Teal | `160 60% 45%` |
| Accent | Muted Lavender | `282 40% 25%` |
| Text | Warm White | `40 20% 95%` |
| Card | Dark Forest | `170 12% 11%` |

### Usage Guidelines
- Use **primary (forest green)** for main CTAs and important UI elements
- Use **accent (lavender)** for secondary buttons and highlights
- Use **gold** sparingly for XP, achievements, and celebration moments
- Never use pure white (#FFF) for backgrounds - always use warm cream tones

---

## Typography

### Font Families
- **Headings**: EB Garamond (serif) - Elegant, editorial feel
- **Body/UI**: Figtree (sans-serif) - Clean, modern, highly readable

### Type Scale
| Element | Size | Weight | Font |
|---------|------|--------|------|
| Display Hero | 4.5rem | 400 | EB Garamond |
| H1 | 2.5rem | 500 | EB Garamond |
| H2 | 1.75rem | 500 | EB Garamond |
| H3 | 1.25rem | 500 | Figtree |
| Body | 1rem | 400 | Figtree |
| Small | 0.875rem | 400 | Figtree |
| Caption | 0.75rem | 400 | Figtree |

### Typography Rules
- Use serif (EB Garamond) for headlines and display text
- Use sans-serif (Figtree) for body text, labels, and UI elements
- Maintain generous line-height (1.5-1.75) for readability
- Use tracking-tight (-0.02em) for large headlines

---

## Spacing & Layout

### Container Widths
- **Max content width**: 1200px (max-w-5xl)
- **Narrow content**: 640px (max-w-xl) - for forms, modals
- **Reading width**: 720px (max-w-2xl) - for quizzes, results

### Spacing Scale
| Size | Tailwind | Use Case |
|------|----------|----------|
| xs | 2 (0.5rem) | Tight inline spacing |
| sm | 3-4 (0.75-1rem) | Between related items |
| md | 6 (1.5rem) | Section padding |
| lg | 8-12 (2-3rem) | Major section breaks |
| xl | 16-24 (4-6rem) | Page sections |

### Layout Principles
- Use generous vertical padding (py-16 to py-24) for page sections
- Cards should have consistent internal padding (p-6)
- Maintain visual rhythm with consistent spacing between elements
- Use grid layouts (2-4 columns) for stat cards and achievements

---

## Components

### Buttons

**Primary Button** (Forest Green)
- Background: primary
- Text: primary-foreground (white)
- Border-radius: 12px (rounded-xl)
- Use for main CTAs: "Start Quiz", "Upload Lecture"

**Accent Button** (Lavender)
- Background: accent (soft lavender)
- Text: foreground (dark)
- Border: 1px solid foreground/10
- Use for secondary actions: "View All", "Try Demo"

**Ghost Button**
- No background
- Text: foreground
- Use for tertiary actions: "Back", navigation

### Cards

- Background: card (warm white)
- Border: subtle (border-border)
- Border-radius: 12px
- Shadow: subtle warm shadow (shadow-sm)
- Hover: subtle lift effect (translateY -2px)

### Badges

**XP/Gold Badge**
- Background: gold/10
- Text: gold
- Border: gold/20

**Achievement Badge**
- Unlocked: gold background glow
- Locked: muted background, grayscale icon

### Progress Bars

- Track: muted background
- Fill: primary (forest green)
- Height: 6-8px for main progress, 4px for inline
- Border-radius: full (rounded-full)

---

## Iconography

### Style
- Use Lucide React icons for all UI icons
- Icon size: 16-20px for inline, 24px for standalone
- Stroke width: 1.5-2 for visibility
- Color: inherit from parent or use semantic colors

### Key Icons
| Use | Icon | Notes |
|-----|------|-------|
| XP | Zap | Gold color |
| Level | Award | Primary color |
| Streak | Flame | Gold when active |
| Upload | Upload | Primary color |
| Quiz | Play | Primary color |
| Achievement | Trophy | Gold color |
| Back | ArrowLeft | Muted color |
| Theme | Sun/Moon | Muted color |

---

## Animation & Motion

### Principles
- **Purposeful**: Every animation should serve clarity or delight
- **Subtle**: Prefer understated over flashy
- **Quick**: Keep durations under 400ms for UI responses

### Standard Transitions
- **Hover**: 200ms ease
- **Focus**: 150ms ease
- **Page transitions**: 300-400ms ease-out
- **Loading states**: Subtle shimmer or pulse

### Key Animations
- **Float up**: XP earned (+10, +50) floats up and fades
- **Check bounce**: Correct answer checkmark bounces in
- **Shake**: Wrong answer subtle horizontal shake
- **Gold pulse**: Achievement unlock subtle glow pulse
- **Fade in**: Page content fades in with slight upward motion

---

## Gamification Visual Language

### XP & Progress
- XP numbers always in **gold** color
- Show progress bars prominently
- Use **+XX XP** format for earned points
- Animate XP gains with float-up effect

### Levels
- Display level number prominently
- Show level title (e.g., "Novice Scholar")
- Progress to next level with visual bar

### Achievements
- Unlocked: Gold background, full color icon
- Locked: Muted background, grayscale icon
- Progress: Small progress bar below

### Streaks
- Flame icon in gold when active
- Display streak count prominently
- Celebrate milestones (7, 30 days)

---

## Accessibility

### Color Contrast
- Ensure 4.5:1 minimum for body text
- Ensure 3:1 minimum for large text and UI elements
- Test both light and dark modes

### Focus States
- Visible focus rings on all interactive elements
- Use ring color matching primary
- Never remove focus styles

### Motion
- Respect prefers-reduced-motion
- Provide non-animated alternatives

---

## Responsive Design

### Breakpoints
- **sm**: 640px - Stack to single column
- **md**: 768px - Tablet adjustments
- **lg**: 1024px - Full desktop layout

### Mobile Considerations
- Touch targets minimum 44x44px
- Reduce padding on mobile (py-8 vs py-16)
- Stack horizontal layouts vertically
- Simplify navigation on mobile
