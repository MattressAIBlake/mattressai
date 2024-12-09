import React, { useEffect } from 'react';
import { usePromptStore } from '../../stores/assistantPromptStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Bot, Package } from 'lucide-react';

const AssistantConfigPage = () => {
  const { masterPrompt, generateMasterPrompt, setMasterPrompt, inventory } = usePromptStore();

  // Generate prompt on first load if empty
  useEffect(() => {
    if (!masterPrompt) {
      generateMasterPrompt();
    }
  }, [masterPrompt, generateMasterPrompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMasterPrompt(e.target.value);
  };

  const handleRegeneratePrompt = () => {
    generateMasterPrompt();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Master Prompt Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">AI Assistant Master Prompt</h2>
          </div>
          <Button variant="secondary" onClick={handleRegeneratePrompt}>
            Regenerate from Settings
          </Button>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-4">
            This is the master prompt that will be used to guide the AI Assistant's behavior. 
            It combines all settings from Assistant Configuration and Assistant Questions.
          </p>
          
          <textarea
            value={masterPrompt}
            onChange={handlePromptChange}
            className="w-full h-[400px] px-4 py-3 border rounded-lg border-gray-200 font-mono text-sm"
            placeholder="The master prompt will be generated from your settings and inventory..."
          />
        </div>
      </Card>

      {/* Selected Inventory Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Selected Inventory</h2>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-4">
            These are the mattresses currently selected in your inventory that the AI Assistant will recommend:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">
                No mattresses selected. Please add mattresses in the Inventory section.
              </p>
            ) : (
              inventory.map((mattress) => (
                <div 
                  key={mattress.id} 
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <h3 className="font-medium">{mattress.brand}</h3>
                  <p className="text-sm text-gray-600">{mattress.name}</p>
                  {mattress.priceRange && (
                    <p className="text-xs text-gray-500 mt-1">
                      ${mattress.priceRange.min.toLocaleString()} - ${mattress.priceRange.max.toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssistantConfigPage; 