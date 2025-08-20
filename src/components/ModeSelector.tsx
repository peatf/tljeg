import { Link } from 'react-router-dom';
import avatar from '../assets/avatar.webp';

export default function ModeSelector() {
  return (
    <section className="grid gap-6">
      <h1 className="sr-only">Timeline Jumping</h1>
      <img src="/assets/logo.svg" alt="Timeline Jumping" className="h-10 w-auto" />
      <p className="text-ink-600 max-w-prose">
        Choose how you'd like to engage: a clean, paginated text guide, or the interactive, offline-first Digital Timeline Jump.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/text"
          className="block border border-slate-300 rounded-lg p-6 focus:outline-none focus:ring-2 focus:ring-ink-600"
          aria-label="Open Text Guide"
        >
          <h2 className="text-xl font-semibold">Text Guide</h2>
          <p className="text-ink-600">The 12-page guide, offline.</p>
        </Link>
        <Link
          to="/artifact"
          className="block border border-slate-300 rounded-lg p-6 focus:outline-none focus:ring-2 focus:ring-ink-600"
          aria-label="Open Digital Timeline Jump"
        >
          <h2 className="text-xl font-semibold">Digital Timeline Jump</h2>
          <p className="text-ink-600">Scene-based practice, offline ML.</p>
        </Link>
      </div>
      {/* Avatar below the buttons for the opening page */}
      <div className="mt-6 flex justify-center">
        <img src={avatar} alt="Avatar" className="w-64 h-auto object-contain shadow" />
      </div>
    </section>
  );
}
