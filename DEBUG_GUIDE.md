# 🔍 AI System Debugging Guide

## Please Provide Error Details

I need to see the exact error to diagnose the issue. Please share:

1. **The exact error message from the browser AI chat**
2. **Browser console logs** (Open DevTools → Console tab)
3. **Any terminal output** from where `npm run dev` is running

---

## Common Issues & Quick Checks

### **Issue 1: Type Conversion Error**
**Error:** `max_tokens: Input should be a valid integer`
**Status:** ✅ FIXED (added parseInt/parseFloat)

### **Issue 2: Missing system_prompt**
**Error:** `system: undefined` or empty
**Quick Check:**
```bash
docker exec docker-wordpress-db-1 mysql -uwordpress -pwordpress wordpress -e "SELECT LENGTH(system_prompt) FROM wp_flora_ai_agents WHERE id=1;"
```
**Should return:** Number > 1000

### **Issue 3: WordPress not accessible**
**Error:** `Failed to fetch tools: 404`
**Quick Check:**
```bash
curl http://localhost:8081/wp-json/flora-im/v1/ai/tools
```
**Should return:** `{"success":true,"count":11,...}`

### **Issue 4: Cache serving old data**
**Solution:** Restart Next.js to clear cache
```bash
pkill -f "next dev" && npm run dev
```

---

## Debugging Commands

### Check WordPress Agent:
```bash
docker exec docker-wordpress-db-1 mysql -uwordpress -pwordpress wordpress -e "SELECT id, name, model, temperature, max_tokens, LENGTH(system_prompt) as prompt_len FROM wp_flora_ai_agents WHERE id=1;"
```

### Check Tools API:
```bash
curl http://localhost:8081/wp-json/flora-im/v1/ai/tools | jq '.count'
```

### Check Config API:
```bash
curl http://localhost:3000/api/ai/config -H "x-api-environment: docker" | jq '.success'
```

### Check if WordPress is running:
```bash
docker ps | grep wordpress
```

---

## What Error Are You Seeing?

Please paste the error message and I'll fix it immediately!

