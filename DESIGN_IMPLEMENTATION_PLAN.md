# Moose Knuckle Golf League: Design Implementation Plan

**Date Created:** March 7, 2026
**Project:** Incremental UI/UX improvements
**Target Timeline:** 4 weeks
**Implementation Pattern:** Phase-based (design system → mobile → unification → polish)

---

## Executive Summary

This plan addresses the three critical design gaps identified in the current application:

1. **No consistent visual design system** — Colors, typography, spacing, and components vary across pages
2. **Poor mobile experience for on-course members** — Members can't quickly access score entry and round status
3. **Visual/UX fragmentation between member and admin sections** — Users experience a jarring visual shift

The plan prioritizes incremental changes that improve usability without requiring a full redesign.

---

## Phase 1: Design System Definition (Week 1)

### 1.1 Color Palette

Create `src/lib/colors.ts` with CSS variables and Tailwind theme extensions.

**Color Definitions:**

```
PRIMARY:        #1B4D2E (Forest Green)  — Primary actions, headers
SECONDARY:      #2B8A8A (Teal)          — Member actions, accents
SUCCESS:        #16A34A (Green)         — Positive states, scores
WARNING:        #EAB308 (Amber)         — Alerts, warnings
DANGER:         #DC2626 (Red)           — Errors, negatives
NEUTRAL_50:     #F5F1E8 (Cream)         — Backgrounds, light surfaces
NEUTRAL_100:    #F3F4F6 (Light Gray)    — Cards, dividers
NEUTRAL_400:    #9CA3AF (Medium Gray)   — Secondary text
NEUTRAL_700:    #374151 (Dark Gray)     — Body text
NEUTRAL_900:    #111827 (Near Black)    — Headings, emphasis
```

**Tailwind Configuration:**
- Extend `tailwind.config.ts` with custom color palette
- Update all existing color usage to reference new palette
- Document color usage: when to use PRIMARY vs SECONDARY vs SUCCESS

**Deliverable:**
- `src/lib/colors.ts` with color constants
- Updated `tailwind.config.ts`
- `DESIGN_TOKENS.md` with usage guidelines

---

### 1.2 Font Implementation

**Font:** Inter (free from Google Fonts)

**Implementation:**

1. Update `src/app/layout.tsx`:
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

2. Update `tailwind.config.ts`:
```ts
export default {
  theme: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    },
  },
};
```

3. Done — Next.js handles optimization automatically (self-hosted, no external requests)

**Benefits:**
- Optimized for screens (not print)
- Excellent readability at 14-18px, especially on mobile
- Professional + approachable tone
- Performance: ~15KB, single load

---

### 1.3 Typography System

**Scale:**

```
H1:  32px, 700 weight, line-height 1.2  (page headings)
H2:  24px, 700 weight, line-height 1.3  (section headings)
H3:  18px, 600 weight, line-height 1.4  (subsection headings)
H4:  16px, 600 weight, line-height 1.4  (card titles)
Body: 16px, 400 weight, line-height 1.5 (default text)
Small: 14px, 400 weight, line-height 1.5 (labels, secondary text)
Caption: 12px, 400 weight, line-height 1.4 (hints, badges)
```

**Implementation:**
- Create Tailwind text utility classes: `text-h1`, `text-h2`, `text-body`, etc.
- Audit all existing `<h1>`, `<h2>`, `<p>` elements and apply consistent sizing
- Create typography component showcase (optional Storybook or docs page)

**Deliverable:**
- Typography classes in Tailwind
- Consistent heading styles across all pages
- Document in `DESIGN_TOKENS.md`

---

### 1.4 Spacing & Layout Grid

**8px Base Unit Grid:**

```
xs:  8px   (4 grid units)
sm:  16px  (2 grid units)
md:  24px  (3 grid units)
lg:  32px  (4 grid units)
xl:  48px  (6 grid units)
```

**Application:**
- Section margins: `mb-lg` (32px)
- Card padding: `p-md` (24px)
- Element spacing: `gap-sm` (16px)
- Top/bottom margins between major sections: `my-lg`

**Audit & Update:**
- Review all existing margin/padding values
- Replace hardcoded pixel values with spacing tokens
- Ensure consistency in card, button, and input spacing

