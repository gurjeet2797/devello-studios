# Google AI Studios Prompt - Devello Studios UI Recreation

## Complete Prompt for Google AI Studios

Use this prompt in Google AI Studios to recreate the exact Devello Studios UI with glassmorphism design system.

---

## PROMPT START

Create a complete, production-ready web application that replicates the Devello Studios UI design system with exact glassmorphism effects. The application should be a single-page app with multiple tool interfaces (Image Editor, Lighting Tool, Assisted Edit) accessible via navigation.

### Design System Requirements

#### Color Scheme
- **Dark Mode Background**: `#1b1b1d`
- **Light Mode Background**: `#e8e8e9`
- **Glass Base Color**: `#bbbbbc`
- **Text Colors**:
  - Dark mode: `rgba(255, 255, 255, 1)`
  - Light mode: `rgba(0, 0, 0, 1)`
- **Action Colors**:
  - Dark mode: `#03d5ff`
  - Light mode: `#0052f5`

#### Typography
- **Font Family**: `"DM Sans", sans-serif`
- **Font Optical Sizing**: `auto`
- **Font Weights**: 300-400 (light to regular)
- **Responsive Sizing**: 
  - Mobile: `text-sm` to `text-base`
  - Desktop: `text-base` to `text-xl`

#### Glassmorphism CSS Variables

```css
:root {
  --c-glass: #bbbbbc;
  --c-light: #fff;
  --c-dark: #000;
  --c-content: #224;
  --c-action: #0052f5;
  --c-bg: #e8e8e9;
  --glass-reflex-dark: 1;
  --glass-reflex-light: 1;
  --saturation: 150%;
  --chromatic-radius: 0px;
  --chromatic-intensity: 0;
  
  /* Nav button specific */
  --nav-bg-dark: rgba(220, 220, 220, 0.2);
  --nav-bg-light: rgba(220, 220, 220, 0.2);
  --nav-border-dark: rgba(200, 200, 200, 0.3);
  --nav-border-light: rgba(200, 200, 200, 0.3);
  --nav-bg-hover-dark: rgba(230, 230, 230, 0.3);
  --nav-bg-hover-light: rgba(230, 230, 230, 0.3);
  --nav-text-dark: rgba(255, 255, 255, 1);
  --nav-text-light: rgba(0, 0, 0, 1);
}

.dark {
  --c-content: #e1e1e1;
  --c-action: #03d5ff;
  --c-bg: #1b1b1d;
  --glass-reflex-dark: 2;
  --glass-reflex-light: 0.3;
}
```

#### Glassmorphic Button Base Class

Create a `.glass-button` class with these exact specifications:

```css
.glass-button {
  font-family: "DM Sans", sans-serif;
  font-optical-sizing: auto;
  background-color: color-mix(in srgb, var(--c-glass) 12%, transparent);
  border: 1px solid rgba(200, 200, 200, 0.3);
  backdrop-filter: blur(8px) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(8px) saturate(var(--saturation));
  border-radius: 20px; /* or 9999px for pill shapes */
  color: var(--nav-text-dark);
  position: relative;
  transform-origin: center center;
  padding: 12px 24px;
  font-weight: 400;
  transition: background-color 400ms cubic-bezier(1, 0, 0.4, 1),
              box-shadow 400ms cubic-bezier(1, 0, 0.4, 1),
              border-color 400ms cubic-bezier(1, 0, 0.4, 1);
  
  /* 10+ Box Shadow Layers for Depth */
  box-shadow: 
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent),
    inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent),
    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent),
    inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent),
    inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent),
    0px 1px 5px 0px rgba(0, 0, 0, 0.1),
    0px 6px 16px 0px rgba(0, 0, 0, 0.15);
}

.glass-button:hover {
  background-color: rgba(230, 230, 230, 0.3);
  transform: scale(1.02);
}

.glass-button:active {
  transform: scale(0.95);
}

/* Light mode */
html:not(.dark) .glass-button {
  background-color: rgba(220, 220, 220, 0.2);
  border-color: rgba(200, 200, 200, 0.3);
  color: rgba(0, 0, 0, 1);
}

html:not(.dark) .glass-button:hover {
  background-color: rgba(230, 230, 230, 0.3);
}
```

