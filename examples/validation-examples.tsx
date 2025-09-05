/**
 * Examples of using the centralized validation schemas
 * This demonstrates how to use Zod schemas consistently across the application
 */

import { useState } from 'react'
import { 
  createPollSchema, 
  validatePollForm, 
  sanitizePollInput,
  type CreatePollInput 
} from '@/lib/validation-schemas'
import { usePollValidation } from '@/lib/use-poll-validation'

// Example 1: Basic schema usage
export function BasicValidationExample() {
  const [formData, setFormData] = useState<Partial<CreatePollInput>>({
    title: '',
    description: '',
    options: ['', '']
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate using the centralized schema
    const result = createPollSchema.safeParse(formData)
    
    if (!result.success) {
      console.error('Validation errors:', result.error.issues)
      return
    }
    
    // Data is valid, proceed with submission
    console.log('Valid data:', result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Poll title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
      />
      {/* ... other form fields */}
    </form>
  )
}

// Example 2: Using the validation hook
export function HookValidationExample() {
  const { validate, validateField, errors, isValid } = usePollValidation()
  const [formData, setFormData] = useState<Partial<CreatePollInput>>({
    title: '',
    description: '',
    options: ['', '']
  })

  const handleFieldChange = (field: keyof CreatePollInput, value: unknown) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    
    // Real-time validation
    validate(newData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      console.error('Form has validation errors:', errors)
      return
    }
    
    // Form is valid, proceed with submission
    console.log('Submitting valid data:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="Poll title"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
        />
        {errors.title && <span className="error">{errors.title}</span>}
      </div>
      
      <div>
        <textarea
          placeholder="Poll description (optional)"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
        />
        {errors.description && <span className="error">{errors.description}</span>}
      </div>
      
      <div>
        {formData.options?.map((option, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...(formData.options || [])]
                newOptions[index] = e.target.value
                handleFieldChange('options', newOptions)
              }}
            />
            {errors[`options.${index}`] && (
              <span className="error">{errors[`options.${index}`]}</span>
            )}
          </div>
        ))}
        {errors.options && <span className="error">{errors.options}</span>}
      </div>
      
      <button type="submit" disabled={!isValid}>
        Create Poll
      </button>
    </form>
  )
}

// Example 3: Server-side validation (API route)
export async function serverSideValidationExample(request: Request) {
  try {
    const body = await request.json()
    
    // Validate and sanitize input
    const result = createPollSchema.safeParse(body)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Sanitize the data
    const sanitizedData = sanitizePollInput(result.data)
    
    // Proceed with database operations
    // ... database logic here
    
    return new Response(
      JSON.stringify({ success: true, data: sanitizedData }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Example 4: Form validation with real-time feedback
export function RealTimeValidationExample() {
  const [formData, setFormData] = useState<Partial<CreatePollInput>>({
    title: '',
    description: '',
    options: ['', '']
  })
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateField = (field: keyof CreatePollInput, value: unknown) => {
    try {
      // Create field-specific validation
      let fieldSchema: z.ZodType<unknown>
      
      switch (field) {
        case 'title':
          fieldSchema = createPollSchema.shape.title
          break
        case 'description':
          fieldSchema = createPollSchema.shape.description
          break
        case 'options':
          fieldSchema = createPollSchema.shape.options
          break
        default:
          return
      }
      
      const result = fieldSchema.safeParse(value)
      
      setFieldErrors(prev => ({
        ...prev,
        [field]: result.success ? '' : result.error.issues[0]?.message || ''
      }))
      
    } catch (error) {
      console.error('Field validation error:', error)
    }
  }

  const handleFieldChange = (field: keyof CreatePollInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  return (
    <form>
      <div>
        <label>Poll Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className={fieldErrors.title ? 'error' : ''}
        />
        {fieldErrors.title && <span className="error-text">{fieldErrors.title}</span>}
        <div className="char-count">
          {formData.title?.length || 0}/200 characters
        </div>
      </div>
      
      <div>
        <label>Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className={fieldErrors.description ? 'error' : ''}
        />
        {fieldErrors.description && <span className="error-text">{fieldErrors.description}</span>}
        <div className="char-count">
          {formData.description?.length || 0}/500 characters
        </div>
      </div>
      
      <div>
        <label>Options</label>
        {formData.options?.map((option, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...(formData.options || [])]
                newOptions[index] = e.target.value
                handleFieldChange('options', newOptions)
              }}
            />
          </div>
        ))}
        {fieldErrors.options && <span className="error-text">{fieldErrors.options}</span>}
        <div className="char-count">
          {formData.options?.length || 0}/10 options
        </div>
      </div>
    </form>
  )
}

// Example 5: TypeScript type safety
export function TypeScriptExample() {
  // Your schema provides full TypeScript support
  const pollData: CreatePollInput = {
    title: "What's your favorite color?",
    description: "Choose from the options below",
    options: ["Red", "Blue", "Green", "Yellow"]
  }
  
  // TypeScript will catch type errors at compile time
  // const invalidData: CreatePollInput = {
  //   title: 123, // ❌ TypeScript error: number not assignable to string
  //   options: ["Only one option"] // ❌ TypeScript error: needs at least 2 options
  // }
  
  // Validation at runtime
  const result = createPollSchema.safeParse(pollData)
  
  if (result.success) {
    // result.data is fully typed as CreatePollInput
    console.log('Valid poll data:', result.data)
  } else {
    console.error('Validation errors:', result.error.issues)
  }
  
  return <div>TypeScript validation example</div>
}
