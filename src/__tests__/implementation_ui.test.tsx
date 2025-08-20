import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../ml', () => ({
  getSuggestions: vi.fn(async (domain: string) => {
    if (domain === 'contexts') return [{ id: 'c1', text: 'kitchen', source: 'seed' }];
    if (domain === 'traits') return [{ id: 't1', text: 'Calm', source: 'seed' }];
    return [];
  })
}));

import Implementation from '../scenes/Implementation';

describe('Implementation UI', () => {
  it('shows micro-act suggestions label', async () => {
    render(
      <MemoryRouter initialEntries={["/rt"]}>
        <Routes>
          <Route path="/rt" element={<Implementation />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByLabelText(/Micro-act suggestions/)).toBeInTheDocument();
  });
});
