import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesktopNavigation } from '../DesktopNavigation';

// Mock the button component
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('DesktopNavigation', () => {
  it('renders navigation items', () => {
    render(<DesktopNavigation isAuthenticated={true} />);
    
    expect(screen.getByText('Strona główna')).toBeInTheDocument();
    expect(screen.getByText('Generuj fiszki')).toBeInTheDocument();
    expect(screen.getByText('Moje zestawy')).toBeInTheDocument();
    expect(screen.getByText('Sesje powtórkowe')).toBeInTheDocument();
  });

  it('hides authenticated items when not authenticated', () => {
    render(<DesktopNavigation isAuthenticated={false} />);
    
    expect(screen.getByText('Strona główna')).toBeInTheDocument();
    expect(screen.getByText('Generuj fiszki')).toBeInTheDocument();
    expect(screen.queryByText('Moje zestawy')).not.toBeInTheDocument();
    expect(screen.queryByText('Sesje powtórkowe')).not.toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<DesktopNavigation isAuthenticated={true} currentPath="/generate" />);
    
    const generateButton = screen.getByText('Generuj fiszki').closest('button');
    expect(generateButton).toHaveClass('bg-secondary');
  });

  it('has proper navigation structure', () => {
    render(<DesktopNavigation isAuthenticated={true} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('hidden', 'md:flex');
  });
});
