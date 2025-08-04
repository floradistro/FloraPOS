# Environment Configuration

To set up your environment variables:

1. Create a `.env.local` file in the project root:

```bash
# WooCommerce API Configuration
NEXT_PUBLIC_WOO_API_URL=https://api.floradistro.com
WOO_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WOO_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

2. Restart your development server after creating the file.

## Testing the AI Chat

1. Navigate to http://localhost:3000/test-ai-chat
2. Try queries like:
   - "Show me all products"
   - "What are my low stock items?"
   - "List recent orders"

## Troubleshooting

If the AI isn't responding:
1. Check browser console for errors
2. Verify API keys are correct
3. Ensure WooCommerce API is accessible
4. Check network tab for failed requests