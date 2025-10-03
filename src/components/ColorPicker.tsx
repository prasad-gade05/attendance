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
  { color: '#334155', name: 'Slate' },
  { color: '#374151', name: 'Gray' },
  { color: '#1f2937', name: 'Dark Gray' },
  { color: '#dc2626', name: 'Red' },
  { color: '#ea580c', name: 'Orange' },
  { color: '#ca8a04', name: 'Yellow' },
  { color: '#16a34a', name: 'Green' },
  { color: '#0891b2', name: 'Cyan' },
  { color: '#2563eb', name: 'Blue' },
  { color: '#7c3aed', name: 'Purple' },
]

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  name,
  value = '#334155',
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
    <div className="space-y-4 animate-fade-in">
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Palette className="h-4 w-4 text-slate-500" />
        {label}
      </Label>
      
      {/* Predefined Colors */}
      <div className="grid grid-cols-5 gap-3">
        {predefinedColors.map(({ color, name: colorName }) => (
          <button
            key={color}
            type="button"
            className={`group relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-105 animate-scale-in ${
              value === color 
                ? 'border-slate-400 ring-2 ring-slate-200 shadow-md' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handlePredefinedColorClick(color)}
            title={colorName}
          >
            {value === color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-4 w-4 text-white drop-shadow-sm animate-scale-in" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Custom Hex Input */}
      <div className="space-y-2">
        <Label htmlFor={`${name}-custom`} className="text-xs text-slate-600 font-medium">
          Custom Color (Hex)
        </Label>
        <div className="relative">
          <Input
            id={`${name}-custom`}
            name={name}
            type="text"
            placeholder="#334155"
            value={customColor}
            onChange={handleCustomColorChange}
            className="font-mono text-sm pl-10 transition-all duration-200 focus:ring-2 focus:ring-slate-400/20 border-slate-200"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-slate-300"
            style={{ backgroundColor: customColor }}
          />
        </div>
      </div>
    </div>
  )
}

export default ColorPicker