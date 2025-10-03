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
  { color: '#475569', name: 'Slate' },
  { color: '#4b5563', name: 'Gray' },
  { color: '#374151', name: 'Dark Gray' },
  { color: '#b91c1c', name: 'Red' },
  { color: '#c2410c', name: 'Orange' },
  { color: '#a16207', name: 'Yellow' },
  { color: '#15803d', name: 'Green' },
  { color: '#0e7490', name: 'Cyan' },
  { color: '#1d4ed8', name: 'Blue' },
  { color: '#6d28d9', name: 'Purple' },
]

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  name,
  value = '#475569',
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
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Palette className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      
      {/* Predefined Colors */}
      <div className="grid grid-cols-5 gap-2">
        {predefinedColors.map(({ color, name: colorName }) => (
          <button
            key={color}
            type="button"
            className={`group relative w-full aspect-square rounded-md border transition-all duration-200 ${ 
              value === color 
                ? 'border-ring ring-2 ring-ring/50'
                : 'border-border hover:border-muted-foreground'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handlePredefinedColorClick(color)}
            title={colorName}
          >
            {value === color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
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
            placeholder="#475569"
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