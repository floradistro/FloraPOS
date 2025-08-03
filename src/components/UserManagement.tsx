'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Store {
  id: string
  name: string
  address: string
  isActive: boolean
}

interface User {
  id: number
  name: string
  email: string
  posEnabled: boolean
  posRole: string
  allowedStores: string[]
}

const UserManagement = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadStores()
    loadUsers()
  }, [])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores/public')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      toast.error('Failed to load stores')
    }
  }

  const loadUsers = async () => {
    try {
      // Mock users for demonstration - in reality, this would come from your API
      // NOTE: POS user management is now handled by Addify Multi-Location Inventory plugin
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'John Manager',
          email: 'john@floradistro.com',
          posEnabled: true,
          posRole: 'manager',
          allowedStores: ['30', '31'] // Charlotte locations
        },
        {
          id: 2,
          name: 'Sarah Cashier',
          email: 'sarah@floradistro.com',
          posEnabled: true,
          posRole: 'cashier',
          allowedStores: ['32'] // Blowing Rock
        },
        {
          id: 3,
          name: 'Mike Admin',
          email: 'mike@floradistro.com',
          posEnabled: true,
          posRole: 'store_admin',
          allowedStores: ['30', '31', '32', '34', '35'] // All stores
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignStores = (user: User) => {
    setSelectedUser(user)
    setShowAssignModal(true)
  }

  const handleSaveAssignment = async (userId: number, storeIds: string[]) => {
    try {
      // In a real implementation, this would call your WordPress API
      console.log(`Assigning user ${userId} to stores:`, storeIds)
      
      // Update local state for demo
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, allowedStores: storeIds }
          : user
      ))
      
      toast.success('Store assignments updated successfully!')
      setShowAssignModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating assignments:', error)
      toast.error('Failed to update assignments')
    }
  }

  const getStoreNames = (storeIds: string[]) => {
    return storeIds
      .map(id => stores.find(store => store.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'store_admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'cashier': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Assign Flora Distro employees to store locations</p>
      </div>

      {/* Store Overview */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Stores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <div key={store.id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{store.address}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {store.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">POS Users</h2>
          <p className="text-sm text-gray-600 mt-1">
            Note: POS user management is now handled by Addify Multi-Location Inventory plugin in WordPress admin.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Stores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.posRole)}`}>
                      {user.posRole.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.allowedStores.length > 0 ? (
                        <div className="max-w-xs">
                          {getStoreNames(user.allowedStores)}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No stores assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.posEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.posEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleAssignStores(user)}
                      className="text-emerald-600 hover:text-emerald-900 mr-4"
                    >
                      Assign Stores
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedUser && (
        <StoreAssignmentModal
          user={selectedUser}
          stores={stores}
          onSave={handleSaveAssignment}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

interface StoreAssignmentModalProps {
  user: User
  stores: Store[]
  onSave: (userId: number, storeIds: string[]) => void
  onClose: () => void
}

const StoreAssignmentModal = ({ user, stores, onSave, onClose }: StoreAssignmentModalProps) => {
  const [selectedStores, setSelectedStores] = useState<string[]>(user.allowedStores)

  const handleStoreToggle = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }

  const handleSave = () => {
    onSave(user.id, selectedStores)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Assign Stores to {user.name}
          </h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Select which Flora Distro locations this user can access:
          </p>
          
          <div className="space-y-3">
            {stores.map(store => (
              <label key={store.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStores.includes(store.id)}
                  onChange={() => handleStoreToggle(store.id)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.address}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Save Assignment
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserManagement 