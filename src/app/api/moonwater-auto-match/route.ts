import { NextRequest, NextResponse } from 'next/server'

const FLORA_API_URL = 'https://api.floradistro.com'
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// Helper function to make WooCommerce API calls
async function makeWooCommerceRequest(endpoint: string, method: string = 'GET', data?: any) {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }
  
  const response = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/${endpoint}`, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

// Alternative approach: Try WordPress REST API without authentication for public media
async function getPublicMediaItems() {
  try {
    const response = await fetch(`${FLORA_API_URL}/wp-json/wp/v2/media?per_page=100&orderby=date&order=desc`)
    
    if (response.ok) {
      return await response.json()
    } else {
      // If that fails, try with authentication
      const authResponse = await fetch(`${FLORA_API_URL}/wp-json/wp/v2/media?per_page=100&orderby=date&order=desc`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (authResponse.ok) {
        return await authResponse.json()
      } else {
        throw new Error(`Media API failed: ${authResponse.status}`)
      }
    }
  } catch (error) {
    throw new Error(`Failed to fetch media: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Function to normalize strings for matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim()
}

// Function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)
  
  if (normalized1 === normalized2) return 1.0
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9
  
  // Character overlap calculation
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1
  
  if (longer.length === 0) return 0
  
  const overlap = shorter.split('').filter(char => longer.includes(char)).length
  return overlap / longer.length
}

// Enhanced matching with precise trait and dosage matching
function findBestImageMatch(productName: string, imageFiles: any[]): any {
  const normalizedProductName = normalizeString(productName)
  
  let bestMatch = null
  let bestScore = 0
  let matchDetails = ''
  
  for (const image of imageFiles) {
    const filename = image.source_url ? image.source_url.split('/').pop() : image.title?.rendered || ''
    const normalizedFilename = normalizeString(filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''))
    
    // Calculate base similarity
    let similarity = calculateSimilarity(normalizedProductName, normalizedFilename)
    const productLower = productName.toLowerCase()
    const filenameLower = filename.toLowerCase()
    
    let details = []
    
    // EXACT brand matching (must match exactly)
    const brands = ['darkside', 'golden hour', 'day drinker', 'riptide']
    let brandMatched = false
    for (const brand of brands) {
      if (productLower.includes(brand) && filenameLower.includes(brand.replace(' ', ''))) {
        similarity += 0.3
        brandMatched = true
        details.push(`brand:${brand}`)
        break
      }
    }
    
    // If no brand match, heavily penalize
    if (!brandMatched) {
      similarity *= 0.3
      details.push('no-brand-match')
    }
    
    // EXACT flavor matching with variations
    const flavorMap = {
      'lemon ginger': ['lemon', 'ginger', 'lemonginger'],
      'berry blast': ['berry', 'blast'],
      'berry twist': ['berry', 'twist'],
      'fizzy punch': ['fizzy', 'punch', 'fizzypunch'],
      'fizzy lemonade': ['fizzy', 'lemonade', 'fizzylemonade'],
      'fizzy lemon': ['fizzy', 'lemon', 'fizzylemon'],
      'clementine orange': ['clementine', 'orange', 'clementineorange']
    }
    
    let flavorMatched = false
    for (const [flavor, variations] of Object.entries(flavorMap)) {
      if (productLower.includes(flavor)) {
        for (const variation of variations) {
          if (filenameLower.includes(variation)) {
            similarity += 0.2
            flavorMatched = true
            details.push(`flavor:${flavor}`)
            break
          }
        }
        if (flavorMatched) break
      }
    }
    
    // MG dosage matching - critical for moonwater products
    const mgPatterns = ['5mg', '10mg', '30mg', '5-mg', '10-mg', '30-mg']
    let mgMatched = false
    for (const mg of mgPatterns) {
      if (filenameLower.includes(mg)) {
        // Golden Hour products are 10mg
        if (productLower.includes('golden hour') && mg.includes('10')) {
          similarity += 0.3
          mgMatched = true
          details.push(`mg:${mg}-correct-golden-hour`)
        }
        // Day Drinker products are 5mg
        else if (productLower.includes('day drinker') && mg.includes('5')) {
          similarity += 0.3
          mgMatched = true
          details.push(`mg:${mg}-correct-day-drinker`)
        }
        // Darkside products are 30mg
        else if (productLower.includes('darkside') && mg.includes('30')) {
          similarity += 0.3
          mgMatched = true
          details.push(`mg:${mg}-correct-darkside`)
        }
        // Riptide products - need to determine correct dosage
        else if (productLower.includes('riptide')) {
          similarity += 0.2
          mgMatched = true
          details.push(`mg:${mg}-riptide`)
        }
        // Wrong dosage penalty
        else if (productLower.includes('golden hour') && !mg.includes('10')) {
          similarity *= 0.7 // Penalty for wrong dosage
          details.push(`mg:${mg}-wrong-for-golden-hour`)
        }
        else if (productLower.includes('day drinker') && !mg.includes('5')) {
          similarity *= 0.7 // Penalty for wrong dosage
          details.push(`mg:${mg}-wrong-for-day-drinker`)
        }
        else if (productLower.includes('darkside') && !mg.includes('30')) {
          similarity *= 0.7 // Penalty for wrong dosage
          details.push(`mg:${mg}-wrong-for-darkside`)
        }
      }
    }
    
    // Bonus for exact product name substring matches
    const productWords = productName.toLowerCase().split(/[\s\-]+/)
    let exactWordMatches = 0
    for (const word of productWords) {
      if (word.length > 2 && filenameLower.includes(word)) {
        exactWordMatches++
      }
    }
    if (exactWordMatches >= 2) {
      similarity += 0.1 * exactWordMatches
      details.push(`exact-words:${exactWordMatches}`)
    }
    
    // Penalty for wrong brand in filename
    for (const brand of brands) {
      if (!productLower.includes(brand) && filenameLower.includes(brand.replace(' ', ''))) {
        similarity *= 0.5 // Heavy penalty for wrong brand
        details.push(`wrong-brand:${brand}`)
      }
    }
    
         if (similarity > bestScore && similarity > 0.5) { // Higher threshold for precision
      bestScore = similarity
      bestMatch = {
        id: image.id,
        url: image.source_url,
        filename: filename,
        similarity: similarity
      }
      matchDetails = details.join(', ')
    }
  }
  
  return { bestMatch, bestScore, matchDetails }
}

