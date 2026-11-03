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
import Jump from './scenes/Jump';
import FlowMap from './components/FlowMap';
import { ArtifactMap } from './components/artifact/ArtifactMap';
import FlowProgressNav, { FlowProgressNavCompact } from './components/FlowProgressNav';

// Page transitions settle in place: a short fade, no blur.
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 6
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.18,
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

function ExtraLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="site-nav flow-nav-extras">
      <Link to="/artifact/resets" onClick={onNavigate}>Resets</Link>
      <Link to="/artifact/faq" onClick={onNavigate}>FAQ</Link>
      <Link to="/artifact/storage" onClick={onNavigate}>Storage</Link>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const isArtifact = location.pathname.startsWith('/artifact');
  const isText = location.pathname.startsWith('/text');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__row">
        <Link className="wordmark" to="/">TJG</Link>
        <nav className="site-nav" aria-label="Guide">
          <Link to="/text" aria-label="Text Guide" aria-current={isText ? 'page' : undefined}>Text</Link>
          <Link to="/artifact" aria-label="Digital TLJ Home" aria-current={location.pathname === '/artifact' ? 'page' : undefined}>Flow</Link>
        </nav>

        {/* Desktop: extra pages sit at the right of the top row */}
        {isArtifact && (
          <div className="hidden sm:flex items-center ml-auto">
            <ExtraLinks />
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="menu-toggle sm:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Desktop: the flow, step by step */}
      {isArtifact && (
        <div className="site-header__flow hidden sm:flex">
          <FlowProgressNav />
        </div>
      )}

      {/* Mobile: Flow progress indicator (always visible when in artifact) */}
      {isArtifact && !menuOpen && (
        <div className="sm:hidden">
          <FlowProgressNavCompact />
        </div>
      )}

      {/* Mobile menu expanded */}
      {menuOpen && (
        <div className="menu-sheet sm:hidden">
          <nav className="site-nav" aria-label="Guide (menu)">
            <Link to="/text" onClick={() => setMenuOpen(false)}>Text Guide</Link>
            <Link to="/artifact" onClick={() => setMenuOpen(false)}>Flow Map</Link>
          </nav>
          {isArtifact && (
            <>
              <FlowProgressNavCompact onNavigate={() => setMenuOpen(false)} />
              <ExtraLinks onNavigate={() => setMenuOpen(false)} />
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24 sm:pt-12">
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
              <Route path="/artifact" element={<section className="flow-page"><h1 className="scene-title text-center">Timeline Jump Flow</h1><ArtifactMap /></section>} />
              <Route path="/jump" element={<Jump />} />
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
