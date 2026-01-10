# Background Contrast Detection Code Review & Cleanup Prompt

## Context
We have a background contrast detection system that should automatically change button text color (black/white) based on the brightness of images behind the buttons. Currently, there are issues where:
- Buttons show white text on white images (should be black)
- Detection may not be working reliably
- Code may have theme-based fallbacks that interfere with image-based detection

## Files to Review

1. **`hooks/useBackgroundContrast.js`** - Main detection hook
2. **`components/ui/Button.js`** - Button component using the hook
3. **`components/pages/ImageContainer.js`** - Lighting tool image container
4. **`components/general-edit/components/ImageContainer.js`** - General edit tool image container
5. **`components/pages/LightingInterface.js`** - Lighting interface component

## Review Tasks

### 1. Code Structure & Logic Review

**Check for:**
- [ ] Are there any theme-based conditions (`isDark`, `dark:` classes) that override image detection?
- [ ] Is the detection hook properly finding IMG elements behind buttons?
- [ ] Are there any CSS rules in `styles/globals.css` that force text colors based on theme?
- [ ] Is the threshold value (128) appropriate for detecting light vs dark backgrounds?
- [ ] Are there any race conditions where detection runs before images are loaded?

**Questions to answer:**
- Does the hook properly wait for images to load before detecting?
- Is the pixel sampling accurate (3x3 area vs single pixel)?
- Are we checking all possible image sources (originalSrc, processedSrc, upscaledImage)?
- Is the fallback logic appropriate (default to white text if no image found)?

### 2. Detection Algorithm Review

**Verify:**
- [ ] The `sampleImagePixel` function correctly samples image pixels
- [ ] Brightness calculation uses proper weights: `(r * 0.299 + g * 0.587 + b * 0.114)`
- [ ] The detection searches for images in the correct order (direct → viewport → parent containers)
- [ ] CORS errors are handled gracefully
- [ ] Multiple sample points are used for accuracy

**Check:**
- Does `elementFromPoint` work correctly when button has `pointer-events: none`?
- Are images with `pointer-events: none` still detectable?
- Is the overlap detection logic correct (tolerance, distance calculation)?

### 3. Integration Review

**Verify:**
- [ ] Button component properly uses the hook's `textColor` value
- [ ] Inline styles override CSS classes correctly
- [ ] No className text color classes conflict with detection
- [ ] The `detectContrast` prop can disable detection when needed
- [ ] Ref is properly attached to the button element

**Check:**
- Are there any places where buttons explicitly set `text-white` or `text-black` classes?
- Does the inline `color` style properly override global CSS?
- Is the detection enabled by default for all buttons?

### 4. Performance & Reliability

**Optimize:**
- [ ] Debouncing/throttling for scroll/resize events
- [ ] Image load event listeners are properly cleaned up
- [ ] MutationObserver doesn't cause performance issues
- [ ] Detection doesn't run unnecessarily (only when images change)
- [ ] Canvas operations are efficient

**Check:**
- Are there memory leaks from event listeners?
- Is detection called too frequently?
- Can we cache detection results for static images?

### 5. Edge Cases

**Handle:**
- [ ] Images that haven't loaded yet (`!img.complete`)
- [ ] Images with zero dimensions
- [ ] CORS-restricted images
- [ ] Multiple images overlapping
- [ ] Buttons positioned outside image bounds
- [ ] Images that change dynamically (src changes)
- [ ] Very large images (performance)

### 6. Cleanup Tasks

**Remove:**
- [ ] Any theme-based text color logic from image containers
- [ ] Unused variables or functions
- [ ] Commented-out code
- [ ] Debug console.logs (or make them conditional)
- [ ] Redundant detection attempts

**Refactor:**
- [ ] Extract magic numbers (threshold, tolerance, sample size) to constants
- [ ] Simplify complex nested conditionals
- [ ] Add JSDoc comments for functions
- [ ] Group related logic together
- [ ] Improve error handling

### 7. Testing Checklist

**Test scenarios:**
- [ ] White image → buttons show black text
- [ ] Dark image → buttons show white text
- [ ] Mixed brightness image → appropriate text color
- [ ] No image uploaded → default to white text
- [ ] Image changes dynamically → text color updates
- [ ] Theme switches → text color stays based on image (not theme)
- [ ] Multiple buttons on same image → all adapt correctly
- [ ] Buttons on different parts of image → adapt to local brightness

## Expected Behavior

1. **Detection Priority:**
   - First: Sample pixels from images directly behind button
   - Second: Find images in viewport that overlap with button
   - Third: Search parent containers for images
   - Last: Default to white text (assume dark background)

2. **No Theme Interference:**
   - Text color should NEVER be based on dark/light theme
   - Only image brightness should determine text color
   - Theme changes should NOT trigger re-detection

3. **Reliability:**
   - Detection should work even if images load slowly
   - Should handle image src changes
   - Should work with CORS-restricted images (fallback to dark)

## Deliverables

After review, provide:
1. **Clean refactored code** with all issues fixed
2. **Documentation** explaining how the detection works
3. **List of changes** made during cleanup
4. **Testing results** for each scenario above
5. **Performance improvements** if any were made

## Code Quality Standards

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code style
- Ensure no console errors or warnings
- Optimize for performance
- Handle all edge cases gracefully

