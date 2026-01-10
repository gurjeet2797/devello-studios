# Why Setting Curvature to 0 Doesn't Make Straight Lines

## The Problem

When you set `curvature = 0`, the beams don't become straight - they appear inverted or curved. Here's why:

## Current Formula (Line 94 in AnimatedBeam.js)

```javascript
const controlY = adjustedStartY - curvature
```

## What Happens with Different Curvature Values

| Curvature | Formula | Control Point Y | Result |
|-----------|---------|-----------------|--------|
| `40` | `startY - 40` | 40px above start | Curves down |
| `0` | `startY - 0` | Same as start Y | **NOT straight!** |
| `-40` | `startY + 40` | 40px below start | Curves up |

## Why Curvature = 0 Doesn't Work

For a **quadratic Bezier curve to be straight**, the control point must be at the **midpoint** between start and end Y positions:

```
controlY = (startY + endY) / 2  // Correct for straight line
```

But the current formula uses:
```
controlY = startY - curvature  // Uses startY as base
```

**When curvature = 0:**
- `controlY = startY` (control point at start Y)
- If `startY ≠ endY` (which is true - top/middle/bottom logos are at different heights)
- The control point is NOT at the midpoint
- **Result:** Creates a curve, not a straight line!

## Visual Example

**Top beam (startY = 100, endY = 200):**
- With curvature = 0: `controlY = 100` (at start)
- Should be: `controlY = 150` (midpoint) for straight line
- **Result:** Curves because control point is too high

**Bottom beam (startY = 300, endY = 200):**
- With curvature = 0: `controlY = 300` (at start)
- Should be: `controlY = 250` (midpoint) for straight line
- **Result:** Curves because control point is too low

## The Fix

To make beams truly straight, the formula should be:

```javascript
const controlY = (adjustedStartY + adjustedEndY) / 2 - curvature
```

This way:
- When curvature = 0: Control point is at midpoint → **straight line**
- When curvature > 0: Curves in one direction
- When curvature < 0: Curves in opposite direction

## Current Workaround

Since the formula uses `startY - curvature`, you need to calculate the offset from startY to the midpoint:

```javascript
// For straight line, you'd need:
const midY = (adjustedStartY + adjustedEndY) / 2
const curvature = adjustedStartY - midY  // This makes it straight
```

But this varies per beam (different start/end Y positions), so you can't use a single value.

## Solution

The AnimatedBeam component needs to be fixed to use the midpoint formula, OR you need to calculate curvature values that account for the Y difference between start and end points.

