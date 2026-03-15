import React from 'react';
import { cn } from '../utils/cn';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'auto' | 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconClassName, 
  imageClassName,
  textClassName,
  showText = true,
  variant = 'auto'
}) => {
  const { darkMode } = useTheme();

  const resolvedVariant = variant === 'auto' ? (darkMode ? 'dark' : 'light') : variant;

  const logoSrc = resolvedVariant === 'dark'
    ? '/assets/app-logo-dark-theme.png'
    : '/assets/app-logo-light-theme.png';

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative flex items-center justify-center h-12 w-12 shrink-0", iconClassName)}>
        <img
          src={logoSrc}
          alt="Writify"
          className={cn("relative z-10 h-10 w-10 object-contain", imageClassName)}
          draggable={false}
        />
      </div>
      {showText && (
        <span className={cn("font-bold text-xl tracking-tight text-foreground", textClassName)}>
          Writify
        </span>
      )}
    </div>
  );
};

export default Logo;
