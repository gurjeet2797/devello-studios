# Glassmorphism Button Styling Guide

## CSS Custom Properties (Variables)

| Property | Current Value (Light) | Current Value (Dark) | What It Does | Effect of Changing |
|----------|----------------------|---------------------|--------------|-------------------|
| `--c-glass` | `#bbbbbc` | `#bbbbbc` | Base glass tint color | **Lighter** = more transparent/white tint<br>**Darker** = more gray/opaque tint<br>**Color change** = shifts the overall glass hue |
| `--c-light` | `#fff` | `#fff` | Light reflection/highlight color | **White** = bright highlights<br>**Off-white** = softer highlights<br>**Colored** = tinted highlights |
| `--c-dark` | `#000` | `#000` | Dark shadow color | **Black** = deep shadows<br>**Gray** = softer shadows<br>**Colored** = tinted shadows |
| `--c-content` | `#224` | `#e1e1e1` | Text content color (reference) | Used for text color calculations (actual text color set via Tailwind classes) |
| `--c-action` | `#0052f5` | `#03d5ff` | Accent/action color | Available for hover states or special accents |
| `--c-bg` | `#e8e8e9` | `#1b1b1d` | Background context color | Reference for background calculations |
| `--glass-reflex-dark` | `1` | `2` | Dark shadow intensity multiplier | **Higher** = deeper, more pronounced shadows (more depth)<br>**Lower** = softer, subtler shadows (less depth)<br>**0** = no dark shadows |
| `--glass-reflex-light` | `1` | `0.3` | Light highlight intensity multiplier | **Higher** = brighter, more visible highlights (more shine)<br>**Lower** = dimmer highlights (less shine)<br>**0** = no light highlights |
| `--saturation` | `150%` | `150%` | Backdrop filter color saturation | **Higher** (200%+) = more vibrant, colorful blur<br>**Lower** (100%) = more muted, desaturated blur<br>**0%** = grayscale blur |

## Direct CSS Properties

| Property | Current Value | What It Does | Effect of Changing |
|----------|--------------|--------------|-------------------|
| `background-color` | `color-mix(in srgb, var(--c-glass) 12%, transparent)` | Glass base opacity | **Higher %** (20-30%) = more opaque, less transparent<br>**Lower %** (5-8%) = more transparent, more see-through<br>**0%** = fully transparent |
| `backdrop-filter` | `blur(8px) saturate(var(--saturation))` | Blur and saturation of background behind button | **Higher blur** (12-16px) = more blurred background, stronger glass effect<br>**Lower blur** (4-6px) = less blurred, clearer background<br>**Remove saturate** = no color enhancement |
| `-webkit-backdrop-filter` | `blur(8px) saturate(var(--saturation))` | Safari/WebKit version of backdrop-filter | Same as above, needed for Safari compatibility |
| `box-shadow` | Multiple inset shadows | Creates depth, highlights, and shadows | **More shadows** = more complex depth<br>**Larger values** = more pronounced effects<br>**Fewer shadows** = simpler, flatter look |
| `transition` | `400ms cubic-bezier(1, 0, 0.4, 1)` | Animation speed and easing | **Faster** (200ms) = snappier transitions<br>**Slower** (600ms) = smoother, more gradual<br>**Different easing** = different animation feel |
| `font-family` | `"DM Sans", sans-serif` | Button text font | Change to any font family |
| `font-optical-sizing` | `auto` | Font optical sizing | `auto` = automatic, `none` = disabled |

## Box Shadow Breakdown

The `box-shadow` property uses multiple shadows to create the glass effect. Here's what each shadow does:

| Shadow Layer | Purpose | Effect of Changing |
|-------------|---------|-------------------|
| `inset 0 0 0 1px ...` | Thin border highlight | **Thicker** (2px) = more visible border<br>**Thinner** (0.5px) = subtler border |
| `inset 1.8px 3px 0px -2px ...` | Top-left highlight | **Larger offset** = more pronounced highlight<br>**Smaller offset** = subtler highlight |
| `inset -2px -2px 0px -2px ...` | Bottom-right highlight | Creates bottom-right shine effect |
| `inset -3px -8px 1px -6px ...` | Deep bottom-right highlight | Adds depth to bottom-right corner |
| `inset -0.3px -1px 4px 0px ...` | Top shadow | Creates subtle top edge shadow |
| `inset -1.5px 2.5px 0px -2px ...` | Side shadow | Adds depth to sides |
| `inset 0px 3px 4px -2px ...` | Bottom shadow | Creates bottom depth |
| `inset 2px -6.5px 1px -4px ...` | Corner shadow | Adds corner depth |
| `0px 1px 5px 0px ...` | Outer shadow (subtle) | Creates slight elevation |
| `0px 6px 16px 0px ...` | Outer shadow (main) | Creates main elevation/depth |

## Quick Tweaking Guide

### Make Glass More Transparent
```css
.about-devello-glass {
  background-color: color-mix(in srgb, var(--c-glass) 8%, transparent);
}
```

### Make Glass More Opaque
```css
.about-devello-glass {
  background-color: color-mix(in srgb, var(--c-glass) 20%, transparent);
}
```

### Increase Blur (Stronger Glass Effect)
```css
.about-devello-glass {
  backdrop-filter: blur(12px) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(12px) saturate(var(--saturation));
}
```

### Decrease Blur (Clearer Background)
```css
.about-devello-glass {
  backdrop-filter: blur(4px) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(4px) saturate(var(--saturation));
}
```

### More Depth/Shadows
```css
.about-devello-glass {
  --glass-reflex-dark: 2;
  --glass-reflex-light: 1.5;
}
```

### Less Depth/Flatter
```css
.about-devello-glass {
  --glass-reflex-dark: 0.5;
  --glass-reflex-light: 0.5;
}
```

### More Vibrant Colors
```css
.about-devello-glass {
  --saturation: 200%;
}
```

### More Muted/Desaturated
```css
.about-devello-glass {
  --saturation: 100%;
}
```

### Change Glass Tint Color
```css
.about-devello-glass {
  --c-glass: #a0a0a0; /* Lighter gray */
  /* or */
  --c-glass: #888888; /* Darker gray */
  /* or */
  --c-glass: #bbbbff; /* Blue tint */
}
```

### Faster Transitions
```css
.about-devello-glass {
  transition: background-color 200ms cubic-bezier(1, 0, 0.4, 1),
    box-shadow 200ms cubic-bezier(1, 0, 0.4, 1);
}
```

### Slower, Smoother Transitions
```css
.about-devello-glass {
  transition: background-color 600ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Where to Edit

Edit these properties in `styles/globals.css` starting at line 970 in the `.about-devello-glass` class definition.

