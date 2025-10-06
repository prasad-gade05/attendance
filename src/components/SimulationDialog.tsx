import React, { useState, useEffect } from 'react'
import { BarChart3, Target, Calendar, BookOpen, Calculator } from 'lucide-react'
import { format, parseISO, eachDayOfInterval, isWithinInterval, getDay, isAfter, isBefore, isEqual } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useTimetable } from '../hooks/useTimetable'
import { useSchedule } from '../hooks/useSchedule'
import { Subject, AttendanceStats } from '../types'

interface SimulationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SubjectSimulationData {
  subject: Subject
  currentStats: AttendanceStats
  targetPercentage: number
  futureLectures: number
  lecturesToAttend: number
  lecturesToSkip: number
  maxPossiblePercentage: number
  minPossiblePercentage: number
  isTargetAchievable: boolean
  errorMessage?: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SimulationDialog: React.FC<SimulationDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [simulationData, setSimulationData] = useState<SubjectSimulationData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { subjects, timeSlots, daySlots, combinedSlots } = useTimetable()
  const { 
    attendanceRecords, 
    specialDates, 
    extraClasses,
    termSettings, 
    getAttendanceStats,
    isDateInTerm 
  } = useSchedule()

  useEffect(() => {
    if (open) {
      calculateSimulationData()
    }
  }, [open, attendanceRecords, termSettings, specialDates, extraClasses, subjects.length, timeSlots.length, daySlots.length, combinedSlots.length])

