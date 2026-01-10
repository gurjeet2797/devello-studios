# Devello Studio Frontend Template - AI Agent Prompt

## Overview
Create a replica frontend template for Devello Studios that matches the glassmorphism design system and navigation structure from develloinc.com. This template will be used to create new studios deployed through Google AI Studio, with navigation buttons routing back to develloinc.com.

---

## Core Libraries & Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "next": "^15.5.7",
    "framer-motion": "^10.16.1",
    "lucide-react": "^0.88.0",
    "tailwindcss": "^3.3.3",
    "tailwindcss-animate": "^1.0.5",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  }
}
```

### Fonts
- **Primary Font**: DM Sans (Google Fonts)
  - Import: `@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap");`
- **Accent Font**: Pacifico (Google Fonts) - for special branding elements

---

## Glassmorphism Styling System

### Core CSS Class: `.about-devello-glass`

This is the primary glassmorphism class used for all navigation buttons and glassy UI elements.

#### CSS Variables
```css
.about-devello-glass {
  /* Glass base colors */
  --c-glass: transparent;
  --c-light: #fff;
  --c-dark: #000;
  --c-content: #224;
  --c-action: #0052f5;
  --c-bg: #e8e8e9;
  
  /* Glass effect intensity */
  --glass-reflex-dark: 1;
  --glass-reflex-light: 1;
  --saturation: 150%;
  --chromatic-radius: 0px;
  --chromatic-intensity: 0;
  
  /* Navigation button colors - Dark mode */
  --nav-bg-dark: rgba(220, 220, 220, 0.2);
  --nav-border-dark: rgba(200, 200, 200, 0.3);
  --nav-bg-hover-dark: rgba(230, 230, 230, 0.3);
  --nav-text-dark: rgba(255, 255, 255, 1);
  
  /* Navigation button colors - Light mode */
  --nav-bg-light: rgba(220, 220, 220, 0.2);
  --nav-border-light: rgba(200, 200, 200, 0.3);
  --nav-bg-hover-light: rgba(230, 230, 230, 0.3);
  --nav-text-light: rgba(0, 0, 0, 1);
}
```

#### Base Styling
```css
.about-devello-glass {
  font-family: "DM Sans", sans-serif;
  font-optical-sizing: auto;
  background-color: var(--nav-bg-dark);
  border: 1px solid var(--nav-border-dark);
  backdrop-filter: blur(4px) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(4px) saturate(var(--saturation));
  color: var(--nav-text-dark);
  position: relative;
  transform-origin: center center;
  
  /* Complex multi-layer inset shadows for depth */
  box-shadow: 
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent),
    inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent),
    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent),
    inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent),
    inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
    inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent);
  
  transition: background-color 400ms cubic-bezier(1, 0, 0.4, 1),
    box-shadow 400ms cubic-bezier(1, 0, 0.4, 1),
    border-color 400ms cubic-bezier(1, 0, 0.4, 1);
}

/* Hover state */
.about-devello-glass:hover {
  background-color: var(--nav-bg-hover-dark);
}

/* Light mode */
html:not(.dark) .about-devello-glass {
  background-color: var(--nav-bg-light);
  border-color: var(--nav-border-light);
  color: var(--nav-text-light);
}

html:not(.dark) .about-devello-glass:hover {
  background-color: var(--nav-bg-hover-light);
}
```

### Background Colors
```css
:root {
  --light-bg: linear-gradient(135deg, #fefbed 0%, #f9fafb 100%);
  --dark-bg: #000000;
}

html {
  background: #000000; /* Default dark */
}

html:not(.dark) {
  background: linear-gradient(135deg, #fefbed 0%, #f9fafb 100%);
  background-attachment: fixed;
}
```

---

## Navigation Bar Structure

### Required Navigation Buttons (Route to develloinc.com)

The navigation bar must include these buttons with glassmorphism styling:

1. **Services** (Dropdown)
   - Business Consultation → `https://develloinc.com/consulting`
   - Software Development → `https://develloinc.com/software`
   - Construction Services → `https://develloinc.com/construction`
   - Custom Fabrication → `https://develloinc.com/custom`

2. **Studio** (Dropdown)
   - Devello Studios → `https://develloinc.com/studios`
   - Lighting Studio → `https://develloinc.com/lighting`
   - Image Editor → `https://develloinc.com/general-edit`
   - Product Studio → `https://devello-catalog-editor-989777430052.us-west1.run.app/` (external)

