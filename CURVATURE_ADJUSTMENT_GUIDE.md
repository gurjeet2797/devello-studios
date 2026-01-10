# Curvature Adjustment Guide

## Quick Reference Table

| Side | Beam Position | Index | Code Location | Current Value | What to Change |
|------|---------------|-------|---------------|---------------|----------------|
| **Left** | Top | 0 | Line 443 | `40` | Change `40` in `index === 0 ? 40` |
| **Left** | Middle | 1 | Line 443 | `0` | Change `0` in `index === 1 ? 0` |
| **Left** | Bottom | 2 | Line 443 | `-40` | Change `-40` in `: -40` |
| **Right** | Top | 0 | Line 473 | `100` | Change `100` in `index === 0 ? 100` |
| **Right** | Middle | 1 | Line 473 | `0` | Change `0` in `index === 1 ? 0` |
| **Right** | Bottom | 2 | Line 473 | `-100` | Change `-100` in `: -100` |

---

## Code Locations

### Left Side (Clients → Logo)

**File:** `components/ClientVendorNetwork.js`  
**Line:** 443

```443:443:components/ClientVendorNetwork.js
            const curvature = index === 0 ? 40 : index === 1 ? 0 : -40
```

**How to adjust:**
- **Top beam (curves down)**: Change `40` → Higher = more curve down, Lower = less curve
- **Middle beam (straight)**: Change `0` → Keep at `0` for straight line
- **Bottom beam (curves up)**: Change `-40` → More negative = more curve up, Less negative = less curve

**Example changes:**
- More curve: `index === 0 ? 60 : index === 1 ? 0 : -60`
- Less curve: `index === 0 ? 20 : index === 1 ? 0 : -20`

---

### Right Side (Logo → Vendors)

**File:** `components/ClientVendorNetwork.js`  
**Line:** 473

```473:473:components/ClientVendorNetwork.js
            const curvature = index === 0 ? 100 : index === 1 ? 0 : -100
```

**How to adjust:**
- **Top beam (curves up)**: Change `100` → Higher = more curve up, Lower = less curve
- **Middle beam (straight)**: Change `0` → Keep at `0` for straight line
- **Bottom beam (curves down)**: Change `-100` → More negative = more curve down, Less negative = less curve

**Example changes:**
- More curve: `index === 0 ? 150 : index === 1 ? 0 : -150`
- Less curve: `index === 0 ? 50 : index === 1 ? 0 : -50`

---

## Curvature Value Guide

| Value | Effect | Visual Result |
|-------|--------|---------------|
| **Positive** (e.g., `40`, `100`) | Curves downward (for left) or upward (for right) | Beam arcs below/above the straight line |
| **Zero** (`0`) | Straight line | No curve, perfectly horizontal |
| **Negative** (e.g., `-40`, `-100`) | Curves upward (for left) or downward (for right) | Beam arcs above/below the straight line |

**Note:** The direction of the curve depends on which side:
- **Left side**: Positive = curves down, Negative = curves up
- **Right side**: Positive = curves up, Negative = curves down

---

## Quick Edit Instructions

1. **Open:** `components/ClientVendorNetwork.js`
2. **Find line 443** for left side curvature
3. **Find line 473** for right side curvature
4. **Edit the numbers** in the ternary operator
5. **Save** and see the changes

**Current Settings:**
- Left: `40` (top), `0` (middle), `-40` (bottom)
- Right: `100` (top), `0` (middle), `-100` (bottom)

