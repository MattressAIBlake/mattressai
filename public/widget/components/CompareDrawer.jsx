import React, { useEffect, useRef } from 'react';

/**
 * Compare Drawer Component
 * Side-by-side comparison of up to 3 products
 */
export const CompareDrawer = ({ products, onClose, onRemove, onAddToCart }) => {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus trap
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const specs = [
    { key: 'firmness', label: 'Firmness' },
    { key: 'height', label: 'Height' },
    { key: 'material', label: 'Construction' },
    { key: 'features', label: 'Cooling Features', isArray: true, filter: (f) => f.includes('cooling') },
    { key: 'features', label: 'Motion Isolation', isArray: true, filter: (f) => f.includes('motion') },
    { key: 'supportFeatures', label: 'Edge Support', isArray: true, filter: (f) => f.includes('edge') },
    { key: 'certifications', label: 'Certifications', isArray: true },
    { key: 'price', label: 'Price', format: (v) => `$${v?.toFixed(2) || 'N/A'}` }
  ];

  const getSpecValue = (product, spec) => {
    const value = product[spec.key];

    if (spec.format && value) {
      return spec.format(value);
    }

    if (spec.isArray && Array.isArray(value)) {
      const filtered = spec.filter ? value.filter(spec.filter) : value;
      return filtered.length > 0 ? filtered.join(', ') : '—';
    }

    return value || '—';
  };

  return (
    <div 
      className="compare-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      ref={drawerRef}
    >
      {/* Overlay */}
      <div 
        className="compare-drawer__overlay" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div className="compare-drawer__content">
        {/* Header */}
        <div className="compare-drawer__header">
          <h2 id="compare-title" className="compare-drawer__title">
            Compare Mattresses
          </h2>
          <button
            ref={closeButtonRef}
            className="compare-drawer__close"
            onClick={onClose}
            aria-label="Close comparison"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Comparison Table */}
        <div className="compare-drawer__body">
          {products.length === 0 ? (
            <div className="compare-drawer__empty">
              <p>Select up to 3 mattresses to compare</p>
            </div>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-table__label-col">Specification</th>
                  {products.map((product) => (
                    <th key={product.productId} className="compare-table__product-col">
                      <div className="compare-table__product-header">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.title}
                            className="compare-table__product-img"
                          />
                        )}
                        <h3 className="compare-table__product-title">{product.title}</h3>
                        <button
                          className="compare-table__remove-btn"
                          onClick={() => onRemove(product.productId)}
                          aria-label={`Remove ${product.title} from comparison`}
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Fill empty columns */}
                  {Array.from({ length: 3 - products.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="compare-table__product-col compare-table__product-col--empty">
                      <div className="compare-table__empty-slot">Empty slot</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.label}>
                    <td className="compare-table__label">{spec.label}</td>
                    {products.map((product) => (
                      <td key={product.productId} className="compare-table__value">
                        {getSpecValue(product, spec)}
                      </td>
                    ))}
                    {/* Fill empty columns */}
                    {Array.from({ length: 3 - products.length }).map((_, i) => (
                      <td key={`empty-${i}`} className="compare-table__value compare-table__value--empty">
                        —
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Actions Row */}
                <tr>
                  <td className="compare-table__label">Actions</td>
                  {products.map((product) => (
                    <td key={product.productId} className="compare-table__value">
                      <button
                        className="compare-table__cta-btn"
                        onClick={() => onAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </td>
                  ))}
                  {/* Fill empty columns */}
                  {Array.from({ length: 3 - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="compare-table__value compare-table__value--empty">
                      —
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="compare-drawer__footer">
          <button
            className="compare-drawer__footer-btn"
            onClick={onClose}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};


