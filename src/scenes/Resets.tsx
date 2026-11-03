import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEntries } from '../storage/storage';
import { ScenePlate } from '../components/ScenePlate';
import BreathingIllustration from '../assets/breathing.svg?react';

const STRAIN_WORDS = ['stuck', 'hard', 'difficult', 'strain', 'tired', 'overwhelm'];

export default function Resets() {
  const [recentText, setRecentText] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // look at latest 10 entries across scenes for strain words
    listEntries().then((arr) => {
      const last = arr.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 10);
      const combined = last
        .map((e: any) => JSON.stringify(e.content || ''))
        .join(' ')
        .toLowerCase();
      setRecentText(combined);
    });
  }, []);

  const highlightHalve = useMemo(() => STRAIN_WORDS.some((w) => recentText.includes(w)), [recentText]);

  function navigateToClarity() {
    navigate('/artifact/clarity?mode=gentle');
  }

  function navigateToVOID() {
    navigate('/artifact/void?autostart=true');
  }

  function navigateToCalibration() {
    navigate('/artifact/calibration?focus=proof');
  }

  return (
    <section className="scene">
      <ScenePlate
        index="06"
        kicker="/ 06"
        title="Resets"
        lead="When things feel off, Resets bring you back gently."
        art={<BreathingIllustration />}
        artLabel="Resets illustration"
      >
        Some days you'll drift. That's part of the rhythm. Resets don't erase progress; they re-align you with what's alive now. If something feels too far, shrink the step. If your system feels heavy, drop into VOID. If you're unsure, hold onto one small piece of proof and let it carry you forward.
        {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
      </ScenePlate>
      <div className="scene-wide grid gap-3 lg:grid-cols-3">
        {/* Halve the distance card */}
        <button
          onClick={navigateToClarity}
          className={`reset-card ${highlightHalve ? 'is-suggested' : ''}`}
          aria-label="Go to Clarity with gentler trait suggestions"
        >
          <span className="kicker"><span className="kicker__index">A</span>Clarity</span>
          <h3 className="reset-card__title">Halve the distance</h3>
          <p className="reset-card__text">
            Choose a version that feels 50% closer and rehearse for 30–60s.
          </p>
          <span className="reset-card__go">Opens Clarity with gentler suggestions</span>
        </button>

        {/* Rest & VOID card */}
        <button
          onClick={navigateToVOID}
          className="reset-card reset-card--dark"
          aria-label="Go to VOID with timer pre-started"
        >
          <span className="kicker"><span className="kicker__index">B</span>VOID</span>
          <h3 className="reset-card__title">Rest & VOID</h3>
          <p className="reset-card__text">
            Pause. Drop into VOID to neutral. Return when you feel spacious.
          </p>
          <span className="reset-card__go">Opens VOID with timer ready to start</span>
        </button>

        {/* Hold onto proof card */}
        <button
          onClick={navigateToCalibration}
          className="reset-card"
          aria-label="Go to Calibration with proof field focused"
        >
          <span className="kicker"><span className="kicker__index">C</span>Grounding</span>
          <h3 className="reset-card__title">Hold onto what's already true</h3>
          <p className="reset-card__text">
            Name one ordinary place you're already being this way. Let it feel mundane.
          </p>
          <span className="reset-card__go">Opens Grounding with proof field focused</span>
        </button>
      </div>
    </section>
  );
}
