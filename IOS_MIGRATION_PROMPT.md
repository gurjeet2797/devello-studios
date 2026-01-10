# iOS Migration Analysis Prompt for GPT-5 Pro

## Objective
You have access to the Devello Inc GitHub repository. Your task is to analyze the entire codebase, extract all styling patterns, component structures, and visual design elements to create a comprehensive migration guide for converting this Next.js React web application into a native iOS app using SwiftUI and Apple's Liquid Glass SDK.

## Repository Context
- **Framework**: Next.js 14 (React 18.2.0)
- **Styling**: Tailwind CSS with custom CSS variables
- **Animations**: Framer Motion
- **Key Features**: AI-powered image processing tools, authentication, payments, partner dashboard
- **Design System**: Glassmorphism effects throughout the application

## Analysis Tasks

### 1. Component Architecture Extraction
- Map all React components and their hierarchy
- Identify reusable component patterns
- Document component props and state management
- Extract component composition patterns
- List all custom hooks and their dependencies

### 2. Styling System Analysis
- Extract all Tailwind CSS classes used throughout the app
- Document custom CSS variables (especially glass-related: `--c-glass`, `--glass-reflex-dark`, `--glass-reflex-light`, `--saturation`, etc.)
- Map color schemes (light/dark mode)
- Document typography system (fonts, sizes, weights)
- Extract spacing and layout patterns
- Document responsive breakpoints and mobile adaptations

### 3. Glassmorphism Effects Documentation
**Critical**: Document ALL glass effects with exact specifications:

- **Navigation Buttons** (`.about-devello-glass` class):
  - Background colors (light/dark mode variants)
  - Border styles and colors
  - Backdrop filter settings (blur, saturation)
  - Box shadow layers (all 10+ shadow layers)
  - Hover states
  - Transition timings and easing functions
  - CSS custom properties and their values

- **GlassSurface Component**:
  - SVG filter implementations
  - Fallback styles
  - Background opacity calculations
  - Border radius patterns

- **Other Glass Elements**:
  - Modal glass effects
  - Card glass effects
  - Button glass effects
  - Form input glass effects
  - Any other components using backdrop-filter or glass styling

### 4. Animation Patterns
- Extract all Framer Motion animations:
  - Page transitions
  - Component entrance/exit animations
  - Hover effects
  - Click/tap interactions
  - Layout animations (especially `layoutId` usage)
  - Spring physics configurations
  - Easing functions
- Document animation timings, delays, and sequences
- Map animation dependencies between components

### 5. Layout Structure
- Document page layouts and routing structure
- Extract navigation patterns
- Document responsive grid systems
- Map component positioning (absolute, relative, fixed)
- Document z-index layering
- Extract safe area handling for mobile

### 6. Color System
- Extract all color values (hex, rgb, rgba)
- Document light/dark mode color mappings
- Map semantic color usage (primary, secondary, accent, etc.)
- Document gradient definitions
- Extract background color patterns

### 7. Typography System
- Document all font families used
- Extract font size scales
- Document font weights and styles
- Map line heights and letter spacing
- Extract text color patterns

### 8. Interactive Elements
- Document all button styles and variants
- Extract form input styles
- Document modal/dialog patterns
- Map tooltip and popover implementations
- Extract dropdown/select patterns

### 9. Image Handling
- Document image upload flows
- Extract image processing patterns
- Document image display components
- Map image optimization strategies

### 10. State Management
- Document global state patterns
- Extract context usage
- Map authentication state
- Document routing state
- Extract form state management

## Analysis Priority Order

**Phase 1 - Critical Foundation (Analyze First):**
1. **Authentication System** - Auth flows, login/signup screens, OAuth integration
2. **Core Tool Pages** - Lighting tool, General Edit, Assisted Edit (main user-facing features)
3. **Home/Welcome Screen** - Hero section, navigation, primary CTAs
4. **Glass Effect System** - All glassmorphism implementations (foundation for everything)

**Phase 2 - Secondary Features:**
5. **Service Pages** - Studios, Consulting, Construction, Manufacturing, Software pages
6. **Forms & Modals** - Custom builds, consultations, partner applications
7. **Dashboard Pages** - User profile, partner dashboard, admin (if applicable)

**Phase 3 - Supporting Elements:**
8. **Navigation System** - Navigation bar, menu, routing
9. **Footer & Static Pages** - Footer, About, Blog, Contact
10. **Utility Components** - Loading states, error states, empty states

## Output Format & Structure

**Deliver as Multiple Separate Documents** (not a single long report):

### Document 1: `01_COMPONENT_INVENTORY.md`
- Complete list of all React components with file paths
- Component hierarchy and relationships
- Props interfaces and state management
- Custom hooks documentation
- Component dependencies map

