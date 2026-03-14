import React from 'react';
import { cn } from '../utils/cn';
import { PenTool } from 'lucide-react';

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
  showText = true 
}) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm overflow-hidden", iconClassName)}>
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
        <PenTool className="w-5 h-5 text-primary-foreground transform -rotate-12" />
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
