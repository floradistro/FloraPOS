// Utility to check user location assignments
export async function checkUserLocation(username: string, credentials: string) {
  
  try {
    // First get the WordPress user ID (use WordPress proxy to respect environment)
    const userResponse = await apiFetch('/api/proxy/wordpress/users/me', {
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

    // Get all locations first to see what's available (use proxy)
    const locationsResponse = await apiFetch('/api/proxy/flora-im/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (locationsResponse.ok) {
      const locations = await locationsResponse.json();
    }

    // Check employee assignments for this user (use proxy)
    const employeeResponse = await apiFetch(`/api/proxy/flora-im/employees?user_id=${user.id}`, {
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
        
        return {
          location_name: assignment.location_name,
          location_id: assignment.location_id,
          role: assignment.role,
          is_primary: assignment.is_primary
        };
      } else {
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
