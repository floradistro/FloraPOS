/**
 * Example demonstrating the new code quality improvements
 * This file shows how to use the error handling, logging, hooks, and error boundaries together
 */

'use client'

import React, { useState } from 'react'
import { 
  ErrorBoundary, 
  SectionErrorBoundary, 
  ComponentErrorBoundary,
  withErrorBoundary,
  useErrorHandler 
} from '@/components/ErrorBoundary'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { useApiCall, useApiGet, useApiPost } from '@/hooks/useApiCall'
import { useFormValidation, validationRules } from '@/hooks/useFormValidation'
import { 
  AppError, 
  createValidationError, 
  createNetworkError,
  handleAsyncError,
  withRetry 
} from '@/lib/error-handling'
import { log } from '@/lib/logging'

// ============================================================================
// Example Form Component with Validation
// ============================================================================

interface UserFormData {
  name: string
  email: string
  age: number
  phone: string
}

function UserForm() {
  const { reportError } = useErrorHandler()
  
  const formValidation = useFormValidation<UserFormData>({
    initialValues: {
      name: '',
      email: '',
      age: 0,
      phone: ''
    },
    validationRules: {
      name: [validationRules.required('Name is required'), validationRules.minLength(2)],
      email: [validationRules.required('Email is required'), validationRules.email()],
      age: [validationRules.required('Age is required'), validationRules.min(18, 'Must be 18 or older')],
      phone: [validationRules.phone()]
    },
    validateOnChange: true,
    enableLogging: true,
    logContext: { component: 'UserForm' }
  })

  // API mutation for submitting form
  const submitUser = useApiPost<any, UserFormData>('/api/users', {
    onSuccess: (data) => {
      log.info('User created successfully', { userId: data.id })
      formValidation.reset()
    },
    onError: (error) => {
      log.error('Failed to create user', { formData: formValidation.values }, error)
      reportError(error, { context: 'user-form-submission' })
    }
  })

  const handleSubmit = formValidation.handleSubmit(async (values) => {
    await submitUser.mutate(values)
  })

  return (
    <ComponentErrorBoundary name="UserForm">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Create User</h2>
        
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            {...formValidation.getFieldProps('name')}
            className={`w-full px-3 py-2 border rounded-md ${
              formValidation.errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formValidation.errors.name && (
            <p className="text-red-500 text-sm mt-1">{formValidation.errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...formValidation.getFieldProps('email')}
            className={`w-full px-3 py-2 border rounded-md ${
              formValidation.errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formValidation.errors.email && (
            <p className="text-red-500 text-sm mt-1">{formValidation.errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age</label>
          <input
            type="number"
            {...formValidation.getFieldProps('age')}
            className={`w-full px-3 py-2 border rounded-md ${
              formValidation.errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formValidation.errors.age && (
            <p className="text-red-500 text-sm mt-1">{formValidation.errors.age}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            {...formValidation.getFieldProps('phone')}
            className={`w-full px-3 py-2 border rounded-md ${
              formValidation.errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formValidation.errors.phone && (
            <p className="text-red-500 text-sm mt-1">{formValidation.errors.phone}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!formValidation.isValid || formValidation.isSubmitting || submitUser.isPending}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formValidation.isSubmitting || submitUser.isPending ? 'Creating...' : 'Create User'}
        </button>

        {submitUser.error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {submitUser.error.message}
          </div>
        )}
      </form>
    </ComponentErrorBoundary>
  )
}

// ============================================================================
// Example Data Fetching Component
// ============================================================================

function UsersList() {
  const [page, setPage] = useState(1)
  
  // Using the new API hook for data fetching
  const { data: users, isLoading, error, refetch } = useApiGet<any[]>(
    `/api/users?page=${page}`,
    {
      enableLogging: true,
      logContext: { component: 'UsersList', page },
      onError: (error) => {
        log.error('Failed to fetch users', { page }, error)
      }
    }
  )

  // Using async operation hook for delete functionality
  const deleteOperation = useAsyncOperation(
    async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw createNetworkError(`Failed to delete user: ${response.statusText}`)
      }
      return response.json()
    },
    {
      enableLogging: true,
      logContext: { component: 'UsersList', action: 'delete' },
      onSuccess: () => {
        log.info('User deleted successfully')
        refetch() // Refresh the list
      },
      onError: (error) => {
        log.error('Failed to delete user', {}, error)
      }
    }
  )

  const handleDelete = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteOperation.execute(userId)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading users...</div>
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 mb-4">Error loading users: {error.message}</p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary name="UsersList">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Users List</h2>
        
        <div className="grid gap-4">
          {users?.map((user) => (
            <div key={user.id} className="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={deleteOperation.loading}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteOperation.loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Next
          </button>
        </div>

        {deleteOperation.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Delete Error: {deleteOperation.error.message}
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  )
}

// ============================================================================
// Example Component with Manual Error Handling
// ============================================================================

function DataProcessor() {
  const [result, setResult] = useState<string | null>(null)
  const { reportError } = useErrorHandler()

  const processData = useAsyncOperation(
    async (data: any[]) => {
      // Simulate processing with potential errors
      if (data.length === 0) {
        throw createValidationError('No data to process')
      }

      // Use the withRetry utility for flaky operations
      return await withRetry(
        async () => {
          // Simulate a flaky API call
          if (Math.random() < 0.3) {
            throw createNetworkError('Temporary network error')
          }
          
          return `Processed ${data.length} items successfully`
        },
        { maxRetries: 3, baseDelay: 1000 }
      )
    },
    {
      enableLogging: true,
      logContext: { component: 'DataProcessor' },
      retryable: true,
      maxRetries: 2
    }
  )

  const handleProcess = async () => {
    try {
      const mockData = Array.from({ length: Math.floor(Math.random() * 10) }, (_, i) => ({ id: i }))
      const result = await processData.execute(mockData)
      setResult(result)
    } catch (error) {
      reportError(error as Error, { component: 'DataProcessor', action: 'process' })
    }
  }

  return (
    <ComponentErrorBoundary name="DataProcessor">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Data Processor</h2>
        
        <button
          onClick={handleProcess}
          disabled={processData.loading}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {processData.loading ? 'Processing...' : 'Process Data'}
        </button>

        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {result}
          </div>
        )}

        {processData.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {processData.error.message}
            <button
              onClick={processData.retry}
              className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  )
}

// ============================================================================
// Component that demonstrates error boundary levels
// ============================================================================

function ProblematicComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('This is a test error from ProblematicComponent')
  }

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-semibold mb-2">Problematic Component</h3>
      <p className="text-gray-600 mb-4">
        This component can throw an error to test the error boundary.
      </p>
      <button
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Trigger Error
      </button>
    </div>
  )
}

// Wrap with HOC for demonstration
const SafeProblematicComponent = withErrorBoundary(ProblematicComponent, {
  name: 'SafeProblematicComponent',
  resetOnPropsChange: true
})

// ============================================================================
// Main Example Component
// ============================================================================

export default function QualityImprovementsExample() {
  log.info('QualityImprovementsExample rendered', { 
    timestamp: new Date().toISOString(),
    component: 'QualityImprovementsExample' 
  })

  return (
    <ErrorBoundary level="page" name="QualityImprovementsExample">
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            Code Quality Improvements Demo
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <SectionErrorBoundary name="FormSection">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Form with Validation</h2>
                <UserForm />
              </div>
            </SectionErrorBoundary>

            {/* Data Processing Section */}
            <SectionErrorBoundary name="ProcessingSection">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Async Operations</h2>
                <DataProcessor />
              </div>
            </SectionErrorBoundary>
          </div>

          {/* Users List Section */}
          <SectionErrorBoundary name="UsersSection">
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">API Data Fetching</h2>
              <UsersList />
            </div>
          </SectionErrorBoundary>

          {/* Error Boundary Demo Section */}
          <SectionErrorBoundary name="ErrorBoundaryDemo">
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Error Boundary Demo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SafeProblematicComponent />
                <ComponentErrorBoundary name="AnotherProblematicComponent">
                  <ProblematicComponent />
                </ComponentErrorBoundary>
              </div>
            </div>
          </SectionErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}