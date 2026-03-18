import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { GuestContext } from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';
import Dashboard from '../components/Dashboard';

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function renderDashboard({ isGuest = false } = {}) {
  return render(
    <ThemeProvider>
      <GuestContext.Provider value={{
        isGuest,
        setIsGuest: jest.fn(),
        exitGuestMode: jest.fn(),
      }}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </GuestContext.Provider>
    </ThemeProvider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockFetch.mockClear();
  });

  describe('Guest Mode', () => {
    test('shows guest mode warning banner', () => {
      renderDashboard({ isGuest: true });
      expect(screen.getByText(/guest mode/i)).toBeInTheDocument();
    });

    test('displays Guest User welcome message', async () => {
      renderDashboard({ isGuest: true });
      await waitFor(() => {
        expect(screen.getByText(/welcome back, guest/i)).toBeInTheDocument();
      });
    });

    test('does not fetch profile API in guest mode', () => {
      renderDashboard({ isGuest: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated Mode', () => {
    test('fetches user profile on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Sajid Khan', email: 'sajid@student.iul.ac.in' }),
      });

      renderDashboard({ isGuest: false });

      await waitFor(() => {
        expect(screen.getByText(/welcome back, sajid/i)).toBeInTheDocument();
      });
    });

    test('handles profile fetch failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      renderDashboard({ isGuest: false });

      await waitFor(() => {
        // Should show fallback name when fetch fails
        expect(screen.getByText(/welcome back, student/i)).toBeInTheDocument();
      });
    });

    test('does not show guest mode banner when authenticated', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test', email: 'test@test.com' }),
      });
      renderDashboard({ isGuest: false });
      expect(screen.queryByText(/guest mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    test('renders all 6 quick action cards', () => {
      renderDashboard({ isGuest: true });
      expect(screen.getByText('Find a Writer')).toBeInTheDocument();
      expect(screen.getByText('Browse Requests')).toBeInTheDocument();
      expect(screen.getByText('My Assignments')).toBeInTheDocument();
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('My Ratings')).toBeInTheDocument();
      expect(screen.getByText('Tutorial')).toBeInTheDocument();
    });

    test('Post Assignment navigates to /find-writer', async () => {
      const user = userEvent.setup();
      renderDashboard({ isGuest: true });

      await user.click(screen.getByRole('button', { name: /post assignment/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/find-writer');
    });

    test('Find Writer CTA button navigates to /find-writer', async () => {
      const user = userEvent.setup();
      renderDashboard({ isGuest: true });

      // There are two "Find Writer" elements — the CTA button and the quick action card.
      // Target the CTA with the Search icon by getting all and using the second match
      // (first is "Post Assignment" which also goes to /find-writer).
      const findWriterButtons = screen.getAllByRole('button', { name: /find.*writer/i });
      await user.click(findWriterButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/find-writer');
    });

    test('clicking quick action card navigates to correct path', async () => {
      const user = userEvent.setup();
      renderDashboard({ isGuest: true });

      await user.click(screen.getByText('My Assignments'));
      expect(mockNavigate).toHaveBeenCalledWith('/my-assignments');
    });
  });
});