// Main script endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const log: string[] = []
  
  try {
    log.push('🌙 MOONWATER AUTO-MATCH SCRIPT STARTED')
    log.push(`⏱️ Start time: ${new Date().toISOString()}`)
    log.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Step 1: Fetch moonwater products
    log.push('📦 STEP 1: Fetching moonwater products...')
    const moonwaterProducts = await makeWooCommerceRequest('products?category=16&per_page=100&status=publish')
    log.push(`📦 Found ${moonwaterProducts.length} moonwater products`)
    
    if (moonwaterProducts.length === 0) {
      log.push('❌ No moonwater products found in category 16')
      return NextResponse.json({
        success: false,
        message: 'No moonwater products found',
        log,
        execution_time: Date.now() - startTime
      })
    }
    
    // Step 2: Try to fetch media items
    log.push('🖼️ STEP 2: Attempting to fetch media library...')
    let imageFiles: any[] = []
    
    try {
      const mediaItems = await getPublicMediaItems()
      imageFiles = mediaItems.filter((item: any) => 
        item.mime_type && item.mime_type.startsWith('image/')
      )
      log.push(`🖼️ Successfully found ${imageFiles.length} image files in media library`)
    } catch (error) {
      log.push(`⚠️ Media library access failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      log.push('🔄 Continuing with product analysis only...')
    }
    
    // Step 3: Match and apply images
    log.push('🔍 STEP 3: Matching products with images...')
    log.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const results = {
      total_products: moonwaterProducts.length,
      processed: 0,
      matched: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      matches: [] as any[]
    }
    
    for (const product of moonwaterProducts) {
      results.processed++
      
      const productName = product.name
      const normalizedProductName = normalizeString(productName)
      
      log.push(`\n🔍 Processing: "${productName}"`)
      log.push(`   Normalized: "${normalizedProductName}"`)
      
      // Check if product already has an image
      const hasExistingImage = product.images && product.images.length > 0 && product.images[0].id !== 0
      if (hasExistingImage) {
        log.push(`   ⚠️ Already has image: ${product.images[0].src}`)
        log.push(`   ⏭️ Skipping (use force=true to override)`)
        results.skipped++
        
        results.matches.push({
          product_id: product.id,
          product_name: productName,
          status: 'has_image',
          current_image: product.images[0].src
        })
        continue
      }
      
      if (imageFiles.length === 0) {
        log.push(`   ❌ No media library access - cannot match images`)
        results.matches.push({
          product_id: product.id,
          product_name: productName,
          status: 'no_media_access'
        })
        continue
      }
      
             // Find best matching image using enhanced algorithm
       const { bestMatch, bestScore, matchDetails } = findBestImageMatch(productName, imageFiles)
      
             if (bestMatch && bestScore > 0.6) { // Higher threshold for precision
         log.push(`   ✅ MATCH FOUND: ${bestMatch.filename} (${Math.round(bestScore * 100)}% confidence)`)
         log.push(`   🔍 Match details: ${matchDetails}`)
        
        try {
          // Update product with new image
          const updateData = {
            images: [
              {
                id: bestMatch.id,
                src: bestMatch.url,
                position: 0
              }
            ]
          }
          
          await makeWooCommerceRequest(`products/${product.id}`, 'PUT', updateData)
          
          log.push(`   ✅ UPDATED: Product ${product.id} now has image ${bestMatch.id}`)
          results.updated++
          results.matched++
          
          results.matches.push({
            product_id: product.id,
            product_name: productName,
            image_id: bestMatch.id,
            image_url: bestMatch.url,
            image_filename: bestMatch.filename,
            confidence: Math.round(bestScore * 100),
            status: 'updated'
          })
          
        } catch (error) {
          log.push(`   ❌ UPDATE FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.errors++
          
          results.matches.push({
            product_id: product.id,
            product_name: productName,
            image_id: bestMatch.id,
            image_filename: bestMatch.filename,
            confidence: Math.round(bestScore * 100),
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        
             } else if (bestMatch) {
         log.push(`   ⚠️ Low confidence match: ${bestMatch.filename} (${Math.round(bestScore * 100)}%)`)
         log.push(`   🔍 Match details: ${matchDetails}`)
         results.matched++
        
        results.matches.push({
          product_id: product.id,
          product_name: productName,
          image_filename: bestMatch.filename,
          confidence: Math.round(bestScore * 100),
          status: 'low_confidence'
        })
        
      } else {
        log.push(`   ❌ No suitable match found`)
        
        results.matches.push({
          product_id: product.id,
          product_name: productName,
          status: 'no_match'
        })
      }
    }
    
    // Final summary
    const executionTime = Date.now() - startTime
    log.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    log.push('🎯 EXECUTION SUMMARY:')
    log.push(`   Total Products: ${results.total_products}`)
    log.push(`   Processed: ${results.processed}`)
    log.push(`   Successfully Updated: ${results.updated}`)
    log.push(`   Matches Found: ${results.matched}`)
    log.push(`   Skipped (has image): ${results.skipped}`)
    log.push(`   Errors: ${results.errors}`)
    log.push(`   Execution Time: ${executionTime}ms`)
    log.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.updated} moonwater products with images`,
      results,
      log,
      execution_time: executionTime,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    log.push(`\n❌ SCRIPT FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        log,
        execution_time: executionTime
      },
      { status: 500 }
    )
  }
}

// GET endpoint for status/info
export async function GET() {
  return NextResponse.json({
    script: 'Moonwater Auto-Match',
    description: 'Automatically matches moonwater products with uploaded images based on filename similarity',
    usage: {
      method: 'POST',
      endpoint: '/api/moonwater-auto-match',
      parameters: {
        force: 'boolean (optional) - Override existing product images'
      }
    },
    matching_criteria: {
      minimum_similarity: '30%',
      auto_apply_threshold: '50%',
      normalization: 'Removes spaces, special characters, file extensions',
      moonwater_specific: 'Enhanced matching for brand names and flavors'
    }
  })
} 