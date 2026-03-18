import React from 'react';
import { cn } from '../utils/cn';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  cropLeftPx?: number;
  cropRightPx?: number;
  cropLeftPercent?: number;
  cropRightPercent?: number;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconClassName, 
  textClassName,
  showText = false,
  cropLeftPx = 0,
  cropRightPx = 0,
  cropLeftPercent,
  cropRightPercent
}) => {
  const { darkMode } = useTheme();
  const logoSrc = `${process.env.PUBLIC_URL}/${darkMode ? 'logo-dark-512.png' : 'logo-light-512.png'}`;
  const cropLeft = cropLeftPercent !== undefined ? `${cropLeftPercent}%` : `${cropLeftPx}px`;
  const cropRight = cropRightPercent !== undefined ? `${cropRightPercent}%` : `${cropRightPx}px`;

  return (
    <div className={cn("flex items-center select-none", className)}>
      <img 
        src={logoSrc} 
        alt="Writify Logo" 
        draggable={false}
        style={{ clipPath: `inset(0px ${cropRight} 0px ${cropLeft})` }}
        className={cn(
          "h-10 sm:h-11 w-auto object-contain",
          iconClassName
        )} 
      />
      {showText && (
        <span className={cn(
          "font-semibold text-xl tracking-tight ml-2.5 text-foreground",
          textClassName
        )}>
          Writify
        </span>
      )}
    </div>
  );
};

export default Logo;
