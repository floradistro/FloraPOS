# Staging Environment Setup

## 🎯 Goal: Create staging.api.floradistro.com

### Siteground Setup:
1. **Create Subdomain:**
   - Login to Siteground cPanel
   - Go to Subdomains
   - Create: `staging.api.floradistro.com`
   - Point to new directory: `/staging-wordpress/`

2. **Clone Live Site:**
   ```bash
   # In Siteground File Manager or SSH
   cp -r /public_html/* /staging-wordpress/
   
   # Update wp-config.php for staging database
   # Create staging database: staging_wordpress
   ```

3. **Vercel Staging Deployments:**
   ```bash
   # In Flora POS project
   vercel --prod --alias staging-pos.vercel.app
   
   # Environment variables for staging:
   NEXT_PUBLIC_WORDPRESS_API_URL=https://staging.api.floradistro.com
   ```

### Automated Deployment Pipeline:
```yaml
# .github/workflows/staging-deploy.yml
on:
  push:
    branches: [develop]
    
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy WordPress plugins to staging
          # Deploy Next.js to Vercel staging
          # Run automated tests
```
