import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Calibration from '../scenes/Calibration';
import Implementation from '../scenes/Implementation';
import VOIDScene from '../scenes/VOID';
import Safety from '../scenes/Safety';
import Clarity from '../scenes/Clarity';

describe('Scenes render', () => {
  it('renders Calibration scene UI', () => {
    render(
      <MemoryRouter initialEntries={["/cal"]}>
        <Routes>
          <Route path="/cal" element={<Calibration />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Calibration/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Proof input/)).toBeInTheDocument();
  });

  it('renders Implementation scene UI', () => {
    render(
      <MemoryRouter initialEntries={["/rt"]}>
        <Routes>
          <Route path="/rt" element={<Implementation />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Implementation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan title/)).toBeInTheDocument();
  });

  it('deep-link focuses Calibration proof', async () => {
    render(
      <MemoryRouter initialEntries={["/cal?focus=proof"]}>
        <Routes>
          <Route path="/cal" element={<Calibration />} />
        </Routes>
      </MemoryRouter>
    );
    const proof = screen.getByLabelText(/Proof input/);
    expect(proof).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(proof));
  });

  it('VOID autostarts hold with deep link', async () => {
    render(
      <MemoryRouter initialEntries={["/void?autostart=true"]}>
        <Routes>
          <Route path="/void" element={<VOIDScene />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Space to pause\/resume/)).toBeInTheDocument());
  });

  it('VOID dissolve animation renders multiple labels', async () => {
    render(
      <MemoryRouter initialEntries={["/void"]}>
        <Routes>
          <Route path="/void" element={<VOIDScene />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Add multiple labels
    const input = screen.getByPlaceholderText(/failure, tired/);
    fireEvent.change(input, { target: { value: 'stress, overwhelm, doubt' } });
    fireEvent.click(screen.getByText('ADD LABEL'));
    
    // Should show labels
    expect(screen.getByText('stress')).toBeInTheDocument();
    expect(screen.getByText('overwhelm')).toBeInTheDocument();
    expect(screen.getByText('doubt')).toBeInTheDocument();
  });

  it('renders Safety consent UI with Yes/Not yet radio options', () => {
    render(
      <MemoryRouter initialEntries={["/safety"]}>
        <Routes>
          <Route path="/safety" element={<Safety />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText('Yes')).toBeInTheDocument();
    expect(screen.getByLabelText('Not yet')).toBeInTheDocument();
    expect(screen.getByText(/Consent check-in/)).toBeInTheDocument();
  });

  it('Safety shows conditional prompt when Not yet is selected', async () => {
    render(
      <MemoryRouter initialEntries={["/safety"]}>
        <Routes>
          <Route path="/safety" element={<Safety />} />
        </Routes>
      </MemoryRouter>
    );
    
    // First enter body readiness to enable the form
    const bodyInput = screen.getByLabelText(/Body readiness reflection/);
    fireEvent.change(bodyInput, { target: { value: 'I feel ready' } });
    
    // Now the form should be enabled and we can test the "Not yet" flow
    fireEvent.click(screen.getByLabelText('Not yet'));
    await waitFor(() => {
      expect(screen.getByLabelText(/WHY NOT YET/)).toBeInTheDocument();
    });
  });

  it('Safety shows rotating scan cues during timer', async () => {
    render(
      <MemoryRouter initialEntries={["/safety"]}>
        <Routes>
          <Route path="/safety" element={<Safety />} />
        </Routes>
      </MemoryRouter>
    );
    
    // First enter body readiness to enable the form
    const bodyInput = screen.getByLabelText(/Body readiness reflection/);
    fireEvent.change(bodyInput, { target: { value: 'I feel ready' } });
    
    // Now the scan button should be enabled
    fireEvent.click(screen.getByText('Start 30s scan'));
    await waitFor(() => {
      expect(screen.getByText(/Notice your breath/)).toBeInTheDocument();
    });
  });

  it('renders Clarity expandable subtitle section', () => {
    render(
      <MemoryRouter initialEntries={["/clarity"]}>
        <Routes>
          <Route path="/clarity" element={<Clarity />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByRole('heading', { name: /Clarity/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/What's working/)).toBeInTheDocument();
  });

  it('Calibration shows overlap preload for Clarity → Calibration flow', async () => {
    // Mock overlap data in localStorage to simulate Clarity → Calibration flow
    const overlapData = { text: 'test overlap', trait: 'courage', created_at: Date.now() };
    localStorage.setItem('tja-overlap-preload', JSON.stringify(overlapData));
    
    render(
      <MemoryRouter initialEntries={["/calibration"]}>
        <Routes>
          <Route path="/calibration" element={<Calibration />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/test overlap/)).toBeInTheDocument();
    });
    
    // Clean up
    localStorage.removeItem('tja-overlap-preload');
  });
});
