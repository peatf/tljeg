export default function FAQ() {
  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
  <h1 className="text-2xl font-bold doto-base doto-700">FAQ</h1>
        <p className="text-ink-700 text-sm">The FAQ is your reassurance file. When doubts pop up, this is where you can flip back and remember why this works.</p>
        <div className="p-4 bg-bone-50 rounded-lg text-sm text-ink-700">
          The FAQ is your reassurance file. When doubts pop up, this is where you can flip back and remember why this works, what to expect, and how to handle common bumps. You won't need it every time, but when your mind gets noisy, it's here to remind you of the bigger picture.
          {/* TODO: Reference path for future copy: docs/Updates/Explainers */}
        </div>
      </header>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">Common Questions</h2>
          
          <div className="grid gap-3">
            <div>
              <h3 className="font-medium text-ink-800">"Did I do it right?"</h3>
              <p className="text-sm text-ink-700">You can't mess it up. If it feels strained, rest or halve the distance. The process is designed to be gentle and self-correcting.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-ink-800">"Can I jump too far?"</h3>
              <p className="text-sm text-ink-700">If holding the shape feels difficult, pick an easier version and rehearse briefly. Your system will tell you what it's ready for.</p>
            </div>

            <div>
              <h3 className="font-medium text-ink-800">"When should I do a Timeline Jump?"</h3>
              <p className="text-sm text-ink-700">You can trust your judgment & do the jumps whenever you feel called to. The only times not recommended are when you're trying to escape your reality or avoid something.</p>
            </div>

            <div>
              <h3 className="font-medium text-ink-800">"Can I jump to the wrong timeline?"</h3>
              <p className="text-sm text-ink-700">No, you can't mess it up. When you're Timeline Jumping your focus is aimed at your desired timeline/self so that's the only direction you move towards.</p>
            </div>

            <div>
              <h3 className="font-medium text-ink-800">"How do I know if it's working?"</h3>
              <p className="text-sm text-ink-700">The chosen self will not feel vastly different than the old self because it is still you. Look for small shifts in how you respond to situations, not dramatic transformations.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">Troubleshooting</h2>
          
          <div className="grid gap-3">
            <div>
              <h3 className="font-medium text-ink-800">If you feel resistance...</h3>
              <p className="text-sm text-ink-700">Check your Safety. Address what the current self needs to feel safe leaving your reality in the hands of the desired self.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-ink-800">If the change feels forced...</h3>
              <p className="text-sm text-ink-700">You may be trying to embody an energy you aren't ready to hold. Choose a version that feels more accessible.</p>
            </div>

            <div>
              <h3 className="font-medium text-ink-800">If nothing seems to be happening...</h3>
              <p className="text-sm text-ink-700">Physical reality has a time delay. Keep holding the pose of your chosen self even when reality doesn't match yet.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}