'use client';

import { useState } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  onClearFilters: () => void;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export default function FilterSidebar({
  categories, selectedCategory, onCategoryChange,
  minPrice, maxPrice, onPriceChange,
  selectedSize, onSizeChange, onClearFilters,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true, price: true, size: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasFilters = selectedCategory || minPrice || maxPrice || selectedSize;

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="sticky top-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold">Filters</h2>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <FiX className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-sm font-semibold text-surface-700 mb-3"
          >
            Category
            <FiChevronDown className={`w-4 h-4 transition-transform ${expandedSections.category ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.category && (
            <div className="space-y-1">
              <button
                onClick={() => onCategoryChange('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  !selectedCategory ? 'bg-brand-50 text-brand-700 font-medium' : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === cat ? 'bg-brand-50 text-brand-700 font-medium' : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-sm font-semibold text-surface-700 mb-3"
          >
            Price Range (PKR)
            <FiChevronDown className={`w-4 h-4 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.price && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => onPriceChange(e.target.value, maxPrice)}
                className="input-field text-sm !py-2"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => onPriceChange(minPrice, e.target.value)}
                className="input-field text-sm !py-2"
              />
            </div>
          )}
        </div>

        {/* Size */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('size')}
            className="flex items-center justify-between w-full text-sm font-semibold text-surface-700 mb-3"
          >
            Size
            <FiChevronDown className={`w-4 h-4 transition-transform ${expandedSections.size ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.size && (
            <div className="flex flex-wrap gap-2">
              {SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => onSizeChange(selectedSize === size ? '' : size)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    selectedSize === size
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
