# PWA Install Guide

## Overview

The Timeline Jumping Artifact PWA now includes a comprehensive install prompt system that works across all major platforms:

- **Desktop (Chrome/Edge)**: Native install prompt with "Install App" button
- **Android (Chrome)**: Native A2HS (Add to Home Screen) prompt
- **iOS (Safari)**: Manual instructions for Share → Add to Home Screen

## Features

### Install Prompt Component

The `InstallPrompt` component automatically appears when:
- The app is not already installed/standalone
- The user hasn't previously dismissed the prompt
- The browser supports PWA installation

### Platform-Specific Behavior

#### Desktop (Chrome/Edge)
- Shows "Install App" button when `beforeinstallprompt` event is available
- Installs as standalone window with taskbar/dock entry
- Supports window controls overlay for better desktop UX

#### Android (Chrome)
- Native install prompt triggered by "Install App" button
- App installs to home screen with proper icon
- Full offline capability with service worker caching

#### iOS (Safari)
- No native `beforeinstallprompt` support
- Shows manual instructions: "Tap Share button → Add to Home Screen"
- App launches full-screen without browser chrome when installed

### Dismissal and Persistence

- Users can dismiss the prompt with the X button
- Dismissal is persisted in localStorage (`tja_install_prompt_dismissed_v1`)
- Prompt stays hidden across sessions after dismissal

## Technical Implementation

### Files Added/Modified

#### New Files
- `src/hooks/useInstallPrompt.ts` - Custom hook for install prompt logic
- `src/components/InstallPrompt.tsx` - UI component for install prompt

#### Modified Files
- `src/App.tsx` - Added InstallPrompt component
- `index.html` - Enhanced iOS meta tags
- `vite.config.ts` - Improved PWA manifest configuration
- `public/icons/` - Generated proper PNG icons from SVG

### PWA Configuration

#### Manifest Features
- `display: 'standalone'` - App opens in its own window
- `display_override: ['window-controls-overlay', 'standalone']` - Enhanced desktop UX
- `shortcuts` - Quick access to main sections
- Proper theme colors matching app design

#### Service Worker
- Auto-update registration
- Offline caching for core app files
- Large model file caching (50MB limit)

#### Icons
- 192x192 and 512x512 PNG icons (maskable and any purpose)
- SVG fallback icon
- Proper iOS touch icon

## Testing

### Manual Testing Steps

1. **Desktop Testing**:
   ```bash
   npm run build && npm run preview
   ```
   - Visit preview URL in Chrome/Edge
   - Look for install icon in omnibox or "Install App" button
   - Verify app opens in standalone window

2. **Mobile Testing**:
   - Android: Use Chrome, interact with app, tap "Install App"
   - iOS: Use Safari, follow manual instructions in prompt

3. **Offline Testing**:
   - Install app, disconnect internet
   - Verify core functionality works offline
   - Check that updates apply on next connection

### Browser Support

- ✅ Chrome (Desktop/Android)
- ✅ Edge (Desktop)
- ✅ Safari (iOS) - Manual install
- ⚠️ Firefox - Limited PWA support
- ⚠️ Safari (Desktop) - No PWA support

## Deployment

### Build Process
```bash
npm run build
```

### Hosting Requirements
- HTTPS required for PWA functionality
- Root domain or subdomain (not subdirectory)
- Static file hosting (Netlify, Vercel, Cloudflare Pages, etc.)

### Deployment Checklist
- [ ] Build completes successfully
- [ ] Icons are properly generated
- [ ] Service worker is included in build
- [ ] Manifest file is generated
- [ ] HTTPS is enabled on hosting
- [ ] Test install flow on target devices

## Troubleshooting

### Common Issues

1. **Install prompt not showing**:
   - Check if app is already installed/standalone
   - Verify browser supports PWA installation
   - Check localStorage for dismissal state

2. **Icons not displaying**:
   - Ensure PNG files are properly generated
   - Verify manifest icon paths are correct
   - Check file sizes (should be reasonable, not 9 bytes)

3. **Offline not working**:
   - Verify service worker is registered
   - Check workbox caching configuration
   - Test with browser dev tools offline mode

### Debug Commands

```bash
# Check PWA manifest
curl https://your-domain.com/manifest.webmanifest

# Verify service worker
# Open browser dev tools → Application → Service Workers

# Test offline functionality
# Dev tools → Network → Offline checkbox
```

## Future Enhancements

- [ ] Add install button to header for desktop
- [ ] Implement app update notifications
- [ ] Add more sophisticated iOS detection
- [ ] Consider app shortcuts for quick actions
- [ ] Add analytics for install success rates
