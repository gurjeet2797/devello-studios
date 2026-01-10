# Local Testing Guide - Mobile Optimized

## Overview
This guide helps you test Devello Inc locally with mobile optimization, HEIC support, and efficient development workflow.

## Quick Start

### 1. Local Development Setup
```bash
# Copy local environment configuration
cp .env.local .env

# Install dependencies (if not already done)
npm install

# Start mobile-optimized development server
.\dev-mobile.ps1
```

### 2. Mobile Testing Setup
1. **Connect to same WiFi network** as your development machine
2. **Get your local IP** (shown by the dev script)
3. **Open Safari on iPhone/iPad** and navigate to `http://[YOUR-IP]:3000`
4. **Test HEIC file uploads** from your device camera

## Testing Workflows

### Desktop Testing
- **Local URL**: `http://localhost:3000`
- **Features**: Full desktop functionality
- **File Types**: All supported formats
- **Performance**: Full resolution processing

### Mobile Testing
- **Mobile URL**: `http://[YOUR-IP]:3000`
- **Features**: Touch-optimized interface
- **File Types**: HEIC/HEIF support
- **Performance**: Mobile-optimized processing

## Mobile-Specific Features

### HEIC/HEIF Support
- **Automatic Conversion**: HEIC files converted to JPEG
- **Quality Preservation**: Maintains image quality during conversion
- **Size Optimization**: Compressed for faster uploads
- **Fallback Handling**: Original file used if conversion fails

### Touch Optimization
- **Button Sizes**: Minimum 44px for touch targets
- **Visual Feedback**: Opacity changes on touch
- **Drag & Drop**: Touch-friendly file selection
- **Responsive Design**: Adapts to screen orientation

### Performance Monitoring
- **Upload Speed**: Real-time progress tracking
- **Memory Usage**: Optimized for mobile devices
- **Processing Time**: Performance metrics logging
- **Error Handling**: Mobile-specific error messages

## Testing Scenarios

### 1. HEIC File Upload
```
1. Take photo with iPhone/iPad camera
2. Upload to application
3. Verify HEIC to JPEG conversion
4. Check image quality after processing
5. Test AI enhancement features
```

### 2. Touch Interaction Testing
```
1. Test file upload button responsiveness
2. Verify drag-and-drop on touch devices
3. Check button sizes meet accessibility standards
4. Test in portrait and landscape orientations
5. Verify visual feedback on touch
```

### 3. Performance Testing
```
1. Upload large HEIC files (>10MB)
2. Monitor upload progress and speed
3. Test with slow network conditions
4. Check memory usage during processing
5. Verify processing time is acceptable
```

### 4. Cross-Device Testing
```
1. Test on iPhone (portrait/landscape)
2. Test on iPad (portrait/landscape)
3. Test on Android devices
4. Verify responsive design on all screen sizes
5. Check accessibility features
```

## Environment Configuration

### Local Development (.env.local)
```env
# Development Settings
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug

# Mobile Testing
MOBILE_OPTIMIZATION=true
HEIC_SUPPORT=true
TOUCH_OPTIMIZATION=true
ENABLE_MOBILE_DEBUG=true

# Real Services (for testing)
ENABLE_MOCK_SERVICES=false
ENABLE_REAL_SERVICES=true
```

### Production Testing (.env)
```env
# Production Settings
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=error

# Mobile Optimization
MOBILE_OPTIMIZATION=true
HEIC_SUPPORT=true
TOUCH_OPTIMIZATION=true
ENABLE_MOBILE_DEBUG=false
```

## Development Scripts

### Mobile Development
```powershell
# Start mobile-optimized development
.\dev-mobile.ps1
```

### Standard Development
```powershell
# Start standard development
npm run dev
```

### Production Build Testing
```powershell
# Build and test production version
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### 1. Mobile Device Can't Connect
- **Check WiFi**: Ensure both devices on same network
- **Firewall**: Allow port 3000 through firewall
- **IP Address**: Verify correct IP address is shown

#### 2. HEIC Files Not Converting
- **Browser Support**: Check if browser supports HEIC
- **File Size**: Verify file isn't too large
- **Network**: Check upload speed and stability

#### 3. Touch Interactions Not Working
- **Touch Events**: Verify touch event listeners are active
- **CSS**: Check for conflicting CSS that blocks touch
- **JavaScript**: Ensure no JavaScript errors

#### 4. Performance Issues
- **File Size**: Reduce file size for testing
- **Network**: Test on faster network connection
- **Device**: Try on different device/emulator

### Debug Commands
```bash
# Check mobile configuration
node -e "console.log(require('./lib/config.js').default.mobile)"

# Test HEIC conversion
node -e "const {isHeicFile} = require('./lib/mobileImageUtils.js'); console.log('HEIC support:', typeof isHeicFile)"

# Monitor performance
npm run dev -- --profile
```

## Best Practices

### 1. Testing Strategy
- **Start Local**: Test basic functionality locally first
- **Mobile Early**: Test mobile features early in development
- **Real Devices**: Use actual devices, not just emulators
- **Network Conditions**: Test on various network speeds

### 2. Performance Optimization
- **Image Compression**: Use appropriate compression settings
- **Lazy Loading**: Implement lazy loading for large images
- **Caching**: Enable browser caching for static assets
- **CDN**: Use CDN for production deployments

### 3. User Experience
- **Loading States**: Show loading indicators during processing
- **Error Messages**: Provide clear, actionable error messages
- **Progress Feedback**: Show upload and processing progress
- **Accessibility**: Ensure WCAG compliance

### 4. Development Workflow
- **Feature Branches**: Use feature branches for new development
- **Testing**: Test on multiple devices before merging
- **Documentation**: Update documentation with new features
- **Monitoring**: Monitor performance metrics in production

## Next Steps

1. **Set up your environment** with real Supabase and Replicate credentials
2. **Test HEIC uploads** from your mobile devices
3. **Verify touch interactions** work correctly
4. **Monitor performance** and optimize as needed
5. **Deploy to Vercel** when ready for production

## Support

For additional help:
- Check browser console for JavaScript errors
- Monitor network tab for API issues
- Review mobile performance metrics
- Test on different devices and browsers
