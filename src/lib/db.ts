import Dexie, { Table } from 'dexie'
import { Subject, TimeSlot, DaySlot, CombinedSlot } from '../types'

export interface StoredSubject extends Subject {}
export interface StoredTimeSlot extends TimeSlot {}
export interface StoredDaySlot extends DaySlot {}
export interface StoredCombinedSlot extends CombinedSlot {}

class TimetableDatabase extends Dexie {
  subjects!: Table<StoredSubject, string>
  timeSlots!: Table<StoredTimeSlot, string>
  daySlots!: Table<StoredDaySlot, string>
  combinedSlots!: Table<StoredCombinedSlot, string>

  constructor() {
    super('TimetableDatabase')
    this.version(2).stores({
      subjects: 'id, name',
      timeSlots: 'id, startTime, endTime',
      daySlots: 'id, timeSlotId, day, subjectId',
      combinedSlots: 'id, day, subjectId'
    })
  }

  async clearAllData() {
    await this.transaction('rw', this.subjects, this.timeSlots, this.daySlots, this.combinedSlots, async () => {
      await this.subjects.clear()
      await this.timeSlots.clear()
      await this.daySlots.clear()
      await this.combinedSlots.clear()
    })
  }
}

export const db = new TimetableDatabase()