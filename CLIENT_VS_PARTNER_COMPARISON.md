# Client Side vs Partner Side Implementation Comparison

## AnimatedBeam Configuration

| Property | Client Side (Left) | Partner Side (Right) | Code Location | Controls |
|----------|-------------------|---------------------|--------------|----------|
| **fromRef** | `clientRefs[index]` | `logoRef` | Lines 444, 465 | Starting point of line |
| **toRef** | `logoRef` | `vendorRefs[index]` | Lines 445, 466 | Ending point of line |
| **curvature** | `-15` (mobile) / `-40` (desktop) | `-15` (mobile) / `-40` (desktop) | Lines 446, 467 | **Line curve height** - negative = upward curve |
| **reverse** | `false` | `true` | Lines 447, 468 | **Gradient direction** - true = right-to-left animation |
| **pathColor** | `rgba(255,255,255,0.3)` / `rgba(0,0,0,0.15)` | Same | Lines 448, 469 | Base line color |
| **pathWidth** | `0.8` (mobile) / `1.5` (desktop) | Same | Lines 449, 470 | **Line thickness** |
| **pathOpacity** | `0.4` (dark) / `0.2` (light) | Same | Lines 450, 471 | Line opacity |
| **gradientStartColor** | `#3b82f6` (blue) | `#f59e0b` (orange) | Lines 451, 472 | **Gradient start color** |
| **gradientStopColor** | `#8b5cf6` (purple) | `#ef4444` (red) | Lines 452, 473 | **Gradient end color** |
| **delay** | `index * 0.2` | `index * 0.2` | Lines 453, 474 | Animation delay |
| **duration** | `3 + index * 0.5` | `3 + index * 0.5` | Lines 454, 475 | Animation duration |
| **startXOffset** | `0` | `0` | Lines 455, 476 | **Horizontal offset from start element edge** |
| **endXOffset** | `0` | `2` (mobile) / `4` (desktop) | Lines 456, 477 | **Horizontal offset from end element edge** - pushes line right on partner side |

## Element Positioning

| Property | Client Side | Partner Side | Code Location | Effect |
|----------|-------------|-------------|--------------|--------|
| **Container Gap** | `gap-6 sm:gap-7 md:gap-8` | `gap-6 sm:gap-7 md:gap-8` | Lines 196, 329 | **Vertical spacing between elements** |
| **Position Variations** | `mdX: 12, -8, -20`<br>`mdY: 0, 4, 8` | `mdX: 8, 16, 28`<br>`mdY: 0, -4, 8` | Lines 203-207, 354-358 | **Desktop X/Y offsets** - client moves left, partner moves right |
| **Initial X** | `-20` | `20` | Lines 214, 365 | Initial animation position |
| **Mobile X** | `8` (first) / `0` (others) | `0` (all) | Lines 217, 368 | Mobile positioning |
| **Alignment** | `['text-left', 'text-center', 'text-right']` | `['text-right', 'text-center', 'text-left']` | Lines 199, 350 | **Text alignment order** - reversed |

## Element Sizes

| Element Type | Client Side | Partner Side | Code Location | Notes |
|--------------|-------------|-------------|--------------|-------|
| **Icon Size** | `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8` | `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8` | Lines 251, 381 | Small icons (Sarah, Michael, David) |
| **Logo Size** | `w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16` | `w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16` | Lines 234, 403 | Large logos (JSEP, Piros, S&N) |
| **Padding** | `p-0.5 sm:p-0.5 md:p-1` | `p-0.5 sm:p-0.5 md:p-1` | Lines 221, 372 | Element padding |

## Container Settings

| Property | Value | Code Location | Controls |
|----------|-------|--------------|----------|
| **Max Width** | `max-w-5xl` (1024px) | Line 190 | **Overall component width** |
| **Horizontal Padding** | `px-4 sm:px-6 md:px-8` | Line 190 | **Side spacing** |
| **Gap Between Sections** | `gap-4 sm:gap-6 md:gap-8` | Line 193 | **Horizontal gap** between left/center/right columns |

## Key Differences Summary

### Line Length & Position
- **Line length** is determined by: `curvature`, `startXOffset`, `endXOffset`, and the distance between `fromRef` and `toRef` elements
- **Client side**: Lines connect directly (`endXOffset: 0`) - lines touch logo edge
- **Partner side**: Lines pushed right (`endXOffset: 2-4px`) - creates gap to prevent overlap

### Line Curvature
- Both use same `curvature` values, but **reverse** prop changes gradient animation direction
- Negative curvature = upward curve (lines arch up)

### Element Positioning
- **Client side**: Elements positioned left of center (`mdX: 12, -8, -20`)
- **Partner side**: Elements positioned right of center (`mdX: 8, 16, 28`)
- This creates visual balance and prevents crowding

### Buffer Calculation (AnimatedBeam.js)
- **Adaptive buffer**: `baseBuffer * (1 + sizeFactor * 0.3)`
- Larger elements (logos) get proportionally larger buffers
- Prevents line overlap with element edges
- Code: Lines 67-73 in `AnimatedBeam.js`

