interface OverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const Overlay = ({ isVisible, onClose, children, className = '' }: OverlayProps) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300" />
      
      {/* Content */}
      <div 
        className={`
          relative z-10 
          max-w-lg w-full mx-4
          bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default Overlay; 