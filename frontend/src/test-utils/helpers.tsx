import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { GuestContext } from '../App';

interface WrapperOptions {
  isGuest?: boolean;
  route?: string;
}

export function createWrapper({ isGuest = false, route = '/' }: WrapperOptions = {}) {
  window.history.pushState({}, 'Test', route);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>
      <GuestContext.Provider value={{
        isGuest,
        setIsGuest: jest.fn(),
        exitGuestMode: jest.fn(),
      }}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </GuestContext.Provider>
    </ThemeProvider>
  );

  return Wrapper;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>
) {
  const { isGuest, route, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: createWrapper({ isGuest, route }),
    ...renderOptions,
  });
}

export { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
