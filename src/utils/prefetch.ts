export async function prefetchScene(id: 'safety' | 'clarity' | 'calibration' | 'void' | 'implementation' | 'resets') {
  try {
    if (id === 'safety') await import('../scenes/Safety');
    if (id === 'clarity') await import('../scenes/Clarity');
    if (id === 'calibration') await import('../scenes/Calibration');
    if (id === 'void') await import('../scenes/VOID');
    if (id === 'implementation') await import('../scenes/Implementation');
    if (id === 'resets') await import('../scenes/Resets');
  } catch {}
}

