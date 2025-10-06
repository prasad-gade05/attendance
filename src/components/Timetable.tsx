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
import { Plus, Edit2, Trash2, Combine, Split, X, Palette, Info, Clock } from 'lucide-react'
import { Subject, DaySlot } from '../types'
import TimePicker from './TimePicker'
import ConfirmDialog from './ConfirmDialog'
import ColorPicker from './ColorPicker'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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
  const [subjectColor, setSubjectColor] = useState('#4f46e5')
  
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
  
  // Sort time slots by start time and filter out extra class time slots
  const sortedTimeSlots = [...timeSlots]
    .filter(timeSlot => !timeSlot.id.startsWith('extra-')) // Exclude extra class time slots
    .sort((a, b) => {
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
    setSubjectColor('#4f46e5')
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
    
    // Check for overlapping time slots (exclude extra class time slots)
    const overlapping = timeSlots.filter(slot => !slot.id.startsWith('extra-')).find(slot => {
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
    ).filter(item => item !== undefined) as any[]
    
    const subjectIds = [...new Set(daySlotItems.map((ds: any) => ds.subjectId).filter((id: string | undefined) => id !== undefined))]
    
    // Check if any slots are empty
    const hasEmptySlots = daySlotItems.some((ds: any) => !ds.subjectId)
    if (hasEmptySlots) {
      setShowAlertDialog({
        show: true,
        title: 'Empty Slots',
        message: 'Cannot combine empty slots. Please assign a subject to all slots first.'
      })
      return
    }
    
    if (subjectIds.length !== 1) {
      setShowAlertDialog({
        show: true,
        title: 'Invalid Selection',
        message: 'All slots must have the same subject to combine them.'
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
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSubject(null)
              setSubjectColor('#4f46e5')
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingSubject ? (
                  <>
                    <Edit2 className="h-5 w-5" />
                    Edit Subject
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create New Subject
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Subject Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingSubject?.name || ''} 
                  required 
                  placeholder="Enter subject name..."
                />
              </div>
              <ColorPicker
                label="Subject Color"
                name="color"
                value={editingSubject?.color || subjectColor}
                onChange={setSubjectColor}
              />
              <Button type="submit" className="w-full">
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={timeSlotDialogOpen} onOpenChange={setTimeSlotDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Create Time Slot
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTimeSlot} className="space-y-6">
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
              <Button type="submit" className="w-full">
                Create Time Slot
              </Button>
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
          className="flex-1 sm:flex-none"
        >
          <Combine className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {isCombineMode ? 'Cancel Combine' : 'Combine Slots'}
          </span>
          <span className="sm:hidden">
            {isCombineMode ? 'Cancel' : 'Combine'}
          </span>
        </Button>
        
        {isCombineMode && (
          <Card className="w-full">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Combine className="h-4 w-4" />
                  <span className="font-medium">
                    Combine Mode: {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button 
                  onClick={handleCombineSlots} 
                  disabled={selectedSlots.length < 2}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Combine className="mr-2 h-4 w-4" />
                  Combine Selected ({selectedSlots.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {sortedTimeSlots.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time slots yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first time slot to organize your schedule
              </p>
              <Button onClick={() => setTimeSlotDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Time Slot
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold w-32">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Time</span>
                        <span className="sm:hidden">Time</span>
                      </div>
                    </th>
                    {days.map((day) => (
                      <th key={day} className="px-2 py-3 text-center text-sm font-semibold min-w-[80px]">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedTimeSlots.map((timeSlot) => (
                    <tr key={timeSlot.id}>
                      <td className="px-4 py-3 text-center font-mono text-sm border-r">
                        <div className="text-xs sm:text-sm">
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </div>
                        
                        {/* Delete time slot button - shows on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity float-right mt-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                            title="Delete this time slot"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      {days.map((day) => {
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
                            className={`px-2 py-3 h-20 relative group ${
                              isCombineMode && daySlot?.subjectId ? 'cursor-pointer' : ''
                            } ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            } ${isCombineMode && daySlot?.subjectId ? 'hover:bg-muted' : ''}
                            ${combinedSlot ? 'bg-muted' : ''}`}
                            rowSpan={rowSpan}
                            onClick={() => daySlot?.subjectId && handleCellClick(timeSlot.id, day)}
                          >
                            {subject && !isCombineMode && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center p-2 rounded border"
                                style={{ 
                                  backgroundColor: `${subject.color}15`,
                                  borderColor: `${subject.color}60`
                                }}
                              >
                                <div className="text-center">
                                  <div 
                                    className="text-xs sm:text-sm font-medium"
                                    style={{ color: subject.color }}
                                  >
                                    {subject.name}
                                  </div>
                                  {combinedSlot && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span className="text-xs text-muted-foreground">Combined</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Remove subject button */}
                                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      assignSubjectToSlot(timeSlot.id, day, undefined)
                                    }}
                                    title="Remove subject"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {subject && isCombineMode && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center p-2 rounded border"
                                style={{ 
                                  backgroundColor: `${subject.color}15`,
                                  borderColor: `${subject.color}60`
                                }}
                              >
                                <div className="text-center">
                                  <div 
                                    className="text-xs sm:text-sm font-medium"
                                    style={{ color: subject.color }}
                                  >
                                    {subject.name}
                                  </div>
                                  {combinedSlot && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span className="text-xs text-muted-foreground">Combined</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {combinedSlot && !isCombineMode && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUncombineSlot(combinedSlot.id)
                                  }}
                                  title="Uncombine slots"
                                >
                                  <Split className="h-2.5 w-2.5" />
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
                                  <SelectTrigger className="h-8 text-xs border-dashed">
                                    <SelectValue placeholder="+ Add subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {subjects.map(subject => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: subject.color }}
                                          />
                                          <span className="text-xs">{subject.name}</span>
                                        </div>
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
                                  <SelectTrigger className="h-5 w-5 p-0">
                                    <Edit2 className="h-2.5 w-2.5" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-destructive">Remove Subject</SelectItem>
                                    {subjects.map(subj => (
                                      <SelectItem key={subj.id} value={subj.id}>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: subj.color }}
                                          />
                                          <span className="text-xs">{subj.name}</span>
                                        </div>
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
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Subjects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subject to start organizing your timetable
              </p>
              <Button onClick={() => {
                setEditingSubject(null)
                setSubjectColor('#4f46e5')
                setSubjectDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: subject.color }}
                        >
                          <span className="text-white font-bold text-sm">
                            {subject.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{subject.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{subject.color}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
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
                          variant="ghost"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {showAlertDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-muted-foreground">{showAlertDialog.message}</p>
          </div>
          <div className="flex justify-end">
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