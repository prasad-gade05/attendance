import React, { useState } from 'react'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  label: string
  name: string
  value?: string
  onChange: (value: string) => void
  required?: boolean
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  label, 
  name, 
  value = '', 
  onChange,
  required = false
}) => {
  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // Generate minutes (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45]
  
  // Parse current value
  const [currentHour, currentMinute] = value ? value.split(':').map(Number) : [9, 0]
  
  const handleHourChange = (hour: string) => {
    const newTime = `${hour.padStart(2, '0')}:${(currentMinute || 0).toString().padStart(2, '0')}`
    onChange(newTime)
  }
  
  const handleMinuteChange = (minute: string) => {
    const newTime = `${(currentHour || 0).toString().padStart(2, '0')}:${minute.padStart(2, '0')}`
    onChange(newTime)
  }
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <input type="hidden" name={name} value={value} />
        <div className="flex-1">
          <Select 
            value={currentHour?.toString() || '9'} 
            onValueChange={handleHourChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hours.map(hour => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">:</div>
        <div className="flex-1">
          <Select 
            value={currentMinute?.toString() || '0'} 
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map(minute => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default TimePicker