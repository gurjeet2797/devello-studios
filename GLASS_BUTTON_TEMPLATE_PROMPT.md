# Glass Button Service Request Template - AI Agent Prompt

## Overview
Create a reusable, production-ready React component template for a glassmorphic service request button that expands into a multi-step form modal. This template should be easily adaptable for different services (e.g., custom builds, consultations, quotes, bookings).

## Core Requirements

### 1. Glass Button Component Structure

**Initial Button State:**
- Glassmorphic design with backdrop blur effect
- Positioned absolutely, centered in parent container
- Responsive sizing: mobile (max-width: 360px, padding: 24px), desktop (max-width: 400px, padding: 28px 32px)
- Two-line text layout: service name (larger) + call-to-action text (smaller)
- Smooth fade-in animation on mount
- Cursor pointer with hover effects

**Button Styling:**
```css
- backdrop-filter: blur(2px)
- background-color: rgba(255, 255, 255, 0.15)
- border: 1px solid rgba(255, 255, 255, 0.25)
- border-radius: 9999px (pill shape)
- Text: white, custom font for title, serif for CTA
```

### 2. Animation System

**Button Click Animation:**
- Spring inward animation on click (scale: 0.85) with spring physics (stiffness: 600, damping: 15)
- Animation should be visible and complete before expansion begins
- Use Framer Motion's `whileTap` for immediate feedback
- Use `animate` prop with state control for sustained spring-in effect

**Expansion Animation:**
- Use Framer Motion's `layoutId` to create smooth morphing transition from button to modal
- Button and expanded modal must share the same `layoutId` for seamless morphing
- Expansion should use spring physics (stiffness: 300, damping: 30, mass: 0.8)
- Container smoothly transitions from pill shape to rounded rectangle
- Border radius animates from 9999px to ~1.75rem (28px)

**Scroll Behavior:**
- On click, scroll page to center button in viewport (smooth scroll)
- Wait for scroll completion (~500ms) before starting expansion
- No scroll restoration on close - page stays at current position
- Prevent body scroll when modal is open (optional, based on design needs)

### 3. Expanded Modal Container

**Container Structure:**
- Fixed overlay with backdrop blur (blur(20px), rgba(0, 0, 0, 0.3))
- Centered modal container with glassmorphic styling
- Close button (X icon) in top-right corner with spring tap animation
- Responsive max-width: full width on mobile, max-w-2xl on desktop
- Responsive height: auto for normal mode, 80vh mobile / 75vh desktop for annotation/image modes

**Container Styling:**
```css
- backdrop-filter: blur(2px)
- background-color: transparent
- border: 1px solid rgba(255, 255, 255, 0.25)
- border-radius: 1.75rem (animated from pill shape)
- Responsive padding: p-8 mobile, sm:pt-8 sm:pb-3 md:pb-5 lg:pb-7 xl:pb-10 sm:px-8 desktop
```

**Overflow Handling:**
- Normal mode: overflow-y-hidden (no scrolling, content fits)
- Annotation/Image mode: overflow-y-auto (allow scrolling for large content)
- Horizontal overflow: visible (for annotation inputs that extend beyond bounds)

### 4. Multi-Step Form Structure

**Step Indicator System:**
- Visual progress indicators showing current step (1-4 or configurable)
- Numbered circles with glassmorphic styling
- Completed steps show checkmark icon (white) with orange-tinted glass background
- Active step has blue tint
- Inactive steps are less transparent
- Connector lines between steps (responsive: longer on mobile, shorter on desktop)
- Mobile: max-width 280px, centered, reduced gap between numbers
- Desktop: full width, standard spacing

**Step Navigation:**
- "Next" button with spring right animation (x: 8 on tap)
- "Back" button with spring left animation (x: -8 on tap)
- "Cancel" button with red tint when on first step
- All buttons use glassmorphic styling with spring tap animations
- Footer buttons container with border-top separator
- Responsive spacing: mt-6, pt-8 pb-2

