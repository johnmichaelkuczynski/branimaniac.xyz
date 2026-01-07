# WhatWouldJesusDo (WWJD) Design Guidelines

## Design Approach

**Reference-Based Approach** drawing inspiration from premium meditation apps (Calm, Headspace) for peaceful UI patterns, modern spiritual/ministry websites for sacred aesthetics, and ChatGPT/Claude for sophisticated chat interfaces. The design balances reverence with contemporary usability, creating a sanctuary-like digital space that feels both timeless and accessible.

**Core Principle**: Sacred Minimalism - Create a reverent, contemplative environment through restrained elegance rather than religious kitsch. Every element should serve spiritual connection without visual noise.

---

## Color Palette

### Light Mode
- **Primary Divine**: 210 45% 25% (Deep celestial blue - conveys wisdom, trust)
- **Primary Light**: 210 40% 92% (Soft sky blue - backgrounds, hover states)
- **Sacred Gold**: 45 65% 55% (Warm divine accent - sparingly for highlights, divine moments)
- **Neutral Text**: 220 15% 20% (Soft black for readability)
- **Neutral Background**: 210 20% 98% (Warm white, not stark)
- **Border Subtle**: 210 15% 88% (Gentle definition)

### Dark Mode
- **Primary Divine**: 210 50% 65% (Luminous celestial blue)
- **Dark Canvas**: 220 18% 12% (Deep midnight, not pure black)
- **Sacred Gold**: 45 55% 60% (Gentler gold for dark backgrounds)
- **Neutral Text**: 210 15% 92% (Soft white)
- **Surface Elevated**: 220 16% 18% (Chat bubbles, cards)
- **Border Subtle**: 220 12% 25% (Subtle definition)

**Color Strategy**: Use Divine Blue as primary throughout. Sacred Gold appears only for special moments (verse reveals, settings highlights). Avoid purple gradients - this is not a typical tech app.

---

## Typography

**Font Families** (via Google Fonts):
- **Display/Headings**: "Cormorant Garamond" - elegant serif that evokes scripture without being overtly biblical
- **Body/Chat**: "Inter" - clean, highly readable sans-serif for extended reading
- **Verse Citations**: "Crimson Text" - refined serif specifically for Bible verses

**Type Scale**:
- Hero/Page Title: text-5xl md:text-6xl font-light (Cormorant)
- Section Headers: text-2xl md:text-3xl font-normal (Cormorant)
- Chat Messages: text-base md:text-lg leading-relaxed (Inter)
- Bible Verses: text-sm md:text-base italic (Crimson Text)
- UI Labels: text-sm font-medium (Inter)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistent rhythm.

**Container Structure**:
- Full-width sections with inner max-w-7xl for expansive feel
- Chat container: max-w-4xl centered for optimal reading
- Settings panel: fixed width 320px overlay or sidebar
- Vertical padding: py-12 mobile, py-16 desktop for breathing room

**Grid System**:
- Settings controls: 2-column grid on desktop (label + control)
- No multi-column chat - single focused conversation flow

---

## Component Library

### Navigation
**Top Bar**: Subtle fixed header with logo, user profile icon, settings gear
- Height: h-16
- Background: backdrop-blur-md with subtle border-b
- Elements: Left-aligned "WWJD" wordmark, right-aligned icons
- No heavy navigation - this is a focused single-purpose app

### Chat Interface
**Message Bubbles**:
- User messages: Align right, Divine Blue background, white text, rounded-2xl rounded-br-sm
- AI responses: Align left, elevated surface color, text color, rounded-2xl rounded-bl-sm
- Streaming indicator: Subtle pulsing cursor during generation
- Padding: p-4 md:p-6 for generous touch targets

**Bible Verse Display**:
- Separate gentle card below AI response
- Italic Crimson Text
- Sacred Gold left border (border-l-4)
- Background: subtle tinted surface
- Format: Verse text above, citation below in smaller text

**Input Area**:
- Fixed bottom with backdrop-blur
- Large textarea, auto-growing
- Send button with gentle icon
- Placeholder: "What guidance do you seek today?"

### Settings Panel
**Overlay Modal** (preferred) or **Slide-in Sidebar**:
- Dark backdrop (backdrop-blur-sm + opacity-90)
- White/dark surface card
- Sections: Profile, Spiritual Voice, Persona Tuning, Goals

**Persona Controls**:
- Spiritual Voice: Radio cards with icons (Gentle, Tough, Scholar, Therapist, Plainspoken)
- Intelligence Slider: 1-10 with labeled markers "Simple" to "Theological"
- Emotional Tone Slider: 1-10 "Logical" to "Pastoral"
- Voice Gender: Toggle group (Masculine, Feminine, Neutral)
- Formality: Segmented control (Casual, Neutral, Biblical)

**Visual Treatment**:
- Sliders: Custom styled with Sacred Gold active track
- Radio cards: Hover lift effect, border highlight on selection
- Generous spacing between sections (space-y-8)

### Data Display
**Goals Section**:
- List of user's spiritual goals
- Add new goal inline input
- Each goal: Editable card with gentle delete icon
- Empty state: Encouraging prompt with illustration

**Conversation History** (if shown):
- Timeline view with date separators
- Preview of first message
- Click to load full conversation

---

## Background & Imagery

### Hero Background Image
**Description**: Ethereal photograph of heavenly clouds with soft sunlight breaking through (golden hour), subtle cross silhouette dissolving into clouds, or artistic rendering of outstretched hands in prayer position against luminous sky.

**Implementation**:
- Fixed background attachment
- Subtle overlay gradient (from transparent to 60% primary color)
- Blur effect (blur-sm) so it doesn't compete with content
- Opacity reduced (opacity-20 in light mode, opacity-10 in dark mode)
- Position: Full viewport behind entire app

**Placement**: Background layer behind all content, not a traditional hero section. The chat interface itself is the focus.

---

## Animations

**Streaming Text**: Characters/words appear sequentially with natural typing cadence (20-40ms delay), no flashy effects

**Verse Reveal**: Bible verse fades in with gentle slide-up (translate-y-2 to 0) after AI response completes

**Settings Panel**: Smooth slide-in from right (translate-x-full to 0, 300ms ease-out)

**Message Appearance**: Gentle fade-in + slight scale (scale-95 to 100) for new messages

**Avoid**: Particle effects, floating elements, excessive motion. Keep sacred and calm.

---

## Accessibility & Polish

- Dark mode maintains same reverent feel with warmer tones
- All interactive elements minimum 44px touch targets
- Focus states: Sacred Gold ring with offset
- Reduced motion support for animations
- High contrast maintained in both modes
- Screen reader labels for all icons and controls

---

## Sacred Design Details

- Subtle Sacred Gold glow on active input focus
- Gentle drop shadows (shadow-lg) never harsh
- Border radius consistently rounded-2xl for softness
- No sharp corners or aggressive angles
- Whitespace is generous - never cramped
- Loading states use peaceful pulse, not aggressive spinners

**Tone**: Reverent yet welcoming, wise yet approachable, sacred yet accessible to all faith levels.