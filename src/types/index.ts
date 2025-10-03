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