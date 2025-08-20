import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('Routing', () => {
  it('renders mode selector on root', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByAltText(/Timeline Jumping/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Text Guide/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Digital Timeline Jump/i).length).toBeGreaterThan(0);
  });

  it('renders VOID scene on route', () => {
    render(
      <MemoryRouter initialEntries={['/artifact/void']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'VOID' })).toBeInTheDocument();
  });
});
