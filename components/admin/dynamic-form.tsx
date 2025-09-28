"use client"

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ContentField } from '@/types/content'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

import { Switch } from '@/components/ui/switch'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

import { Label } from '@/components/ui/label'
import { 
  CalendarIcon, 
  X, 
  Plus,
  Palette,
  Code
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { MediaSelectorTrigger } from '@/components/admin/media-selector'

interface DynamicFieldProps {
  field: ContentField
  form: UseFormReturn<Record<string, unknown>>
  disabled?: boolean
}

export function DynamicField({ field, form, disabled = false }: DynamicFieldProps) {
  const { 
    register, 
    setValue, 
    watch, 
    formState: { errors } 
  } = form
  
  const value = watch(field.name)
  const error = errors[field.name]?.message as string

  // Check conditional display
  if (field.config?.showIf) {
    const { field: conditionField, value: conditionValue, operator = 'equals' } = field.config.showIf
    const conditionFieldValue = watch(conditionField)
    
    let shouldShow = false
    switch (operator) {
      case 'equals':
        shouldShow = conditionFieldValue === conditionValue
        break
      case 'not_equals':
        shouldShow = conditionFieldValue !== conditionValue
        break
      case 'contains':
        shouldShow = String(conditionFieldValue).includes(String(conditionValue))
        break
      case 'greater_than':
        shouldShow = Number(conditionFieldValue) > Number(conditionValue)
        break
      case 'less_than':
        shouldShow = Number(conditionFieldValue) < Number(conditionValue)
        break
    }
    
    if (!shouldShow) return null
  }

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <Input
            {...register(field.name, {
              required: field.validation?.required ? 'This field is required' : false,
              maxLength: field.validation?.maxLength ? {
                value: field.validation.maxLength,
                message: `Maximum ${field.validation.maxLength} characters allowed`
              } : undefined,
              pattern: field.validation?.pattern ? {
                value: new RegExp(field.validation.pattern),
                message: field.validation.customMessage || 'Invalid format'
              } : undefined
            })}
            type={field.type === 'text' ? 'text' : field.type}
            placeholder={field.config?.placeholder}
            maxLength={field.config?.maxLength}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'textarea':
        return (
          <Textarea
            {...register(field.name, {
              required: field.validation?.required ? 'This field is required' : false,
              maxLength: field.validation?.maxLength ? {
                value: field.validation.maxLength,
                message: `Maximum ${field.validation.maxLength} characters allowed`
              } : undefined
            })}
            placeholder={field.config?.placeholder}
            rows={field.config?.rows || 4}
            maxLength={field.config?.maxLength}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'richtext':
        return (
          <div className="border rounded-md p-3">
            <Textarea
              {...register(field.name)}
              placeholder={field.config?.placeholder || 'Enter rich text content...'}
              rows={field.config?.rows || 6}
              disabled={disabled}
              className="border-0 resize-none focus-visible:ring-0"
            />
            <div className="text-xs text-muted-foreground mt-2">
              Rich text editor would be implemented here
            </div>
          </div>
        )

      case 'number':
      case 'integer':
      case 'float':
        return (
          <Input
            {...register(field.name, {
              required: field.validation?.required ? 'This field is required' : false,
              min: field.validation?.min ? {
                value: field.validation.min,
                message: `Minimum value is ${field.validation.min}`
              } : undefined,
              max: field.validation?.max ? {
                value: field.validation.max,
                message: `Maximum value is ${field.validation.max}`
              } : undefined,
              valueAsNumber: true
            })}
            type="number"
            step={field.config?.step || (field.type === 'float' ? 0.01 : 1)}
            placeholder={field.config?.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => setValue(field.name, checked)}
              disabled={disabled}
            />
            <Label>{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        )

      case 'select':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(newValue) => setValue(field.name, newValue)}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {field.config?.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  <div className="flex items-center space-x-2">
                    {option.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((selectedValue: string) => {
                const option = field.config?.options?.find(opt => opt.value === selectedValue)
                return (
                  <Badge key={selectedValue} variant="secondary">
                    {option?.label || selectedValue}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newValues = selectedValues.filter(v => v !== selectedValue)
                        setValue(field.name, newValues)
                      }}
                    />
                  </Badge>
                )
              })}
            </div>
            <Select
              onValueChange={(newValue) => {
                if (!selectedValues.includes(newValue)) {
                  setValue(field.name, [...selectedValues, newValue])
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add option..." />
              </SelectTrigger>
              <SelectContent>
                {field.config?.options?.filter(option => 
                  !selectedValues.includes(String(option.value))
                ).map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'date':
      case 'datetime':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-red-500"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value as string), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value as string) : undefined}
                onSelect={(date) => setValue(field.name, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <div 
              className="w-10 h-10 rounded border cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: String(value || field.defaultValue || '#000000') }}
              onClick={() => {
                // In a real implementation, this would open a color picker
                const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
                const randomColor = colors[Math.floor(Math.random() * colors.length)]
                setValue(field.name, randomColor)
              }}
            >
              <Palette className="w-4 h-4 text-white mix-blend-difference" />
            </div>
            <Input
              value={String(value || field.defaultValue || '#000000')}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder="#000000"
              disabled={disabled}
            />
          </div>
        )

      case 'tags':
        const tags = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline">
                  {tag}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newTags = tags.filter((_, i) => i !== index)
                      setValue(field.name, newTags)
                    }}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder={field.config?.placeholder || 'Add tag...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.currentTarget
                    const newTag = input.value.trim()
                    if (newTag && !tags.includes(newTag)) {
                      setValue(field.name, [...tags, newTag])
                      input.value = ''
                    }
                  }
                }}
                disabled={disabled}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  const newTag = input.value.trim()
                  if (newTag && !tags.includes(newTag)) {
                    setValue(field.name, [...tags, newTag])
                    input.value = ''
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-2">
            <MediaSelectorTrigger
              value={value as string}
              onSelect={(asset) => {
                setValue(field.name, asset.url)
              }}
              placeholder={`Select ${field.label.toLowerCase()}...`}
              acceptedTypes={field.config?.allowedTypes || ['image/*']}
              className="w-full"
            />
            {Boolean(value) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded p-2">
                <span className="truncate flex-1 mr-2">{String(value)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue(field.name, '')}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )

      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setValue(field.name, parsed)
                } catch {
                  setValue(field.name, e.target.value)
                }
              }}
              placeholder={'{\n  "key": "value"\n}'}
              rows={6}
              disabled={disabled}
              className={cn("font-mono text-sm", error && "border-red-500")}
            />
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Code className="w-3 h-3" />
              <span>JSON format required</span>
            </div>
          </div>
        )

      case 'slug':
        return (
          <div className="space-y-2">
            <Input
              {...register(field.name, {
                required: field.validation?.required ? 'This field is required' : false,
                pattern: {
                  value: /^[a-z0-9-]+$/,
                  message: 'Slug can only contain lowercase letters, numbers, and hyphens'
                }
              })}
              placeholder={field.config?.placeholder || 'url-friendly-slug'}
              disabled={disabled}
              className={error ? 'border-red-500' : ''}
              onChange={(e) => {
                // Auto-generate slug
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .trim()
                setValue(field.name, slug)
              }}
            />
            <p className="text-xs text-muted-foreground">
              URL: /{String(value || 'your-slug')}
            </p>
          </div>
        )

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded">
            <p className="text-sm text-gray-500">
              Field type &quot;{field.type}&quot; not yet implemented
            </p>
          </div>
        )
    }
  }

  return (
    <div className={cn(
      "space-y-2",
      field.config?.width === 'half' && "md:w-1/2",
      field.config?.width === 'third' && "md:w-1/3", 
      field.config?.width === 'quarter' && "md:w-1/4",
      field.config?.className
    )}>
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.label}
        {field.validation?.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">
          {field.description}
        </p>
      )}
      
      {renderField()}
      
      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

interface DynamicFormProps {
  fields: ContentField[]
  form: UseFormReturn<Record<string, unknown>>
  disabled?: boolean
}

export function DynamicForm({ fields, form, disabled = false }: DynamicFormProps) {
  // Group fields by group property
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.group || 'main'
    if (!acc[group]) acc[group] = []
    acc[group].push(field)
    return acc
  }, {} as Record<string, ContentField[]>)

  // Sort fields by order within each group
  Object.keys(groupedFields).forEach(group => {
    groupedFields[group].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([groupName, groupFields]) => (
        <div key={groupName}>
          {groupName !== 'main' && (
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {groupName.replace('_', ' ')}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupFields.map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                form={form}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}