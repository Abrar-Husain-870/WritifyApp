import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DarkModeToggle from '../components/DarkModeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';

function renderToggle() {
  return render(
    <ThemeProvider>
      <DarkModeToggle />
    </ThemeProvider>
  );
}

describe('DarkModeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('renders with "Switch to dark mode" label in light mode', () => {
    renderToggle();
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  test('toggles to dark mode on click', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('toggles back to light mode on second click', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });
});
