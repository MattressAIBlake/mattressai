import React, { useState } from 'react';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Settings2, MessageSquare, Store, Palette, BrainCircuit, X, Plus } from 'lucide-react';

const AssistantConfiguration = () => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6">
      {/* Branding & Appearance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Branding & Appearance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Assistant Name">
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="Enter assistant name"
              defaultValue="MattressAI Assistant"
            />
          </FormField>

          <FormField label="Brand Color">
            <div className="flex gap-3">
              <input 
                type="color" 
                className="h-10 w-20 border rounded cursor-pointer"
                defaultValue="#2563eb"
              />
              <input 
                type="text" 
                className="flex-grow px-3 py-2 border rounded-lg border-gray-200"
                placeholder="#2563eb"
                defaultValue="#2563eb"
              />
            </div>
          </FormField>

          <FormField label="Chat Window Title">
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="How can we help you find your perfect mattress?"
              defaultValue="Find Your Perfect Mattress"
            />
          </FormField>

          <FormField label="Chat Icon">
            <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
              <option value="default">Default Chat Icon</option>
              <option value="store">Store Icon</option>
              <option value="bed">Bed Icon</option>
              <option value="custom">Custom Upload</option>
            </select>
          </FormField>
        </div>
      </Card>

      {/* Store Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Store Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Store Name">
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="Your store name"
            />
          </FormField>

          <FormField label="Store Hours">
            <textarea 
              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none" 
              placeholder="Mon-Fri: 9am-6pm&#10;Sat: 10am-5pm&#10;Sun: Closed"
            />
          </FormField>

          <FormField label="Store Locations">
            <textarea 
              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none" 
              placeholder="Enter your store locations"
            />
          </FormField>

          <FormField label="Contact Information">
            <textarea 
              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none" 
              placeholder="Phone: (555) 123-4567&#10;Email: sales@yourstore.com"
            />
          </FormField>
        </div>
      </Card>

      {/* Conversation Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Conversation Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Initial Greeting">
            <textarea 
              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none" 
              placeholder="Enter the greeting message"
              defaultValue="Hello! I'm your mattress expert. How can I help you find the perfect mattress today?"
            />
          </FormField>

          <FormField label="Tone & Personality Directive">
            <textarea 
              className="w-full px-3 py-2 border rounded-lg border-gray-200 h-24 resize-none" 
              placeholder="Examples:&#10;- Be friendly and use emojis 😊&#10;- Maintain a professional, knowledgeable tone&#10;- Be casual and relatable&#10;- Use humor and dad jokes&#10;- Be concise and to-the-point"
              defaultValue="Be friendly and professional, use occasional emojis to keep the conversation engaging 😊"
            />
            <p className="text-sm text-gray-500 mt-1">
              Guide how your assistant should communicate. You can specify tone, personality, and style preferences.
            </p>
          </FormField>

          <FormField label="Conversation Style">
            <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
              <option value="professional">Professional & Knowledgeable</option>
              <option value="friendly">Friendly & Approachable</option>
              <option value="casual">Casual & Relaxed</option>
              <option value="luxury">Luxury & High-end</option>
            </select>
          </FormField>

          <FormField label="Lead Capture Timing">
            <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
              <option value="immediate">Immediate</option>
              <option value="after-engagement">After Initial Engagement</option>
              <option value="before-recommendation">Before Product Recommendation</option>
              <option value="end">End of Conversation</option>
            </select>
          </FormField>
        </div>
      </Card>

      {/* AI Behavior */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BrainCircuit className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">AI Behavior</h2>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Product Knowledge Base">
              <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
                <option value="all">All Products</option>
                <option value="in-stock">In-Stock Only</option>
                <option value="featured">Featured Products</option>
              </select>
            </FormField>

            <FormField label="Primary Goal">
              <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
                <option value="lead">Get Lead Information</option>
                <option value="product">Direct to Product Pages</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Choose whether to prioritize collecting customer information or directing to product pages
              </p>
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-700">Education Topics</h3>
              <span className="text-xs text-gray-500">Topics the assistant will proactively educate about</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>Quality Bedding</span>
                <button className="text-blue-400 hover:text-blue-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>Adjustable Bases</span>
                <button className="text-blue-400 hover:text-blue-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>Sleep Positions</span>
                <button className="text-blue-400 hover:text-blue-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm border-2 border-dashed border-gray-200">
                <input 
                  type="text" 
                  className="w-24 bg-transparent border-none p-0 focus:outline-none text-sm placeholder:text-gray-400" 
                  placeholder="Add topic..."
                />
                <button className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Advanced Settings</h3>
            <div className="space-y-6">
              <FormField label="Response Creativity">
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="70"
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
              </FormField>

              <FormField label="Product Recommendation Limit">
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border rounded-lg border-gray-200" 
                  defaultValue={3}
                  min={1}
                  max={10}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum number of products to recommend at once
                </p>
              </FormField>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Button variant="secondary" onClick={() => setShowPreview(!showPreview)}>
          Preview Changes
        </Button>
        <Button variant="primary">
          Save Configuration
        </Button>
      </div>

      {showPreview && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Chat preview would go here */}
          <div className="p-4 border-b">
            <h3 className="font-medium">Preview Mode</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-center">Chat preview coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantConfiguration;