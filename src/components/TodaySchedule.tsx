import React, { useState, useEffect } from 'react'
import { format, parseISO, getDay } from 'date-fns'
import { Calendar, Clock, BookOpen, Plus, Settings, BarChart3, Calculator, Upload } from 'lucide-react'
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
import CustomCalendar from './CustomCalendar'
import ImportAttendanceDialog from './ImportAttendanceDialog'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TodaySchedule: React.FC = () => {
  // Initialize selectedDate with time set to midnight to avoid timezone issues
  const initialDate = new Date();
  initialDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [showExtraClassDialog, setShowExtraClassDialog] = useState(false)
  const [showTermSettings, setShowTermSettings] = useState(false)
  const [showAttendanceStats, setShowAttendanceStats] = useState(false)
  const [showSimulationDialog, setShowSimulationDialog] = useState(false)
  const [showImportAttendanceDialog, setShowImportAttendanceDialog] = useState(false)
  
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
    removeSpecialDate,
    importAttendance
  } = useSchedule()

  // Add a check to ensure termSettings is loaded
  useEffect(() => {
    console.log('🔥 TodaySchedule: Term settings updated:', termSettings);
  }, [termSettings]);

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayName = DAYS[getDay(selectedDate)]
  const todayAttendance = getAttendanceForDate(selectedDateString)
  const todayExtraClasses = getExtraClassesForDate(selectedDateString)
  const specialDate = isSpecialDate(selectedDateString)
  
  // Check if date is in term, with additional logging
  const dateInTerm = (() => {
    console.log('🔥 TodaySchedule: Checking if date is in term');
    console.log('🔥 TodaySchedule: selectedDate:', selectedDate);
    console.log('🔥 TodaySchedule: selectedDateString:', selectedDateString);
    const result = isDateInTerm(selectedDateString);
    console.log(`Date ${selectedDateString} in term: ${result}, termSettings:`, termSettings);
    return result;
  })();

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

  const handleImportAttendance = async (data: {
    subjectId: string;
    importDate: string;
    totalLectures: number;
    attendedLectures: number;
    missedLectures: number;
    cancelledLectures: number;
  }) => {
    try {
      await importAttendance(data);
    } catch (error) {
      console.error('Failed to import attendance:', error);
      throw error;
    }
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      {/* Header Section - Moved all header elements together */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            {/* Removed "Today's Schedule" label as requested */}
            <h1 className="text-2xl font-bold">
              {format(selectedDate, 'EEEE')}
            </h1>
            <p className="text-muted-foreground">
              {format(selectedDate, 'MMMM do, yyyy')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportAttendanceDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
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

        {/* Term Information - Made it more minimal */}
        {termSettings && (
          <div className="text-center text-sm text-muted-foreground">
            <span className="font-medium">
              Term: {format(parseISO(termSettings.startDate), 'MMM dd')} - {format(parseISO(termSettings.endDate), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
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
                  {!termSettings && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Term settings not configured. Please set term dates in Term Settings.
                    </div>
                  )}
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
                          key={`regular-${selectedDateString}-${lecture.daySlot.id}`}
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
                            key={`extra-${selectedDateString}-${extraClass.id}`}
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

        {/* Sidebar - Calendar and Controls */}
        <div className="space-y-6">
          {/* Calendar and Date Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                {/* Calendar */}
                <div className="border rounded-lg bg-white shadow-sm">
                  <CustomCalendar 
                    selectedDate={selectedDate} 
                    onDateSelect={(date) => {
                      console.log('Date selected in CustomCalendar:', date);
                      setSelectedDate(date);
                    }} 
                  />
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap justify-center gap-2">
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
                </div>
                
                {/* Action Buttons - Moved up and removed date display */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleSpecialDate('holiday')}
                    className={specialDate?.type === 'holiday' ? 'bg-red-100 border-red-300' : ''}
                  >
                    {specialDate?.type === 'holiday' ? 'Remove Holiday' : 'Mark Holiday'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => toggleSpecialDate('exam')}
                    className={specialDate?.type === 'exam' ? 'bg-red-100 border-red-300' : ''}
                  >
                    {specialDate?.type === 'exam' ? 'Remove Exam' : 'Mark Exam'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
      
      <ImportAttendanceDialog
        open={showImportAttendanceDialog}
        onOpenChange={setShowImportAttendanceDialog}
        onImport={handleImportAttendance}
      />
    </div>
  )
}

export default TodaySchedule