#### Glass Surface Component

Create a `.glass-surface` class for cards, modals, and panels:

```css
.glass-surface {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.2),
    0 2px 16px 0 rgba(31, 38, 135, 0.1),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.2);
  padding: 24px;
}

.dark .glass-surface {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1);
}
```

### Layout Structure

#### Main Container
```html
<div class="app-container">
  <nav class="glass-nav">
    <!-- Navigation with glass buttons -->
  </nav>
  <main class="main-content">
    <!-- Tool interfaces -->
  </main>
</div>
```

#### Responsive Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Component Specifications

#### 1. Navigation Bar
- **Height**: 64px (mobile), 80px (desktop)
- **Background**: Glassmorphic with backdrop blur
- **Buttons**: Glass buttons with hover effects
- **Position**: Fixed top
- **Z-index**: 100

#### 2. Image Container
- **Max Width**: `1280px` (7xl)
- **Padding**: `16px` mobile, `24px` desktop
- **Border Radius**: `20px`
- **Background**: Transparent (shows global background)
- **Image Display**: Responsive, maintains aspect ratio

#### 3. Action Buttons
- **Style**: Glassmorphic buttons
- **Layout**: Horizontal row, centered
- **Spacing**: `16px` gap between buttons
- **Icons**: SVG icons with text labels
- **States**: Default, hover, active, disabled

#### 4. Chat Input (Assisted Edit)
- **Container**: Glass surface
- **Input Field**: Glassmorphic with backdrop blur
- **Border Radius**: `9999px` (pill shape)
- **Padding**: `12px 24px`
- **Placeholder**: Light gray text

#### 5. Hotspot System
- **Hotspot Marker**: Circular, colored indicator
- **Size**: `24px` diameter
- **Border**: `2px solid white`
- **Shadow**: Drop shadow for visibility
- **Animation**: Pulse on creation

#### 6. Loading States
- **Spinner**: Animated glassmorphic container
- **Backdrop**: Blurred overlay
- **Text**: "Processing..." with glassmorphic styling

### Animations

#### Entry Animations
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Hover Effects
- **Scale**: `1.02` on hover
- **Opacity**: Slight increase
- **Transition**: `400ms cubic-bezier(1, 0, 0.4, 1)`

#### Click/Tap Effects
- **Scale**: `0.95` on active
- **Spring Animation**: Stiffness 400, damping 17

### Theme Switching

Implement dark/light mode toggle:

```javascript
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}
```

### Tool Interfaces

#### Image Editor Interface
1. **Upload Area**: Drag-and-drop zone with glassmorphic border
2. **Image Display**: Centered, responsive container
3. **Hotspot Placement**: Click-to-place editing points
4. **Prompt Input**: Glassmorphic text input per hotspot
5. **Action Buttons**: Process, Upscale, Download, Undo, Redo

#### Lighting Tool Interface
1. **Image Upload**: Same as Image Editor
2. **Lighting Options**: Bottom sheet with 3 glassmorphic buttons
   - Dramatic Daylight
   - Midday Bright
   - Cozy Evening
3. **Processing Indicator**: Animated glassmorphic loader
4. **Result Display**: Before/after toggle

#### Assisted Edit Interface
1. **Image Upload**: Same as Image Editor
2. **Chat Input**: Glassmorphic input at bottom
3. **Reference Images**: Grid of 4 images in glassmorphic containers
4. **Hotspot System**: Click reference → place hotspot
5. **Processing**: Combined edit processing

### Responsive Design

#### Mobile Adaptations
- **Stacked Layouts**: Vertical stacking on mobile
- **Reduced Padding**: `16px` instead of `24px`
- **Smaller Fonts**: `text-sm` instead of `text-base`
- **Touch Targets**: Minimum `44px` height
- **Bottom Sheets**: Full-width bottom sheets for options