### Document 2: `02_STYLING_SYSTEM.md`
- Complete Tailwind CSS class inventory
- Custom CSS variables catalog (especially glass-related)
- Color system (light/dark mode with exact values)
- Typography system (fonts, sizes, weights, line heights)
- Spacing system (matching Tailwind scale)
- Layout patterns and grid systems
- Responsive breakpoints and mobile adaptations

### Document 3: `03_GLASS_EFFECTS_CATALOG.md` ⭐ CRITICAL
- **Navigation Buttons** (`.about-devello-glass`):
  - Exact CSS values (blur, saturation, opacity)
  - All 10+ box-shadow layers with exact values
  - Light/dark mode variants
  - Hover/press states
  - Transition specifications
- **GlassSurface Component**:
  - SVG filter details
  - Fallback implementations
  - Usage locations
- **All Other Glass Elements**:
  - Modal glass effects
  - Card glass effects
  - Button variants
  - Form input glass effects
  - Any backdrop-filter usage
- **For Each Glass Effect**:
  - Exact CSS implementation (copy code)
  - Visual specifications (blur radius, opacity, saturation, colors)
  - All shadow layers with exact values
  - Proposed Liquid Glass SDK/iOS equivalent configuration

### Document 4: `04_ANIMATION_LIBRARY.md`
- All Framer Motion animations:
  - Page transitions (with code examples)
  - Component animations (entrance/exit)
  - Hover effects
  - Click/tap interactions
  - Layout animations (`layoutId` usage)
  - Spring physics configurations (stiffness, damping, mass)
  - Easing functions (cubic-bezier values)
- Animation timing and delays
- Animation sequences and coordination
- Performance considerations

### Document 5: `05_LAYOUT_STRUCTURE.md`
- Page layouts and routing structure
- Navigation patterns
- Responsive grid systems
- Component positioning (absolute, relative, fixed)
- Z-index layering hierarchy
- Safe area handling
- Mobile-specific adaptations

### Document 6: `06_COLOR_PALETTE.md`
- Complete color inventory (hex, rgb, rgba)
- Light/dark mode color mappings
- Semantic color usage (primary, secondary, accent, etc.)
- Gradient definitions with exact stops
- Background color patterns
- Text color patterns

### Document 7: `07_TYPOGRAPHY_SYSTEM.md`
- All font families used (DM Sans, Pacifico, etc.)
- Font size scale (matching Tailwind)
- Font weights and styles
- Line heights and letter spacing
- Text color mappings
- Font loading strategies

### Document 8: `08_INTERACTIVE_ELEMENTS.md`
- All button styles and variants (with code)
- Form input styles (text, textarea, select)
- Modal/dialog patterns
- Tooltip implementations
- Dropdown/select patterns
- Checkbox/radio patterns

### Document 9: `09_IMAGE_HANDLING.md`
- Image upload flow diagrams
- Image processing patterns
- Image display components
- Image optimization strategies
- HEIC/HEIF handling
- Image caching strategies

### Document 10: `10_STATE_MANAGEMENT.md`
- Global state patterns (Context API usage)
- Component state management
- Authentication state flow
- Routing state
- Form state management
- Data fetching patterns

### Document 11: `11_DEPENDENCIES_MAP.md` ⭐ IMPORTANT
- **Complete npm package inventory** from `package.json`
- For each dependency:
  - Purpose in the app
  - iOS equivalent/library
  - Migration strategy
  - Notes on implementation
- Key dependencies to analyze:
  - `framer-motion` → SwiftUI Animation
  - `@stripe/stripe-js` → Stripe iOS SDK
  - `@supabase/supabase-js` → Supabase Swift SDK
  - `@google/generative-ai` → Google AI SDK for iOS
  - `next` → Native iOS navigation
  - `tailwindcss` → SwiftUI styling
  - Image processing libraries → Core Image/Vision
  - Authentication libraries → iOS equivalents

### Document 12: `12_API_INTEGRATION.md`
- All API endpoints used
- Request/response patterns
- Authentication headers
- Error handling patterns
- Data models and types
- WebSocket connections (if any)

### Document 13: `13_COMPONENT_MIGRATION_MAP.md`
- React component → SwiftUI view mapping
- Migration complexity rating (Low/Medium/High)
- Suggested migration order
- Dependencies between components
- Reusable component identification

### Document 14: `14_VISUAL_REFERENCE.md`
- **Code-level analysis PRIMARY** (analyze actual component code)
- **Screenshots/descriptions SECONDARY** (if possible, describe visual appearance based on code)
- For each major screen/component:
  - Component file path
  - Key visual elements (from code analysis)
  - Layout structure (from code)
  - Color scheme (from code)
  - Glass effects used (from code)
  - Animations present (from code)
  - Responsive behavior (from code)

