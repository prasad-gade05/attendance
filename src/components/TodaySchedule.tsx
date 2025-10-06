import React, { useState, useEffect } from 'react'
import { format, parseISO, getDay } from 'date-fns'
import { Calendar, Clock, BookOpen, Plus, Settings, BarChart3, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar as CalendarComponent } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useTimetable } from '../hooks/useTimetable'
import { useSchedule } from '../hooks/useSchedule'
import { Subject, TimeSlot, DaySlot, AttendanceRecord, ExtraClass } from '../types'
import TodayScheduleItem from './TodayScheduleItem'
import ExtraClassDialog from './ExtraClassDialog'
import TermSettingsDialog from './TermSettingsDialog'
import AttendanceStatsPanel from './AttendanceStatsPanel'
import SimulationDialog from './SimulationDialog'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TodaySchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showExtraClassDialog, setShowExtraClassDialog] = useState(false)
  const [showTermSettings, setShowTermSettings] = useState(false)
  const [showAttendanceStats, setShowAttendanceStats] = useState(false)
  const [showSimulationDialog, setShowSimulationDialog] = useState(false)
  
  const { subjects, timeSlots, daySlots, combinedSlots } = useTimetable()
  const {
    attendanceRecords,
    specialDates,
    extraClasses,
    termSettings,
    getAttendanceForDate,
    getExtraClassesForDate,
    isSpecialDate,
    isDateInTerm,
    addSpecialDate,
    removeSpecialDate
  } = useSchedule()

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayName = DAYS[getDay(selectedDate)]
  const todayAttendance = getAttendanceForDate(selectedDateString)
  const todayExtraClasses = getExtraClassesForDate(selectedDateString)
  const specialDate = isSpecialDate(selectedDateString)
  const dateInTerm = isDateInTerm(selectedDateString)

  // Get scheduled lectures for the selected day
  const getScheduledLectures = () => {
    if (specialDate || !dateInTerm) {
      return []
    }

    const lectures: Array<{
      timeSlot: TimeSlot
      subject: Subject | null
      daySlot: DaySlot
      isCombined: boolean
      combinedSlots?: DaySlot[]
    }> = []

    // Get regular time slots (exclude extra class time slots)
    timeSlots
      .filter(timeSlot => !timeSlot.id.startsWith('extra-')) // Exclude extra class time slots
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach(timeSlot => {
        const daySlot = daySlots.find(ds => ds.timeSlotId === timeSlot.id && ds.day === selectedDayName)
        if (!daySlot) return

        // Check if this slot is part of a combined slot
        const combinedSlot = combinedSlots.find(cs => 
          cs.day === selectedDayName && cs.daySlotIds.includes(daySlot.id)
        )

        if (combinedSlot) {
          // Only add the first slot of a combined slot
          const firstDaySlotId = combinedSlot.daySlotIds
            .map(id => daySlots.find(ds => ds.id === id))
            .filter(Boolean)
            .sort((a, b) => {
              const aTimeSlot = timeSlots.find(ts => ts.id === a!.timeSlotId)
              const bTimeSlot = timeSlots.find(ts => ts.id === b!.timeSlotId)
              return aTimeSlot!.startTime.localeCompare(bTimeSlot!.startTime)
            })[0]?.id

          if (daySlot.id === firstDaySlotId) {
            const subject = subjects.find(s => s.id === combinedSlot.subjectId)
            const allCombinedSlots = combinedSlot.daySlotIds
              .map(id => daySlots.find(ds => ds.id === id))
              .filter(Boolean) as DaySlot[]

            lectures.push({
              timeSlot,
              subject: subject || null,
              daySlot,
              isCombined: true,
              combinedSlots: allCombinedSlots
            })
          }
        } else if (daySlot.subjectId) {
          const subject = subjects.find(s => s.id === daySlot.subjectId)
          lectures.push({
            timeSlot,
            subject: subject || null,
            daySlot,
            isCombined: false
          })
        }
      })

    return lectures
  }

  const scheduledLectures = getScheduledLectures()

  const toggleSpecialDate = async (type: 'holiday' | 'exam') => {
    if (specialDate) {
      await removeSpecialDate(specialDate.id)
    } else {
      await addSpecialDate({
        date: selectedDateString,
        type,
        description: type === 'holiday' ? 'Holiday' : 'Exam'
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Today's Schedule</h1>
            <p className="text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM do, yyyy')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSimulationDialog(true)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Simulate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAttendanceStats(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTermSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Term Settings
            </Button>
          </div>
        </div>

        {/* Date Selection and Status */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            {specialDate && (
              <Badge variant="destructive">
                {specialDate.type === 'holiday' ? 'Holiday' : 'Exam'}
              </Badge>
            )}
            
            {!dateInTerm && (
              <Badge variant="secondary">
                Outside Term
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSpecialDate('holiday')}
              className={specialDate?.type === 'holiday' ? 'bg-red-100' : ''}
            >
              Mark Holiday
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSpecialDate('exam')}
              className={specialDate?.type === 'exam' ? 'bg-red-100' : ''}
            >
              Mark Exam
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule for {format(selectedDate, 'EEEE')}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowExtraClassDialog(true)}
                disabled={specialDate !== null || !dateInTerm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extra Class
              </Button>
            </CardHeader>
            <CardContent>
              {specialDate ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No schedule - {specialDate.type === 'holiday' ? 'Holiday' : 'Exam Day'}
                  </div>
                  {specialDate.description && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {specialDate.description}
                    </div>
                  )}
                </div>
              ) : !dateInTerm ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Date is outside the current term period
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Regular scheduled lectures */}
                  {scheduledLectures.length === 0 && todayExtraClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No lectures scheduled for this day
                    </div>
                  ) : (
                    <>
                      {scheduledLectures.map((lecture, index) => (
                        <TodayScheduleItem
                          key={`regular-${lecture.daySlot.id}`}
                          timeSlot={lecture.timeSlot}
                          subject={lecture.subject}
                          daySlot={lecture.daySlot}
                          isCombined={lecture.isCombined}
                          combinedSlots={lecture.combinedSlots}
                          date={selectedDateString}
                          attendance={todayAttendance.find(a => a.timeSlotId === lecture.timeSlot.id)}
                          isExtraClass={false}
                        />
                      ))}
                      
                      {/* Extra classes */}
                      {todayExtraClasses.map((extraClass) => {
                        const timeSlot = timeSlots.find(ts => ts.id === extraClass.timeSlotId)
                        const subject = subjects.find(s => s.id === extraClass.subjectId)
                        
                        if (!timeSlot || !subject) return null
                        
                        return (
                          <TodayScheduleItem
                            key={`extra-${extraClass.id}`}
                            timeSlot={timeSlot}
                            subject={subject}
                            daySlot={null}
                            isCombined={false}
                            date={selectedDateString}
                            attendance={todayAttendance.find(a => a.timeSlotId === timeSlot.id)}
                            isExtraClass={true}
                            extraClass={extraClass}
                          />
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          {dateInTerm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Lectures Today:</span>
                    <span className="font-medium">
                      {scheduledLectures.length + todayExtraClasses.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attended:</span>
                    <span className="font-medium text-green-600">
                      {todayAttendance.filter(a => a.status === 'attended').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed:</span>
                    <span className="font-medium text-red-600">
                      {todayAttendance.filter(a => a.status === 'missed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancelled:</span>
                    <span className="font-medium text-yellow-600">
                      {todayAttendance.filter(a => a.status === 'cancelled').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Term Information */}
          {termSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Current Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-medium">
                      {format(parseISO(termSettings.startDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span className="font-medium">
                      {format(parseISO(termSettings.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ExtraClassDialog
        open={showExtraClassDialog}
        onOpenChange={setShowExtraClassDialog}
        selectedDate={selectedDateString}
      />
      
      <TermSettingsDialog
        open={showTermSettings}
        onOpenChange={setShowTermSettings}
      />
      
      <AttendanceStatsPanel
        open={showAttendanceStats}
        onOpenChange={setShowAttendanceStats}
      />
      
      <SimulationDialog
        open={showSimulationDialog}
        onOpenChange={setShowSimulationDialog}
      />
    </div>
  )
}

export default TodaySchedule