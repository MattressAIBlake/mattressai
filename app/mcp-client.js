import { generateAuthUrl } from "./auth.server";
import { getCustomerToken } from "./db.server";

/**
 * Client for interacting with Model Context Protocol (MCP) API endpoints.
 * Manages connections to both customer and storefront MCP endpoints, and handles tool invocation.
 */
class MCPClient {
  /**
   * Creates a new MCPClient instance.
   *
   * @param {string} hostUrl - The base URL for the shop
   * @param {string} conversationId - ID for the current conversation
   * @param {string} shopId - ID of the Shopify shop
   */
  constructor(hostUrl, conversationId, shopId, customerMcpEndpoint) {
    this.tools = [];
    this.customerTools = [];
    this.storefrontTools = [];
    this.customTools = [];
    
    // Ensure hostUrl has protocol
    const normalizedHostUrl = hostUrl.startsWith('http') ? hostUrl : `https://${hostUrl}`;
    
    // IMPORTANT: Store shop domain for tenant-specific queries
    this.shopDomain = normalizedHostUrl.replace(/^https?:\/\//, '');
    
    // TODO: Make this dynamic, for that first we need to allow access of mcp tools on password proteted demo stores.
    this.storefrontMcpEndpoint = `${normalizedHostUrl}/api/mcp`;

    const accountHostUrl = normalizedHostUrl.replace(/(\.myshopify\.com)$/, '.account$1');
    this.customerMcpEndpoint = customerMcpEndpoint || `${accountHostUrl}/customer/api/mcp`;
    this.customerAccessToken = "";
    this.conversationId = conversationId;
    this.shopId = shopId;
    
    // Define custom mattress search tools
    this.customTools = [
      {
        name: 'search_mattresses',
        description: 'Search our enriched mattress catalog based on customer preferences. This uses AI-powered vector search with enriched product attributes (firmness, materials, cooling features, etc.). ALWAYS use this tool instead of generic product search when customers ask about mattresses or need mattress recommendations.',
        input_schema: {
          type: 'object',
          properties: {
            firmness: { 
              type: 'string', 
              enum: ['soft', 'medium-soft', 'medium', 'medium-firm', 'firm'],
              description: 'Desired mattress firmness level'
            },
            sleepPosition: { 
              type: 'string', 
              enum: ['side', 'back', 'stomach', 'combination'],
              description: 'Primary sleep position'
            },
            budget: { 
              type: 'object', 
              properties: { 
                min: { type: 'number', description: 'Minimum price' }, 
                max: { type: 'number', description: 'Maximum price' } 
              },
              description: 'Price range budget'
            },
            coolingPreference: { 
              type: 'boolean',
              description: 'Whether customer prefers cooling features for hot sleepers'
            },
            motionIsolation: {
              type: 'boolean',
              description: 'Whether customer needs motion isolation (for couples)'
            },
            edgeSupport: {
              type: 'boolean',
              description: 'Whether customer needs strong edge support'
            },
            organic: {
              type: 'boolean',
              description: 'Whether customer prefers organic/natural materials'
            },
            rawQuery: { 
              type: 'string', 
              description: 'Free-text search query for any other preferences' 
            }
          }
        }
      },
      {
        name: 'check_index_status',
        description: 'Check if the mattress catalog has been indexed and is ready for recommendations. Call this at the start of conversations to verify product availability.',
        input_schema: { 
          type: 'object', 
          properties: {} 
        }
      }
    ];
  }

  /**
   * Connects to the customer MCP server and retrieves available tools.
   * Attempts to use an existing token or will proceed without authentication.
   *
   * @returns {Promise<Array>} Array of available customer tools
   * @throws {Error} If connection to MCP server fails
   */
  async connectToCustomerServer() {
    try {
      console.log(`Connecting to MCP server at ${this.customerMcpEndpoint}`);

      if (this.conversationId) {
        const dbToken = await getCustomerToken(this.conversationId);

        if (dbToken && dbToken.accessToken) {
          this.customerAccessToken = dbToken.accessToken;
        } else {
          console.log("No token in database for conversation:", this.conversationId);
        }
      }

      // If we still don't have a token, we'll connect without one
      // and tools that require auth will prompt for it later
      const headers = {
        "Content-Type": "application/json",
        "Authorization": this.customerAccessToken || ""
      };

      const response = await this._makeJsonRpcRequest(
        this.customerMcpEndpoint,
        "tools/list",
        {},
        headers
      );

      // Extract tools from the JSON-RPC response format
      const toolsData = response.result && response.result.tools ? response.result.tools : [];
      const customerTools = this._formatToolsData(toolsData);

      this.customerTools = customerTools;
      this.tools = [...this.tools, ...customerTools];

      return customerTools;
    } catch (e) {
      console.error("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  /**
   * Connects to the storefront MCP server and retrieves available tools.
   *
   * @returns {Promise<Array>} Array of available storefront tools
   * @throws {Error} If connection to MCP server fails
   */
  async connectToStorefrontServer() {
    try {
      console.log(`Connecting to MCP server at ${this.storefrontMcpEndpoint}`);

      const headers = {
        "Content-Type": "application/json"
      };

      const response = await this._makeJsonRpcRequest(
        this.storefrontMcpEndpoint,
        "tools/list",
        {},
        headers
      );

      // Extract tools from the JSON-RPC response format
      const toolsData = response.result && response.result.tools ? response.result.tools : [];
      const storefrontTools = this._formatToolsData(toolsData);

      this.storefrontTools = storefrontTools;
      // IMPORTANT: Add custom tools first so they take priority
      this.tools = [...this.customTools, ...storefrontTools, ...this.tools];

      return storefrontTools;
    } catch (e) {
      console.error("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  /**
   * Dispatches a tool call to the appropriate MCP server based on the tool name.
   *
   * @param {string} toolName - Name of the tool to call
   * @param {Object} toolArgs - Arguments to pass to the tool
   * @returns {Promise<Object>} Result from the tool call
   * @throws {Error} If tool is not found or call fails
   */
  async callTool(toolName, toolArgs) {
    // Check custom tools first (highest priority)
    if (this.customTools.some(tool => tool.name === toolName)) {
      return this.callCustomTool(toolName, toolArgs);
    } else if (this.customerTools.some(tool => tool.name === toolName)) {
      return this.callCustomerTool(toolName, toolArgs);
    } else if (this.storefrontTools.some(tool => tool.name === toolName)) {
      return this.callStorefrontTool(toolName, toolArgs);
    } else {
      throw new Error(`Tool ${toolName} not found`);
    }
  }

  /**
   * Calls a tool on the storefront MCP server.
   *
   * @param {string} toolName - Name of the storefront tool to call
   * @param {Object} toolArgs - Arguments to pass to the tool
   * @returns {Promise<Object>} Result from the tool call
   * @throws {Error} If the tool call fails
   */
  async callStorefrontTool(toolName, toolArgs) {
    try {
      console.log("Calling storefront tool", toolName, toolArgs);

      const headers = {
        "Content-Type": "application/json"
      };

      const response = await this._makeJsonRpcRequest(
        this.storefrontMcpEndpoint,
        "tools/call",
        {
          name: toolName,
          arguments: toolArgs,
        },
        headers
      );

      return response.result || response;
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Calls a tool on the customer MCP server.
   * Handles authentication if needed.
   *
   * @param {string} toolName - Name of the customer tool to call
   * @param {Object} toolArgs - Arguments to pass to the tool
   * @returns {Promise<Object>} Result from the tool call or auth error
   * @throws {Error} If the tool call fails
   */
  async callCustomerTool(toolName, toolArgs) {
    try {
      console.log("Calling customer tool", toolName, toolArgs);
      // First try to get a token from the database for this conversation
      let accessToken = this.customerAccessToken;

      if (!accessToken || accessToken === "") {
        const dbToken = await getCustomerToken(this.conversationId);

        if (dbToken && dbToken.accessToken) {
          accessToken = dbToken.accessToken;
          this.customerAccessToken = accessToken; // Store it for later use
        } else {
          console.log("No token in database for conversation:", this.conversationId);
        }
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": accessToken
      };

      try {
        const response = await this._makeJsonRpcRequest(
          this.customerMcpEndpoint,
          "tools/call",
          {
            name: toolName,
            arguments: toolArgs,
          },
          headers
        );

        return response.result || response;
      } catch (error) {
        // Handle 401 specifically to trigger authentication
        if (error.status === 401) {
          console.log("Unauthorized, generating authorization URL for customer");

          // Generate auth URL
          const authResponse = await generateAuthUrl(this.conversationId, this.shopId);

          // Instead of retrying, return the auth URL for the front-end
          return {
            error: {
              type: "auth_required",
              data: `You need to authorize the app to access your customer data. [Click here to authorize](${authResponse.url})`
            }
          };
        }

        // Re-throw other errors
        throw error;
      }
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      return {
        error: {
          type: "internal_error",
          data: `Error calling tool ${toolName}: ${error.message}`
        }
      };
    }
  }

  /**
   * Makes a JSON-RPC request to the specified endpoint.
   *
   * @private
   * @param {string} endpoint - The endpoint URL
   * @param {string} method - The JSON-RPC method to call
   * @param {Object} params - Parameters for the method
   * @param {Object} headers - HTTP headers for the request
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {Error} If the request fails
   */
  async _makeJsonRpcRequest(endpoint, method, params, headers) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: method,
        id: 1,
        params: params
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      const errorObj = new Error(`Request failed: ${response.status} ${error}`);
      errorObj.status = response.status;
      throw errorObj;
    }

    return await response.json();
  }

  /**
   * Calls a custom tool (local implementation without MCP protocol).
   * Handles mattress search and indexing status checks.
   *
   * @param {string} toolName - Name of the custom tool to call
   * @param {Object} toolArgs - Arguments to pass to the tool
   * @returns {Promise<Object>} Result from the tool call
   * @throws {Error} If the tool call fails
   */
  async callCustomTool(toolName, toolArgs) {
    try {
      console.log(`Calling custom tool: ${toolName}`, toolArgs);
      
      // Import services dynamically
      const { getProductRecommendations } = await import('./lib/recommendations/recommendation.service.server');
      const { prisma } = await import('./db.server');
      
      if (toolName === 'search_mattresses') {
        try {
          console.log(`🔍 Searching for mattresses - Tenant: ${this.shopDomain}, Args:`, toolArgs);
          
          // CRITICAL: Pass shop domain for tenant-specific search
          const recommendations = await getProductRecommendations(
            this.shopDomain,  // Tenant identifier
            toolArgs,
            { topK: 5, includeOutOfStock: true } // Include out-of-stock for debugging
          );
          
          console.log(`📊 Search returned ${recommendations.length} products`);
          
          if (recommendations.length === 0) {
            // Check if indexing is in progress
            const activeJob = await prisma.indexJob.findFirst({
              where: { 
                tenant: this.shopDomain, 
                status: { in: ['pending', 'running'] } 
              }
            });
            
            if (activeJob) {
              return {
                content: [{
                  type: 'text',
                  text: 'Our mattress catalog is currently being indexed. This typically takes 5-10 minutes for completion. Would you like general mattress shopping guidance in the meantime, or would you prefer to wait until our full catalog is available?'
                }]
              };
            }
            
            // No products indexed at all
            const tenant = await prisma.tenant.findUnique({ 
              where: { shop: this.shopDomain } 
            });
            
            const fallbackMessage = tenant?.fallbackContactInfo 
              ? `Please contact us at ${tenant.fallbackContactInfo} for personalized assistance.`
              : 'Please contact our team for personalized assistance.';
            
            return {
              content: [{
                type: 'text',
                text: `I don't have access to our mattress catalog yet. ${fallbackMessage}`
              }]
            };
          }
          
          // Format recommendations for the AI
          const formattedResults = recommendations.map(product => ({
            productId: product.productId,
            title: product.title,
            vendor: product.vendor,
            imageUrl: product.imageUrl,
            score: product.score,
            fitScore: product.fitScore,
            firmness: product.firmness,
            material: product.material,
            height: product.height,
            features: product.features,
            certifications: product.certifications,
            whyItFits: product.whyItFits,
            price: product.price,
            availableForSale: product.availableForSale
          }));
          
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                success: true,
                count: recommendations.length,
                products: formattedResults
              }, null, 2)
            }] 
          };
          
        } catch (error) {
          console.error('Error in search_mattresses:', error);
          return {
            content: [{
              type: 'text',
              text: `I encountered an error searching our mattress catalog: ${error.message}. Please try again or contact our support team.`
            }]
          };
        } finally {
          await prisma.$disconnect();
        }
      }
      
      if (toolName === 'check_index_status') {
        try {
          // Check indexed product count FOR THIS TENANT ONLY
          const { getVectorStoreProvider } = await import('./lib/ports/provider-registry');
          const vectorStore = getVectorStoreProvider(this.shopDomain);
          
          // Try a simple search to check if any products exist
          const testEmbedding = new Array(1536).fill(0); // OpenAI embedding dimension
          const results = await vectorStore.search(testEmbedding, {
            topK: 1,
            filter: { tenant_id: this.shopDomain }
          });
          
          const productCount = results.length;
          const isIndexed = productCount > 0;
          
          // Check for active indexing job
          const activeJob = await prisma.indexJob.findFirst({
            where: { 
              tenant: this.shopDomain, 
              status: { in: ['pending', 'running'] } 
            },
            orderBy: { startedAt: 'desc' }
          });
          
          const lastCompletedJob = await prisma.indexJob.findFirst({
            where: { 
              tenant: this.shopDomain,
              status: 'completed'
            },
            orderBy: { finishedAt: 'desc' }
          });
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                indexed: isIndexed,
                shop: this.shopDomain,
                productCount: productCount,
                indexingInProgress: !!activeJob,
                lastIndexed: lastCompletedJob?.finishedAt,
                message: isIndexed 
                  ? `Catalog is indexed and ready with ${productCount > 0 ? 'products' : 'no products yet'} available`
                  : activeJob 
                    ? 'Catalog is currently being indexed...'
                    : 'Catalog not indexed yet'
              }, null, 2)
            }]
          };
          
        } catch (error) {
          console.error('Error in check_index_status:', error);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ 
                indexed: false, 
                error: error.message,
                message: 'Unable to check index status'
              }, null, 2)
            }]
          };
        } finally {
          await prisma.$disconnect();
        }
      }
      
      throw new Error(`Unknown custom tool: ${toolName}`);
      
    } catch (error) {
      console.error(`Error calling custom tool ${toolName}:`, error);
      return {
        content: [{
          type: 'text',
          text: `Error executing ${toolName}: ${error.message}`
        }]
      };
    }
  }

  /**
   * Formats raw tool data into a consistent format.
   *
   * @private
   * @param {Array} toolsData - Raw tools data from the API
   * @returns {Array} Formatted tools data
   */
  _formatToolsData(toolsData) {
    return toolsData.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema || tool.input_schema,
      };
    });
  }
}

export default MCPClient;
