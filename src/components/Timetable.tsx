import React, { useState, useEffect } from 'react'
import { useTimetable } from '../hooks/useTimetable'
import { Button } from '../components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Plus, Edit2, Trash2, Combine, Split, X } from 'lucide-react'
import { Subject } from '../types'
import TimePicker from './TimePicker'
import ConfirmDialog from './ConfirmDialog'
import ColorPicker from './ColorPicker'

const Timetable = () => {
  const { 
    subjects, 
    timeSlots, 
    daySlots,
    combinedSlots,
    addSubject, 
    updateSubject, 
    deleteSubject, 
    addTimeSlot, 
    deleteTimeSlot,
    assignSubjectToSlot,
    combineSlots,
    uncombineSlot
  } = useTimetable()
  
  const [isCombineMode, setIsCombineMode] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<{timeSlotId: string, day: string}[]>([])
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [subjectColor, setSubjectColor] = useState('#3b82f6')
  
  // Confirmation dialogs state
  const [showDeleteSubjectDialog, setShowDeleteSubjectDialog] = useState<{show: boolean, subjectId: string}>({show: false, subjectId: ''})
  const [showDeleteTimeSlotDialog, setShowDeleteTimeSlotDialog] = useState<{show: boolean, timeSlotId: string}>({show: false, timeSlotId: ''})
  const [showUncombineDialog, setShowUncombineDialog] = useState<{show: boolean, combinedSlotId: string}>({show: false, combinedSlotId: ''})
  const [showAlertDialog, setShowAlertDialog] = useState<{show: boolean, title: string, message: string}>({show: false, title: '', message: ''})
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Auto-calculate end time when start time changes
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const endHours = (hours + 1) % 24
      const endTimeString = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      setEndTime(endTimeString)
    }
  }, [startTime])
  
  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => {
    const [aHours, aMinutes] = a.startTime.split(':').map(Number)
    const [bHours, bMinutes] = b.startTime.split(':').map(Number)
    return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes)
  })
  
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    
    if (editingSubject) {
      updateSubject(editingSubject.id, { name, color: subjectColor })
    } else {
      addSubject({ name, color: subjectColor })
    }
    
    setSubjectDialogOpen(false)
    setEditingSubject(null)
    setSubjectColor('#3b82f6')
  }
  
  const handleAddTimeSlot = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that end time is after start time
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    if (endMinutes <= startMinutes) {
      setShowAlertDialog({
        show: true,
        title: 'Invalid Time Range',
        message: 'End time must be after start time'
      })
      return
    }
    
    // Check for overlapping time slots
    const overlapping = timeSlots.find(slot => {
      const [slotStartHour, slotStartMinute] = slot.startTime.split(':').map(Number)
      const [slotEndHour, slotEndMinute] = slot.endTime.split(':').map(Number)
      const slotStartMinutes = slotStartHour * 60 + slotStartMinute
      const slotEndMinutes = slotEndHour * 60 + slotEndMinute
      
      return !(
        (startMinutes >= slotEndMinutes) ||
        (endMinutes <= slotStartMinutes)
      )
    })
    
    if (overlapping) {
      setShowAlertDialog({
        show: true,
        title: 'Time Slot Overlap',
        message: `Time slot overlaps with existing slot from ${overlapping.startTime} to ${overlapping.endTime}`
      })
      return
    }
    
    addTimeSlot({ startTime, endTime })
    
    setTimeSlotDialogOpen(false)
    setStartTime('09:00')
    setEndTime('10:00')
  }
  
  const handleDeleteSubject = (id: string) => {
    setShowDeleteSubjectDialog({show: true, subjectId: id})
  }
  
  const confirmDeleteSubject = () => {
    deleteSubject(showDeleteSubjectDialog.subjectId)
  }
  
  const handleDeleteTimeSlot = (id: string) => {
    setShowDeleteTimeSlotDialog({show: true, timeSlotId: id})
  }
  
  const confirmDeleteTimeSlot = () => {
    deleteTimeSlot(showDeleteTimeSlotDialog.timeSlotId)
  }
  
  const handleCellClick = (timeSlotId: string, day: string) => {
    if (isCombineMode) {
      const slotKey = `${timeSlotId}-${day}`
      setSelectedSlots(prev => {
        const exists = prev.find(s => s.timeSlotId === timeSlotId && s.day === day)
        if (exists) {
          return prev.filter(s => !(s.timeSlotId === timeSlotId && s.day === day))
        } else {
          return [...prev, { timeSlotId, day }]
        }
      })
    }
  }
  
  const handleCombineSlots = async () => {
    if (selectedSlots.length < 2) {
      setShowAlertDialog({
        show: true,
        title: 'Insufficient Selection',
        message: 'Please select at least 2 slots to combine'
      })
      return
    }
    
    // Check if all slots are from the same day
    const days = [...new Set(selectedSlots.map(s => s.day))]
    if (days.length > 1) {
      setShowAlertDialog({
        show: true,
        title: 'Invalid Selection',
        message: 'Slots must be from the same day to combine them.'
      })
      return
    }
    
    // Check if all slots have the same subject
    const daySlotItems = selectedSlots.map(s => 
      daySlots.find(ds => ds.timeSlotId === s.timeSlotId && ds.day === s.day)
    ).filter(Boolean)
    
    const subjectIds = [...new Set(daySlotItems.map(ds => ds?.subjectId).filter(Boolean))]
    if (subjectIds.length !== 1) {
      setShowAlertDialog({
        show: true,
        title: 'Invalid Selection',
        message: 'All slots must have the same subject to combine them.'
      })
      return
    }
    
    if (subjectIds.length === 0) {
      setShowAlertDialog({
        show: true,
        title: 'Empty Slots',
        message: 'Cannot combine empty slots. Please assign a subject to all slots first.'
      })
      return
    }
    
    // Sort selected slots by time
    const sortedSlots = [...selectedSlots].sort((a, b) => {
      const timeSlotA = timeSlots.find(ts => ts.id === a.timeSlotId)
      const timeSlotB = timeSlots.find(ts => ts.id === b.timeSlotId)
      if (!timeSlotA || !timeSlotB) return 0
      
      const [aHours, aMinutes] = timeSlotA.startTime.split(':').map(Number)
      const [bHours, bMinutes] = timeSlotB.startTime.split(':').map(Number)
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes)
    })
    
    try {
      const firstSlot = sortedSlots[0]
      const adjacentTimeSlotIds = sortedSlots.slice(1).map(s => s.timeSlotId)
      
      await combineSlots(firstSlot.timeSlotId, firstSlot.day, adjacentTimeSlotIds)
      setSelectedSlots([])
      setIsCombineMode(false)
      setShowAlertDialog({
        show: true,
        title: 'Success',
        message: 'Slots combined successfully!'
      })
    } catch (error) {
      setShowAlertDialog({
        show: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to combine slots'
      })
    }
  }
  
  const handleUncombineSlot = async (combinedSlotId: string) => {
    setShowUncombineDialog({show: true, combinedSlotId})
  }
  
  const confirmUncombineSlot = async () => {
    await uncombineSlot(showUncombineDialog.combinedSlotId)
  }
  
  const getDaySlot = (timeSlotId: string, day: string) => {
    return daySlots.find(ds => ds.timeSlotId === timeSlotId && ds.day === day)
  }
  
  const getCombinedSlot = (timeSlotId: string, day: string) => {
    const daySlot = getDaySlot(timeSlotId, day)
    if (!daySlot) return null
    
    return combinedSlots.find(cs => 
      cs.day === day && cs.daySlotIds.includes(daySlot.id)
    )
  }
  
  const isSlotPartOfCombined = (timeSlotId: string, day: string) => {
    const combinedSlot = getCombinedSlot(timeSlotId, day)
    if (!combinedSlot) return false
    
    const daySlot = getDaySlot(timeSlotId, day)
    if (!daySlot) return false
    
    // Check if this is the first slot in the combined group
    const firstDaySlotId = combinedSlot.daySlotIds[0]
    return daySlot.id !== firstDaySlotId
  }
  
  const getTimeSlotSpan = (timeSlotId: string, day: string) => {
    const combinedSlot = getCombinedSlot(timeSlotId, day)
    if (!combinedSlot) return 1
    
    const daySlot = getDaySlot(timeSlotId, day)
    if (!daySlot) return 1
    
    // Only the first slot should have rowspan
    const firstDaySlotId = combinedSlot.daySlotIds[0]
    return daySlot.id === firstDaySlotId ? combinedSlot.daySlotIds.length : 1
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSubject(null)
              setSubjectColor('#3b82f6')
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <Label htmlFor="name">Subject Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingSubject?.name || ''} 
                  required 
                />
              </div>
              <div>
                <ColorPicker
                  label="Color"
                  name="color"
                  value={editingSubject?.color || subjectColor}
                  onChange={setSubjectColor}
                />
              </div>
              <Button type="submit">
                {editingSubject ? 'Update' : 'Add'} Subject
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={timeSlotDialogOpen} onOpenChange={setTimeSlotDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Slot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTimeSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TimePicker 
                  label="Start Time"
                  name="startTime"
                  value={startTime}
                  onChange={setStartTime}
                  required
                />
                <TimePicker 
                  label="End Time"
                  name="endTime"
                  value={endTime}
                  onChange={setEndTime}
                  required
                />
              </div>
              <Button type="submit">Add Time Slot</Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant={isCombineMode ? "default" : "outline"} 
          onClick={() => {
            if (isCombineMode) {
              setSelectedSlots([])
            }
            setIsCombineMode(!isCombineMode)
          }}
        >
          <Combine className="mr-2 h-4 w-4" />
          {isCombineMode ? 'Cancel Combine' : 'Combine Slots'}
        </Button>
        
        {isCombineMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <p className="text-blue-700 text-sm mb-2">
              <strong>Combine Mode Active:</strong> Click on slots with the same subject to select them for combining. 
              Only adjacent slots from the same day with the same subject can be combined.
            </p>
            {selectedSlots.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-blue-600 text-xs">
                  {selectedSlots.length} slot(s) selected
                </p>
                <Button 
                  onClick={handleCombineSlots} 
                  disabled={selectedSlots.length < 2}
                  size="sm"
                >
                  <Combine className="mr-2 h-4 w-4" />
                  Combine Selected ({selectedSlots.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        {sortedTimeSlots.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">No time slots added yet</p>
            <Button 
              onClick={() => setTimeSlotDialogOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Time Slot
            </Button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 w-32">Time</th>
                {days.map(day => (
                  <th key={day} className="border p-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTimeSlots.map(timeSlot => (
                <tr key={timeSlot.id}>
                  <td className="border p-2 text-center font-mono group relative">
                    {timeSlot.startTime} - {timeSlot.endTime}
                    
                    {/* Delete time slot button - shows on hover */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 bg-white/80 hover:bg-red-50"
                        onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                        title="Delete this time slot"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </td>
                  {days.map(day => {
                    const daySlot = getDaySlot(timeSlot.id, day)
                    const combinedSlot = getCombinedSlot(timeSlot.id, day)
                    const isPartOfCombined = isSlotPartOfCombined(timeSlot.id, day)
                    const rowSpan = getTimeSlotSpan(timeSlot.id, day)
                    
                    // Skip rendering if this slot is part of a combined slot but not the first one
                    if (isPartOfCombined) {
                      return null
                    }
                    
                    const subject = daySlot?.subjectId ? subjects.find(s => s.id === daySlot.subjectId) : null
                    const isSelected = selectedSlots.some(s => s.timeSlotId === timeSlot.id && s.day === day)
                    
                    return (
                      <td 
                        key={`${timeSlot.id}-${day}`} 
                        className={`border p-2 h-16 relative ${
                          isCombineMode && daySlot?.subjectId ? 'cursor-pointer' : ''
                        } ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        } ${isCombineMode && daySlot?.subjectId ? 'hover:bg-gray-100' : ''}
                        ${combinedSlot ? 'bg-green-50' : ''}`}
                        rowSpan={rowSpan}
                        onClick={() => daySlot?.subjectId && handleCellClick(timeSlot.id, day)}
                      >
                        {subject && !isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-1 group"
                            style={{ backgroundColor: `${subject.color}20` }}
                          >
                            <span className="text-xs font-medium text-center">
                              {subject.name}
                              {combinedSlot && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Combined
                                </div>
                              )}
                            </span>
                            
                            {/* Remove subject button */}
                            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-5 w-5 bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  assignSubjectToSlot(timeSlot.id, day, undefined)
                                }}
                                title="Remove subject"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {subject && isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-1"
                            style={{ backgroundColor: `${subject.color}20` }}
                          >
                            <span className="text-xs font-medium text-center">
                              {subject.name}
                              {combinedSlot && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Combined
                                </div>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {combinedSlot && !isCombineMode && (
                          <div className="absolute top-1 right-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUncombineSlot(combinedSlot.id)
                              }}
                            >
                              <Split className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {!subject && !isCombineMode && (
                          <div className="flex items-center justify-center h-full">
                            <Select 
                              onValueChange={(value) => 
                                assignSubjectToSlot(timeSlot.id, day, value === 'none' ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue placeholder="Add subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {subjects.map(subject => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Replace subject dropdown for existing subjects */}
                        {subject && !isCombineMode && !combinedSlot && (
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Select 
                              onValueChange={(value) => 
                                assignSubjectToSlot(timeSlot.id, day, value === 'none' ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-6 w-6 p-0 text-xs bg-white/80 hover:bg-white">
                                <Edit2 className="h-3 w-3" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Remove Subject</SelectItem>
                                {subjects.map(subj => (
                                  <SelectItem key={subj.id} value={subj.id}>
                                    {subj.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </td>
                    )
                  }).filter(Boolean)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Subjects</h2>
          <p className="text-sm text-gray-600">
            Create subjects to assign to your time slots
          </p>
        </div>
        {subjects.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">No subjects created yet</p>
            <Button 
              onClick={() => {
                setEditingSubject(null)
                setSubjectColor('#3b82f6')
                setSubjectDialogOpen(true)
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Subject
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <div 
                key={subject.id} 
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: subject.color }}
                  />
                  <span>{subject.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingSubject(subject)
                      setSubjectColor(subject.color)
                      setSubjectDialogOpen(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showDeleteSubjectDialog.show}
        onOpenChange={(open) => setShowDeleteSubjectDialog({show: open, subjectId: ''})}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This will remove it from all assigned time slots."
        onConfirm={confirmDeleteSubject}
        confirmText="Delete"
        variant="destructive"
      />
      
      <ConfirmDialog
        open={showDeleteTimeSlotDialog.show}
        onOpenChange={(open) => setShowDeleteTimeSlotDialog({show: open, timeSlotId: ''})}
        title="Delete Time Slot"
        message="Are you sure you want to delete this time slot? This will remove all assignments for this time."
        onConfirm={confirmDeleteTimeSlot}
        confirmText="Delete"
        variant="destructive"
      />
      
      <ConfirmDialog
        open={showUncombineDialog.show}
        onOpenChange={(open) => setShowUncombineDialog({show: open, combinedSlotId: ''})}
        title="Uncombine Slot"
        message="Are you sure you want to uncombine this slot?"
        onConfirm={confirmUncombineSlot}
        confirmText="Uncombine"
        variant="default"
      />
      
      {/* Alert Dialog */}
      <Dialog open={showAlertDialog.show} onOpenChange={(open) => setShowAlertDialog({show: open, title: '', message: ''})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showAlertDialog.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">{showAlertDialog.message}</p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowAlertDialog({show: false, title: '', message: ''})}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Timetable