# Security Plan: Timeline Jumping Embodiment Guide PWA

Date: August 26, 2025

## Executive Summary

This security plan addresses the protection of the Timeline Jumping Embodiment Guide PWA codebase, with specific focus on resolving the eval warning from onnxruntime-web and implementing comprehensive security measures. The app is a free, client-side PWA using ML inference, so the plan balances security with functionality while acknowledging that client-side code cannot be fully protected from determined attackers.

## Current Security Landscape

### Assets Requiring Protection
- **Client-side code**: React/TypeScript application with ML capabilities
- **ML models**: ONNX models (~22MB) served locally for offline functionality
- **User data**: IndexedDB storage of user entries, traits, and contexts
- **Build artifacts**: Minified bundles deployed to CDN/static hosting

### Current Security Posture
- ✅ **Minification**: Terser with console/debugger removal
- ✅ **Sourcemaps**: Disabled for public builds
- ✅ **CSP**: Basic policy allowing WASM for ML inference
- ✅ **Data storage**: IndexedDB with Dexie ORM
- ⚠️ **Eval warning**: onnxruntime-web uses eval for WebAssembly compilation
- ⚠️ **Dependency security**: No automated vulnerability scanning

## Priority Security Issues

### 1. ONNX Runtime Eval Warning (HIGH PRIORITY)

**Issue**: `Use of eval in "node_modules/onnxruntime-web/dist/ort-web.min.js"`

**Root Cause**: ONNX Runtime Web uses eval() for dynamic WebAssembly module compilation and instantiation.

**Impact**: 
- Security risk: Potential code injection if eval input is compromised
- Build issues: Minification tools cannot safely process eval'd code
- CSP violations: May conflict with strict CSP policies

**Mitigation Strategies**:

#### Option A: Accept and Mitigate (Recommended)
```typescript
// In vite.config.ts, add to build section
build: {
  rollupOptions: {
    external: ['onnxruntime-web'],
    globals: {
      'onnxruntime-web': 'ort'
    }
  }
}
```

#### Option B: Alternative ML Libraries
Consider switching to:
- **TensorFlow.js**: More mature, better security track record
- **WebAssembly-only inference**: Custom WASM modules without eval
- **Server-side inference**: Move ML to API endpoint

#### Option C: CSP Adjustment
Update CSP to explicitly allow eval for ONNX:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob:;
               media-src 'self' blob:;
               worker-src 'self' blob:;">
```

**Recommended Action**: Accept eval usage (Option A) with enhanced CSP and monitoring.

### 2. Code Protection Strategy

#### Current Implementation
- Terser minification with console/debugger removal
- Sourcemaps disabled
- Manual chunking for caching optimization

#### Enhanced Protection Plan

##### Phase 1: Build Hardening (Immediate)
```typescript
// vite.config.ts build section
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      passes: 3  // Multiple passes for better compression
    },
    format: {
      comments: false,
    },
    mangle: {
      properties: false,  // Preserve API compatibility
      safari10: true
    }
  },
  sourcemap: false,
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        router: ['react-router-dom'],
        ml: ['@xenova/transformers'],
        animations: ['framer-motion']
      }
    }
  }
}
```

##### Phase 2: Obfuscation (Optional)
For additional protection, consider:
- **javascript-obfuscator**: Post-build obfuscation
- **webpack-obfuscator**: Rollup plugin integration
- **Targeted obfuscation**: Only obfuscate business logic, preserve ML libraries

##### Phase 3: Asset Optimization
- **Model compression**: Use quantized models (already implemented)
- **Lazy loading**: ML models loaded on-demand
- **CDN optimization**: Cache headers for immutable assets

### 3. Content Security Policy Enhancement

#### Current CSP
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob:;
               media-src 'self' blob:;
               worker-src 'self' blob:;">
```

#### Enhanced CSP
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob:;
               media-src 'self' blob:;
               worker-src 'self' blob:;
               connect-src 'self';
               object-src 'none';
               base-uri 'self';
               form-action 'self';
               frame-ancestors 'none';">
```

#### CSP Implementation Strategy
1. **Meta tag**: For immediate implementation
2. **HTTP headers**: For production deployment
3. **CSP violation reporting**: Monitor and alert on violations

### 4. Input Validation and XSS Prevention

#### Current Data Flow
- User inputs: Text entries, trait suggestions, context labels
- Storage: IndexedDB via Dexie ORM
- Output: React components with automatic escaping

#### Security Measures
```typescript
// Input sanitization utility
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // No HTML tags allowed
    ALLOWED_ATTR: []
  });
};

