export interface Subject {
  id: string
  name: string
  color: string
}

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
}

export interface DaySlot {
  id: string
  timeSlotId: string
  day: string
  subjectId?: string
}

export interface CombinedSlot {
  id: string
  daySlotIds: string[] // IDs of day slots that are combined
  subjectId: string
  day: string
}

// New types for attendance tracking
export interface AttendanceRecord {
  id: string
  date: string // YYYY-MM-DD format
  timeSlotId: string
  originalSubjectId?: string // Original subject from timetable
  actualSubjectId?: string // Actual subject conducted
  status: 'attended' | 'missed' | 'cancelled'
  isVerified: boolean // Whether user verified the actual subject conducted
}

export interface SpecialDate {
  id: string
  date: string // YYYY-MM-DD format
  type: 'holiday' | 'exam'
  description?: string
}

export interface ExtraClass {
  id: string
  date: string // YYYY-MM-DD format
  timeSlotId: string
  subjectId: string
  description?: string
}

export interface TermSettings {
  id: string
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
  isActive: boolean
}

export interface AttendanceStats {
  subjectId: string
  totalLectures: number // Total lectures that should have been conducted
  attendedLectures: number // Lectures marked as attended
  missedLectures: number // Lectures marked as missed
  cancelledLectures: number // Lectures marked as cancelled
}

// Add the new interface for imported attendance
export interface ImportedAttendance {
  id: string
  subjectId: string
  importDate: string // YYYY-MM-DD format
  totalLectures: number
  attendedLectures: number
  missedLectures: number
  cancelledLectures: number
}