import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Copy, Code2 } from 'lucide-react';

const EmbedMattressAI = () => {
  const embedCode = `<script>
  window.mattressAIConfig = {
    apiKey: 'YOUR_API_KEY',
    theme: 'light',
    position: 'bottom-right'
  };
</script>
<script src="https://embed.mattressai.com/widget.js"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Embed MattressAI</h2>
        <p className="text-sm text-gray-500">Add MattressAI to your website with a simple embed code</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <select className="w-full px-3 py-2 border rounded-lg border-gray-200">
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Embed Code</h3>
          <div className="relative">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-md shadow-sm border"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Installation Guide</h3>
          <div className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li>Copy the embed code above</li>
              <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag of your website</li>
              <li>Replace <code>YOUR_API_KEY</code> with your actual API key</li>
              <li>Customize the configuration options as needed</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="secondary">
            <Code2 className="w-4 h-4 mr-2" />
            View Documentation
          </Button>
          <Button variant="primary">
            Generate New API Key
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EmbedMattressAI;