// Utility to check user location assignments
export async function checkUserLocation(username: string, credentials: string) {
  console.log('🔍 Checking location for user:', username);
  
  try {
    // First get the WordPress user ID
    const userResponse = await fetch('https://api.floradistro.com/wp-json/wp/v2/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to get user info:', userResponse.status);
      return null;
    }

    const user = await userResponse.json();
    console.log('👤 User found:', user.name, 'ID:', user.id);

    // Get all locations first to see what's available
    const locationsResponse = await fetch('https://api.floradistro.com/wp-json/flora-im/v1/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (locationsResponse.ok) {
      const locations = await locationsResponse.json();
      console.log('🏢 Available locations:', locations);
    }

    // Check employee assignments for this user
    const employeeResponse = await fetch(`https://api.floradistro.com/wp-json/flora-im/v1/employees?user_id=${user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (employeeResponse.ok) {
      const employeeData = await employeeResponse.json();
      console.log('🎯 Employee assignments for', username + ':', employeeData);
      
      if (employeeData.success && employeeData.employees?.length > 0) {
        const primaryLocation = employeeData.employees.find((emp: any) => emp.is_primary === '1' || emp.is_primary === 1);
        const assignment = primaryLocation || employeeData.employees[0];
        
        console.log('✅ Found assignment:', assignment.location_name, '(ID:', assignment.location_id + ')');
        return {
          location_name: assignment.location_name,
          location_id: assignment.location_id,
          role: assignment.role,
          is_primary: assignment.is_primary
        };
      } else {
        console.log('❌ No location assignments found for', username);
        return null;
      }
    } else {
      console.error('❌ Failed to get employee data:', employeeResponse.status);
      return null;
    }

  } catch (error) {
    console.error('❌ Error checking user location:', error);
    return null;
  }
}

// Add this to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).checkUserLocation = checkUserLocation;
}
