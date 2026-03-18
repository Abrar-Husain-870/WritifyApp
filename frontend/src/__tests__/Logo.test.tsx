import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Logo from '../components/Logo';

// Mock the image import
jest.mock('../assets/new_logo11.png', () => 'test-logo.png');

describe('Logo', () => {
  test('renders the logo image', () => {
    render(<Logo />);
    const img = screen.getByAltText('Writify Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'test-logo.png');
  });

  test('applies custom iconClassName', () => {
    render(<Logo iconClassName="h-32" />);
    const img = screen.getByAltText('Writify Logo');
    expect(img.className).toContain('h-32');
  });

  test('does not show text by default', () => {
    render(<Logo />);
    expect(screen.queryByText('Writify')).not.toBeInTheDocument();
  });

  test('shows text when showText is true', () => {
    render(<Logo showText />);
    expect(screen.getByText('Writify')).toBeInTheDocument();
  });

  test('applies custom textClassName when text is shown', () => {
    render(<Logo showText textClassName="text-3xl" />);
    const text = screen.getByText('Writify');
    expect(text.className).toContain('text-3xl');
  });

  test('image is not draggable', () => {
    render(<Logo />);
    const img = screen.getByAltText('Writify Logo');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  test('applies custom wrapper className', () => {
    const { container } = render(<Logo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
