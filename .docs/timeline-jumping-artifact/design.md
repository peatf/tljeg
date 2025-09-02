# Design: Timeline Jumping Digital Artifact PWA

## Architecture Overview

The Timeline Jumping PWA follows an offline-first, privacy-preserving architecture:

```mermaid
graph TB
    subgraph "Client Device"
        PWA[PWA Shell]
        SW[Service Worker]
        IDB[(IndexedDB)]
        WW[Web Worker]
        ML[ML Engine]
        
        PWA --> SW
        PWA --> IDB
        PWA --> WW
        WW --> ML
        ML --> IDB
    end
    
    subgraph "Local Assets"
        CACHE[Asset Cache]
        CORPUS[Seed Corpus]
        MODELS[ML Models]
        
        SW --> CACHE
        ML --> CORPUS
        ML --> MODELS
    end
Core Principles

Zero External Dependencies: No CDNs, analytics, or external APIs
Local-First ML: All inference happens on-device via transformers.js
Immutable Privacy: Data never leaves the device
Graceful Degradation: Features degrade elegantly on lower-end devices
Key Components & Interfaces

Scene Manager


interface SceneManager {
  currentScene: SceneType;
  flowMap: Map<SceneType, SceneConfig>;
  navigate(to: SceneType): void;
  getProgress(): SceneProgress;
}
ML Service (Two-Layer System)


interface MLService {
  coldStart: {
    suggestTraits(text: string): Promise<Trait[]>;
    suggestContexts(): Context[];
    reframeToNeutral(text: string): string;
  };
  personalized: {
    recallTraits(userId: string): Trait[];
    surfacePatterns(userId: string): Pattern[];
    suggestFromHistory(context: string): Suggestion[];
  };
}
Gesture Controller


interface GestureController {
  registerGesture(scene: SceneType, gesture: GestureConfig): void;
  handleTwoFingerTap(): void;
  provideHapticFeedback(type: FeedbackType): void;
}
Audio Manager


interface AudioManager {
  importAudio(file: File): Promise<void>;
  cacheAudio(id: string, blob: Blob): void;
  playSegment(id: string, start?: number, duration?: number): void;
}
Data Models

User Session


interface UserSession {
  id: string;
  mode: 'text-only' | 'artifact';
  currentScene: SceneType;
  progress: Map<SceneType, SceneData>;
  createdAt: Date;
  lastActive: Date;
}
Scene Data


interface SceneData {
  safety: {
    environment: string[];
    consent: 'proceed' | 'not-yet' | 'part-says-no';
    reflection?: string;
  };
  clarity: {
    traits: Trait[];
    chosenTrait: Trait;
    overlaps: string[];
  };
  calibration: {
    evidence: string;
    context: string;
    friction: string;
  };
  void: {
    labels: string[];
    duration: number;
    reflection: string;
  };
  runtime: {
    label: string;
    principle: string;
    microActs: string[];
    friction: string;
    logs: LogEntry[];
  };
}
ML Seed Corpus


interface SeedCorpus {
  traits: {
    category: string;
    examples: string[];
    somaticCues: string[];
  }[];
  contexts: {
    mundane: string[];
    frictions: string[];
    microActs: string[];
  };
  neutralFrames: Map<string, string>;
}
Tech Stack

Frontend

Framework: React 18 with TypeScript
State: Zustand for scene state, IndexedDB for persistence
Styling: CSS Modules with design tokens
Animations: Framer Motion with reduced-motion support
PWA Infrastructure

Service Worker: Workbox for caching strategies
Storage: IndexedDB via Dexie.js
Manifest: Web App Manifest with all icon sizes
ML Pipeline

Runtime: transformers.js in Web Worker
Models: Quantized MiniLM-L6-v2 for embeddings
Tokenization: Fast tokenizer with custom vocabulary
Inference: ONNX runtime with WebGL acceleration
Build & Bundle

Bundler: Vite with PWA plugin
Compression: Brotli for assets, model quantization
Code Splitting: Lazy load scenes, aggressive tree-shaking
Error Handling & Resilience

Offline Edge Cases

Model Loading Failure: Fall back to keyword matching
Storage Quota Exceeded: Prompt user to export/clear old data
Audio Import Failure: Show supported formats, size limits
Worker Crash: Restart with exponential backoff
Graceful Degradation Strategy


enum DegradationLevel {
  FULL = 'all features available',
  REDUCED_ML = 'keyword matching only',
  BASIC = 'text and navigation only',
  READONLY = 'text-only mode forced'
}
Recovery Mechanisms

Auto-save every 30 seconds to IndexedDB
Session recovery on app restart
Export data before clearing storage
Versioned data migration on updates
Testing Strategies

Unit Testing

Component isolation with React Testing Library
ML service mocking for deterministic tests
Gesture handler edge cases
Data model validation
Integration Testing

Scene navigation flows
ML pipeline end-to-end
Audio import and playback
Storage quota handling
Performance Testing

Time to Interactive (TTI) < 3s
ML inference < 500ms on 2019 devices
60fps animations on mid-range phones
Memory usage < 150MB active
Offline Testing

Complete scene flow without network
ML inference with cached models
Audio playback from cache
Data persistence across sessions
Security Considerations

Content Security Policy


<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob:;
               media-src 'self' blob:;
               worker-src 'self' blob:;">
Data Sanitization

XSS prevention on all user inputs
File type validation for audio imports
Size limits on text inputs (10KB max)
Rate limiting on ML requests (10/min)
Performance Optimizations

Critical Rendering Path

Inline critical CSS
Preload ML models in worker
Lazy load scene components
Virtual scrolling for logs
Memory Management

Cleanup unused scene data
Limit log history to 100 entries
Compress old sessions
Model unloading when inactive