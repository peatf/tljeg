import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import avatar from '../assets/avatar.webp';

export default function ModeSelector() {
  return (
    <section className="cover">
      <div className="cover__text">
        <h1 className="sr-only">Timeline Jumping</h1>
        <img src={logo} alt="Timeline Jumping" className="cover__logo" />
        <p className="cover__line">
          Timeline Jumping is the process of becoming a fertile environment where your desires must thrive
        </p>
        <p className="cover__intro">
          Choose how you'd like to engage: a clean, paginated text guide, or the interactive, offline-first Digital Timeline Jump.
        </p>
        <div className="doors">
          <Link to="/text" className="door" aria-label="Open Text Guide">
            <span className="door__label">Read</span>
            <h2 className="door__title">Text Guide</h2>
            <p className="door__text">The 12-page guide, offline.</p>
          </Link>
          <Link to="/artifact" className="door door--primary" aria-label="Open Digital Timeline Jump">
            <span className="door__label">Practice</span>
            <h2 className="door__title">Digital Timeline Jump</h2>
            <p className="door__text">Scene-based practice, offline ML.</p>
          </Link>
        </div>
      </div>
      {/* Avatar beside the doors on the opening page */}
      <div className="cover__art scene-plate__art">
        <img src={avatar} alt="Avatar" />
      </div>
    </section>
  );
}
