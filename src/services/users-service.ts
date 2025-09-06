/**
 * WordPress Users Service
 * Fetches WordPress users for location manager assignment
 */

export interface WordPressUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  display_name: string;
}

class UsersService {
  private baseUrl = '/api/users-matrix'; // Use WordPress Core API via proxy

  async getUsers(bustCache = false): Promise<WordPressUser[]> {
    try {
      const url = `${this.baseUrl}/users`;
      const params = new URLSearchParams();
      
      if (bustCache) {
        params.append('_', Date.now().toString());
      }
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': bustCache ? 'no-cache' : 'default',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Data is already in the correct format from UsersMatrix API
      const users: WordPressUser[] = data.map((user: any) => ({
        id: user.id,
        name: user.name || user.display_name,
        username: user.username,
        email: user.email || '',
        roles: user.roles || [],
        display_name: user.display_name || user.name || user.username
      }));

      return users;
    } catch (error) {
      console.error('Failed to fetch users from API:', error);
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(userId: number): Promise<WordPressUser | null> {
    try {
      // For now, get all users and find the one we want
      // We can optimize this later with a specific endpoint
      const users = await this.getUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        return user;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
}

export const usersService = new UsersService();


