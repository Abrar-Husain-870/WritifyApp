import React from 'react';
import { cn } from '../utils/cn';
import writifyLogo from '../assets/new_logo11.png';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconClassName, 
  textClassName,
  showText = false 
}) => {
  return (
    <div className={cn("flex items-center select-none", className)}>
      <img 
        src={writifyLogo} 
        alt="Writify Logo" 
        draggable={false}
        className={cn(
          "h-14 sm:h-16 w-auto object-contain",
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