#### Tablet Adaptations
- **Hybrid Layouts**: Mix of stacked and side-by-side
- **Medium Padding**: `20px`
- **Medium Fonts**: `text-base`

### Implementation Checklist

- [ ] Create HTML structure with semantic elements
- [ ] Implement CSS variables for theming
- [ ] Create glassmorphic button class with all shadow layers
- [ ] Create glass surface component
- [ ] Implement dark/light theme switching
- [ ] Add responsive breakpoints
- [ ] Create entry animations
- [ ] Add hover and active states
- [ ] Implement image upload interface
- [ ] Create hotspot system
- [ ] Add loading states
- [ ] Create chat input component
- [ ] Implement navigation bar
- [ ] Add mobile menu (if needed)
- [ ] Test on multiple screen sizes
- [ ] Ensure backdrop-filter fallbacks

### Code Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devello Studios</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz@9..40&display=swap" rel="stylesheet">
  <style>
    /* All CSS here */
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Navigation -->
    <!-- Main Content -->
    <!-- Tool Interfaces -->
  </div>
  <script>
    // JavaScript for interactions
  </script>
</body>
</html>
```

### Visual Reference Points

1. **Glass Effect**: Should look like frosted glass with subtle transparency
2. **Depth**: Multiple shadow layers create 3D depth effect
3. **Blur**: Background should be blurred but visible through glass
4. **Highlights**: Subtle light reflections on top-left edges
5. **Shadows**: Soft shadows on bottom-right edges
6. **Saturation**: Colors should be slightly enhanced (150% saturation)
7. **Borders**: Thin, semi-transparent borders
8. **Hover**: Smooth scale and opacity transitions

### Performance Considerations

- Use `will-change` for animated elements
- Implement `transform` and `opacity` for animations (GPU accelerated)
- Lazy load images
- Debounce scroll and resize events
- Use CSS containment for isolated components

### Browser Compatibility

- **Backdrop Filter**: Use `-webkit-backdrop-filter` for Safari
- **Fallbacks**: Solid backgrounds for browsers without backdrop-filter support
- **CSS Variables**: Provide fallback values
- **Color Mix**: Use rgba fallbacks for older browsers

### Final Notes

- All glassmorphic elements should maintain consistent styling
- Animations should feel smooth and responsive
- Theme switching should be instant
- Mobile experience should be touch-optimized
- All interactive elements should have clear visual feedback

## PROMPT END

---

## Additional Implementation Details

### Exact CSS for Glass Buttons (Copy-Paste Ready)

```css
.glass-button {
  --c-glass: #bbbbbc;
  --c-light: #fff;
  --c-dark: #000;
  --glass-reflex-dark: 1;
  --glass-reflex-light: 1;
  --saturation: 150%;
  
  font-family: "DM Sans", sans-serif;
  background-color: color-mix(in srgb, var(--c-glass) 12%, transparent);
  border: 1px solid rgba(200, 200, 200, 0.3);
  backdrop-filter: blur(8px) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(8px) saturate(var(--saturation));
  border-radius: 20px;
  padding: 12px 24px;
  color: white;
  cursor: pointer;
  transition: all 400ms cubic-bezier(1, 0, 0.4, 1);
  box-shadow: 
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent),
    inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent),
    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent),
    inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent),
    inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent),
    0px 1px 5px 0px rgba(0, 0, 0, 0.1),
    0px 6px 16px 0px rgba(0, 0, 0, 0.15);
}

.glass-button:hover {
  background-color: rgba(230, 230, 230, 0.3);
  transform: scale(1.02);
}

.glass-button:active {
  transform: scale(0.95);
}
```

### JavaScript for Theme Toggle

```javascript
// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

function setTheme(theme) {
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

function getTheme() {
  return localStorage.getItem('theme') || 
         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Initialize theme
setTheme(getTheme());

// Toggle on button click
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}
```

### Responsive Utilities

```css
/* Mobile first approach */
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

---

*Use this prompt in Google AI Studios to generate a complete, pixel-perfect recreation of the Devello Studios UI with all glassmorphism effects, animations, and responsive design.*
