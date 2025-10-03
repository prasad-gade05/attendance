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
import { Plus, Edit2, Trash2, Combine, Split, X, Palette, Info } from 'lucide-react'
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
  const [subjectColor, setSubjectColor] = useState('#334155')
  
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
    setSubjectColor('#334155')
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
    <div className="space-y-8 animate-slide-up">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingSubject(null)
                setSubjectColor('#334155')
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200 animate-scale-in"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                {editingSubject ? (
                  <>
                    <Edit2 className="h-5 w-5 text-slate-600" />
                    Edit Subject
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-slate-600" />
                    Create New Subject
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Subject Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingSubject?.name || ''} 
                  required 
                  className="transition-all duration-200 focus:ring-2 focus:ring-slate-400/20 border-slate-200"
                  placeholder="Enter subject name..."
                />
              </div>
              <ColorPicker
                label="Subject Color"
                name="color"
                value={editingSubject?.color || subjectColor}
                onChange={setSubjectColor}
              />
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200"
              >
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={timeSlotDialogOpen} onOpenChange={setTimeSlotDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 animate-scale-in"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Plus className="h-5 w-5 text-slate-600" />
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
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200"
              >
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
          className={isCombineMode 
            ? "bg-amber-600 hover:bg-amber-700 text-white transition-all duration-200 animate-scale-in" 
            : "border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 animate-scale-in"
          }
        >
          <Combine className="mr-2 h-4 w-4" />
          {isCombineMode ? 'Cancel Combine' : 'Combine Slots'}
        </Button>
        
        {isCombineMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 w-full animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Combine className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-amber-900 mb-1">Combine Mode Active</h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Click on slots with the same subject to select them for combining. 
                  Only adjacent slots from the same day with the same subject can be combined.
                </p>
                {selectedSlots.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-float"></div>
                      <span className="text-amber-700 text-sm font-medium">
                        {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button 
                      onClick={handleCombineSlots} 
                      disabled={selectedSlots.length < 2}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Combine className="mr-2 h-4 w-4" />
                      Combine Selected ({selectedSlots.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-elegant border border-slate-200 overflow-hidden animate-fade-in">
        {sortedTimeSlots.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No time slots yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Get started by creating your first time slot to organize your schedule
            </p>
            <Button 
              onClick={() => setTimeSlotDialogOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Time Slot
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900 w-32">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-6 py-4 text-center text-sm font-medium text-slate-900">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {sortedTimeSlots.map((timeSlot, index) => (
                <tr key={timeSlot.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-center font-mono group relative bg-slate-50/30">
                    <div className="text-sm font-medium text-slate-900">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </div>
                    
                    {/* Delete time slot button - shows on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300"
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
                        className={`px-6 py-4 h-20 relative transition-all duration-200 ${
                          isCombineMode && daySlot?.subjectId ? 'cursor-pointer' : ''
                        } ${
                          isSelected ? 'ring-2 ring-blue-400 ring-inset bg-blue-50' : ''
                        } ${isCombineMode && daySlot?.subjectId ? 'hover:bg-blue-50/50' : ''}
                        ${combinedSlot ? 'bg-green-50 border-l-4 border-green-400' : 'border-l border-slate-100'}
                        group`}
                        rowSpan={rowSpan}
                        onClick={() => daySlot?.subjectId && handleCellClick(timeSlot.id, day)}
                      >
                        {subject && !isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-3 group/cell rounded-md m-1 border border-slate-200 transform-gpu transition-all duration-200 group-hover/cell:scale-105"
                            style={{ 
                              backgroundColor: `${subject.color}10`,
                              borderColor: `${subject.color}40`
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="text-sm font-medium mb-1"
                                style={{ color: subject.color }}
                              >
                                {subject.name}
                              </div>
                              {combinedSlot && (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-700 font-medium">Combined</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Remove subject button */}
                            <div className="absolute top-1 left-1 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-5 w-5 bg-white hover:bg-white border border-slate-200"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  assignSubjectToSlot(timeSlot.id, day, undefined)
                                }}
                                title="Remove subject"
                              >
                                <X className="h-3 w-3 text-slate-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {subject && isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-3 rounded-md m-1 border border-slate-200 transform-gpu transition-all duration-200 group-hover/cell:scale-105"
                            style={{ 
                              backgroundColor: `${subject.color}10`,
                              borderColor: `${subject.color}40`
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="text-sm font-medium mb-1"
                                style={{ color: subject.color }}
                              >
                                {subject.name}
                              </div>
                              {combinedSlot && (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-700 font-medium">Combined</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {combinedSlot && !isCombineMode && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-5 w-5 bg-white hover:bg-white border border-slate-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUncombineSlot(combinedSlot.id)
                              }}
                              title="Uncombine slots"
                            >
                              <Split className="h-3 w-3 text-slate-600" />
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
                              <SelectTrigger className="h-10 w-32 text-xs border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors duration-200 bg-white">
                                <SelectValue placeholder="+ Add subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-slate-500">None</SelectItem>
                                {subjects.map(subject => (
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
                        )}
                        
                        {/* Replace subject dropdown for existing subjects */}
                        {subject && !isCombineMode && !combinedSlot && (
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200">
                            <Select 
                              onValueChange={(value) => 
                                assignSubjectToSlot(timeSlot.id, day, value === 'none' ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-6 w-6 p-0 text-xs bg-white hover:bg-white border border-slate-200">
                                <Edit2 className="h-3 w-3 text-slate-600" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-red-600">Remove Subject</SelectItem>
                                {subjects.map(subj => (
                                  <SelectItem key={subj.id} value={subj.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: subj.color }}
                                      />
                                      {subj.name}
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
      </div>
      
      {/* Subjects Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                Your Subjects
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your subjects and their colors
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first subject to start organizing your timetable
              </p>
              <Button 
                onClick={() => {
                  setEditingSubject(null)
                  setSubjectColor('#334155')
                  setSubjectDialogOpen(true)
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div 
                  key={subject.id} 
                  className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center"
                        style={{ backgroundColor: subject.color }}
                      >
                        <span className="text-white font-bold text-lg">
                          {subject.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{subject.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{subject.color}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingSubject(subject)
                          setSubjectColor(subject.color)
                          setSubjectDialogOpen(true)
                        }}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <DialogContent className="sm:max-w-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 mb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                {showAlertDialog.title}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-2">
            <p className="text-sm text-gray-600 leading-relaxed">{showAlertDialog.message}</p>
          </div>
          <div className="flex justify-end px-6 pb-6 pt-4">
            <Button 
              onClick={() => setShowAlertDialog({show: false, title: '', message: ''})}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Timetable