**Deliverable:**
- Spacing utility classes (already available via Tailwind, just document)
- Style guide showing examples of spacing application

---

### 1.5 Button Component System

**Button Variants:**

```
Primary:     Background PRIMARY (#1B4D2E), white text, applies to main actions
Secondary:   Background SECONDARY (#2B8A8A), white text, info/secondary actions
Success:     Background SUCCESS (#16A34A), white text, scoring/confirmation
Danger:      Background DANGER (#DC2626), white text, destructive actions
Ghost:       Border NEUTRAL_400, text NEUTRAL_900, light background
```

**Button States:**

```
Default:   Full opacity, pointer cursor
Hover:     5% darker background, subtle shadow
Active:    10% darker background
Disabled:  50% opacity, cursor not-allowed
Loading:   Spinner icon, text hidden or "Loading..."
```

**Sizing:**
```
Small:   8px vertical × 12px horizontal padding, 14px font
Default: 12px vertical × 16px horizontal padding, 16px font
Large:   16px vertical × 24px horizontal padding, 16px font
Icon:    40px × 40px min (touch target), centered icon
```

**Implementation Steps:**
1. Create `src/components/Button.tsx` with variant prop
2. Replace all existing `<button>` elements to use Button component
3. Update colors:
   - "Enter My Score" → Primary (green)
   - "Declare Golfers" → Secondary (teal)
   - "Declare Availability" → Secondary (teal)
   - "Enter Scores" → Primary (green)
   - "Logout" → Ghost (light)

**Deliverable:**
- Button component with all variants/states
- Replace 30+ button instances across codebase
- Button style guide

---

### 1.6 Card Component Standardization

**Card Structure:**

```
Padding:    24px (md spacing)
Border:     1px solid NEUTRAL_100
Border-radius: 8px
Shadow:     Optional subtle shadow (0 1px 3px rgba(0,0,0,0.1))
Background: NEUTRAL_50 or white
```

**Card Variants:**

```
Default:    Base styling, white background
Elevated:   Subtle shadow for emphasis
Bordered:   Stronger border (2px), no shadow
Transparent: No border, no shadow, cream background
```

**Round Card Example:**

```tsx
<Card className="mb-md">
  <div className="flex justify-between items-start mb-sm">
    <div>
      <h4 className="text-h4 mb-xs">Round 2</h4>
      <p className="text-small">Thursday, May 7, 2026</p>
    </div>
    <Badge status="in_progress">Playing</Badge>
  </div>
  {/* Card content */}
</Card>
```

**Implementation:**
- Create `src/components/Card.tsx`
- Replace all div-based cards with Card component
- Update border/padding/spacing across ~20 card instances

**Deliverable:**
- Card component with variants
- Consistent card styling on Dashboard, Availability, Admin pages

---

## Phase 2: Mobile-First Dashboard Redesign (Week 2)

### 2.1 Mobile Navigation & Action Bar

**New Navigation Pattern:**

**Desktop (>768px):**
- Keep existing horizontal navigation at top
- Logo + brand text on left
- Nav links + Logout on right
- No changes to current layout

**Mobile (<768px):**
- Logo only (remove text to save space)
- Hamburger menu (☰) on right
- Drawer menu slides from left with all nav links
- New sticky action bar at bottom with 3 quick actions

**Bottom Action Bar (Mobile Only):**

```
+--------+--------+--------+
| Score  | Status | More ⋯ |
+--------+--------+--------+
(each button is 33% width, 16px padding, 48px min height)
```

Actions:
- **Score:** Jump to current round scoring
- **Status:** Show round availability status
- **More:** Dropdown menu (Dashboard, Help, Settings)

**Implementation:**
- Create `src/components/MobileNav.tsx` with hamburger/drawer
- Create `src/components/ActionBar.tsx` for bottom sticky bar
- Update Layout component to conditionally show nav based on breakpoint
- Add `useMediaQuery` hook to detect mobile

**Files to Update:**
- `src/components/Layout.tsx` (main layout wrapper)
- `src/app/layout.tsx` (root layout)
- Create new mobile nav components

**Deliverable:**
- Responsive navigation (hamburger on mobile)
- Sticky action bar on mobile devices
- Test at 375px, 768px, 1024px breakpoints

---

### 2.2 Dashboard Redesign (Member View)

