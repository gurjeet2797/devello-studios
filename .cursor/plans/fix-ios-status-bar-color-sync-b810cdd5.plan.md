<!-- b810cdd5-e43b-4fcc-99cd-7838add64053 100496e8-58b2-49ca-941b-a03b138296d7 -->
# Fix Status Bar Theme Sync Bugs

## Root Causes Identified

1. **querySelector may return null**: `document.querySelector('meta[name="theme-color"]')` might not find the meta tag if DOM isn't ready or Next.js has moved it
2. **No direct update on toggle**: `toggleTheme` relies on useEffect which may have timing/closure issues
3. **Single meta tag update**: Only updates first found meta tag, but there might be multiple or none found
4. **Property vs attribute**: Using `.content` property instead of `setAttribute` which might not trigger browser updates
5. **iOS Safari caching**: iOS Safari may cache meta tag values and need forced refresh
6. **CSS overrides with old color**: CSS rules in `globals.css` use `#0a0a0a` instead of `#000000` which may override JavaScript updates:

- Line 170: `html { background: #0a0a0a; }`
- Line 186: `body { background: #0a0a0a; }`
- Line 78: `--dark-bg: #0a0a0a;` CSS variable
- Line 96: `.dark { --light-bg: #0a0a0a; }` CSS variable override

7. **GlobalBackground component conflict**: `components/GlobalBackground.js` line 69 uses `#0a0a0a` instead of `#000000` for dark mode background

## Implementation Plan

### 1. Enhance Meta Tag Update Logic

- Use `querySelectorAll` to find ALL `theme-color` meta tags and update them all
- Use `setAttribute('content', bgColor)` instead of `.content` property for better browser compatibility
- Add fallback to create meta tag if none exists
- Update `apple-mobile-web-app-status-bar-style` dynamically based on theme

### 2. Add Direct Status Bar Update in toggleTheme

- Call status bar update function directly in `toggleTheme` before state update
- Add immediate update after state update with setTimeout
- Ensure update runs synchronously and asynchronously

### 3. Improve Status Bar Update Function

- Add retry logic with multiple attempts (immediate, 50ms, 100ms, 300ms, 500ms)
- Use `querySelectorAll` to update all matching meta tags
- Add better error handling and logging
- Force iOS Safari refresh by removing and re-adding meta tag if needed

### 4. Fix Initial Load Script

- Update `_document.js` inline script to also set initial meta tag color based on saved preference
- Ensure script runs before React hydration

### 5. Add Next.js Head Component Update (Optional)

- Consider using Next.js `Head` component to dynamically update meta tags instead of querySelector
- This ensures Next.js manages the meta tags properly

## Files to Modify

- `components/Layout.js` - Enhance updateStatusBar function, add direct call in toggleTheme, improve meta tag handling
- `pages/_document.js` - Update initial script to set meta tag color

### To-dos

- [ ] Update _document.js script to set initial theme-color meta tag based on saved preference
- [ ] Enhance status bar update function with retries and longer delays for iOS Safari
- [ ] Dynamically update apple-mobile-web-app-status-bar-style meta tag based on theme
- [ ] Add immediate status bar update call in toggleTheme function
- [ ] Add useEffect to force status bar update after theme initialization