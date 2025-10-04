import Dexie, { Table } from 'dexie'
import { Subject, TimeSlot, DaySlot, CombinedSlot, AttendanceRecord, SpecialDate, ExtraClass, TermSettings } from '../types'

export interface StoredSubject extends Subject {}
export interface StoredTimeSlot extends TimeSlot {}
export interface StoredDaySlot extends DaySlot {}
export interface StoredCombinedSlot extends CombinedSlot {}
export interface StoredAttendanceRecord extends AttendanceRecord {}
export interface StoredSpecialDate extends SpecialDate {}
export interface StoredExtraClass extends ExtraClass {}
export interface StoredTermSettings extends TermSettings {}

class TimetableDatabase extends Dexie {
  subjects!: Table<StoredSubject, string>
  timeSlots!: Table<StoredTimeSlot, string>
  daySlots!: Table<StoredDaySlot, string>
  combinedSlots!: Table<StoredCombinedSlot, string>
  attendanceRecords!: Table<StoredAttendanceRecord, string>
  specialDates!: Table<StoredSpecialDate, string>
  extraClasses!: Table<StoredExtraClass, string>
  termSettings!: Table<StoredTermSettings, string>

  constructor() {
    super('TimetableDatabase')
    this.version(3).stores({
      subjects: 'id, name',
      timeSlots: 'id, startTime, endTime',
      daySlots: 'id, timeSlotId, day, subjectId',
      combinedSlots: 'id, day, subjectId',
      attendanceRecords: 'id, date, timeSlotId, originalSubjectId, actualSubjectId, status',
      specialDates: 'id, date, type',
      extraClasses: 'id, date, timeSlotId, subjectId',
      termSettings: 'id, startDate, endDate, isActive'
    })
  }

  async clearAllData() {
    await this.transaction('rw', 
      this.subjects, this.timeSlots, this.daySlots, this.combinedSlots,
      this.attendanceRecords, this.specialDates, this.extraClasses, this.termSettings,
      async () => {
        await this.subjects.clear()
        await this.timeSlots.clear()
        await this.daySlots.clear()
        await this.combinedSlots.clear()
        await this.attendanceRecords.clear()
        await this.specialDates.clear()
        await this.extraClasses.clear()
        await this.termSettings.clear()
      }
    )
  }
}

export const db = new TimetableDatabase()