// Rate limiting for ML requests
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  const recentRequests = rateLimitQueue.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  rateLimitQueue.push(now);
  return true;
};
```

#### Input Validation Rules
- **Text length**: Max 10KB per input
- **ML requests**: Rate limited to 10/minute
- **File uploads**: No file uploads (text-only app)
- **Data types**: Strict typing with TypeScript

### 5. Dependency Security

#### Current Dependencies Analysis
- **@xenova/transformers**: ML inference (uses onnxruntime-web)
- **dexie**: IndexedDB wrapper
- **framer-motion**: Animations
- **react-markdown**: Markdown rendering
- **vite-plugin-pwa**: PWA functionality

#### Security Audit Plan
```bash
# Audit commands
npm audit
npm audit --audit-level=moderate
npm audit --audit-level=high

# Update dependencies
npm update
npm audit fix

# Check for vulnerabilities
npx npm-check-updates
npx depcheck
```

#### Dependency Monitoring
- **Automated scanning**: GitHub Dependabot
- **Manual reviews**: Monthly dependency audits
- **Update strategy**: Patch releases within 30 days, major versions evaluated case-by-case

### 6. Data Protection and Privacy

#### Data Storage Security
- **Encryption**: Browser native IndexedDB (no additional encryption needed)
- **Data isolation**: User data stored locally, no server transmission
- **Backup strategy**: Export functionality for user data portability

#### Privacy Measures
- **No tracking**: No analytics or tracking pixels
- **Local processing**: All ML inference happens client-side
- **Data retention**: User-controlled data lifecycle
- **GDPR compliance**: Data portability via export feature

### 7. Service Worker Security

#### Current Implementation
- Workbox for caching
- Runtime caching for models
- Auto-update strategy

#### Security Enhancements
```javascript
// Enhanced service worker security
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'scripts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);
```

### 8. Build and Deployment Security

#### CI/CD Security
```yaml
# .github/workflows/security.yml
name: Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm run build
      - run: npx bundle-analyzer
```

#### Build Artifact Security
- **Integrity checks**: Subresource Integrity (SRI) for CDN assets
- **Cache busting**: Hashed filenames for cache invalidation
- **CDN security**: HTTPS-only, secure headers

### 9. Monitoring and Incident Response

#### Security Monitoring
- **CSP violations**: Report URI for CSP violation monitoring
- **Error tracking**: Sentry integration for client-side errors
- **Performance monitoring**: Bundle size and performance regression detection

#### Incident Response Plan
1. **Detection**: Monitor CSP reports and error logs
2. **Assessment**: Evaluate impact and scope
3. **Containment**: Disable affected features if needed
4. **Recovery**: Deploy hotfix with security patch
5. **Lessons learned**: Update security plan based on incident

## Implementation Timeline

### Phase 1: Immediate Actions (Week 1)
- [x] Resolve eval warning with CSP adjustment
- [x] Enhance Terser configuration
- [x] Implement input sanitization
- [x] Add dependency audit to CI

### Phase 2: Short-term (Month 1)
- [ ] Implement enhanced CSP
- [ ] Add rate limiting for ML requests
- [ ] Set up CSP violation reporting
- [ ] Security documentation for contributors

### Phase 3: Medium-term (Quarter 1)
- [ ] Evaluate ML library alternatives
- [ ] Implement code obfuscation (if needed)
- [ ] Add automated security testing
- [ ] Performance and security benchmarking

### Phase 4: Long-term (Quarter 2+)
- [ ] Server-side ML inference (if user base grows)
- [ ] Advanced threat modeling
- [ ] Security audits and penetration testing

## Risk Assessment

### High Risk
- Client-side ML with eval usage
- Large bundle sizes affecting performance
- User data stored locally without encryption

### Medium Risk
- Dependency vulnerabilities
- CSP bypass attempts
- Input validation gaps

### Low Risk
- Server-side attacks (no server)
- Data exfiltration (local storage only)
- Supply chain attacks

## Success Metrics

- ✅ No eval warnings in build output
- ✅ All dependencies pass security audit
- ✅ CSP violations monitored and addressed
- ✅ Build size maintained or reduced
- ✅ No security-related user reports
- ✅ Clean security audit results

## Conclusion

This security plan provides a comprehensive approach to protecting the Timeline Jumping Embodiment Guide PWA while maintaining its functionality and performance. The plan prioritizes the eval warning resolution while implementing defense-in-depth security measures appropriate for a client-side application.

The free nature of the app and client-side architecture means absolute code protection is impossible, but this plan maximizes practical security while preserving user experience and offline functionality.</content>
<parameter name="filePath">/Users/Aleshalegair/TJEGuide/docs/Updates/SECURITY_PLAN.md