  const calculateSimulationData = async () => {
    if (!termSettings) {
      setError('Please set up term dates to use the simulation feature')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const todayDate = new Date()
      const termEndDate = parseISO(termSettings.endDate)
      
      // If term has already ended, show appropriate message
      if (isBefore(termEndDate, todayDate)) {
        setError('The term has already ended. No future lectures to simulate.')
        setSimulationData([])
        return
      }

      // Calculate current attendance stats similar to AttendanceStatsPanel
      const statsMap: { [key: string]: AttendanceStats } = {}
      
      // Initialize stats for all subjects
      subjects.forEach(subject => {
        statsMap[subject.id] = {
          subjectId: subject.id,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0
        }
      })

      // Calculate total lectures that should have happened
      const termStart = parseISO(termSettings.startDate)
      const termEnd = parseISO(termSettings.endDate)
      const today = new Date()
      const calculationEnd = today < termEnd ? today : termEnd

      // Get all days in the term up to today
      const allDays = eachDayOfInterval({ start: termStart, end: calculationEnd })

      for (const date of allDays) {
        const dateString = format(date, 'yyyy-MM-dd')
        const dayName = DAYS[getDay(date)]
        
        // Skip special dates (holidays/exams)
        const isSpecial = specialDates.some(sd => sd.date === dateString)
        if (isSpecial) continue

        // Get scheduled lectures for this day
        const dayLectures = daySlots.filter(ds => 
          ds.day === dayName && ds.subjectId
        )

        // Process regular lectures
        for (const daySlot of dayLectures) {
          // Check if this slot is part of a combined slot
          const combinedSlot = combinedSlots.find(cs => 
            cs.day === dayName && cs.daySlotIds.includes(daySlot.id)
          )

          let subjectId = daySlot.subjectId!
          let shouldCount = true

          if (combinedSlot) {
            // Only count the first slot of a combined slot
            const firstDaySlotId = combinedSlot.daySlotIds
              .map(id => daySlots.find(ds => ds.id === id))
              .filter(Boolean)
              .sort((a, b) => {
                const aTimeSlot = timeSlots.find(ts => ts.id === a!.timeSlotId)
                const bTimeSlot = timeSlots.find(ts => ts.id === b!.timeSlotId)
                return aTimeSlot!.startTime.localeCompare(bTimeSlot!.startTime)
              })[0]?.id

            shouldCount = daySlot.id === firstDaySlotId
            subjectId = combinedSlot.subjectId
          }

          if (shouldCount) {
            // Check if there's an attendance record for this lecture
            const attendanceRecord = attendanceRecords.find(ar => 
              ar.date === dateString && ar.timeSlotId === daySlot.timeSlotId
            )

            if (attendanceRecord) {
              const actualSubjectId = attendanceRecord.actualSubjectId || attendanceRecord.originalSubjectId || subjectId
              
              if (attendanceRecord.status !== 'cancelled') {
                statsMap[actualSubjectId].totalLectures++
                
                if (attendanceRecord.status === 'attended') {
                  statsMap[actualSubjectId].attendedLectures++
                } else if (attendanceRecord.status === 'missed') {
                  statsMap[actualSubjectId].missedLectures++
                }
              } else {
                statsMap[actualSubjectId].cancelledLectures++
              }
            } else {
              // No attendance record - count as total lecture but not attended/missed
              statsMap[subjectId].totalLectures++
            }
          }
        }
      }

      // Process extra classes
      extraClasses.forEach(extraClass => {
        // Only count extra classes that are within the term
        if (isDateInTerm(extraClass.date)) {
          const subjectId = extraClass.subjectId;
          
          // Initialize stats for this subject if not already present
          if (!statsMap[subjectId]) {
            statsMap[subjectId] = {
              subjectId: subjectId,
              totalLectures: 0,
              attendedLectures: 0,
              missedLectures: 0,
              cancelledLectures: 0
            }
          }
          
          // Check if there's an attendance record for this extra class
          const attendanceRecord = attendanceRecords.find(ar => 
            ar.date === extraClass.date && ar.timeSlotId === extraClass.timeSlotId
          )
          
          if (attendanceRecord) {
            // Use the actual attendance record status
            if (attendanceRecord.status !== 'cancelled') {
              statsMap[subjectId].totalLectures++
              
              if (attendanceRecord.status === 'attended') {
                statsMap[subjectId].attendedLectures++
              } else if (attendanceRecord.status === 'missed') {
                statsMap[subjectId].missedLectures++
              }
            } else {
              statsMap[subjectId].cancelledLectures++
            }
          } else {
            // No attendance record - count as total lecture and attended by default
            statsMap[subjectId].totalLectures++
            statsMap[subjectId].attendedLectures++
          }
        }
      })

      // Calculate future lectures for each subject
      const simulationResults: SubjectSimulationData[] = []
      
      for (const subject of subjects) {
        const subjectCurrentStats = statsMap[subject.id] || {
          subjectId: subject.id,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0
        }

        // Calculate future lectures from today to term end
        const futureLectures = await calculateFutureLectures(
          subject.id,
          todayDate,
          termEndDate
        )

        // Initialize with 0% target (will be updated by user)
        const simulation: SubjectSimulationData = {
          subject,
          currentStats: subjectCurrentStats,
          targetPercentage: 0,
          futureLectures,
          lecturesToAttend: 0,
          lecturesToSkip: 0,
          maxPossiblePercentage: 0,
          minPossiblePercentage: 0,
          isTargetAchievable: true
        }

        // Calculate max and min possible percentages
        if (futureLectures > 0) {
          const maxTotal = subjectCurrentStats.totalLectures + futureLectures
          const maxAttended = subjectCurrentStats.attendedLectures + futureLectures
          const minAttended = subjectCurrentStats.attendedLectures
          
          simulation.maxPossiblePercentage = maxTotal > 0 ? Math.round((maxAttended / maxTotal) * 100) : 0
          simulation.minPossiblePercentage = maxTotal > 0 ? Math.round((minAttended / maxTotal) * 100) : 0
        }

        simulationResults.push(simulation)
      }

      setSimulationData(simulationResults)
    } catch (err) {
      console.error('Failed to calculate simulation data:', err)
      setError('Failed to calculate simulation data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateFutureLectures = async (subjectId: string, fromDate: Date, toDate: Date): Promise<number> => {
    if (!termSettings) return 0

    const termStart = parseISO(termSettings.startDate)
    const termEnd = parseISO(termSettings.endDate)
    
    // Adjust the calculation period to be within the term
    const calculationStart = isAfter(fromDate, termStart) ? fromDate : termStart
    const calculationEnd = isBefore(toDate, termEnd) ? toDate : termEnd

    // If start date is after end date, no future lectures
    if (isAfter(calculationStart, calculationEnd)) {
      return 0
    }

    // Get all days in the future period
    const allDays = eachDayOfInterval({ start: calculationStart, end: calculationEnd })

    let futureLectureCount = 0

    for (const date of allDays) {
      const dateString = format(date, 'yyyy-MM-dd')
      const dayName = DAYS[getDay(date)]
      
      // Skip special dates (holidays/exams)
      const isSpecial = specialDates.some(sd => sd.date === dateString)
      if (isSpecial) continue

      // Get scheduled lectures for this day and subject
      const dayLectures = daySlots.filter(ds => 
        ds.day === dayName && ds.subjectId === subjectId
      )

      // Process regular lectures
      for (const daySlot of dayLectures) {
        // Check if this slot is part of a combined slot
        const combinedSlot = combinedSlots.find(cs => 
          cs.day === dayName && cs.daySlotIds.includes(daySlot.id)
        )

        let shouldCount = true

        if (combinedSlot) {
          // Only count the first slot of a combined slot
          const firstDaySlotId = combinedSlot.daySlotIds
            .map(id => daySlots.find(ds => ds.id === id))
            .filter(Boolean)
            .sort((a, b) => {
              const aTimeSlot = timeSlots.find(ts => ts.id === a!.timeSlotId)
              const bTimeSlot = timeSlots.find(ts => ts.id === b!.timeSlotId)
              return aTimeSlot!.startTime.localeCompare(bTimeSlot!.startTime)
            })[0]?.id

          shouldCount = daySlot.id === firstDaySlotId
        }

        if (shouldCount) {
          futureLectureCount++
        }
      }
    }

    // Add future extra classes for this subject
    const futureExtraClasses = extraClasses.filter(extraClass => {
      const extraClassDate = parseISO(extraClass.date)
      return (
        extraClass.subjectId === subjectId &&
        (isAfter(extraClassDate, fromDate) || isEqual(extraClassDate, fromDate)) &&
        isDateInTerm(extraClass.date)
      )
    })

    futureLectureCount += futureExtraClasses.length

    return futureLectureCount
  }

  const updateTargetPercentage = (subjectId: string, percentage: number) => {
    setSimulationData(prev => prev.map(data => {
      if (data.subject.id === subjectId) {
        // Validate percentage input
        const validPercentage = Math.min(100, Math.max(0, percentage || 0))
        
        // Calculate required lectures to attend
        const { 
          lecturesToAttend, 
          lecturesToSkip, 
          isTargetAchievable, 
          errorMessage 
        } = calculateRequiredLectures(data, validPercentage)
        
        return {
          ...data,
          targetPercentage: validPercentage,
          lecturesToAttend,
          lecturesToSkip,
          isTargetAchievable,
          errorMessage
        }
      }
      return data
    }))
  }

  const calculateRequiredLectures = (
    data: SubjectSimulationData, 
    targetPercentage: number
  ): { 
    lecturesToAttend: number, 
    lecturesToSkip: number, 
    isTargetAchievable: boolean,
    errorMessage?: string
  } => {
    const { currentStats, futureLectures } = data
    
    // If no future lectures, check if target is already met
    if (futureLectures === 0) {
      const currentPercentage = currentStats.totalLectures > 0 
        ? Math.round((currentStats.attendedLectures / currentStats.totalLectures) * 100)
        : 0
      
      if (currentPercentage >= targetPercentage) {
        return {
          lecturesToAttend: 0,
          lecturesToSkip: 0,
          isTargetAchievable: true
        }
      } else {
        return {
          lecturesToAttend: 0,
          lecturesToSkip: 0,
          isTargetAchievable: false,
          errorMessage: 'No future lectures available to achieve target'
        }
      }
    }

    // Calculate required attended lectures to meet target
    const totalLectures = currentStats.totalLectures + futureLectures
    const requiredAttended = Math.ceil((targetPercentage / 100) * totalLectures)
    const additionalNeeded = requiredAttended - currentStats.attendedLectures
    
    // Check if target is achievable
    if (additionalNeeded <= 0) {
      // Target already achievable even if all future lectures are missed
      return {
        lecturesToAttend: 0,
        lecturesToSkip: futureLectures,
        isTargetAchievable: true
      }
    }
    
    if (additionalNeeded > futureLectures) {
      // Target not achievable even if all future lectures are attended
      return {
        lecturesToAttend: futureLectures,
        lecturesToSkip: 0,
        isTargetAchievable: false,
        errorMessage: `Target of ${targetPercentage}% is not achievable. Maximum possible is ${data.maxPossiblePercentage}%.`
      }
    }
    
    // Target is achievable
    return {
      lecturesToAttend: additionalNeeded,
      lecturesToSkip: futureLectures - additionalNeeded,
      isTargetAchievable: true
    }
  }

  const getCurrentAttendancePercentage = (stat: AttendanceStats) => {
    if (stat.totalLectures === 0) return 0
    return Math.round((stat.attendedLectures / stat.totalLectures) * 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Attendance Simulation
          </DialogTitle>
        </DialogHeader>

        {!termSettings ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Please set up term dates to use the simulation feature
            </p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Calculating simulation data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Set Your Attendance Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Enter your target attendance percentage for each subject. The system will calculate how many future lectures you need to attend to achieve your goal.
                </p>
              </CardContent>
            </Card>

            {simulationData.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No subjects available for simulation
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {simulationData.map((data) => {
                  const currentPercentage = getCurrentAttendancePercentage(data.currentStats)
                  
                  return (
                    <Card key={data.subject.id}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: data.subject.color }}
                            />
                            <CardTitle className="text-lg">{data.subject.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Current</div>
                              <div className="text-xl font-bold">{currentPercentage}%</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Target</div>
                              <div className="text-xl font-bold">{data.targetPercentage}%</div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Target Attendance Percentage
                            </label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={data.targetPercentage || ''}
                                onChange={(e) => updateTargetPercentage(data.subject.id, parseInt(e.target.value) || 0)}
                                className="w-24"
                              />
                              <span className="flex items-center">%</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            {!data.isTargetAchievable && data.errorMessage && (
                              <Alert variant="destructive" className="py-2">
                                <AlertDescription>{data.errorMessage}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{data.currentStats.totalLectures}</div>
                            <div className="text-muted-foreground">Current Lectures</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{data.currentStats.attendedLectures}</div>
                            <div className="text-muted-foreground">Attended</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{data.futureLectures}</div>
                            <div className="text-muted-foreground">Future Lectures</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600">
                              {data.currentStats.totalLectures + data.futureLectures}
                            </div>
                            <div className="text-muted-foreground">Total Possible</div>
                          </div>
                        </div>
                        
                        {data.targetPercentage > 0 && (
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Required Action</span>
                                <span>
                                  {data.lecturesToAttend} to attend, {data.lecturesToSkip} to skip
                                </span>
                              </div>
                              <Progress 
                                value={data.futureLectures > 0 ? (data.lecturesToAttend / data.futureLectures) * 100 : 0} 
                                className="h-2"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="font-bold text-green-600 text-lg">{data.lecturesToAttend}</div>
                                <div className="text-sm text-muted-foreground">Lectures to Attend</div>
                              </div>
                              <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="font-bold text-red-600 text-lg">{data.lecturesToSkip}</div>
                                <div className="text-sm text-muted-foreground">Lectures to Skip</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Max Possible: {data.maxPossiblePercentage}%</span>
                              <span>Min Possible: {data.minPossiblePercentage}%</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SimulationDialog