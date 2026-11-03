import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ScenePlateProps = {
  /** Small label above the title, e.g. "01 · Step one". */
  index?: string;
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  art?: ReactNode;
  artLabel?: string;
  artCaption?: string;
  dark?: boolean;
};

/** Chapter opening: title and teaching on one side, the drawing on its own plate. */
export function ScenePlate({ index, kicker, title, lead, children, art, artLabel, artCaption, dark }: ScenePlateProps) {
  return (
    <header className="scene-plate">
      <div className="scene-plate__text">
        {(index || kicker) && (
          <p className="kicker">
            {index && <span className="kicker__index">{index}</span>}
            {kicker && <span>{kicker}</span>}
          </p>
        )}
        <h1 className="scene-title">{title}</h1>
        {lead && <p className="scene-lead">{lead}</p>}
        {children && <div className="scene-explainer">{children}</div>}
      </div>
      {art && (
        <figure
          className={`scene-plate__art ${dark ? 'scene-plate__art--dark' : ''}`}
          role="img"
          aria-label={artLabel}
          title={artLabel}
        >
          {art}
          {artCaption && <figcaption className="plate-caption" aria-hidden>{artCaption}</figcaption>}
        </figure>
      )}
    </header>
  );
}

type NextLink = { to: string; label: ReactNode; primary?: boolean };

/** The quiet hand-off at the end of a scene. */
export function SceneNext({ prompt = 'Ready to continue?', links }: { prompt?: string; links: NextLink[] }) {
  return (
    <nav className="scene-next" aria-label="Next step">
      <p className="kicker">{prompt}</p>
      <div className="scene-next__actions">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={l.primary ? 'btn-flow btn-flow--primary' : 'btn-quiet'}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
