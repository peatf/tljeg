import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
import { InstallPrompt } from './components/InstallPrompt';

function Header() {
  const location = useLocation();
  const isArtifact = location.pathname.startsWith('/artifact');
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="px-3 sm:px-4 py-3 border-b border-slate-300 bg-bone-50 sticky top-0 z-10">
      <nav className="flex items-center gap-3 text-ink-800">
        <Link className="font-bold" to="/">TGJ</Link>
        <span className="hidden sm:inline text-slate-500">|</span>
        <div className="hidden sm:flex items-center gap-3">
          <Link to="/text" aria-label="Text Guide">Text Guide</Link>
          <Link to="/artifact" aria-label="Digital TLJ Home">Digital TLJ</Link>
        </div>
        <button
          className="ml-auto sm:hidden px-3 py-2 border rounded min-h-[44px]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          Menu
        </button>
        <div className="ml-auto hidden sm:flex items-center gap-3 text-sm">
          {isArtifact && (
            <>
              <Link to="/artifact/safety">Safety</Link>
              <Link to="/artifact/clarity">Clarity</Link>
              <Link to="/artifact/void">VOID</Link>
              <Link to="/artifact/calibration">Calibration</Link>
              <Link to="/artifact/implementation">Implementation</Link>
              <Link to="/artifact/resets">Resets</Link>
              <Link to="/artifact/faq">FAQ</Link>
              <Link to="/artifact/storage">Storage</Link>
            </>
          )}
        </div>
      </nav>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-2 grid gap-2 border-t border-slate-200 pt-2 text-ink-800">
          <div className="flex items-center gap-3">
            <Link to="/text" onClick={() => setMenuOpen(false)} aria-label="Text Guide (mobile)">Text Guide</Link>
            <Link to="/artifact" onClick={() => setMenuOpen(false)} aria-label="Digital TLJ Home (mobile)">Digital TLJ</Link>
          </div>
          {isArtifact && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/artifact/safety" onClick={() => setMenuOpen(false)}>Safety</Link>
              <Link to="/artifact/clarity" onClick={() => setMenuOpen(false)}>Clarity</Link>
              <Link to="/artifact/void" onClick={() => setMenuOpen(false)}>VOID</Link>
              <Link to="/artifact/calibration" onClick={() => setMenuOpen(false)}>Calibration</Link>
              <Link to="/artifact/implementation" onClick={() => setMenuOpen(false)}>Implementation</Link>
              <Link to="/artifact/resets" onClick={() => setMenuOpen(false)}>Resets</Link>
              <Link to="/artifact/faq" onClick={() => setMenuOpen(false)}>FAQ</Link>
              <Link to="/artifact/storage" onClick={() => setMenuOpen(false)}>Storage</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen text-ink-900 overflow-x-hidden">
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
        <InstallPrompt />
        <Routes>
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
      </main>
    </div>
  );
}
