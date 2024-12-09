import React, { memo } from 'react';
import { useImageLazyLoad } from '../hooks/useImageLazyLoad';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

const LazyImage: React.FC<LazyImageProps> = memo(({ src, alt, className = '' }) => {
  const { imageSrc, setImageRef } = useImageLazyLoad(src);

  return (
    <div className={`relative ${className}`}>
      <img
        ref={setImageRef}
        src={imageSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
        alt={alt}
        className={`transition-opacity duration-300 ${imageSrc ? 'opacity-100' : 'opacity-0'}`}
      />
      {!imageSrc && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;