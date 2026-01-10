# Layout Structure Visualization

## Current Organization of Build Button, Network, and Testimonials

```
┌─────────────────────────────────────────────────────────────────┐
│                         HERO SECTION                             │
│                      "Devello" Title                             │
│              "a platform for all your building..."                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK SECTION (Background)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  z-index: 0                                               │  │
│  │  marginTop: 0px                                           │  │
│  │  marginBottom: -200px (mobile) / -150px (desktop)         │  │
│  │  paddingTop: 0px                                          │  │
│  │  pointerEvents: 'none' (wrapper)                          │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │  ClientVendorNetwork Component                     │   │  │
│  │  │  - Scattered logos/icons                          │   │  │
│  │  │  - Exclusion radius around center (build button)  │   │  │
│  │  │  - pointerEvents: 'auto' (re-enabled)            │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (overlaps with negative margin)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUILD BUTTON                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  z-index: 10 (ON TOP)                                     │  │
│  │  marginTop: -350px (mobile) / -280px (desktop)            │  │
│  │  padding: py-4 md:py-6                                    │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │  [Build Button Component]                         │   │  │
│  │  │  "build anything"                                  │   │  │
│  │  │  - Centered horizontally                           │   │  │
│  │  │  - Positioned OVER network logos                  │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (spacing with marginTop)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TESTIMONIALS SECTION                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  z-index: 10                                              │  │
│  │  marginTop: 200px (mobile) / 150px (desktop)             │  │
│  │  paddingTop: pt-8 sm:pt-12                               │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │  "What do clients say about Devello?"              │   │  │
│  │  │  [Rotating testimonials text]                      │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              STUDIOS SECTION ("Creative Solutions")             │
│                      [Stack Cards]                              │
└─────────────────────────────────────────────────────────────────┘
```

## Z-Index Layers (Front to Back)

```
Layer 10 (Front):
  ├── Build Button (z-10)
  └── Testimonials Section (z-10)

Layer 0 (Back):
  └── Network Section (z-0) - Background layer
```

## Vertical Positioning Flow

```
Viewport Top
    │
    ├─ Hero Section (normal flow)
    │
    ├─ Network Section
    │  └─ Starts at: marginTop: 0px
    │  └─ Extends down with: marginBottom: -200px/-150px (negative = overlaps upward)
    │
    ├─ Build Button
    │  └─ Positioned at: marginTop: -350px/-280px (negative = moves UP)
    │  └─ Overlaps Network Section visually
    │
    ├─ Testimonials Section
    │  └─ Positioned at: marginTop: 200px/150px (positive = pushes DOWN)
    │  └─ Clear spacing below network/build button area
    │
    └─ Studios Section (normal flow)
```

## Visual Overlap Diagram

```
                    ┌─────────────────┐
                    │   Hero Section  │
                    └─────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │                                  │
        │    NETWORK SECTION (z-0)         │
        │    ┌────────────────────────┐    │
        │    │  Logos scattered       │    │
        │    │  around, avoiding      │    │
        │    │  center area           │    │
        │    └────────────────────────┘    │
        │                                  │
        │         ┌──────────┐             │
        │         │  BUILD   │  ← z-10     │
        │         │  BUTTON  │  (on top)   │
        │         └──────────┘             │
        │                                  │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │                                  │
        │  TESTIMONIALS SECTION (z-10)     │
        │  "What do clients say..."        │
        │                                  │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  STUDIOS SECTION                 │
        │  "Creative Solutions"             │
        └──────────────────────────────────┘
```

## Key Positioning Details

### Network Section
- **Purpose**: Background layer with scattered logos
- **Z-index**: 0 (behind everything)
- **Margin**: Negative bottom margin creates overlap upward
- **Pointer Events**: Disabled on wrapper, enabled on component (for logo clicks)

### Build Button
- **Purpose**: Primary CTA, positioned over network logos
- **Z-index**: 10 (in front)
- **Margin**: Large negative top margin (-350px/-280px) pulls it UP
- **Result**: Appears centered over the network section

### Testimonials Section
- **Purpose**: Client testimonials, positioned below network/build area
- **Z-index**: 10 (same level as build button)
- **Margin**: Positive top margin (200px/150px) pushes it DOWN
- **Result**: Clear spacing, no overlap with network section

## Summary

1. **Network Section** = Background layer (z-0) with logos scattered around
2. **Build Button** = Overlays network section (z-10) using negative margin to move up
3. **Testimonials** = Below network/build area (z-10) with positive margin for spacing

The negative margins create visual overlap while maintaining proper document flow.

