import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ModeSelector from './components/ModeSelector';
import Safety from './scenes/Safety';
import Clarity from './scenes/Clarity';
import VOIDScene from './scenes/VOID';
import Calibration from './scenes/Calibration';
import Implementation from './scenes/Implementation';
import Resets from './scenes/Resets';
import TextOnlyReader from './scenes/TextOnlyReader';
import StorageReveal from './scenes/Storage';
import FAQ from './scenes/FAQ';
import FlowMap from './components/FlowMap';
import { ArtifactMap } from './components/artifact/ArtifactMap';
import FlowProgressNav, { FlowProgressNavCompact } from './components/FlowProgressNav';

// Animation variants for page transitions
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: 'blur(4px)'
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: 'blur(2px)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    }
  }
};

// Stagger container variants for section reveals
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

function Header() {
  const location = useLocation();
  const isArtifact = location.pathname.startsWith('/artifact');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-300 bg-bone-50 sticky top-0 z-10">
      {/* Main nav row */}
      <div className="px-3 sm:px-4 py-2 flex items-center gap-3 text-ink-800">
        <Link className="font-bold text-sm" to="/">TJG</Link>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/text" className="text-ink-600 hover:text-ink-900 transition-colors" aria-label="Text Guide">Text</Link>
          <Link to="/artifact" className="text-ink-600 hover:text-ink-900 transition-colors" aria-label="Digital TLJ Home">Flow</Link>
        </div>

        {/* Desktop: Flow progress nav */}
        {isArtifact && (
          <div className="hidden sm:flex items-center ml-auto">
            <FlowProgressNav />
            <span className="mx-2 text-slate-300">|</span>
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <Link to="/artifact/resets" className="hover:text-ink-700 transition-colors">Resets</Link>
              <Link to="/artifact/faq" className="hover:text-ink-700 transition-colors">FAQ</Link>
              <Link to="/artifact/storage" className="hover:text-ink-700 transition-colors">Storage</Link>
            </div>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="ml-auto sm:hidden px-2 py-1.5 text-xs border border-slate-300 rounded min-h-[36px]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Mobile: Flow progress indicator (always visible when in artifact) */}
      {isArtifact && !menuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-bone-50">
          <FlowProgressNavCompact />
        </div>
      )}

      {/* Mobile menu expanded */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-bone-50 p-3">
          <div className="grid gap-3">
            <div className="flex items-center gap-4 text-sm">
              <Link to="/text" onClick={() => setMenuOpen(false)} className="text-ink-700">Text Guide</Link>
              <Link to="/artifact" onClick={() => setMenuOpen(false)} className="text-ink-700">Flow Map</Link>
            </div>
            {isArtifact && (
              <>
                <div className="border-t border-slate-100 pt-3">
                  <FlowProgressNavCompact onNavigate={() => setMenuOpen(false)} />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-ink-500 pt-2 border-t border-slate-100">
                  <Link to="/artifact/resets" onClick={() => setMenuOpen(false)}>Resets</Link>
                  <Link to="/artifact/faq" onClick={() => setMenuOpen(false)}>FAQ</Link>
                  <Link to="/artifact/storage" onClick={() => setMenuOpen(false)}>Storage</Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-ink-900 overflow-x-hidden">
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
          >
            <Routes location={location}>
              <Route path="/" element={<ModeSelector />} />
              <Route path="/text" element={<TextOnlyReader />} />
              <Route path="/artifact" element={<section className="grid gap-3"><h1 className="text-2xl font-bold doto-base doto-700 text-center">Timeline Jump Flow</h1><ArtifactMap /></section>} />
              <Route path="/artifact/safety" element={<Safety />} />
              <Route path="/artifact/clarity" element={<Clarity />} />
              <Route path="/artifact/void" element={<VOIDScene />} />
              <Route path="/artifact/calibration" element={<Calibration />} />
              <Route path="/artifact/implementation" element={<Implementation />} />
              <Route path="/artifact/runtime" element={<Navigate to="/artifact/implementation" replace />} />
              <Route path="/artifact/resets" element={<Resets />} />
              <Route path="/artifact/faq" element={<FAQ />} />
              <Route path="/artifact/storage" element={<StorageReveal />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
