# Migration from Claude to OpenAI

## Summary
This document outlines the migration from Claude (Anthropic) to OpenAI as the LLM provider for the chat functionality.

## Changes Made

### 1. New OpenAI Service
**File Created:** `app/services/openai.server.js`
- Implements OpenAI chat completions with streaming support
- Converts Claude-format messages and tools to OpenAI format
- Maintains compatibility with existing tool use patterns
- Supports the same event handlers as the Claude service

### 2. Configuration Updates
**File:** `app/services/config.server.js`
- Changed default model from `claude-3-5-sonnet-latest` to `gpt-4o`
- Updated error messages to reference OpenAI instead of Claude

### 3. Chat Route Updates
**File:** `app/routes/chat.jsx`
- Replaced `createClaudeService()` with `createOpenAIService()`
- Updated comments to reference OpenAI
- No changes to the chat flow logic (fully compatible)

### 4. Streaming Service Updates
**File:** `app/services/streaming.server.js`
- Updated error messages to reference OpenAI API

### 5. Frontend Updates
**File:** `extensions/chat-bubble/assets/chat.js`
- Updated error logging to reference OpenAI API

**File:** `app/routes/app._index.jsx`
- Updated app description to mention OpenAI

### 6. Documentation Updates
**File:** `README.md`
- Updated architecture description to mention OpenAI
- Updated tech stack to reference OpenAI instead of Claude

## Environment Variables

### Required Change
Update your environment variables to use OpenAI instead of Claude:

```bash
# Remove (or keep for fallback):
# CLAUDE_API_KEY=sk-ant-xxxxx

# Add or ensure this is set:
OPENAI_API_KEY=sk-proj-xxxxx
```

The app will now read from `OPENAI_API_KEY` instead of `CLAUDE_API_KEY`.

## Key Features Maintained

✅ **Streaming Responses** - OpenAI streaming is fully implemented
✅ **Tool Use** - MCP tools work with OpenAI function calling
✅ **Conversation History** - Message format conversion maintains compatibility
✅ **Error Handling** - All error cases are handled appropriately
✅ **Message Format** - Automatic conversion between Claude and OpenAI formats

## Technical Details

### Message Format Conversion
The OpenAI service automatically converts:
- Claude's content blocks → OpenAI messages
- Claude's tool_use → OpenAI function calls
- Claude's tool_result → OpenAI tool messages

### Tool Format Conversion
Tools are converted from Claude's MCP format to OpenAI's function calling format:
- `input_schema` → `parameters`
- Tool structure maintains compatibility with MCP client

### Streaming Implementation
- Uses OpenAI's native streaming API
- Maintains the same event handlers (onText, onMessage, onToolUse)
- Compatible with existing SSE infrastructure

## Models Available

The service is configured to use `gpt-4o` by default. You can change this in `app/services/config.server.js` to any OpenAI model:
- `gpt-4o` - Latest GPT-4 optimized model (recommended)
- `gpt-4-turbo` - Fast, multimodal flagship model
- `gpt-3.5-turbo` - Fast, cost-effective option

## Backward Compatibility

The old Claude service file (`app/services/claude.server.js`) has been preserved in case you need to:
- Roll back to Claude
- Run A/B tests between providers
- Use both providers simultaneously

To switch back to Claude, simply:
1. Update `app/routes/chat.jsx` to import `createClaudeService`
2. Update `app/services/config.server.js` model to a Claude model
3. Set `CLAUDE_API_KEY` environment variable

## Testing Checklist

Before deploying to production, test:
- [ ] Chat streaming works correctly
- [ ] Tool calls (product search, cart actions) function properly
- [ ] Conversation history persists across messages
- [ ] Error handling displays appropriate messages
- [ ] CORS headers work for cross-origin requests
- [ ] Rate limiting is handled gracefully

## Performance Considerations

**OpenAI vs Claude:**
- OpenAI typically has faster response times
- GPT-4o is optimized for speed and cost
- Token limits may differ (adjust `maxTokens` in config if needed)

## Support

If you encounter issues:
1. Check that `OPENAI_API_KEY` is set correctly
2. Verify the model name in config.server.js is valid
3. Check OpenAI API status at status.openai.com
4. Review error logs for specific API error messages

