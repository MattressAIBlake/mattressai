import React, { useState } from 'react';
import { ChevronDown, Plus, X, DollarSign, Link, ArrowLeft, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FormField from '../ui/FormField';

interface MattressSpecs {
  firmness: string;
  type: string;
  height: string;
  materials: string[];
  sleepingPositions: string[];
  coolingSystems?: string[];
  edgeSupport?: string;
  motionTransfer?: string;
  warranty?: string;
  trialPeriod?: string;
}

interface MattressModel {
  id: string;
  name: string;
  description?: string;
  specs?: MattressSpecs;
  priceRange?: {
    min: number;
    max: number;
  };
  selected: boolean;
  productUrl?: string;
}

interface MattressSeries {
  name: string;
  models: MattressModel[];
}

interface Brand {
  id: string;
  name: string;
  series: MattressSeries[];
  isCustom?: boolean;
}

// Full brands data moved to a separate file for clarity
import { initialBrands } from './brandsData';

interface AddModelFormData {
  name: string;
  description: string;
  minPrice: string;
  maxPrice: string;
}

const MerchantBrandsPage = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [expandedBrands, setExpandedBrands] = useState<string[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddModel, setShowAddModel] = useState<{brandId: string, seriesIndex: number} | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: '',
    seriesName: '',
  });
  const [newModel, setNewModel] = useState<AddModelFormData>({
    name: '',
    description: '',
    minPrice: '',
    maxPrice: '',
  });

  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleModel = (brandId: string, seriesIndex: number, modelId: string) => {
    setBrands(prev => prev.map(brand => {
      if (brand.id === brandId) {
        return {
          ...brand,
          series: brand.series.map((series, idx) => {
            if (idx === seriesIndex) {
              return {
                ...series,
                models: series.models.map(model => {
                  if (model.id === modelId) {
                    return { ...model, selected: !model.selected };
                  }
                  return model;
                })
              };
            }
            return series;
          })
        };
      }
      return brand;
    }));
  };

  const updateModelUrl = (brandId: string, seriesIndex: number, modelId: string, url: string) => {
    setBrands(prev => prev.map(brand => {
      if (brand.id === brandId) {
        return {
          ...brand,
          series: brand.series.map((series, idx) => {
            if (idx === seriesIndex) {
              return {
                ...series,
                models: series.models.map(model => {
                  if (model.id === modelId) {
                    return { ...model, productUrl: url };
                  }
                  return model;
                })
              };
            }
            return series;
          })
        };
      }
      return brand;
    }));
  };

  const handleAddBrand = () => {
    if (!newBrand.name || !newBrand.seriesName) return;

    const brandId = newBrand.name.toLowerCase().replace(/\s+/g, '-');
    const newCustomBrand: Brand = {
      id: brandId,
      name: newBrand.name,
      isCustom: true,
      series: [{
        name: newBrand.seriesName,
        models: []
      }]
    };

    setBrands(prev => [...prev, newCustomBrand]);
    setExpandedBrands(prev => [...prev, brandId]);
    setNewBrand({ name: '', seriesName: '' });
    setShowAddBrand(false);
  };

  const handleAddModel = (brandId: string, seriesIndex: number) => {
    if (!newModel.name) return;

    setBrands(prev => prev.map(brand => {
      if (brand.id === brandId) {
        const updatedSeries = [...brand.series];
        updatedSeries[seriesIndex] = {
          ...updatedSeries[seriesIndex],
          models: [
            ...updatedSeries[seriesIndex].models,
            {
              id: `${brandId}-${Date.now()}`,
              name: newModel.name,
              description: newModel.description,
              priceRange: {
                min: parseFloat(newModel.minPrice) || 0,
                max: parseFloat(newModel.maxPrice) || 0,
              },
              selected: false,
            }
          ]
        };
        return { ...brand, series: updatedSeries };
      }
      return brand;
    }));

    setNewModel({
      name: '',
      description: '',
      minPrice: '',
      maxPrice: '',
    });
    setShowAddModel(null);
  };

  const getSelectedModelsCount = () => {
    return brands.reduce((total, brand) => 
      total + brand.series.reduce((seriesTotal, series) => 
        seriesTotal + series.models.filter(model => model.selected).length, 0
      ), 0
    );
  };

  const renderStepOne = () => (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Step 1: Select Your Inventory</h1>
          <p className="text-gray-600">Choose the mattress models available in your store</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowAddBrand(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Brand
          </Button>
          <Button 
            variant="primary"
            onClick={() => setCurrentStep(2)}
            disabled={getSelectedModelsCount() === 0}
          >
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {showAddBrand && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Add Custom Brand</h2>
            <button onClick={() => setShowAddBrand(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Brand Name">
              <input
                type="text"
                value={newBrand.name}
                onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-gray-200"
                placeholder="Enter brand name"
              />
            </FormField>
            <FormField label="Initial Series Name">
              <input
                type="text"
                value={newBrand.seriesName}
                onChange={(e) => setNewBrand(prev => ({ ...prev, seriesName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-gray-200"
                placeholder="e.g., Premium Series"
              />
            </FormField>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="primary" onClick={handleAddBrand}>
              Add Brand
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {brands.map(brand => (
          <Card key={brand.id} className="overflow-hidden">
            <button
              onClick={() => toggleBrand(brand.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{brand.name}</span>
                {brand.isCustom && (
                  <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">
                    Custom
                  </span>
                )}
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedBrands.includes(brand.id) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedBrands.includes(brand.id) && (
              <div className="border-t">
                {brand.series.map((series, seriesIndex) => (
                  <div key={series.name} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-sm text-gray-700">{series.name}</h3>
                      {brand.isCustom && (
                        <Button 
                          variant="secondary" 
                          onClick={() => setShowAddModel({ brandId: brand.id, seriesIndex })}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Model
                        </Button>
                      )}
                    </div>
                    
                    {showAddModel?.brandId === brand.id && 
                     showAddModel?.seriesIndex === seriesIndex && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField label="Model Name">
                            <input
                              type="text"
                              value={newModel.name}
                              onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="Enter model name"
                            />
                          </FormField>

                          <FormField label="Description">
                            <textarea
                              value={newModel.description}
                              onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none"
                              placeholder="Brief description of the mattress"
                            />
                          </FormField>

                          <FormField label="Firmness Level">
                            <select 
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              value={newModel.specs?.firmness || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, firmness: e.target.value }
                              }))}
                            >
                              <option value="">Select Firmness</option>
                              <option value="Extra Soft">Extra Soft</option>
                              <option value="Soft">Soft</option>
                              <option value="Medium Soft">Medium Soft</option>
                              <option value="Medium">Medium</option>
                              <option value="Medium Firm">Medium Firm</option>
                              <option value="Firm">Firm</option>
                              <option value="Extra Firm">Extra Firm</option>
                            </select>
                          </FormField>

                          <FormField label="Type">
                            <select 
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              value={newModel.specs?.type || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, type: e.target.value }
                              }))}
                            >
                              <option value="">Select Type</option>
                              <option value="Memory Foam">Memory Foam</option>
                              <option value="Innerspring">Innerspring</option>
                              <option value="Hybrid">Hybrid</option>
                              <option value="Latex">Latex</option>
                              <option value="Airbed">Airbed</option>
                            </select>
                          </FormField>

                          <FormField label="Height">
                            <input
                              type="text"
                              value={newModel.specs?.height || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, height: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., 12 inches"
                            />
                          </FormField>

                          <FormField label="Materials">
                            <input
                              type="text"
                              value={newModel.specs?.materials?.join(', ') || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { 
                                  ...prev.specs, 
                                  materials: e.target.value.split(',').map(m => m.trim()) 
                                }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., Memory Foam, Coils, Latex"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate materials with commas</p>
                          </FormField>

                          <FormField label="Best For Sleeping Positions">
                            <input
                              type="text"
                              value={newModel.specs?.sleepingPositions?.join(', ') || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { 
                                  ...prev.specs, 
                                  sleepingPositions: e.target.value.split(',').map(p => p.trim()) 
                                }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., Back, Side, Stomach"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate positions with commas</p>
                          </FormField>

                          <FormField label="Cooling Systems">
                            <input
                              type="text"
                              value={newModel.specs?.coolingSystems?.join(', ') || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { 
                                  ...prev.specs, 
                                  coolingSystems: e.target.value.split(',').map(c => c.trim()) 
                                }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., Gel-infused foam, Phase change material"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate features with commas</p>
                          </FormField>

                          <FormField label="Edge Support">
                            <select 
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              value={newModel.specs?.edgeSupport || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, edgeSupport: e.target.value }
                              }))}
                            >
                              <option value="">Select Edge Support</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </FormField>

                          <FormField label="Motion Transfer">
                            <select 
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              value={newModel.specs?.motionTransfer || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, motionTransfer: e.target.value }
                              }))}
                            >
                              <option value="">Select Motion Transfer</option>
                              <option value="Minimal">Minimal</option>
                              <option value="Low">Low</option>
                              <option value="Moderate">Moderate</option>
                              <option value="High">High</option>
                            </select>
                          </FormField>

                          <FormField label="Warranty">
                            <input
                              type="text"
                              value={newModel.specs?.warranty || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, warranty: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., 10 years"
                            />
                          </FormField>

                          <FormField label="Trial Period">
                            <input
                              type="text"
                              value={newModel.specs?.trialPeriod || ''}
                              onChange={(e) => setNewModel(prev => ({
                                ...prev,
                                specs: { ...prev.specs, trialPeriod: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border rounded-lg border-gray-200"
                              placeholder="e.g., 100 nights"
                            />
                          </FormField>

                          <FormField label="Minimum Price">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={newModel.priceRange?.min || ''}
                                onChange={(e) => setNewModel(prev => ({
                                  ...prev,
                                  priceRange: { 
                                    ...prev.priceRange, 
                                    min: parseFloat(e.target.value) 
                                  }
                                }))}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg border-gray-200"
                                placeholder="0"
                              />
                            </div>
                          </FormField>

                          <FormField label="Maximum Price">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={newModel.priceRange?.max || ''}
                                onChange={(e) => setNewModel(prev => ({
                                  ...prev,
                                  priceRange: { 
                                    ...prev.priceRange, 
                                    max: parseFloat(e.target.value) 
                                  }
                                }))}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg border-gray-200"
                                placeholder="0"
                              />
                            </div>
                          </FormField>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="secondary" onClick={() => setShowAddModel(null)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            onClick={() => handleAddModel(brand.id, seriesIndex)}
                          >
                            Add Model
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {series.models.map(model => (
                        <label 
                          key={model.id}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <input
                            type="checkbox"
                            checked={model.selected}
                            onChange={() => toggleModel(brand.id, seriesIndex, model.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                          />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            {model.description && (
                              <div className="text-xs text-gray-500">{model.description}</div>
                            )}
                            {model.priceRange && (
                              <div className="text-xs text-gray-500">
                                Price Range: ${model.priceRange.min.toLocaleString()} - ${model.priceRange.max.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );

  const renderStepTwo = () => (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Step 2: Add Product URLs</h1>
          <p className="text-gray-600">Add links to your product description pages for each selected model</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </Button>
          <Button variant="primary">
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {brands.map(brand => {
          const hasSelectedModels = brand.series.some(series => 
            series.models.some(model => model.selected)
          );

          if (!hasSelectedModels) return null;

          return (
            <Card key={brand.id} className="p-6">
              <h2 className="text-lg font-semibold mb-4">{brand.name}</h2>
              <div className="space-y-6">
                {brand.series.map((series, seriesIndex) => {
                  const selectedModels = series.models.filter(model => model.selected);
                  if (selectedModels.length === 0) return null;

                  return (
                    <div key={series.name} className="space-y-4">
                      <h3 className="font-medium text-sm text-gray-700">{series.name}</h3>
                      <div className="space-y-4">
                        {selectedModels.map(model => (
                          <div key={model.id} className="flex items-start gap-4">
                            <div className="flex-grow">
                              <FormField label={model.name}>
                                <div className="relative">
                                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="url"
                                    value={model.productUrl || ''}
                                    onChange={(e) => updateModelUrl(brand.id, seriesIndex, model.id, e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg border-gray-200"
                                    placeholder="https://your-store.com/products/..."
                                  />
                                </div>
                              </FormField>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {currentStep === 1 ? renderStepOne() : renderStepTwo()}
    </div>
  );
};

export default MerchantBrandsPage;