3. **Store** → `https://develloinc.com/storecatalogue`

4. **My Account** (Dropdown - only show if user is authenticated)
   - Client Portal → `https://develloinc.com/client-portal`
   - My Profile → `https://develloinc.com/profile`
   - Sign Out → (sign out action)

5. **Cart Icon** (if items in cart) → `https://develloinc.com/checkout`

6. **Theme Toggle** (Dark/Light mode switcher)

### Navigation Layout

**Desktop (md and up):**
- Left side: Logo → Services → Studio → Beta badge
- Right side: Store → My Account → Cart → Theme Toggle

**Mobile:**
- Hamburger menu with all navigation options
- Same dropdown structure as desktop

### Button Styling Specifications

#### Standard Button
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  className="about-devello-glass px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm whitespace-nowrap"
  style={{ transformOrigin: "center center" }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Button Text
</motion.button>
```

#### Dropdown Button
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => setIsOpen(!isOpen)}
  className="about-devello-glass relative px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm"
  style={{ transformOrigin: "center center" }}
>
  Dropdown Name
  <span className="ml-1.5 text-xs">▼</span>
</motion.button>
```

#### Dropdown Menu Items
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: -10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: -10 }}
  transition={{ duration: 0.2 }}
  className="absolute top-full left-0 mt-2 min-w-48 z-50"
>
  <div>
    {items.map((item) => (
      <Link href={item.href} key={item.name}>
        <motion.div
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ y: 0, scale: 0.95 }}
          className="about-devello-glass px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 mb-3"
          style={{
            backgroundColor: isDark 
              ? 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 50%, rgba(220, 220, 220, 0.2))'
              : 'color-mix(in srgb, rgba(56, 189, 248, 0.2) 50%, rgba(220, 220, 220, 0.2))',
            borderColor: isDark ? 'rgba(125, 211, 252, 0.5)' : 'rgba(56, 189, 248, 0.4)',
            transformOrigin: "center center"
          }}
        >
          {item.name}
        </motion.div>
      </Link>
    ))}
  </div>
</motion.div>
```

---

## Animation Library: Framer Motion

### Key Animation Patterns

1. **Button Hover/Tap**
```jsx
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

2. **Dropdown Animations**
```jsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

3. **Page Transitions**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
```

---

## Tailwind CSS Configuration

### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "rgb(255, 247, 145)",
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### Key Tailwind Classes Used
- `rounded-full` - Fully rounded buttons
- `px-3 py-2` - Standard button padding
- `px-4 py-3` - Larger button padding
- `text-sm` - Small text size
- `font-medium` - Medium font weight
- `whitespace-nowrap` - Prevent text wrapping
- `backdrop-blur-sm` - Backdrop blur (though CSS handles this)
- `transition-all duration-300` - Smooth transitions

---

## Component Structure Requirements

### 1. Navigation Component
- Must be responsive (mobile hamburger menu)
- Dark/light mode support
- Dropdown menus for Services and Studio
- External link handling (Product Studio)
- User authentication state handling

### 2. Theme System
- Dark mode toggle
- CSS variables for theme switching
- Smooth transitions between themes

### 3. Layout Structure
```jsx
<div className="min-h-screen w-full bg-black dark:bg-[var(--light-bg)]">
  <Navigation />
  <main>
    {/* Studio content */}
  </main>
</div>
```

---

## Implementation Checklist

### Required Features
- [ ] Glassmorphism styling (`.about-devello-glass` class)
- [ ] Navigation bar with all specified buttons
- [ ] Dropdown menus for Services and Studio
- [ ] All routes point to develloinc.com (or external URLs as specified)
- [ ] Dark/light mode toggle
- [ ] Responsive mobile menu
- [ ] Framer Motion animations
- [ ] DM Sans font integration
- [ ] Tailwind CSS setup
- [ ] External link indicators (↗ symbol)
- [ ] Smooth transitions and hover effects

### Styling Requirements
- [ ] Glassmorphism backdrop blur effect
- [ ] Multi-layer inset shadows for depth
- [ ] Consistent button sizing and spacing
- [ ] Rounded-full buttons
- [ ] Proper z-index for dropdowns
- [ ] Theme-aware colors (dark/light mode)

