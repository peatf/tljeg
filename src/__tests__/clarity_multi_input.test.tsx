import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Clarity from '../scenes/Clarity';
import { getSuggestionsWithContext } from '../ml';

import { vi } from 'vitest';

// Mock the ML functions
vi.mock('../ml', () => ({
  getSuggestions: vi.fn(),
  getSuggestionsWithContext: vi.fn(),
  ingestUserText: vi.fn(),
}));

// Mock storage functions
vi.mock('../storage/storage', () => ({
  addEntry: vi.fn(),
  addTrait: vi.fn(),
  listEntries: vi.fn().mockResolvedValue([]),
  listTraits: vi.fn().mockResolvedValue([]),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

const mockedGetSuggestionsWithContext = getSuggestionsWithContext as ReturnType<typeof vi.fn>;

function renderClarity() {
  return render(
    <MemoryRouter>
      <Clarity />
    </MemoryRouter>
  );
}

describe('Clarity Multi-Input Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chips update when inspiration field changes', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [
        { id: 'test-1', text: 'positive', source: 'seed' },
        { id: 'test-2', text: 'optimistic', source: 'seed' },
      ],
    });

    renderClarity();

    // Expand the inspiration section
    const inspirationSection = screen.getByText('What inspires you?');
    fireEvent.click(inspirationSection);

    // Fill inspiration field
    const inspirationInput = screen.getByLabelText(/WHAT INSPIRES YOU/);
    fireEvent.change(inspirationInput, {
      target: { value: 'I admire my partners positivity' }
    });

    await waitFor(() => {
      expect(mockedGetSuggestionsWithContext).toHaveBeenCalledWith(
        'traits',
        expect.objectContaining({
          inspiration: 'I admire my partners positivity'
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('positive')).toBeInTheDocument();
    });
  });

  it('chips update when working field changes', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [
        { id: 'test-1', text: 'patient', source: 'seed' },
        { id: 'test-2', text: 'calm', source: 'seed' },
      ],
    });

    renderClarity();

    // Expand the working section
    const workingSection = screen.getByText("What's working?");
    fireEvent.click(workingSection);

    // Fill working field
    const workingInput = screen.getByLabelText(/WHAT'S WORKING/);
    fireEvent.change(workingInput, {
      target: { value: 'I stayed patient during the meeting' }
    });

    await waitFor(() => {
      expect(mockedGetSuggestionsWithContext).toHaveBeenCalledWith(
        'traits',
        expect.objectContaining({
          working: 'I stayed patient during the meeting'
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('patient')).toBeInTheDocument();
    });
  });

  it('chips update when recurring thought field changes', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [
        { id: 'test-1', text: 'focused', source: 'seed' },
        { id: 'test-2', text: 'clear', source: 'seed' },
      ],
    });

    renderClarity();

    // Expand the recurring thought section
    const recurringThoughtSection = screen.getByText('What recurring thought keeps showing up?');
    fireEvent.click(recurringThoughtSection);

    // Fill recurring thought field
    const recurringThoughtInput = screen.getByLabelText(/RECURRING THOUGHT/);
    fireEvent.change(recurringThoughtInput, {
      target: { value: 'I keep thinking about being more focused at work' }
    });

    await waitFor(() => {
      expect(mockedGetSuggestionsWithContext).toHaveBeenCalledWith(
        'traits',
        expect.objectContaining({
          recurringThought: 'I keep thinking about being more focused at work'
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('focused')).toBeInTheDocument();
    });
  });

  it('chips update when jealousy field changes', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [
        { id: 'test-1', text: 'bold', source: 'seed' },
        { id: 'test-2', text: 'confident', source: 'seed' },
      ],
    });

    renderClarity();

    // Expand the jealousy section
    const jealousySection = screen.getByText('Who triggers a spark of jealousy?');
    fireEvent.click(jealousySection);

    // Fill jealousy field
    const jealousyInput = screen.getByLabelText(/JEALOUSY SIGNAL/);
    fireEvent.change(jealousyInput, {
      target: { value: 'I envy how confidently she speaks up in meetings' }
    });

    await waitFor(() => {
      expect(mockedGetSuggestionsWithContext).toHaveBeenCalledWith(
        'traits',
        expect.objectContaining({
          jealousy: 'I envy how confidently she speaks up in meetings'
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('bold')).toBeInTheDocument();
    });
  });

  it('chips update when multiple fields are filled', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [
        { id: 'test-1', text: 'positive', source: 'seed' },
        { id: 'test-2', text: 'patient', source: 'seed' },
        { id: 'test-3', text: 'focused', source: 'seed' },
      ],
    });

    renderClarity();

    // Expand sections and fill multiple fields
    const inspirationSection = screen.getByText('What inspires you?');
    fireEvent.click(inspirationSection);
    
    const workingSection = screen.getByText("What's working?");
    fireEvent.click(workingSection);

    const inspirationInput = screen.getByLabelText(/WHAT INSPIRES YOU/);
    const workingInput = screen.getByLabelText(/WHAT'S WORKING/);

    fireEvent.change(inspirationInput, {
      target: { value: 'I admire my partners positivity' }
    });

    fireEvent.change(workingInput, {
      target: { value: 'I stayed patient during the meeting' }
    });

    await waitFor(() => {
      expect(mockedGetSuggestionsWithContext).toHaveBeenCalledWith(
        'traits',
        expect.objectContaining({
          inspiration: 'I admire my partners positivity',
          working: 'I stayed patient during the meeting'
        }),
        expect.objectContaining({
          weights: expect.objectContaining({
            inspiration: 0.4,
            working: 0.2,
            recurringThought: 0.2,
            jealousy: 0.2,
            recentMoment: 0.05,
            feltNatural: 0.05
          })
        })
      );
    });

    // Should show traits from both contexts
    await waitFor(() => {
      expect(screen.getByText('positive')).toBeInTheDocument();
      expect(screen.getByText('patient')).toBeInTheDocument();
      expect(screen.getByText('focused')).toBeInTheDocument();
    });
  });

  it('shows starter traits when all fields are empty', async () => {
    renderClarity();

    // Should show starter traits by default
    await waitFor(() => {
      expect(screen.getByText('Calm')).toBeInTheDocument();
      expect(screen.getByText('Generous')).toBeInTheDocument();
      expect(screen.getByText('Brave')).toBeInTheDocument();
    });

    // getSuggestionsWithContext should not be called when no input
    expect(mockedGetSuggestionsWithContext).not.toHaveBeenCalled();
  });

  it('handles ML function errors gracefully', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockRejectedValue(new Error('ML service unavailable'));

    renderClarity();

    // Expand and fill a field
    const inspirationSection = screen.getByText('What inspires you?');
    fireEvent.click(inspirationSection);

    const inspirationInput = screen.getByLabelText(/WHAT INSPIRES YOU/);
    fireEvent.change(inspirationInput, {
      target: { value: 'Some inspiration text' }
    });

    // Should fall back to starter traits on error
    await waitFor(() => {
      expect(screen.getByText('Calm')).toBeInTheDocument();
      expect(screen.getByText('Generous')).toBeInTheDocument();
    });
  });

  it('handles throttled responses correctly', async () => {
    vi.mocked(mockedGetSuggestionsWithContext).mockResolvedValue({
      items: [{ id: 'test-1', text: 'positive', source: 'seed' }],
      throttled: true,
    });

    renderClarity();

    // Fill a field
    const inspirationSection = screen.getByText('What inspires you?');
    fireEvent.click(inspirationSection);

    const inspirationInput = screen.getByLabelText(/WHAT INSPIRES YOU/);
    fireEvent.change(inspirationInput, {
      target: { value: 'Some inspiration' }
    });

    await waitFor(() => {
      expect(screen.getByText('Throttled - showing recent suggestions')).toBeInTheDocument();
    });
  });
});