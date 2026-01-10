# Why Same Curvature Values Look Different

## The Problem

Even though both sides use the same curvature values (`40`, `0`, `-40`), they look different because:

1. **Curvature is absolute** - The value `40` means the control point is 40px above/below the start point
2. **Visual curve depends on distance** - A 40px curve over 200px looks different than 40px over 300px
3. **Different horizontal distances** - Left and right sides may have different distances from logo

## Current Code

**Left Side (Line 443):**
```javascript
const curvature = index === 0 ? 40 : index === 1 ? 0 : -40
```

**Right Side (Line 473):**
```javascript
const curvature = index === 0 ? 40 : index === 1 ? 0 : -40
```

## Why They Look Different

The curvature formula in `AnimatedBeam.js` (line 94):
```javascript
const controlY = adjustedStartY - curvature
```

This creates a quadratic Bezier curve where:
- The control point Y is `startY - curvature`
- The visual "steepness" depends on: **curvature / horizontal_distance**

**Example:**
- Left beam: 200px wide, curvature 40 → 40/200 = 20% curve
- Right beam: 300px wide, curvature 40 → 40/300 = 13.3% curve
- **Result:** Left looks more curved!

## Solutions

### Option 1: Scale Curvature by Distance (Recommended)

You'd need to calculate the distance and scale proportionally, but this requires modifying `AnimatedBeam.js`.

### Option 2: Adjust Values Manually

If right side is longer, increase its curvature values:
- If right is 1.5x longer, use 1.5x curvature: `60` instead of `40`
- If right is 2x longer, use 2x curvature: `80` instead of `40`

### Option 3: Ensure Equal Distances

Make sure the horizontal spacing is identical on both sides.

## Quick Fix

If right side beams look less curved, try increasing the values:

**Right Side (Line 473) - More Curve:**
```javascript
const curvature = index === 0 ? 60 : index === 1 ? 0 : -60  // Increased from 40
```

Or if right side looks more curved, decrease:
```javascript
const curvature = index === 0 ? 30 : index === 1 ? 0 : -30  // Decreased from 40
```

## Visual Comparison

| Side | Distance | Curvature | Visual Curve % | Looks Like |
|------|----------|-----------|----------------|------------|
| Left | 200px | 40 | 20% | More curved |
| Right | 300px | 40 | 13.3% | Less curved |
| Right | 300px | 60 | 20% | Same as left |

**To match left side visually, right side needs: `60` instead of `40`**

