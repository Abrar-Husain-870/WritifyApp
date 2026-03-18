import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { GuestContext } from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';
import Login from '../components/Login';

// Mock Logo to avoid image import issues
jest.mock('../components/Logo', () => {
  return function MockLogo() {
    return <div data-testid="logo">Logo</div>;
  };
});

const mockSetIsGuest = jest.fn();
const mockExitGuestMode = jest.fn();

function renderLogin() {
  return render(
    <ThemeProvider>
      <GuestContext.Provider value={{
        isGuest: false,
        setIsGuest: mockSetIsGuest,
        exitGuestMode: mockExitGuestMode,
      }}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </GuestContext.Provider>
    </ThemeProvider>
  );
}

describe('Login Page', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockSetIsGuest.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      href: '',
      search: '',
      hostname: 'localhost',
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  test('renders the login page with both auth options', () => {
    renderLogin();
    expect(screen.getByText('Sign in to Writify')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument();
  });

  test('renders logo', () => {
    renderLogin();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  test('shows unauthorized error from URL params', () => {
    (window as any).location.search = '?error=unauthorized';
    renderLogin();
    expect(screen.getByText(/university email addresses/i)).toBeInTheDocument();
  });

  test('shows auth_failed error from URL params', () => {
    (window as any).location.search = '?error=auth_failed';
    renderLogin();
    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  test('shows locked error from URL params', () => {
    (window as any).location.search = '?error=locked';
    renderLogin();
    expect(screen.getByText(/temporarily locked/i)).toBeInTheDocument();
  });

  test('Google login redirects to auth endpoint', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(window.location.href).toContain('/auth/google');
  });

  test('Google login clears logout flags', async () => {
    localStorage.setItem('FORCE_LOGOUT', 'true');
    sessionStorage.setItem('manual_logout', 'true');
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(localStorage.getItem('FORCE_LOGOUT')).toBeNull();
    expect(sessionStorage.getItem('manual_logout')).toBeNull();
  });

  test('guest login sets session storage and redirects to dashboard', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continue as guest/i }));

    expect(sessionStorage.getItem('GUEST_MODE')).toBe('true');
    const guestUser = JSON.parse(sessionStorage.getItem('GUEST_USER') || '{}');
    expect(guestUser.name).toBe('Guest User');
    expect(guestUser.isGuest).toBe(true);
    expect(mockSetIsGuest).toHaveBeenCalledWith(true);
    expect(window.location.href).toBe('/dashboard');
  });

  test('guest login clears logout flags', async () => {
    localStorage.setItem('FORCE_LOGOUT', 'true');
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continue as guest/i }));
    expect(localStorage.getItem('FORCE_LOGOUT')).toBeNull();
  });

  test('buttons are disabled while Google login is in progress', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    // After clicking, the Google button shows "Signing in..."
    // Both buttons should be disabled
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      if (btn.textContent?.includes('Signing in') || btn.textContent?.includes('Continue')) {
        expect(btn).toBeDisabled();
      }
    });
  });

  test('displays terms and privacy links', () => {
    renderLogin();
    expect(screen.getByText(/terms/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
  });

  test('displays university email restriction notice', () => {
    renderLogin();
    expect(screen.getByText(/@student\.iul\.ac\.in/)).toBeInTheDocument();
  });
});