**Current Structure Problem:**
- Welcome section at top (not actionable)
- "Upcoming Rounds" below (important content, visual parity with greeting)
- Scrolling required to see actionable rounds

**New Mobile-First Structure:**

**Desktop (>1024px):**
```
┌─────────────────────────────┐
│ Welcome, Skinny!            │ (compact, 60px height)
├─────────────────────────────┤
│ 📌 ACTIVE ROUND             │ (current round card, prominent)
│    Round 2 — May 7, 2026    │
│    [Enter My Score] [Team]  │
├─────────────────────────────┤
│ UPCOMING ROUNDS             │ (below active)
│ [Round 1] [Round 3]         │
├─────────────────────────────┤
│ PAST ROUNDS                 │ (collapsed section)
└─────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────┐
│ Welcome, Skinny! ✏️  │ (name only, no email)
├──────────────────────┤
│ 📌 ROUND 2 IN PLAY   │ (visual status badge)
│ Thu, May 7           │
│ Holes: 1-4 · +2     │ (quick info)
│ [Enter Score] [Help] │ (large touch targets)
├──────────────────────┤
│ UPCOMING (2 more)    │ (collapsed, expandable)
│ > Round 1, Apr 30    │
│ > Round 3, May 14    │
├──────────────────────┤
│ PAST (1)             │ (collapsed)
│ > Round 0, Apr 9     │
└──────────────────────┘
(sticky action bar below)
```

**Implementation Steps:**

1. **Redesign Welcome Section:**
   - Remove email display
   - Reduce height: 60px instead of current 100px+
   - Keep name, remove detailed greeting text
   - Add pencil icon (edit profile) for future

2. **Create Active Round Component:**
   - Display current round prominently (top of list)
   - Show status badge: "In Progress," "Scoring," "Playing"
   - Quick info: date, holes completed, current score
   - Two primary CTA buttons: large and touch-friendly

3. **Collapsible Sections:**
   - Group rounds by status (active, upcoming, past)
   - Collapse past/upcoming by default on mobile
   - Expand on click with smooth animation

4. **Responsive Card Sizing:**
   - Desktop: 3 rounds per row in grid
   - Tablet: 2 per row
   - Mobile: 1 per row, full width

**Files to Update:**
- `src/app/(authenticated)/dashboard/page.tsx` (refactor layout)
- Create `src/components/dashboard/ActiveRound.tsx`
- Create `src/components/dashboard/RoundSection.tsx`
- Update `src/components/Card.tsx` for round cards

**CSS Grid Changes:**
- Current: inconsistent spacing
- New: Use grid with `gap-md`, consistent 24px margins

**Deliverable:**
- Mobile-optimized dashboard with active round at top
- Collapsible sections (upcoming/past)
- Sticky action bar on mobile
- Touch-friendly buttons (48px min height)

---

### 2.3 Availability Declaration Redesign

**Current Issues:**
- Buttons small and hard to tap on phone
- Team member status unclear
- Too much vertical space for content

**New Design:**

**Mobile View:**
```
┌────────────────────────┐
│ Round 3 Availability   │
│ Thu, May 14            │
├────────────────────────┤
│ ⏰ Deadline: Mon, May 11│
│    at 6:00 PM          │ (time-sensitive, prominent)
├────────────────────────┤
│ YOUR TEAM              │
│ Team 1 — Max / Skinny  │
├────────────────────────┤
│ YOUR DECISION          │
│ ┌──────────────────┐   │
│ │ ✓ I'm In         │   │
│ └──────────────────┘   │
│ ┌──────────────────┐   │
│ │ ✗ I'm Out        │   │
│ └──────────────────┘   │
│ (each button 50% width)│
├────────────────────────┤
│ TEAMMATE STATUS        │
│ Max Dupont             │
│ [? Undeclared]         │
├────────────────────────┤
│ NOTES                  │
│ • Only one member...   │
│ • Please declare...    │
│ • If both out...       │
└────────────────────────┘
```

**Changes:**
1. Deadline banner stays (good UX)
2. Buttons full width instead of side-by-side
3. Buttons: 60px height, larger text (18px)
4. Team member status → expandable for more info
5. Notes section → stays in info box