**Form Fields:**
- All inputs and textareas use glassmorphic styling
- Text color: gray by default, white on focus
- Focus states: increased border opacity and background brightness
- Placeholder text: white/50 opacity
- Responsive sizing and spacing

### 5. Image Upload & Annotation System

**Upload Container:**
- Glassmorphic container with upload icon
- Tap/click to upload functionality
- Image compression before upload (resize to max 1920x1920, quality 0.75, convert to JPEG)
- Preview with delete button (trash icon, red-tinted glass, white icon)
- Responsive sizing: mobile (180px width), desktop (300px max-height)

**Annotation Mode:**
- Click on image to add annotation points (max 3 annotations)
- Pin marker icon (MapPin) with glassmorphic circle background
- Click pin to delete annotation
- Text input appears on click with glassmorphic container
- Input positioning: switches to left side if annotation is >50% from left edge
- Mobile: 180px width, 45% threshold, max-width calc(100vw - 6rem)
- Desktop: 200px width, 50% threshold, max-width calc(100vw - 4rem)
- Input text: gray by default, white on focus
- Helper text: "Type your note, press Enter to save" (can be removed per design)
- Prevent clicks outside image bounds
- Calculate click position relative to actual image element, not container

**Annotation Container Height:**
- Mobile: 80vh max-height
- Desktop: 75vh max-height
- Prevents overlap with navigation bar
- Ensures all content fits within viewport

### 6. Responsive Design Patterns

**Mobile (< 640px):**
- Increased vertical spacing between sections
- Reduced horizontal padding in some areas
- Larger touch targets
- Adjusted font sizes
- Instruction text below images
- Optimized annotation input positioning

**Desktop (≥ 640px):**
- Standard spacing
- Larger containers
- More horizontal space utilization
- Instruction text below images

**Breakpoint Strategy:**
- Use Tailwind's `sm:` prefix for desktop styles
- Mobile-first approach
- Test at: 320px, 480px, 768px, 1024px, 1280px

### 7. State Management

**Required State:**
```javascript
- currentStep: number (1-4 or configurable)
- formData: object (all form field values)
- isSubmitting: boolean
- submitStatus: string | null
- showAnnotation: boolean (for image annotation mode)
- annotations: array (annotation points with x, y, text, id)
- activeAnnotationIndex: number | null
- isMobile: boolean (window.innerWidth < 640)
- isExpanded: boolean (parent component)
- isInAnnotationMode: boolean (for container height adjustment)
```

**State Flow:**
- Step navigation updates currentStep
- Form data updates on input changes
- Image upload updates formData.uploadedImage
- Annotation mode toggles showAnnotation and notifies parent
- Submission sets isSubmitting and submitStatus

### 8. Backend Integration

**API Endpoint Structure:**
```javascript
// pages/api/[service-name]/submit.js
POST /api/[service-name]/submit

Request Body:
{
  projectType: string,
  projectDescription: string,
  projectStage: string,
  uploadedImage: string (base64 data URL),
  annotatedImage: string (base64 data URL),
  name: string,
  email: string,
  phone: string,
  additionalInfo: string (optional)
}

Response:
{
  success: boolean,
  message: string
}
```

**Email Integration (SendGrid):**
- Send formatted email with all form data
- Include base64 images as attachments or inline
- Use HTML email template
- Include error handling and validation

**Client-Side Submission:**
- Compress images before sending (reduce payload size)
- Show loading state during submission
- Display success/error messages
- Reset form on success
- Handle network errors gracefully

### 9. Styling System

**Glassmorphism Pattern:**
```javascript
const glassStyle = {
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  backgroundColor: isDark 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'rgba(255, 255, 255, 0.7)',
  borderColor: isDark 
    ? 'rgba(255, 255, 255, 0.25)' 
    : 'rgba(0, 0, 0, 0.1)',
  borderWidth: '1px'
}
```

**Color Tints:**
- Selected/Active: Blue tint (rgba(59, 130, 246, 0.3))
- Completed/Check: Orange tint (matching navigation construction button)
- Cancel/Delete: Red tint (rgba(239, 68, 68, 0.3))
- Icons: White for visibility

