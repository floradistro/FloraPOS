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

// Helper function to make WordPress Media API calls
async function makeWordPressMediaRequest(endpoint: string, method: string = 'GET', data?: any) {
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
  
  const response = await fetch(`${FLORA_API_URL}/wp-json/wp/v2/${endpoint}`, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WordPress API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

// Function to normalize product names for matching
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim()
}

// Function to normalize image filenames for matching
function normalizeImageFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') // Remove file extension
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim()
}

// Function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  // Check for exact match
  if (str1 === str2) return 1.0
  
  // Check if shorter string is contained in longer
  if (longer.includes(shorter)) return 0.8
  
  // Simple character overlap calculation
  const overlap = shorter.split('').filter(char => longer.includes(char)).length
  return overlap / longer.length
}

// GET endpoint - Analyze moonwater products and find matching images
export async function GET(request: NextRequest) {
  try {
    console.log('🌙 Starting moonwater image matching analysis...')
    
    // Step 1: Fetch moonwater products (category 16)
    console.log('📦 Fetching moonwater products...')
    const moonwaterProducts = await makeWooCommerceRequest('products?category=16&per_page=100&status=publish')
    console.log(`📦 Found ${moonwaterProducts.length} moonwater products`)
    
    // Step 2: Fetch recent media uploads
    console.log('🖼️ Fetching recent media uploads...')
    const mediaItems = await makeWordPressMediaRequest('media?per_page=100&orderby=date&order=desc')
    console.log(`🖼️ Found ${mediaItems.length} media items`)
    
    // Step 3: Filter for image files only
    const imageFiles = mediaItems.filter((item: any) => 
      item.mime_type && item.mime_type.startsWith('image/')
    )
    console.log(`🖼️ Filtered to ${imageFiles.length} image files`)
    
    // Step 4: Match products with images
    console.log('🔍 Matching products with images...')
    const matches = []
    
    for (const product of moonwaterProducts) {
      const normalizedProductName = normalizeProductName(product.name)
      console.log(`🔍 Analyzing product: "${product.name}" (normalized: "${normalizedProductName}")`)
      
      let bestMatch = null
      let bestScore = 0
      
      for (const image of imageFiles) {
        const filename = image.source_url ? image.source_url.split('/').pop() : image.title?.rendered || ''
        const normalizedFilename = normalizeImageFilename(filename)
        
        const similarity = calculateSimilarity(normalizedProductName, normalizedFilename)
        
        if (similarity > bestScore && similarity > 0.3) { // Minimum threshold
          bestScore = similarity
          bestMatch = {
            id: image.id,
            url: image.source_url,
            filename: filename,
            title: image.title?.rendered || '',
            similarity: similarity
          }
        }
      }
      
      const currentImages = product.images || []
      const hasExistingImage = currentImages.length > 0 && currentImages[0].id !== 0
      
      matches.push({
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          current_images: currentImages,
          has_existing_image: hasExistingImage
        },
        suggested_image: bestMatch,
        confidence: bestMatch ? bestMatch.similarity : 0,
        status: bestMatch ? (bestMatch.similarity > 0.7 ? 'high_confidence' : 'low_confidence') : 'no_match'
      })
      
      if (bestMatch) {
        console.log(`✅ Match found for "${product.name}": ${bestMatch.filename} (${Math.round(bestMatch.similarity * 100)}% confidence)`)
      } else {
        console.log(`❌ No match found for "${product.name}"`)
      }
    }
    
    // Step 5: Sort by confidence and prepare summary
    matches.sort((a, b) => b.confidence - a.confidence)
    
    const summary = {
      total_products: moonwaterProducts.length,
      total_images: imageFiles.length,
      high_confidence_matches: matches.filter(m => m.status === 'high_confidence').length,
      low_confidence_matches: matches.filter(m => m.status === 'low_confidence').length,
      no_matches: matches.filter(m => m.status === 'no_match').length,
      products_with_existing_images: matches.filter(m => m.product.has_existing_image).length
    }
    
    console.log('📊 Matching Summary:', summary)
    
    return NextResponse.json({
      success: true,
      summary,
      matches,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in moonwater image matching:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// POST endpoint - Apply image matches to products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matches_to_apply } = body
    
    if (!matches_to_apply || !Array.isArray(matches_to_apply)) {
      return NextResponse.json(
        { success: false, error: 'matches_to_apply array is required' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Applying ${matches_to_apply.length} image matches...`)
    
    const results = []
    
    for (const match of matches_to_apply) {
      try {
        const { product_id, image_id, image_url } = match
        
        if (!product_id || !image_id || !image_url) {
          results.push({
            product_id,
            success: false,
            error: 'Missing required fields: product_id, image_id, image_url'
          })
          continue
        }
        
        console.log(`🔄 Updating product ${product_id} with image ${image_id}...`)
        
        // Update product with new image
        const updateData = {
          images: [
            {
              id: image_id,
              src: image_url,
              position: 0
            }
          ]
        }
        
        await makeWooCommerceRequest(`products/${product_id}`, 'PUT', updateData)
        
        results.push({
          product_id,
          success: true,
          message: `Successfully updated product ${product_id} with image ${image_id}`
        })
        
        console.log(`✅ Successfully updated product ${product_id}`)
        
      } catch (error) {
        console.error(`❌ Error updating product ${match.product_id}:`, error)
        results.push({
          product_id: match.product_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const summary = {
      total_attempted: matches_to_apply.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
    
    console.log('📊 Update Summary:', summary)
    
    return NextResponse.json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error applying image matches:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
} 