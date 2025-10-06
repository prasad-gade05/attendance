import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { useTimetable } from '../hooks/useTimetable'
import { useSchedule } from '../hooks/useSchedule'
import { db } from '../lib/db'
import TimePicker from './TimePicker'

interface ExtraClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string
}

const ExtraClassDialog: React.FC<ExtraClassDialogProps> = ({
  open,
  onOpenChange,
  selectedDate
}) => {
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '', endTime: '' })
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [description, setDescription] = useState('')
  const [useExistingSlot, setUseExistingSlot] = useState(true)

  const { subjects, timeSlots, addTimeSlot } = useTimetable()
  const { addExtraClass } = useSchedule()

  const resetForm = () => {
    setNewTimeSlot({ startTime: '', endTime: '' })
    setSelectedTimeSlot('')
    setSelectedSubject('')
    setDescription('')
    setUseExistingSlot(true)
  }

  const handleSubmit = async () => {
    try {
      let timeSlotId = selectedTimeSlot

      // Create new time slot if needed (only for extra classes, not for timetable)
      if (!useExistingSlot && newTimeSlot.startTime && newTimeSlot.endTime) {
        // Generate a unique ID for the extra class time slot
        timeSlotId = `extra-${Date.now()}`
        
        // Create a time slot record directly without affecting the timetable structure
        const newSlot = {
          id: timeSlotId,
          startTime: newTimeSlot.startTime,
          endTime: newTimeSlot.endTime
        }
        // Save to database directly without creating day slots for all days
        await db.timeSlots.add(newSlot)
      }

      if (!timeSlotId || !selectedSubject) {
        alert('Please fill in all required fields')
        return
      }

      await addExtraClass({
        date: selectedDate,
        timeSlotId,
        subjectId: selectedSubject,
        description: description || undefined
      })

      resetForm()
      onOpenChange(false)
      // Refresh the page after adding an extra class
      window.location.reload()
    } catch (error) {
      alert('Failed to add extra class. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Extra Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="existing-slot"
                  checked={useExistingSlot}
                  onChange={() => setUseExistingSlot(true)}
                />
                <Label htmlFor="existing-slot">Use existing time slot</Label>
              </div>
              
              {useExistingSlot && (
                <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter(slot => !slot.id.startsWith('extra-')) // Exclude extra class time slots
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.startTime} - {slot.endTime}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new-slot"
                  checked={!useExistingSlot}
                  onChange={() => setUseExistingSlot(false)}
                />
                <Label htmlFor="new-slot">Create new time slot</Label>
              </div>

              {!useExistingSlot && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Use TimePicker component for consistency */}
                  <TimePicker 
                    label="Start Time"
                    name="startTime"
                    value={newTimeSlot.startTime}
                    onChange={(value) => setNewTimeSlot(prev => ({ ...prev, startTime: value }))}
                  />
                  <TimePicker 
                    label="End Time"
                    name="endTime"
                    value={newTimeSlot.endTime}
                    onChange={(value) => setNewTimeSlot(prev => ({ ...prev, endTime: value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional notes about this extra class..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Extra Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExtraClassDialog