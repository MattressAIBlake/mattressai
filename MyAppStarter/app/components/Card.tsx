interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ title, children, className = '', onClick }: CardProps) => {
  const baseClasses = 'bg-white rounded-xl shadow-lg p-6 transition-all duration-200';
  const hoverClasses = onClick ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer' : '';
  const focusClasses = onClick ? 'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2' : '';
  
  return (
    <div
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${baseClasses} ${hoverClasses} ${focusClasses} ${className}`}
    >
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
      )}
      {children}
    </div>
  );
};

export default Card; 