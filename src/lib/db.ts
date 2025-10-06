import Dexie, { Table } from 'dexie'
import { Subject, TimeSlot, DaySlot, CombinedSlot, AttendanceRecord, SpecialDate, ExtraClass, TermSettings, ImportedAttendance } from '../types'

export interface StoredSubject extends Subject {}
export interface StoredTimeSlot extends TimeSlot {}
export interface StoredDaySlot extends DaySlot {}
export interface StoredCombinedSlot extends CombinedSlot {}
export interface StoredAttendanceRecord extends AttendanceRecord {}
export interface StoredSpecialDate extends SpecialDate {}
export interface StoredExtraClass extends ExtraClass {}
export interface StoredTermSettings extends TermSettings {}
export interface StoredImportedAttendance extends ImportedAttendance {}

class TimetableDatabase extends Dexie {
  subjects!: Table<StoredSubject, string>
  timeSlots!: Table<StoredTimeSlot, string>
  daySlots!: Table<StoredDaySlot, string>
  combinedSlots!: Table<StoredCombinedSlot, string>
  attendanceRecords!: Table<StoredAttendanceRecord, string>
  specialDates!: Table<StoredSpecialDate, string>
  extraClasses!: Table<StoredExtraClass, string>
  termSettings!: Table<StoredTermSettings, string>
  importedAttendance!: Table<StoredImportedAttendance, string>

  constructor() {
    super('TimetableDatabase')
    
    // Version 3 (original)
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
    
    // Version 4 (current) - same schema but with improved handling
    this.version(4).stores({
      subjects: 'id, name',
      timeSlots: 'id, startTime, endTime',
      daySlots: 'id, timeSlotId, day, subjectId',
      combinedSlots: 'id, day, subjectId',
      attendanceRecords: 'id, date, timeSlotId, originalSubjectId, actualSubjectId, status',
      specialDates: 'id, date, type',
      extraClasses: 'id, date, timeSlotId, subjectId',
      termSettings: 'id, startDate, endDate, isActive'
    }).upgrade(trans => {
      console.log('🔥 TimetableDatabase: Upgrading to version 4')
      // Data migration if needed
      return trans.table('termSettings').toCollection().modify(termSetting => {
        console.log('🔥 TimetableDatabase: Processing term setting during upgrade:', termSetting)
        // Ensure all term settings have the required fields
        if (!termSetting.hasOwnProperty('isActive')) {
          termSetting.isActive = true
        }
      })
    })

    // Version 5 - add importedAttendance table
    this.version(5).stores({
      subjects: 'id, name',
      timeSlots: 'id, startTime, endTime',
      daySlots: 'id, timeSlotId, day, subjectId',
      combinedSlots: 'id, day, subjectId',
      attendanceRecords: 'id, date, timeSlotId, originalSubjectId, actualSubjectId, status',
      specialDates: 'id, date, type',
      extraClasses: 'id, date, timeSlotId, subjectId',
      termSettings: 'id, startDate, endDate, isActive',
      importedAttendance: 'id, subjectId, importDate'
    })

    this.on('ready', function() {
      console.log('🔥 TimetableDatabase: Database ready')
      return db.debugDatabaseState()
    })

    this.on('populate', function() {
      console.log('🔥 TimetableDatabase: Database populated (first time)')
    })
  }

  async clearAllData() {
    console.log('🔥 TimetableDatabase: clearAllData called')
    // Clear tables in batches to avoid exceeding transaction argument limit
    await this.transaction('rw', this.subjects, this.timeSlots, this.daySlots, async () => {
      console.log('🔥 TimetableDatabase: Clearing first batch of tables')
      await this.subjects.clear()
      await this.timeSlots.clear()
      await this.daySlots.clear()
    })
    
    await this.transaction('rw', this.combinedSlots, this.attendanceRecords, this.specialDates, async () => {
      console.log('🔥 TimetableDatabase: Clearing second batch of tables')
      await this.combinedSlots.clear()
      await this.attendanceRecords.clear()
      await this.specialDates.clear()
    })
    
    await this.transaction('rw', this.extraClasses, this.termSettings, this.importedAttendance, async () => {
      console.log('🔥 TimetableDatabase: Clearing third batch of tables')
      await this.extraClasses.clear()
      await this.termSettings.clear()
      await this.importedAttendance.clear()
      console.log('🔥 TimetableDatabase: All tables cleared')
    })
  }

  async debugDatabaseState() {
    console.log('🔥 TimetableDatabase: Database state debug:')
    const subjects = await this.subjects.toArray()
    const timeSlots = await this.timeSlots.toArray()
    const daySlots = await this.daySlots.toArray()
    const combinedSlots = await this.combinedSlots.toArray()
    const attendanceRecords = await this.attendanceRecords.toArray()
    const specialDates = await this.specialDates.toArray()
    const extraClasses = await this.extraClasses.toArray()
    const termSettings = await this.termSettings.toArray()
    const importedAttendance = await this.importedAttendance.toArray()
    
    console.log('🔥 TimetableDatabase: - subjects:', subjects.length)
    console.log('🔥 TimetableDatabase: - timeSlots:', timeSlots.length)
    console.log('🔥 TimetableDatabase: - daySlots:', daySlots.length)
    console.log('🔥 TimetableDatabase: - combinedSlots:', combinedSlots.length)
    console.log('🔥 TimetableDatabase: - attendanceRecords:', attendanceRecords.length)
    console.log('🔥 TimetableDatabase: - specialDates:', specialDates.length)
    console.log('🔥 TimetableDatabase: - extraClasses:', extraClasses.length)
    console.log('🔥 TimetableDatabase: - termSettings:', termSettings)
    console.log('🔥 TimetableDatabase: - importedAttendance:', importedAttendance.length)
    
    return {
      subjects, timeSlots, daySlots, combinedSlots,
      attendanceRecords, specialDates, extraClasses, termSettings, importedAttendance
    }
  }
}

export const db = new TimetableDatabase()