import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Clock, Check, X, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { useTimetable } from '../hooks/useTimetable'
import { useSchedule } from '../hooks/useSchedule'
import { Subject, TimeSlot, DaySlot, AttendanceRecord, ExtraClass } from '../types'

interface TodayScheduleItemProps {
  timeSlot: TimeSlot
  subject: Subject | null
  daySlot: DaySlot | null
  isCombined: boolean
  combinedSlots?: DaySlot[]
  date: string
  attendance?: AttendanceRecord
  isExtraClass: boolean
  extraClass?: ExtraClass
}

const TodayScheduleItem: React.FC<TodayScheduleItemProps> = ({
  timeSlot,
  subject,
  daySlot,
  isCombined,
  combinedSlots,
  date,
  attendance,
  isExtraClass,
  extraClass
}) => {
  const [selectedSubject, setSelectedSubject] = useState(
    attendance?.actualSubjectId || subject?.id || ''
  )
  const [attendanceStatus, setAttendanceStatus] = useState<'attended' | 'missed' | 'cancelled'>(
    attendance?.status || 'attended'
  )
  const [isVerified, setIsVerified] = useState(attendance?.isVerified || false)
  const [hasAutoSaved, setHasAutoSaved] = useState(false) // Track if we've auto-saved

  const { subjects, timeSlots } = useTimetable() // Also get timeSlots
  const { markAttendance, updateAttendance, removeExtraClass } = useSchedule()

  // Auto-save default attendance status when component mounts and there's no existing attendance
  useEffect(() => {
    const autoSaveDefaultAttendance = async () => {
      // Only auto-save if this is a new item (no existing attendance), we haven't auto-saved yet,
      // and we have the required data
      if (!attendance && !hasAutoSaved && subject && timeSlot && daySlot) {
        const attendanceData = {
          date,
          timeSlotId: timeSlot.id,
          originalSubjectId: subject.id,
          actualSubjectId: subject.id,
          status: 'attended' as 'attended', // Default to attended with correct type
          isVerified: false
        }

        try {
          await markAttendance(attendanceData)
          setHasAutoSaved(true) // Mark that we've auto-saved
        } catch (error) {
          console.error('Failed to auto-save default attendance:', error)
        }
      }
    }

    autoSaveDefaultAttendance()
  }, [attendance, hasAutoSaved, subject, timeSlot, daySlot, date, markAttendance])

  const handleSaveAttendance = async () => {
    const attendanceData = {
      date,
      timeSlotId: timeSlot.id,
      originalSubjectId: subject?.id,
      actualSubjectId: selectedSubject || subject?.id,
      status: attendanceStatus,
      isVerified: selectedSubject !== subject?.id || isVerified
    }

    if (attendance) {
      await updateAttendance(attendance.id, attendanceData)
    } else {
      await markAttendance(attendanceData)
    }
  }

  const handleStatusChange = async (newStatus: 'attended' | 'missed' | 'cancelled') => {
    setAttendanceStatus(newStatus)
    
    const attendanceData = {
      date,
      timeSlotId: timeSlot.id,
      originalSubjectId: subject?.id,
      actualSubjectId: selectedSubject || subject?.id,
      status: newStatus,
      isVerified: selectedSubject !== subject?.id || isVerified
    }

    if (attendance) {
      await updateAttendance(attendance.id, attendanceData)
    } else {
      await markAttendance(attendanceData)
    }
  }

  const handleSubjectChange = async (newSubjectId: string) => {
    setSelectedSubject(newSubjectId)
    setIsVerified(true)
    
    const attendanceData = {
      date,
      timeSlotId: timeSlot.id,
      originalSubjectId: subject?.id,
      actualSubjectId: newSubjectId,
      status: attendanceStatus,
      isVerified: true
    }

    if (attendance) {
      await updateAttendance(attendance.id, attendanceData)
    } else {
      await markAttendance(attendanceData)
    }
  }

  const handleDeleteExtraClass = async () => {
    if (extraClass) {
      await removeExtraClass(extraClass.id)
    }
  }

  const getTimeRange = () => {
    if (isCombined && combinedSlots) {
      const allTimeSlots = combinedSlots
        .map(cs => timeSlots.find(ts => ts.id === cs.timeSlotId))
        .filter(Boolean)
        .sort((a, b) => a!.startTime.localeCompare(b!.startTime))
      
      if (allTimeSlots.length > 0) {
        return `${allTimeSlots[0]!.startTime} - ${allTimeSlots[allTimeSlots.length - 1]!.endTime}`
      }
    }
    
    return `${timeSlot.startTime} - ${timeSlot.endTime}`
  }

  const getStatusColor = () => {
    switch (attendanceStatus) {
      case 'attended':
        return 'bg-green-500/10 border-green-500/20'
      case 'missed':
        return 'bg-red-500/10 border-red-500/20'
      case 'cancelled':
        return 'bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusIcon = () => {
    switch (attendanceStatus) {
      case 'attended':
        return <Check className="h-4 w-4 text-green-500" />
      case 'missed':
        return <X className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  if (!subject) return null

  return (
    <Card className={`transition-colors ${getStatusColor()}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm">{getTimeRange()}</span>
              {isExtraClass && (
                <Badge variant="secondary" className="text-xs">
                  Extra
                </Badge>
              )}
              {isCombined && (
                <Badge variant="outline" className="text-xs">
                  Combined
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Subject Selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[100px]">
                  Scheduled:
                </span>
                <div 
                  className="px-2 py-1 rounded text-xs font-medium border min-w-0 truncate"
                  style={{ 
                    backgroundColor: subject.color + '20',
                    color: subject.color,
                    borderColor: subject.color + '40'
                  }}
                >
                  {subject.name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[100px]">
                  Actual:
                </span>
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="w-32 text-xs h-7">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj) => (
                      <SelectItem key={subj.id} value={subj.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="truncate">{subj.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedSubject !== subject.id && (
                  <Badge variant="outline" className="text-xs">
                    Changed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* Attendance Status Buttons */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={attendanceStatus === 'attended' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('attended')}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Attended
              </Button>
              <Button
                size="sm"
                variant={attendanceStatus === 'missed' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('missed')}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Missed
              </Button>
              <Button
                size="sm"
                variant={attendanceStatus === 'cancelled' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('cancelled')}
                className="h-7 px-2 text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Cancelled
              </Button>
            </div>

            {/* Extra Class Actions */}
            {isExtraClass && (
              <div className="flex gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Extra Class</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this extra class? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteExtraClass}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs text-muted-foreground capitalize">
                {attendanceStatus}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TodayScheduleItem