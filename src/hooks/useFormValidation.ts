/**
 * Reusable hook for form validation with error handling and common patterns
 */

import { useState, useCallback, useMemo } from 'react'
import { createValidationError, AppError } from '@/lib/error-handling'
import { log } from '@/lib/logging'

export type ValidationRule<T> = (value: T) => string | null
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

export interface UseFormValidationOptions<T> {
  initialValues: T
  validationRules?: ValidationRules<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  enableLogging?: boolean
  logContext?: Record<string, any>
}

export interface FormValidationResult<T> extends FormState<T> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: <K extends keyof T>(field: K, error: string) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void
  setFieldTouched: <K extends keyof T>(field: K) => void
  validateField: <K extends keyof T>(field: K) => string | null
  validateForm: () => boolean
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void
  handleBlur: <K extends keyof T>(field: K) => () => void
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>
  reset: (values?: T) => void
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K]
    onChange: (value: T[K]) => void
    onBlur: () => void
    error: string | undefined
    touched: boolean
  }
}

// ============================================================================
// Built-in Validation Rules
// ============================================================================

export const validationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => 
    (value) => {
      if (value === null || value === undefined || value === '') {
        return message
      }
      return null
    },

  email: (message = 'Please enter a valid email address'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : message
    },

  minLength: (min: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const msg = message || `Must be at least ${min} characters`
      return value.length >= min ? null : msg
    },

  maxLength: (max: number, message?: string): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const msg = message || `Must be no more than ${max} characters`
      return value.length <= max ? null : msg
    },

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      return regex.test(value) ? null : message
    },

  numeric: (message = 'Must be a number'): ValidationRule<string | number> =>
    (value) => {
      if (value === null || value === undefined || value === '') return null
      const num = typeof value === 'string' ? parseFloat(value) : value
      return !isNaN(num) ? null : message
    },

  min: (minimum: number, message?: string): ValidationRule<number> =>
    (value) => {
      if (value === null || value === undefined) return null
      const msg = message || `Must be at least ${minimum}`
      return value >= minimum ? null : msg
    },

  max: (maximum: number, message?: string): ValidationRule<number> =>
    (value) => {
      if (value === null || value === undefined) return null
      const msg = message || `Must be no more than ${maximum}`
      return value <= maximum ? null : msg
    },

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      return phoneRegex.test(value.replace(/\D/g, '')) ? null : message
    },

  url: (message = 'Please enter a valid URL'): ValidationRule<string> =>
    (value) => {
      if (!value) return null
      try {
        new URL(value)
        return null
      } catch {
        return message
      }
    },

  custom: <T>(validator: (value: T) => boolean, message: string): ValidationRule<T> =>
    (value) => validator(value) ? null : message
}

// ============================================================================
// Main Hook
// ============================================================================

export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T>
): FormValidationResult<T> {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    enableLogging = false,
    logContext = {}
  } = options

  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  const validateField = useCallback(<K extends keyof T>(field: K): string | null => {
    const fieldRules = validationRules[field]
    if (!fieldRules) return null

    const value = values[field]
    
    for (const rule of fieldRules) {
      const error = rule(value)
      if (error) {
        if (enableLogging) {
          log.debug(`Validation error for field ${String(field)}`, {
            ...logContext,
            field: String(field),
            error,
            value
          })
        }
        return error
      }
    }

    return null
  }, [values, validationRules, enableLogging, logContext])

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let hasErrors = false

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T)
      if (error) {
        newErrors[field as keyof T] = error
        hasErrors = true
      }
    })

    setErrorsState(newErrors)

    if (enableLogging) {
      log.info('Form validation completed', {
        ...logContext,
        isValid: !hasErrors,
        errorCount: Object.keys(newErrors).length,
        fields: Object.keys(validationRules)
      })
    }

    return !hasErrors
  }, [validationRules, validateField, enableLogging, logContext])

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }))

    if (validateOnChange) {
      const error = validateField(field)
      setErrorsState(prev => ({
        ...prev,
        [field]: error || undefined
      }))
    }
  }, [validateOnChange, validateField])

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))

    if (validateOnChange) {
      const newErrors: Partial<Record<keyof T, string>> = {}
      Object.keys(newValues).forEach((field) => {
        const error = validateField(field as keyof T)
        if (error) {
          newErrors[field as keyof T] = error
        }
      })
      setErrorsState(prev => ({ ...prev, ...newErrors }))
    }
  }, [validateOnChange, validateField])

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrorsState(prev => ({ ...prev, ...newErrors }))
  }, [])

  const setTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouchedState(prev => ({ ...prev, [field]: true }))

    if (validateOnBlur) {
      const error = validateField(field)
      setErrorsState(prev => ({
        ...prev,
        [field]: error || undefined
      }))
    }
  }, [validateOnBlur, validateField])

  const handleChange = useCallback(<K extends keyof T>(field: K) => 
    (value: T[K]) => setValue(field, value)
  , [setValue])

  const handleBlur = useCallback(<K extends keyof T>(field: K) => 
    () => setFieldTouched(field)
  , [setFieldTouched])

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => 
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      setIsSubmitting(true)

      try {
        const isFormValid = validateForm()
        
        if (!isFormValid) {
          if (enableLogging) {
            log.warn('Form submission blocked due to validation errors', {
              ...logContext,
              errors: Object.keys(errors),
              values
            })
          }
          throw createValidationError('Form validation failed', {
            formErrors: errors,
            formValues: values
          })
        }

        if (enableLogging) {
          log.info('Form submission started', {
            ...logContext,
            values
          })
        }

        await onSubmit(values)

        if (enableLogging) {
          log.info('Form submission completed successfully', {
            ...logContext,
            values
          })
        }
      } catch (error) {
        if (enableLogging) {
          log.error('Form submission failed', logContext, error as Error)
        }
        throw error
      } finally {
        setIsSubmitting(false)
      }
    }
  , [validateForm, values, errors, enableLogging, logContext])

  const reset = useCallback((newValues?: T) => {
    const resetValues = newValues || initialValues
    setValuesState(resetValues)
    setErrorsState({})
    setTouchedState({})
    setIsSubmitting(false)

    if (enableLogging) {
      log.info('Form reset', {
        ...logContext,
        resetToInitial: !newValues
      })
    }
  }, [initialValues, enableLogging, logContext])

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: values[field],
    onChange: handleChange(field),
    onBlur: handleBlur(field),
    error: errors[field],
    touched: touched[field] || false
  }), [values, errors, touched, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    setFieldTouched,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps
  }
}