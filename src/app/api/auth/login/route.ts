import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const baseUrl = 'https://api.floradistro.com';
    const credentials = getApiCredentials();
    
    console.log(`🔐 [${apiEnv.toUpperCase()}] Authenticating user: ${username}`);
    
    // 🔓 DEV MODE BYPASS: Allow admin/admin123 in docker/local mode
    if (apiEnv === 'docker' && username === 'admin' && password === 'admin123') {
      console.log('🔓 [DEV MODE] Using local dev bypass credentials');
      const devUser = {
        id: 1,
        username: 'admin',
        email: 'admin@local.dev',
        first_name: 'Admin',
        last_name: 'User',
        role: 'administrator',
        location_id: '20',
        location: 'Charlotte Central',
        capabilities: {
          manage_woocommerce: true,
          edit_products: true,
          manage_options: true,
          administrator: true
        },
      };
      
      return NextResponse.json({
        success: true,
        user: devUser,
        token: btoa(`${username}:${password}`),
      });
    }
    
    // Create Basic Auth credentials
    const basicAuth = btoa(`${username}:${password}`);
    
    // Authenticate with WordPress /wp/v2/users/me endpoint
    const wpUrl = `${baseUrl}/wp-json/wp/v2/users/me`;
    
    const response = await fetch(wpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${apiEnv.toUpperCase()}] WordPress auth failed:`, response.status, errorText);
      return NextResponse.json(
        { error: 'Invalid credentials', status: response.status },
        { status: 401 }
      );
    }
    
    const wpUser = await response.json();
    console.log(`✅ [${apiEnv.toUpperCase()}] User authenticated:`, wpUser.name);
    
    // Get employee/location assignment from Flora IM
    let locationName = 'FloraDistro';
    let locationId = null;
    
    try {
      const employeeUrl = `${baseUrl}/wp-json/flora-im/v1/employees?user_id=${wpUser.id}&consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`;
      const employeeResponse = await fetch(employeeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        console.log(`✅ [${apiEnv.toUpperCase()}] Employee data:`, employeeData);
        
        if (employeeData.success && employeeData.employees && employeeData.employees.length > 0) {
          const primaryEmployee = employeeData.employees.find((emp: any) => emp.is_primary === '1' || emp.is_primary === 1);
          const activeEmployee = employeeData.employees.find((emp: any) => emp.status === 'active');
          const assignment = primaryEmployee || activeEmployee || employeeData.employees[0];
          
          if (assignment) {
            locationId = assignment.location_id?.toString();
            locationName = assignment.location_name || locationName;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [${apiEnv.toUpperCase()}] Could not fetch employee location:`, error);
    }
    
    // Build user object
    const user = {
      id: wpUser.id,
      username: wpUser.username || wpUser.slug,
      email: wpUser.email,
      first_name: wpUser.first_name || wpUser.name?.split(' ')[0] || '',
      last_name: wpUser.last_name || wpUser.name?.split(' ').slice(1).join(' ') || '',
      role: wpUser.roles?.[0] || 'subscriber',
      location_id: locationId,
      location: locationName,
      capabilities: wpUser.capabilities || {},
    };
    
    console.log(`✅ [${apiEnv.toUpperCase()}] Login successful for ${user.username}`);
    
    return NextResponse.json({
      success: true,
      user,
      token: basicAuth, // Return the credentials for future requests
    });
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}




