import React from 'react';

interface RatingGroupProps {
  title: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingGroup: React.FC<RatingGroupProps> = ({ title, value, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className="flex items-center">
            <input
              type="radio"
              className="sr-only peer"
              name={title}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
            />
            <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white cursor-pointer transition-all">
              {rating}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RatingGroup;