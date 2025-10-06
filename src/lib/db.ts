import Dexie, { Table } from "dexie";
import {
  Subject,
  TimeSlot,
  DaySlot,
  CombinedSlot,
  AttendanceRecord,
  SpecialDate,
  ExtraClass,
  TermSettings,
  ImportedAttendance,
} from "../types";

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
  subjects!: Table<StoredSubject, string>;
  timeSlots!: Table<StoredTimeSlot, string>;
  daySlots!: Table<StoredDaySlot, string>;
  combinedSlots!: Table<StoredCombinedSlot, string>;
  attendanceRecords!: Table<StoredAttendanceRecord, string>;
  specialDates!: Table<StoredSpecialDate, string>;
  extraClasses!: Table<StoredExtraClass, string>;
  termSettings!: Table<StoredTermSettings, string>;
  importedAttendance!: Table<StoredImportedAttendance, string>;

  constructor() {
    super("TimetableDatabase");

    // Version 3 (original)
    this.version(3).stores({
      subjects: "id, name",
      timeSlots: "id, startTime, endTime",
      daySlots: "id, timeSlotId, day, subjectId",
      combinedSlots: "id, day, subjectId",
      attendanceRecords:
        "id, date, timeSlotId, originalSubjectId, actualSubjectId, status",
      specialDates: "id, date, type",
      extraClasses: "id, date, timeSlotId, subjectId",
      termSettings: "id, startDate, endDate, isActive",
    });

    // Version 4 (current) - same schema but with improved handling
    this.version(4)
      .stores({
        subjects: "id, name",
        timeSlots: "id, startTime, endTime",
        daySlots: "id, timeSlotId, day, subjectId",
        combinedSlots: "id, day, subjectId",
        attendanceRecords:
          "id, date, timeSlotId, originalSubjectId, actualSubjectId, status",
        specialDates: "id, date, type",
        extraClasses: "id, date, timeSlotId, subjectId",
        termSettings: "id, startDate, endDate, isActive",
      })
      .upgrade((trans) => {
        // Data migration if needed
        return trans
          .table("termSettings")
          .toCollection()
          .modify((termSetting) => {
            // Ensure all term settings have the required fields
            if (!termSetting.hasOwnProperty("isActive")) {
              termSetting.isActive = true;
            }
          });
      });

    // Version 5 - add importedAttendance table
    this.version(5).stores({
      subjects: "id, name",
      timeSlots: "id, startTime, endTime",
      daySlots: "id, timeSlotId, day, subjectId",
      combinedSlots: "id, day, subjectId",
      attendanceRecords:
        "id, date, timeSlotId, originalSubjectId, actualSubjectId, status",
      specialDates: "id, date, type",
      extraClasses: "id, date, timeSlotId, subjectId",
      termSettings: "id, startDate, endDate, isActive",
      importedAttendance: "id, subjectId, importDate",
    });

    this.on("ready", function () {
      return db.debugDatabaseState();
    });

    this.on("populate", function () {
      // Database populated callback
    });
  }

  async clearAllData() {
    // Clear tables in batches to avoid exceeding transaction argument limit
    await this.transaction(
      "rw",
      this.subjects,
      this.timeSlots,
      this.daySlots,
      async () => {
        await this.subjects.clear();
        await this.timeSlots.clear();
        await this.daySlots.clear();
      }
    );

    await this.transaction(
      "rw",
      this.combinedSlots,
      this.attendanceRecords,
      this.specialDates,
      async () => {
        await this.combinedSlots.clear();
        await this.attendanceRecords.clear();
        await this.specialDates.clear();
      }
    );

    await this.transaction(
      "rw",
      this.extraClasses,
      this.termSettings,
      this.importedAttendance,
      async () => {
        await this.extraClasses.clear();
        await this.termSettings.clear();
        await this.importedAttendance.clear();
      }
    );
  }

  async debugDatabaseState() {
    const subjects = await this.subjects.toArray();
    const timeSlots = await this.timeSlots.toArray();
    const daySlots = await this.daySlots.toArray();
    const combinedSlots = await this.combinedSlots.toArray();
    const attendanceRecords = await this.attendanceRecords.toArray();
    const specialDates = await this.specialDates.toArray();
    const extraClasses = await this.extraClasses.toArray();
    const termSettings = await this.termSettings.toArray();
    const importedAttendance = await this.importedAttendance.toArray();

    return {
      subjects,
      timeSlots,
      daySlots,
      combinedSlots,
      attendanceRecords,
      specialDates,
      extraClasses,
      termSettings,
      importedAttendance,
    };
  }
}

export const db = new TimetableDatabase();