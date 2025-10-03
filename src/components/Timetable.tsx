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
import { Plus, Edit2, Trash2, Combine, Split, X, Palette, Info, Clock, Zap, Star } from 'lucide-react'
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
      <div className="glass-card rounded-2xl p-6 border border-accent shadow-soft">
        <div className="flex flex-wrap gap-4">
        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingSubject(null)
                setSubjectColor('#334155')
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 hover-lift group shadow-soft"
            >
              <Plus className="mr-2 h-4 w-4 group-hover:animate-bounce-subtle" />
              Add Subject
              <Star className="ml-2 h-3 w-3 animate-pulse-gentle" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md animate-scale-in glass-card border-accent">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                {editingSubject ? (
                  <>
                    <Edit2 className="h-5 w-5 text-blue-600 animate-pulse-gentle" />
                    Edit Subject
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-purple-600 animate-bounce-subtle" />
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
                  className="transition-all duration-300 focus:ring-2 focus:ring-purple-400/20 border-purple-200/50 hover:border-purple-300"
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
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300 hover-lift"
              >
                <Zap className="mr-2 h-4 w-4 animate-pulse-gentle" />
                {editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={timeSlotDialogOpen} onOpenChange={setTimeSlotDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 hover-lift group shadow-soft"
            >
              <Clock className="mr-2 h-4 w-4 group-hover:animate-rotate-slow" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md animate-scale-in glass-card border-accent">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Clock className="h-5 w-5 text-blue-600 animate-rotate-slow" />
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
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all duration-300 hover-lift"
              >
                <Zap className="mr-2 h-4 w-4 animate-pulse-gentle" />
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
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 hover-lift shadow-soft" 
            : "border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 hover-lift group shadow-soft"
          }
        >
          <Combine className={`mr-2 h-4 w-4 ${isCombineMode ? 'animate-pulse-gentle' : 'group-hover:animate-bounce-subtle'}`} />
          {isCombineMode ? 'Cancel Combine' : 'Combine Slots'}
        </Button>
        
        {isCombineMode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 w-full animate-slide-up shadow-soft">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-glow">
                <Combine className="h-5 w-5 text-white animate-pulse-gentle" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                  Combine Mode Active
                  <Star className="h-4 w-4 text-amber-600 animate-pulse-gentle" />
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Click on slots with the same subject to select them for combining. 
                  Only adjacent slots from the same day with the same subject can be combined.
                </p>
                {selectedSlots.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-bounce-subtle"></div>
                      <span className="text-amber-700 text-sm font-medium">
                        {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button 
                      onClick={handleCombineSlots} 
                      disabled={selectedSlots.length < 2}
                      size="sm"
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover-lift shadow-soft"
                    >
                      <Combine className="mr-2 h-4 w-4 animate-pulse-gentle" />
                      Combine Selected ({selectedSlots.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="glass-card rounded-2xl shadow-elegant border border-accent overflow-hidden animate-fade-in">
        {sortedTimeSlots.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
              <Clock className="h-10 w-10 text-blue-500 animate-rotate-slow" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No time slots yet</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Get started by creating your first time slot to organize your schedule efficiently
            </p>
            <Button 
              onClick={() => setTimeSlotDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 hover-lift shadow-soft"
            >
              <Plus className="mr-2 h-4 w-4 animate-bounce-subtle" />
              Create First Time Slot
              <Star className="ml-2 h-3 w-3 animate-pulse-gentle" />
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-accent">
                  <th className="px-6 py-5 text-left text-sm font-semibold text-slate-900 w-32">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 animate-pulse-gentle" />
                      Time
                    </div>
                  </th>
                  {days.map((day, index) => (
                    <th key={day} className="px-6 py-5 text-center text-sm font-semibold text-slate-900">
                      <div className="flex items-center justify-center gap-2">
                        {day}
                        <div className={`w-2 h-2 rounded-full animate-pulse-gentle ${
                          ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400'][index]
                        }`}></div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
              {sortedTimeSlots.map((timeSlot, index) => (
                <tr 
                  key={timeSlot.id} 
                  className="hover:bg-blue-50/30 transition-all duration-300 group animate-fade-in"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <td className="px-6 py-5 text-center font-mono group relative bg-gradient-to-r from-slate-50/50 to-blue-50/30 border-r border-accent">
                    <div className="text-sm font-semibold text-slate-900 flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 animate-pulse-gentle" />
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </div>
                    
                    {/* Delete time slot button - shows on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg shadow-soft hover-lift"
                        onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                        title="Delete this time slot"
                      >
                        <Trash2 className="h-3 w-3 text-red-600 group-hover:animate-bounce-subtle" />
                      </Button>
                    </div>
                  </td>
                  {days.map((day, index) => {
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
                        className={`px-6 py-5 h-24 relative transition-all duration-300 ${
                          isCombineMode && daySlot?.subjectId ? 'cursor-pointer' : ''
                        } ${
                          isSelected ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/70 animate-glow' : ''
                        } ${isCombineMode && daySlot?.subjectId ? 'hover:bg-blue-50/50' : ''}
                        ${combinedSlot ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-emerald-400' : 'border-l border-accent'}
                        group/cell hover-lift`}
                        rowSpan={rowSpan}
                        onClick={() => daySlot?.subjectId && handleCellClick(timeSlot.id, day)}
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        {subject && !isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-3 group/cell rounded-xl m-2 border-2 transform-gpu transition-all duration-300 group-hover/cell:scale-105 shadow-soft hover-lift"
                            style={{ 
                              backgroundColor: `${subject.color}15`,
                              borderColor: `${subject.color}60`
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="text-sm font-semibold mb-1 flex items-center justify-center gap-1"
                                style={{ color: subject.color }}
                              >
                                <Star className="h-3 w-3 animate-pulse-gentle" />
                                {subject.name}
                              </div>
                              {combinedSlot && (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-gentle"></div>
                                  <span className="text-xs text-emerald-700 font-medium">Combined</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Remove subject button */}
                            <div className="absolute top-1 left-1 opacity-0 group-hover/cell:opacity-100 transition-all duration-300">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 bg-white hover:bg-white border border-slate-200 rounded-lg shadow-soft hover-lift"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  assignSubjectToSlot(timeSlot.id, day, undefined)
                                }}
                                title="Remove subject"
                              >
                                <X className="h-3 w-3 text-slate-600 group-hover:animate-bounce-subtle" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {subject && isCombineMode && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center p-3 rounded-xl m-2 border-2 transform-gpu transition-all duration-300 group-hover/cell:scale-105 shadow-soft"
                            style={{ 
                              backgroundColor: `${subject.color}15`,
                              borderColor: `${subject.color}60`
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="text-sm font-semibold mb-1 flex items-center justify-center gap-1"
                                style={{ color: subject.color }}
                              >
                                <Star className="h-3 w-3 animate-pulse-gentle" />
                                {subject.name}
                              </div>
                              {combinedSlot && (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-gentle"></div>
                                  <span className="text-xs text-emerald-700 font-medium">Combined</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {combinedSlot && !isCombineMode && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 bg-white hover:bg-white border border-slate-200 rounded-lg shadow-soft hover-lift"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUncombineSlot(combinedSlot.id)
                              }}
                              title="Uncombine slots"
                            >
                              <Split className="h-3 w-3 text-slate-600 group-hover:animate-bounce-subtle" />
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
                              <SelectTrigger className="h-11 w-36 text-xs border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-lg shadow-soft hover-lift">
                                <SelectValue placeholder="+ Add subject" />
                              </SelectTrigger>
                              <SelectContent className="glass-card border-accent">
                                <SelectItem value="none" className="text-slate-500">None</SelectItem>
                                {subjects.map(subject => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full animate-pulse-gentle" 
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
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-all duration-300">
                            <Select 
                              onValueChange={(value) => 
                                assignSubjectToSlot(timeSlot.id, day, value === 'none' ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-7 w-7 p-0 text-xs bg-white hover:bg-white border border-slate-200 rounded-lg shadow-soft hover-lift">
                                <Edit2 className="h-3 w-3 text-slate-600 group-hover:animate-bounce-subtle" />
                              </SelectTrigger>
                              <SelectContent className="glass-card border-accent">
                                <SelectItem value="none" className="text-red-600">Remove Subject</SelectItem>
                                {subjects.map(subj => (
                                  <SelectItem key={subj.id} value={subj.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full animate-pulse-gentle" 
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
      <div className="glass-card rounded-2xl shadow-elegant border border-accent overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-accent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Palette className="h-6 w-6 text-purple-600 animate-pulse-gentle" />
                Subjects
                <Star className="h-5 w-5 text-amber-500 animate-bounce-subtle" />
              </h2>
              <p className="text-sm text-slate-600 mt-1">Manage your course subjects and colors</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {subjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
                <Palette className="h-12 w-12 text-purple-600 animate-rotate-slow" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">No subjects yet</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Create your first subject to start organizing your timetable with beautiful colors
              </p>
              <Button 
                onClick={() => {
                  setEditingSubject(null)
                  setSubjectColor('#334155')
                  setSubjectDialogOpen(true)
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-elegant hover:shadow-elevated transition-all duration-300 hover-lift"
              >
                <Plus className="mr-2 h-4 w-4 animate-bounce-subtle" />
                Create First Subject
                <Star className="ml-2 h-4 w-4 animate-pulse-gentle" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, index) => (
                <div 
                  key={subject.id} 
                  className="group relative glass-card border border-accent rounded-2xl p-6 hover:shadow-elegant transition-all duration-300 hover-lift animate-fade-in"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-14 h-14 rounded-2xl shadow-soft flex items-center justify-center animate-glow"
                        style={{ backgroundColor: subject.color }}
                      >
                        <span className="text-white font-bold text-xl">
                          {subject.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {subject.name}
                          <Star className="h-4 w-4 text-amber-500 animate-pulse-gentle" />
                        </h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">{subject.color}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingSubject(subject)
                          setSubjectColor(subject.color)
                          setSubjectDialogOpen(true)
                        }}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover-lift"
                      >
                        <Edit2 className="h-4 w-4 group-hover:animate-bounce-subtle" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover-lift"
                      >
                        <Trash2 className="h-4 w-4 group-hover:animate-bounce-subtle" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <DialogContent className="sm:max-w-md overflow-hidden glass-card border-accent animate-scale-in">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 -m-6 mb-4 border-b border-accent">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center animate-glow">
                  <Info className="h-5 w-5 text-white animate-pulse-gentle" />
                </div>
                {showAlertDialog.title}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-2">
            <p className="text-sm text-slate-600 leading-relaxed">{showAlertDialog.message}</p>
          </div>
          <div className="flex justify-end px-6 pb-6 pt-4">
            <Button 
              onClick={() => setShowAlertDialog({show: false, title: '', message: ''})}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-elegant hover:shadow-elevated transition-all duration-300 hover-lift"
            >
              <Zap className="mr-2 h-4 w-4 animate-pulse-gentle" />
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Timetable