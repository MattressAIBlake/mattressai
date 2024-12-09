import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
    right: 'top-1/2 left-full -translate-y-1/2 ml-2',
    bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
    left: 'top-1/2 right-full -translate-y-1/2 -ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={`absolute ${positions[position]} z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md whitespace-nowrap`}>
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;