## Special Focus Areas

### Glassmorphism → Liquid Glass SDK Migration
For EVERY glass effect found, provide:
- Exact visual specifications (blur radius, opacity, colors, shadows)
- Current CSS implementation
- Proposed Liquid Glass SDK configuration
- Visual equivalence mapping

### Responsive Design
- Document mobile-specific adaptations
- Extract breakpoint behaviors
- Map responsive component variants

### Performance Considerations
- Identify heavy animations
- Document image loading strategies
- Extract optimization patterns

## Deliverables Summary

**Output Format**: 14 separate markdown documents (as specified above)

**Analysis Approach**:
- **PRIMARY**: Code-level analysis (read and analyze actual component code, CSS, styles)
- **SECONDARY**: Visual descriptions based on code (describe what the code would render)
- **Screenshots**: Not required (focus on code analysis), but visual descriptions helpful

**Dependencies Analysis**: 
- **REQUIRED**: Complete analysis of all npm packages in `package.json`
- Document purpose, iOS equivalent, and migration strategy for each
- Prioritize critical dependencies (Framer Motion, Stripe, Supabase, etc.)

**Priority**: Follow the Phase 1 → Phase 2 → Phase 3 order specified above, but ensure completeness across all phases

## Critical Requirements

- **Exact Replication**: The iOS app must visually match the web app pixel-perfect
- **Liquid Glass SDK**: All glass effects must use Apple's Liquid Glass SDK, not CSS backdrop-filter
- **Native Feel**: Convert web patterns to iOS-native patterns where appropriate
- **Performance**: Optimize for iOS performance characteristics
- **Accessibility**: Maintain or improve accessibility standards

## Key Questions to Answer

1. **Glass Effects**: What are all the unique glass effect variations? (Document in `03_GLASS_EFFECTS_CATALOG.md`)
2. **Animations**: How are animations sequenced and coordinated? (Document in `04_ANIMATION_LIBRARY.md`)
3. **Colors**: What are the exact color values for all UI elements? (Document in `06_COLOR_PALETTE.md`)
4. **Responsive Design**: How is responsive design handled? (Document in `02_STYLING_SYSTEM.md` and `05_LAYOUT_STRUCTURE.md`)
5. **User Flows**: What are the critical user flows that must be preserved? (Document in `13_COMPONENT_MIGRATION_MAP.md`)
6. **Complexity**: Which components are most complex and need special attention? (Document in `01_COMPONENT_INVENTORY.md` with complexity ratings)
7. **State Management**: How is state shared between components? (Document in `10_STATE_MANAGEMENT.md`)
8. **Performance**: What are the performance bottlenecks? (Document in `04_ANIMATION_LIBRARY.md` and relevant sections)
9. **Dependencies**: What iOS equivalents exist for each npm package? (Document in `11_DEPENDENCIES_MAP.md`)
10. **API Integration**: What are all the API endpoints and data flows? (Document in `12_API_INTEGRATION.md`)

## Next Steps After Analysis

After completing this analysis, the output will be used to:
1. Create SwiftUI component implementations
2. Configure Liquid Glass SDK for each glass effect
3. Implement animations using SwiftUI animation APIs
4. Build the iOS app structure
5. Integrate with existing backend APIs
6. Prepare for App Store submission

---

## Analysis Instructions

### Code Analysis Approach
1. **Read actual source files** - Don't rely on assumptions, read the code
2. **Extract exact values** - Copy CSS values, Tailwind classes, animation parameters exactly
3. **Trace dependencies** - Follow imports and understand component relationships
4. **Document patterns** - Identify reusable patterns and document them

### Visual Analysis Approach
1. **Code-first** - Analyze what the code would render
2. **Describe visually** - Based on CSS/styling, describe the visual appearance
3. **Screenshots optional** - If you can generate/access screenshots, include them, but code analysis is primary

### Dependencies Analysis
1. **Read package.json** - Analyze all dependencies
2. **Research iOS equivalents** - For each npm package, find iOS equivalent
3. **Document migration path** - How to replace each dependency
4. **Prioritize critical ones** - Focus extra detail on core dependencies

### Output Quality Standards
- **Exhaustive**: Every component, every style, every animation documented
- **Exact**: Copy actual code values, don't approximate
- **Organized**: Use the 14-document structure specified
- **Actionable**: Each document should enable direct iOS implementation
- **Complete**: Nothing should be missing for pixel-perfect replication

---

**Note**: This analysis must be exhaustive. Every visual element, every animation, every color, every spacing value must be documented. The goal is pixel-perfect replication with native iOS technologies. Focus on code-level analysis first, with visual descriptions based on code analysis.