**Spring Animations:**
- All interactive elements use spring physics
- Tap animations: scale 0.95, stiffness 400, damping 25
- Button animations: scale 0.85, stiffness 600, damping 15
- Layout transitions: stiffness 300, damping 30, mass 0.8

### 10. Component Architecture

**Parent Component (e.g., ServiceAd.js):**
- Manages button visibility and expansion state
- Handles scroll-to-center on click
- Controls modal overlay
- Passes props to form component

**Form Component (e.g., ServiceRequestForm.js):**
- Manages all form state and logic
- Handles step navigation
- Manages image upload and annotation
- Handles form submission
- Notifies parent of annotation mode changes

**File Structure:**
```
components/
  ServiceAd.js (parent, button + modal wrapper)
  ServiceRequestForm.js (form component)
pages/
  api/
    [service-name]/
      submit.js (API endpoint)
```

### 11. Configuration Points

**Make Configurable:**
- Service name and CTA text
- Number of steps
- Step titles and content
- Form fields (types, labels, validation)
- API endpoint path
- Email template
- Color scheme (dark/light mode)
- Max annotations (default: 3)
- Image upload limits
- Animation timings

**Example Configuration:**
```javascript
const serviceConfig = {
  name: "Custom Builds",
  cta: "start my order",
  steps: [
    { title: "Project Type", fields: [...] },
    { title: "Project Details", fields: [...] },
    { title: "Upload Image", fields: [...] },
    { title: "Contact Info", fields: [...] }
  ],
  apiEndpoint: "/api/custom-builds/submit",
  maxAnnotations: 3,
  imageMaxSize: { width: 1920, height: 1920, quality: 0.75 }
}
```

### 12. Accessibility & UX

**Accessibility:**
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Form validation messages

**UX Considerations:**
- Clear visual feedback on all interactions
- Loading states during submission
- Error messages with actionable guidance
- Success confirmation
- Smooth animations (no jank)
- Touch-friendly targets on mobile (min 44x44px)

### 13. Testing Requirements

**Test Cases:**
- Button click triggers spring animation
- Expansion animation is smooth
- Form navigation works correctly
- Image upload and compression works
- Annotation system functions properly
- Form submission succeeds/fails appropriately
- Responsive design works on all breakpoints
- Mobile touch interactions work correctly
- Scroll behavior is correct

### 14. Implementation Notes

**Key Technologies:**
- React with hooks (useState, useEffect, useRef)
- Framer Motion for animations
- Next.js for API routes
- Tailwind CSS for styling
- SendGrid for email (or configurable email service)
- FileReader API for image handling
- Canvas API for image compression

**Important Considerations:**
- Image compression is critical for performance
- Layout animations require shared layoutId
- Mobile touch events need special handling
- Container height management for annotation mode
- Prevent default behaviors where needed
- Handle edge cases (no image, max annotations, etc.)

### 15. Deliverables

**Required Files:**
1. Parent component (ServiceAd.js) - Button + Modal wrapper
2. Form component (ServiceRequestForm.js) - Multi-step form
3. API endpoint (submit.js) - Backend handler
4. Configuration file (serviceConfig.js) - Configurable options
5. README.md - Setup and usage instructions
6. Example implementation for one service

**Documentation:**
- Component props and API
- Configuration options
- Customization guide
- Integration instructions
- Troubleshooting common issues

## Success Criteria

The template should:
✅ Be easily reusable across different services
✅ Maintain consistent UX and animations
✅ Work seamlessly on mobile and desktop
✅ Handle form submission reliably
✅ Be well-documented and maintainable
✅ Follow React and Next.js best practices
✅ Include proper error handling
✅ Be performant and accessible

## Additional Context

- The spring animation on button click should be clearly visible before expansion
- All glassmorphic elements should maintain visual consistency
- Spacing should be carefully tuned for both mobile and desktop
- The annotation system should feel intuitive and responsive
- Form validation should be user-friendly and clear

