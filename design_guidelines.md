# Design Guidelines: Gamified Lecture Learning App

## Design Approach
**Nature-Inspired Sage Green Aesthetic** - Calming, organic design with emphasis on growth, progression, and natural learning flow.

## Core Color Palette
Based on the sage green color scheme:
- **#F1F3E0** (67 33% 91%) - Light cream background
- **#D2DCB6** (77 31% 79%) - Light sage for accents and secondary elements
- **#A1BC98** (107 24% 67%) - Medium sage for primary actions
- **#778873** (110 10% 50%) - Dark sage for text and emphasis

## Core Design Elements

### Color System
- **Primary**: Sage green (107 24% 45% light / 107 30% 55% dark) for CTAs and emphasis
- **Secondary**: Light sage (77 31% 65% light / 77 25% 50% dark) for secondary actions
- **XP/Achievement Gold**: Warm gold for rewards and celebrations
- **Base**: Cream tones in light mode, deep forest greens in dark mode
- **Feedback Colors**: Green for success, red for errors, gold for achievements
- **Card Backgrounds**: Subtle elevation through soft sage tints

### Typography
- **Headers**: Clean, nature-inspired hierarchy with gradient text treatments
- **Body**: High contrast text on sage backgrounds
- **XP/Stats**: Large, bold numbers with gold accents
- **Level Titles**: Prominent badges with descriptive titles (e.g., "Knowledge Warrior")
- **Motivational Messages**: Dynamic, supportive performance feedback

### Layout System
**Spacing**: Tailwind units 2, 4, 6, 8 for consistency
- Card-based layouts with rounded corners and soft shadow elevation
- Full-screen overlays for level-up celebrations
- Sticky header with level badge, XP bar, and streak counter
- Toast notifications sliding from top-right (auto-dismiss 4s)

### Component Library

**Navigation/Header**
- Persistent header with user level badge (circular, prominent)
- Horizontal XP progress bar with animated sage gradient fill
- Streak counter with flame icon that grows visually with length
- Mobile hamburger menu with slide-out drawer

**Upload Interface**
- Drag-and-drop zone with dashed border and hover state
- Large file icon and instructional text
- Support for click-to-upload alternative
- File type indicator (text/PDF accepted)

**Quiz Interface**
- Large question card centered on screen
- Multiple choice options as full-width buttons with hover effects
- Progress indicator showing question X of Y
- Immediate visual feedback (green checkmark/red shake animation)
- Floating "+10 XP" animations on correct answers
- Explanation reveal after answer submission

**Confidence Rating**
- 1-5 star rating interface with large touch targets
- Visual fill states and hover previews
- Bonus XP display per rating point

**Achievement System**
- Grid layout of badge cards (3-4 columns desktop, 2 mobile)
- Locked achievements as greyscale silhouettes with lock icon
- Unlocked badges in full color with gold glow effect
- Recently unlocked highlighted with pulsing border
- Click to expand for details and unlock requirements
- Progress bars for multi-step achievements

**Dashboard Cards**
- Lecture history with score, XP, and date
- Weak topics with circular progress rings (red to yellow to green)
- Mastered topics list with checkmarks
- Personal records section with trophy icons
- Simulated leaderboard position ("Top 15% of students")

**Power-Ups Display**
- Icon-based inventory with count badges
- Inactive state when none available (greyscale)
- Active/usable state with sage color and soft glow
- Tooltip on hover showing power-up description

**Progress Visualizations**
- Animated sage gradient XP bar (smooth transitions)
- Circular progress rings for topic mastery
- Line chart showing score trends over time
- Skill tree with interconnected nodes for topics

### Animations
**Celebration Effects** (use sparingly, high impact moments only)
- Confetti burst on achievement unlock (canvas-based)
- Sparkle particles on level-up (full-screen overlay)
- Floating "+XP" text on correct answers (fade up and out)
- Shake animation on incorrect answers
- Smooth progress bar fills with easing
- Leaf float animation for nature theme elements
- Growth pulse for encouraging elements

**Transitions**
- Card hover: subtle scale (1.02) and shadow increase
- Button presses: quick scale down (0.98)
- View transitions: fade with 200ms duration
- Toast slide-in from right (300ms ease-out)

### Accessibility
- Semantic HTML5 elements throughout
- ARIA labels on all interactive elements
- Keyboard navigation with visible focus rings (ring-2 ring-primary)
- Icons paired with descriptive text
- High contrast ratios (WCAG AA compliant)
- Touch targets minimum 44x44px
- Screen reader announcements for XP gains and achievements

### Mobile Responsiveness
- Single column layouts on mobile
- Collapsible navigation drawer
- Touch-friendly button sizing (min 44px height)
- Swipe gestures for quiz navigation (optional)
- Responsive typography scaling
- Card stacking on narrow viewports

### Images
**No hero images required** - This is a productivity/learning tool focused on functionality over marketing visuals. Any imagery should be:
- Icon-based illustrations for empty states
- Achievement badge graphics (simple icons acceptable)
- Profile avatar placeholders (generated initials or nature-themed icons)

### Motivational UX
- Dynamic performance messages based on scores
- Immediate positive reinforcement (confetti, +XP animations)
- Progress milestones ("2 more reviews until Level 5!")
- Encouraging copy for struggling ("Growth happens outside comfort zones!")
- Visual celebration for streaks and perfect scores