### Navigation Requirements
- [ ] Services dropdown with 4 items
- [ ] Studio dropdown with 4 items (1 external)
- [ ] Store button
- [ ] My Account dropdown (conditional on auth)
- [ ] Cart icon (conditional on cart items)
- [ ] Theme toggle button
- [ ] Logo linking to develloinc.com

---

## Example Navigation Component Structure

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo, Services, Studio */}
        <div className="flex items-center space-x-4">
          <Link href="https://develloinc.com">
            <img src="/logo.png" alt="Devello" className="h-10" />
          </Link>
          
          {/* Services Dropdown */}
          <DropdownButton
            name="Services"
            isOpen={servicesOpen}
            onToggle={() => setServicesOpen(!servicesOpen)}
            items={[
              { name: 'Business Consultation', href: 'https://develloinc.com/consulting' },
              { name: 'Software Development', href: 'https://develloinc.com/software' },
              { name: 'Construction Services', href: 'https://develloinc.com/construction' },
              { name: 'Custom Fabrication', href: 'https://develloinc.com/custom' },
            ]}
          />
          
          {/* Studio Dropdown */}
          <DropdownButton
            name="Studio"
            isOpen={studioOpen}
            onToggle={() => setStudioOpen(!studioOpen)}
            items={[
              { name: 'Devello Studios', href: 'https://develloinc.com/studios' },
              { name: 'Lighting Studio', href: 'https://develloinc.com/lighting' },
              { name: 'Image Editor', href: 'https://develloinc.com/general-edit' },
              { name: 'Product Studio', href: 'https://devello-catalog-editor-989777430052.us-west1.run.app/', external: true },
            ]}
          />
        </div>
        
        {/* Right: Store, Account, Cart, Theme */}
        <div className="flex items-center space-x-2">
          <NavButton href="https://develloinc.com/storecatalogue">Store</NavButton>
          <DropdownButton
            name="My Account"
            isOpen={accountOpen}
            onToggle={() => setAccountOpen(!accountOpen)}
            items={[
              { name: 'Client Portal', href: 'https://develloinc.com/client-portal' },
              { name: 'My Profile', href: 'https://develloinc.com/profile' },
              { name: 'Sign Out', href: '#', action: 'signout' },
            ]}
          />
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
      </div>
    </nav>
  );
}
```

---

## Color Scheme Reference

### Dark Mode
- Background: `#000000`
- Glass BG: `rgba(220, 220, 220, 0.2)`
- Glass Border: `rgba(200, 200, 200, 0.3)`
- Text: `rgba(255, 255, 255, 1)`

### Light Mode
- Background: `linear-gradient(135deg, #fefbed 0%, #f9fafb 100%)`
- Glass BG: `rgba(220, 220, 220, 0.2)`
- Glass Border: `rgba(200, 200, 200, 0.3)`
- Text: `rgba(0, 0, 0, 1)`

### Dropdown Item Colors (Examples)
- Sky Blue (Software): `rgba(56, 189, 248, 0.25)` / `rgba(56, 189, 248, 0.2)`
- Amber (Consultation): `rgba(251, 191, 36, 0.25)` / `rgba(251, 191, 36, 0.2)`
- Orange (Construction): `rgba(249, 115, 22, 0.25)` / `rgba(249, 115, 22, 0.2)`
- Purple (Custom): `rgba(168, 85, 247, 0.25)` / `rgba(168, 85, 247, 0.2)`

---

## Notes for AI Agent

1. **External Links**: Use `<a>` tags with `target="_blank" rel="noopener noreferrer"` for external links
2. **Internal Links**: Use Next.js `Link` component for same-domain navigation
3. **Click Outside**: Implement click-outside detection to close dropdowns
4. **Mobile Menu**: Create hamburger menu that slides in from side
5. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
6. **Performance**: Use React.memo for expensive components
7. **Responsive**: Test on mobile, tablet, and desktop breakpoints

---

## Final Deliverable

Create a complete Next.js application with:
- Navigation component matching Devello's design
- All routes configured to develloinc.com
- Glassmorphism styling system
- Dark/light mode support
- Responsive design
- Smooth animations
- Ready for Google AI Studio deployment

The template should be a drop-in replacement that maintains visual consistency with develloinc.com while allowing for custom studio content in the main area.

