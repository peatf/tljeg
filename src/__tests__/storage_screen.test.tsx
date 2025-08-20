import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StorageReveal from '../scenes/Storage';

describe('Storage screen', () => {
  it('renders export/import controls', () => {
    render(
      <MemoryRouter initialEntries={["/storage"]}>
        <Routes>
          <Route path="/storage" element={<StorageReveal />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Manage your saved guides/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Download a copy/)).toBeInTheDocument();
  });
});
