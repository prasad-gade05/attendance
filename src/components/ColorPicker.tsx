import React, { useState } from 'react'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface ColorPickerProps {
  label: string
  name: string
  value?: string
  onChange: (value: string) => void
}

const predefinedColors = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
]

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  name,
  value = '#3b82f6',
  onChange
}) => {
  const [customColor, setCustomColor] = useState(value)

  const handlePredefinedColorClick = (color: string) => {
    setCustomColor(color)
    onChange(color)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      onChange(color)
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={name}>{label}</Label>
      
      {/* Predefined Colors */}
      <div className="grid grid-cols-5 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
              value === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handlePredefinedColorClick(color)}
            title={color}
          />
        ))}
      </div>
      
      {/* Custom Hex Input */}
      <div>
        <Label htmlFor={`${name}-custom`} className="text-xs text-gray-600">
          Or enter hex color:
        </Label>
        <Input
          id={`${name}-custom`}
          name={name}
          type="text"
          placeholder="#3b82f6"
          value={customColor}
          onChange={handleCustomColorChange}
          className="font-mono text-sm"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
    </div>
  )
}

export default ColorPicker