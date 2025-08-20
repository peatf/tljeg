import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StorageReveal from '../scenes/Storage';

describe('Storage buttons', () => {
  it('shows CSV export button', () => {
    render(
      <MemoryRouter initialEntries={["/s"]}>
        <Routes>
          <Route path="/s" element={<StorageReveal />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Download entries CSV/)).toBeInTheDocument();
  });
});
