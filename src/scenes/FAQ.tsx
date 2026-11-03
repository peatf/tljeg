import { ScenePlate } from '../components/ScenePlate';

export default function FAQ() {
  return (
    <section className="scene">
      <ScenePlate
        kicker="Reassurance"
        title="FAQ"
        lead="The FAQ is your reassurance file. When doubts pop up, this is where you can flip back and remember why this works."
      >
        The FAQ is your reassurance file. When doubts pop up, this is where you can flip back and remember why this works, what to expect, and how to handle common bumps. You won't need it every time, but when your mind gets noisy, it's here to remind you of the bigger picture.
        {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
      </ScenePlate>

      <div className="grid gap-3">
        <h2 className="kicker"><span className="kicker__index">01</span>Common Questions</h2>
        <div className="grid gap-2">
          <details className="disclosure">
            <summary>"Did I do it right?"</summary>
            <div className="disclosure__body">
              <p>You can't mess it up. If it feels strained, rest or halve the distance. The process is designed to be gentle and self-correcting.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>"Can I jump too far?"</summary>
            <div className="disclosure__body">
              <p>If holding the shape feels difficult, pick an easier version and rehearse briefly. Your system will tell you what it's ready for.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>"When should I do a Timeline Jump?"</summary>
            <div className="disclosure__body">
              <p>You can trust your judgment & do the jumps whenever you feel called to. The only times not recommended are when you're trying to escape your reality or avoid something.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>"Can I jump to the wrong timeline?"</summary>
            <div className="disclosure__body">
              <p>No, you can't mess it up. When you're Timeline Jumping your focus is aimed at your desired timeline/self so that's the only direction you move towards.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>"How do I know if it's working?"</summary>
            <div className="disclosure__body">
              <p>The chosen self will not feel vastly different than the old self because it is still you. Look for small shifts in how you respond to situations, not dramatic transformations.</p>
            </div>
          </details>
        </div>
      </div>

      <div className="grid gap-3">
        <h2 className="kicker"><span className="kicker__index">02</span>Troubleshooting</h2>
        <div className="grid gap-2">
          <details className="disclosure">
            <summary>If you feel resistance...</summary>
            <div className="disclosure__body">
              <p>Check your Safety. Address what the current self needs to feel safe leaving your reality in the hands of the desired self.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>If the change feels forced...</summary>
            <div className="disclosure__body">
              <p>You may be trying to embody an energy you aren't ready to hold. Choose a version that feels more accessible.</p>
            </div>
          </details>
          <details className="disclosure">
            <summary>If nothing seems to be happening...</summary>
            <div className="disclosure__body">
              <p>Physical reality has a time delay. Keep holding the pose of your chosen self even when reality doesn't match yet.</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
