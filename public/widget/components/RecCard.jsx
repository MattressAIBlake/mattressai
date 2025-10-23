import React, { useState } from 'react';

/**
 * Recommendation Card Component
 * Displays a product recommendation with "why it fits" bullets
 */
export const RecCard = ({ product, onAddToCart, onViewDetails, onSave, onCompare }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div 
      className="rec-card"
      role="article"
      aria-label={`Product recommendation: ${product.title}`}
    >
      {/* Image */}
      <div className="rec-card__image">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title}
            loading="lazy"
          />
        ) : (
          <div className="rec-card__placeholder">No image</div>
        )}
        
        {/* Fit Score Badge */}
        <div className="rec-card__badge">
          <span className="rec-card__badge-score">{product.fitScore}%</span>
          <span className="rec-card__badge-label">match</span>
        </div>
      </div>

      {/* Content */}
      <div className="rec-card__content">
        {/* Vendor */}
        {product.vendor && (
          <div className="rec-card__vendor">{product.vendor}</div>
        )}

        {/* Title */}
        <h3 className="rec-card__title">{product.title}</h3>

        {/* Price */}
        {product.price && (
          <div className="rec-card__price">
            ${product.price.toFixed(2)}
          </div>
        )}

        {/* Firmness Indicator */}
        {product.firmness && (
          <div className="rec-card__firmness">
            <span className="rec-card__firmness-label">Firmness:</span>
            <div className="rec-card__firmness-scale">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`rec-card__firmness-dot ${
                    i < getFirmnessValue(product.firmness) ? 'active' : ''
                  }`}
                />
              ))}
            </div>
            <span className="rec-card__firmness-value">{product.firmness}</span>
          </div>
        )}

        {/* Why It Fits */}
        {product.whyItFits && product.whyItFits.length > 0 && (
          <div className="rec-card__why-it-fits">
            <h4 className="rec-card__why-title">Why it fits:</h4>
            <ul className="rec-card__why-list">
              {product.whyItFits.map((reason, index) => (
                <li key={index} className="rec-card__why-item">
                  <svg className="rec-card__check-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M6 11L3 8l1-1 2 2 5-5 1 1z" />
                  </svg>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="rec-card__actions">
          <button
            className="rec-card__btn rec-card__btn--primary"
            onClick={handleAddToCart}
            disabled={isLoading}
            aria-label={`Add ${product.title} to cart`}
          >
            {isLoading ? (
              <span className="rec-card__spinner" aria-live="polite">Adding...</span>
            ) : isAdded ? (
              <span aria-live="polite">Added ✓</span>
            ) : (
              'Add to Cart'
            )}
          </button>

          <button
            className="rec-card__btn rec-card__btn--secondary"
            onClick={() => onViewDetails(product)}
            aria-label={`View details for ${product.title}`}
          >
            View Details
          </button>

          <div className="rec-card__quick-actions">
            <button
              className="rec-card__icon-btn"
              onClick={() => onSave(product)}
              aria-label={`Save ${product.title} for later`}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => onSave(product))}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 14l-5-5V2h10v7l-5 5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            <button
              className="rec-card__icon-btn"
              onClick={() => onCompare(product)}
              aria-label={`Add ${product.title} to comparison`}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => onCompare(product))}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2" y="2" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="2" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="9" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Map firmness to 1-10 scale
 */
function getFirmnessValue(firmness) {
  const mapping = {
    'soft': 2,
    'medium-soft': 4,
    'medium': 5,
    'medium-firm': 7,
    'firm': 9
  };
  return mapping[firmness?.toLowerCase()] || 5;
}


