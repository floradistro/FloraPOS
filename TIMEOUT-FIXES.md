# AI Chat Timeout Fixes

## Issues Resolved:

1. **Increased Timeout Duration**
   - Changed from 15 seconds to 30 seconds
   - Allows more time for slow API responses

2. **Automatic Retry Logic**
   - If `get_products` times out, automatically retries with only 5 items
   - Prevents complete failure on slow connections

3. **Reduced Default Product Count**
   - Changed default from 20 to 10 products per page
   - Reduces initial load on the API

4. **Improved Error Messages**
   - Clear timeout indicators with ⏱️ icon
   - Helpful suggestions to request fewer items
   - Better error details for troubleshooting

5. **Updated System Prompt**
   - AI now knows to start with smaller requests
   - Will automatically paginate if needed
   - Aware of timeout issues and how to handle them

## Testing:

Try these queries to test the improvements:
- "Show me 5 products" (should work quickly)
- "List all products" (AI should automatically use smaller page size)
- "Show inventory" (will retry with fewer items if timeout occurs)

## Performance Tips:

- For large datasets, use specific filters (category, search terms)
- Request smaller batches and paginate as needed
- The API performs better with targeted queries vs. broad requests