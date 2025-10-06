import React, { useState } from 'react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Palette, Check } from 'lucide-react'

interface ColorPickerProps {
  label: string
  name: string
  value?: string
  onChange: (value: string) => void
}

const predefinedColors = [
  { color: '#ef4444', name: 'Red' },      // Modern vibrant red
  { color: '#f97316', name: 'Orange' },   // Modern vibrant orange
  { color: '#eab308', name: 'Yellow' },  // Modern vibrant yellow
  { color: '#22c55e', name: 'Green' },   // Modern vibrant green
  { color: '#10b981', name: 'Emerald' }, // Modern vibrant emerald
  { color: '#06b6d4', name: 'Cyan' },    // Modern vibrant cyan
  { color: '#3b82f6', name: 'Blue' },    // Modern vibrant blue
  { color: '#6366f1', name: 'Indigo' },  // Modern vibrant indigo
  { color: '#8b5cf6', name: 'Violet' },  // Modern vibrant violet
  { color: '#ec4899', name: 'Pink' },    // Modern vibrant pink
]

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  name,
  value = '#4f46e5',
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
    <div className="space-y-4">
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Palette className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      
      {/* Predefined Colors */}
      <div className="grid grid-cols-5 gap-3">
        {predefinedColors.map(({ color, name: colorName }) => (
          <button
            key={color}
            type="button"
            className={`group relative w-full h-10 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
              value === color 
                ? 'border-ring ring-2 ring-ring/50 scale-105'
                : 'border-border hover:border-muted-foreground'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handlePredefinedColorClick(color)}
            title={colorName}
          >
            {value === color && (
              <Check className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
            )}
          </button>
        ))}
      </div>
      
      {/* Custom Hex Input */}
      <div className="space-y-2">
        <Label htmlFor={`${name}-custom`} className="text-xs text-muted-foreground font-medium">
          Custom Color (Hex)
        </Label>
        <div className="relative">
          <Input
            id={`${name}-custom`}
            name={name}
            type="text"
            placeholder="#4f46e5"
            value={customColor}
            onChange={handleCustomColorChange}
            className="font-mono text-sm pl-10 border-border"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-muted-foreground/50"
            style={{ backgroundColor: customColor }}
          />
        </div>
      </div>
    </div>
  )
}
export default ColorPicker