**Files to Update:**
- `src/app/(authenticated)/availability/[roundId]/page.tsx`
- Update button sizing to `large` variant
- Add responsive grid (stacked on mobile, side-by-side on desktop)

**Deliverable:**
- Full-width buttons on mobile
- Clear teammate status (add help text on hover)
- Responsive layout (stack on mobile, 2-col on desktop)

---

## Phase 3: Unify Admin & Member Visual Design (Week 3)

### 3.1 Admin Header Redesign

**Current:**
- Green header with white text
- Different from member pages (beige/white background)
- Creates visual discontinuity

**New Approach:**

**Header (consistent across both):**
```
┌──────────────────────────────────────┐
│ [Logo] Moose Knuckle Golf [Admin]    │
│                    [Public View] [Logout]
└──────────────────────────────────────┘
```

**Implementation:**
- Use same header component for both admin and member sections
- Add "Admin" badge/label next to logo on admin pages
- Background: use PRIMARY color (#1B4D2E) consistently
- Text: white

**Files to Update:**
- `src/components/Header.tsx` (create if doesn't exist)
- `src/app/(admin)/layout.tsx`
- `src/app/(authenticated)/layout.tsx`

---

### 3.2 Admin Sidebar Consistency

**Current:** Good structure (emoji + text)

**Updates:**
1. Keep emoji icons (they work)
2. Add hover state: 5% darker background
3. Active state: darker background + left border accent
4. Responsive: collapse to icons on small screens

**Sidebar Code Updates:**
```tsx
// Before:
<link href="/admin/teams">⛳ Teams</link>

// After:
<NavLink
  href="/admin/teams"
  active={isActive}
  icon="⛳"
  label="Teams"
/>
```

**Files to Update:**
- `src/components/AdminSidebar.tsx` (refactor)
- Add hover/active states with CSS

---

### 3.3 Color Application Across Admin

**Current:** Green header, but inconsistent button colors

**New Application:**
- Primary buttons (create, save) → PRIMARY (#1B4D2E)
- Secondary buttons (cancel, back) → Ghost
- Danger actions (delete) → DANGER (#DC2626)
- Info actions (view, expand) → SECONDARY (#2B8A8A)

**Files to Update:**
- `src/app/(admin)/teams/page.tsx`
- `src/app/(admin)/rounds/page.tsx`
- `src/app/(admin)/users/page.tsx`
- `src/app/(admin)/subs/page.tsx`
- All admin action buttons

---

## Phase 4: Responsive Design & Polish (Week 4)

### 4.1 Breakpoint Testing & Responsive Updates

**Target Breakpoints:**

| Breakpoint | Use Case | Width |
|-----------|----------|-------|
| Mobile | Small phones | 375px |
| Tablet | iPad, larger phones | 768px |
| Desktop | Standard monitors | 1024px |
| Wide | Large monitors | 1440px |

**Testing Checklist:**

- [ ] Navigation works at 375px (hamburger visible)
- [ ] Buttons full-width on mobile, side-by-side on desktop
- [ ] Tables don't overflow on mobile (scroll or collapse)
- [ ] Images responsive (scale appropriately)
- [ ] Form inputs large enough to tap (48px min)
- [ ] Text readable without zoom on mobile (16px min)
- [ ] No horizontal scrolling on mobile

**Update Plan:**
1. Create viewport test suite (or test manually in Chrome DevTools)
2. Add responsive Tailwind classes: `md:`, `lg:`, `xl:`
3. Update grid layouts to use `flex` or `grid` with responsive cols
4. Test on actual devices (iOS Safari, Android Chrome)

**Example Pattern:**

```tsx
// Current: fixed width
<div className="flex gap-4">

// Updated: responsive
<div className="flex flex-col md:flex-row gap-4">
  <button className="w-full md:w-auto">Button 1</button>
  <button className="w-full md:w-auto">Button 2</button>
</div>
```

**Files Needing Review:**
- All layout files for responsive classes
- Tables/data grids (may need horizontal scroll on mobile)
- Forms (ensure inputs are full-width on mobile)

---

### 4.2 Component Polish

**Loading States:**
- Add loading spinners to all async actions
- Disable buttons while loading
- Show "Loading..." text or spinner icon

**Error States:**
- Standardize error message styling (DANGER color, icon)
- Use error toast/banner at top of page or inline

**Empty States:**
- Add illustrations or icons for empty scorecard, empty rounds
- Show helpful next steps

**Accessibility Polish:**
- Add ARIA labels to buttons without text
- Ensure color contrast passes WCAG AA
- Test with screen reader (optional, but recommended)

---

### 4.3 Finalization

**Audit Checklist:**
- [ ] All buttons use Button component with correct variant
- [ ] All cards use Card component with consistent spacing
- [ ] All text uses typography scale (h1-h4, body, small, caption)
- [ ] Spacing uses 8px grid (no random pixel values)
- [ ] Colors use palette (no hex values hardcoded)
- [ ] Mobile navigation works (hamburger menu)
- [ ] Sticky action bar visible on mobile
- [ ] All states tested (loading, error, empty, success)
- [ ] Responsive tested at 375px, 768px, 1024px

**Documentation:**
- Create `DESIGN_SYSTEM.md` with:
  - Color palette
  - Typography scale
  - Spacing grid
  - Component patterns (Button, Card, etc.)
  - Breakpoint strategy
  - Accessibility notes

---

## Implementation Order (Suggested)

### Week 1: Design System
1. Define colors, update Tailwind config
2. Standardize typography
3. Create Button component, replace 30+ instances
4. Create Card component, replace cards

### Week 2: Mobile Dashboard
1. Build responsive navigation (hamburger + action bar)
2. Redesign dashboard (active round at top, collapsible sections)
3. Update availability flow (full-width buttons)

### Week 3: Admin Unification
1. Update admin header to match member header
2. Refactor admin sidebar (hover/active states)
3. Apply color system to all admin buttons/actions

### Week 4: Polish & Testing
1. Test responsive design at all breakpoints
2. Add loading/error states
3. Accessibility review
4. Document design system

---

## File Structure Reference

```
src/
├── components/
│   ├── Button.tsx (NEW)
│   ├── Card.tsx (NEW)
│   ├── Header.tsx (UPDATE/CREATE)
│   ├── AdminSidebar.tsx (REFACTOR)
│   ├── MobileNav.tsx (NEW)
│   ├── ActionBar.tsx (NEW)
│   ├── dashboard/
│   │   ├── ActiveRound.tsx (NEW)
│   │   └── RoundSection.tsx (NEW)
│   └── ... (existing components)
├── lib/
│   ├── colors.ts (NEW)
│   └── ... (existing utilities)
├── app/
│   ├── (authenticated)/
│   │   └── dashboard/page.tsx (REFACTOR)
│   ├── (authenticated)/availability/[roundId]/page.tsx (UPDATE)
│   ├── (admin)/layout.tsx (UPDATE)
│   └── layout.tsx (UPDATE)
└── ...

docs/
├── DESIGN_TOKENS.md (NEW)
└── DESIGN_SYSTEM.md (NEW - Week 4)
```

---

## Success Metrics

After completing this plan, the app should:

1. **Visual Consistency** — All buttons, spacing, colors follow a unified system
2. **Mobile Usability** — Members on phones can enter scores in <3 taps
3. **Clear Navigation** — No confusion between member and admin sections (visual continuity)
4. **Responsive Design** — Works smoothly at 375px, 768px, and 1024px
5. **Brand Identity** — Forest green color system, clear typography, recognizable UI

---

## Notes for Claude Code Implementation

When implementing with Claude Code:

1. **Start with Phase 1** — Design system foundation makes all future work easier
2. **Use Tailwind utilities** — Leverage existing Tailwind classes for spacing/colors
3. **Component-based approach** — Create reusable components (Button, Card) before refactoring
4. **Test responsiveness early** — Add mobile viewport testing to your workflow
5. **Update incrementally** — Replace one page at a time, test thoroughly
6. **Reference this doc** — Keep it open while coding for consistency

---

## Questions for Clarification

Before starting implementation:

- [ ] Confirm color palette (or provide preferred colors)
- [ ] Confirm font family (keep system or upgrade to Inter/Open Sans?)
- [ ] Confirm action bar icons (use emojis or custom icons?)
- [ ] Priority: mobile first or desktop refinement first?
- [ ] Any existing component library or patterns to preserve?

---

**Next Steps:** Share this doc with Claude Code and begin Phase 1 implementation.
