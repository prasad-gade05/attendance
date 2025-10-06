import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../lib/db";
import {
  AttendanceRecord,
  SpecialDate,
  ExtraClass,
  TermSettings,
  AttendanceStats,
  ImportedAttendance,
} from "../types";
import {
  format,
  isWithinInterval,
  parseISO,
  getDay,
  isSameDay,
  isBefore,
  isEqual,
} from "date-fns";

interface ScheduleContextType {
  attendanceRecords: AttendanceRecord[];
  specialDates: SpecialDate[];
  extraClasses: ExtraClass[];
  termSettings: TermSettings | null;
  importedAttendance: ImportedAttendance[];

  // Attendance methods
  markAttendance: (record: Omit<AttendanceRecord, "id">) => Promise<void>;
  updateAttendance: (
    id: string,
    updates: Partial<AttendanceRecord>
  ) => Promise<void>;
  getAttendanceForDate: (date: string) => AttendanceRecord[];

  // Special dates methods
  addSpecialDate: (specialDate: Omit<SpecialDate, "id">) => Promise<void>;
  removeSpecialDate: (id: string) => Promise<void>;
  isSpecialDate: (date: string) => SpecialDate | null;

  // Extra classes methods
  addExtraClass: (extraClass: Omit<ExtraClass, "id">) => Promise<void>;
  updateExtraClass: (id: string, updates: Partial<ExtraClass>) => Promise<void>;
  removeExtraClass: (id: string) => Promise<void>;
  getExtraClassesForDate: (date: string) => ExtraClass[];

  // Term settings methods
  setTermSettings: (
    settings: Omit<TermSettings, "id" | "isActive">
  ) => Promise<void>;
  getActiveTermSettings: () => TermSettings | null;
  isDateInTerm: (date: string) => boolean;

  // Statistics methods
  getAttendanceStats: (subjectId?: string) => AttendanceStats[];
  getTotalLecturesForSubject: (
    subjectId: string,
    fromDate?: string,
    toDate?: string
  ) => Promise<number>;

  // Import attendance methods
  importAttendance: (data: Omit<ImportedAttendance, "id">) => Promise<void>;
  getImportedAttendanceForSubject: (
    subjectId: string
  ) => ImportedAttendance | null;
  isDateLockedForSubject: (date: string, subjectId: string) => boolean;

  // Data management
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [extraClasses, setExtraClasses] = useState<ExtraClass[]>([]);
  const [termSettings, setTermSettingsState] = useState<TermSettings | null>(
    null
  );
  const [importedAttendance, setImportedAttendance] = useState<
    ImportedAttendance[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Empty effect for termSettings changes
  }, [termSettings]);

  const loadData = async () => {
    try {
      // Load all data including a fallback for term settings
      const [
        loadedAttendance,
        loadedSpecialDates,
        loadedExtraClasses,
        loadedTermSettings,
        loadedImportedAttendance,
      ] = await Promise.all([
        db.attendanceRecords.toArray(),
        db.specialDates.toArray(),
        db.extraClasses.toArray(),
        db.termSettings.filter((term) => term.isActive === true).first(),
        db.importedAttendance.toArray(),
      ]);

      // Fallback: if no active term settings found, get the most recent one
      let finalTermSettings = loadedTermSettings;
      if (!finalTermSettings) {
        try {
          const allTermSettings = await db.termSettings.toArray();

          if (allTermSettings.length > 0) {
            // Get the most recently created term settings
            finalTermSettings = allTermSettings.reduce(
              (mostRecent, current) => {
                // Handle case where IDs might not be parseable as numbers
                try {
                  return parseInt(current.id) > parseInt(mostRecent.id)
                    ? current
                    : mostRecent;
                } catch (e) {
                  // If parsing fails, compare as strings
                  return current.id > mostRecent.id ? current : mostRecent;
                }
              }
            );
          }
        } catch (dbError) {
          // Error handling without console logging
        }
      }

      setAttendanceRecords(loadedAttendance);
      setSpecialDates(loadedSpecialDates);
      setExtraClasses(loadedExtraClasses);
      setTermSettingsState(finalTermSettings || null);
      setImportedAttendance(loadedImportedAttendance);

    } catch (error) {
      // Set default empty state on error
      setAttendanceRecords([]);
      setSpecialDates([]);
      setExtraClasses([]);
      setTermSettingsState(null);
      setImportedAttendance([]);
    }
  };

  const markAttendance = async (record: Omit<AttendanceRecord, "id">) => {
    try {
      const id = Date.now().toString();
      const newRecord = { ...record, id };
      await db.attendanceRecords.add(newRecord);
      setAttendanceRecords((prev) => [...prev, newRecord]);
    } catch (error) {
      // Error handling without console logging
    }
  };

  const updateAttendance = async (
    id: string,
    updates: Partial<AttendanceRecord>
  ) => {
    try {
      await db.attendanceRecords.update(id, updates);
      setAttendanceRecords((prev) =>
        prev.map((record) =>
          record.id === id ? { ...record, ...updates } : record
        )
      );
    } catch (error) {
      // Error handling without console logging
    }
  };

  const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    return attendanceRecords.filter((record) => record.date === date);
  };

  const addSpecialDate = async (specialDate: Omit<SpecialDate, "id">) => {
    try {
      const id = Date.now().toString();
      const newSpecialDate = { ...specialDate, id };
      await db.specialDates.add(newSpecialDate);
      setSpecialDates((prev) => [...prev, newSpecialDate]);
    } catch (error) {
      // Error handling without console logging
    }
  };

  const removeSpecialDate = async (id: string) => {
    try {
      await db.specialDates.delete(id);
      setSpecialDates((prev) => prev.filter((date) => date.id !== id));
    } catch (error) {
      // Error handling without console logging
    }
  };

  const isSpecialDate = (date: string): SpecialDate | null => {
    return specialDates.find((special) => special.date === date) || null;
  };

  const addExtraClass = async (extraClass: Omit<ExtraClass, "id">) => {
    try {
      const id = Date.now().toString();
      const newExtraClass = { ...extraClass, id };
      await db.extraClasses.add(newExtraClass);
      setExtraClasses((prev) => [...prev, newExtraClass]);
    } catch (error) {
      // Error handling without console logging
    }
  };

  const updateExtraClass = async (id: string, updates: Partial<ExtraClass>) => {
    try {
      await db.extraClasses.update(id, updates);
      setExtraClasses((prev) =>
        prev.map((extraClass) =>
          extraClass.id === id ? { ...extraClass, ...updates } : extraClass
        )
      );
    } catch (error) {
      // Error handling without console logging
    }
  };

  const removeExtraClass = async (id: string) => {
    try {
      await db.extraClasses.delete(id);
      setExtraClasses((prev) =>
        prev.filter((extraClass) => extraClass.id !== id)
      );
    } catch (error) {
      // Error handling without console logging
    }
  };

  const getExtraClassesForDate = (date: string): ExtraClass[] => {
    return extraClasses.filter((extraClass) => extraClass.date === date);
  };

  const setTermSettings = async (
    settings: Omit<TermSettings, "id" | "isActive">
  ) => {
    try {
      let savedSettings: TermSettings | null = null;

      // Use a transaction to ensure data consistency
      await db.transaction("rw", db.termSettings, async () => {
        try {
          // First, let's check what's currently in the database
          const existingSettings = await db.termSettings.toArray();

          // Deactivate all existing term settings
          const deactivateResult = await db.termSettings
            .toCollection()
            .modify({ isActive: false });

          // Add new active term settings
          const id = Date.now().toString();
          const newSettings = { ...settings, id, isActive: true };

          const addResult = await db.termSettings.add(newSettings);

          // Verify the data was saved
          const verifySettings = await db.termSettings
            .where("id")
            .equals(id)
            .first();

          // Store the settings to update state after transaction
          savedSettings = newSettings;
        } catch (transactionError) {
          throw transactionError;
        }
      });

      // Update the state AFTER the transaction completes
      if (savedSettings) {
        setTermSettingsState(savedSettings);
      } else {
        // If for some reason savedSettings is null, reload from DB
        try {
          const reloadedSettings = await db.termSettings
            .filter((term) => term.isActive === true)
            .first();
          if (reloadedSettings) {
            setTermSettingsState(reloadedSettings);
          }
        } catch (reloadError) {
          // Error handling without console logging
        }
      }
    } catch (error) {
      throw error; // Re-throw to allow calling code to handle it
    }
  };

  const getActiveTermSettings = (): TermSettings | null => {
    return termSettings;
  };

  const isDateInTerm = (date: string): boolean => {
    // If no term settings exist, we can't determine if date is in term
    if (!termSettings) {
      return false;
    }

    try {
      const targetDate = parseISO(date);
      const startDate = parseISO(termSettings.startDate);
      const endDate = parseISO(termSettings.endDate);

      // Include the start and end dates in the term period
      const result =
        isWithinInterval(targetDate, { start: startDate, end: endDate }) ||
        isSameDay(targetDate, startDate) ||
        isSameDay(targetDate, endDate);

      return result;
    } catch (error) {
      return false;
    }
  };

  const getAttendanceStats = (subjectId?: string): AttendanceStats[] => {
    const stats: { [key: string]: AttendanceStats } = {};

    // Collect all subject IDs from all records to ensure all subjects are initialized.
    const allSubjectIds = new Set<string>();
    attendanceRecords.forEach((record) => {
      if (record.originalSubjectId) allSubjectIds.add(record.originalSubjectId);
      if (record.actualSubjectId) allSubjectIds.add(record.actualSubjectId);
    });
    extraClasses.forEach((extraClass) => {
      allSubjectIds.add(extraClass.subjectId);
    });

    // Initialize stats for all subjects.
    allSubjectIds.forEach((id) => {
      if (!subjectId || id === subjectId) {
        stats[id] = {
          subjectId: id,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0,
        };
      }
    });

    // Count regular attendance records based on the actual subject.
    attendanceRecords.forEach((record) => {
      const actualSubjectId =
        record.actualSubjectId || record.originalSubjectId;
      if (!actualSubjectId) return;

      // If a filter is applied, only consider the filtered subject.
      if (subjectId && actualSubjectId !== subjectId) return;

      if (stats[actualSubjectId]) {
        stats[actualSubjectId].totalLectures++;

        switch (record.status) {
          case "attended":
            stats[actualSubjectId].attendedLectures++;
            break;
          case "missed":
            stats[actualSubjectId].missedLectures++;
            break;
          case "cancelled":
            stats[actualSubjectId].cancelledLectures++;
            break;
        }
      }
    });

    // Count extra classes as additional lectures conducted (attended).
    extraClasses.forEach((extraClass) => {
      if (subjectId && extraClass.subjectId !== subjectId) return;

      if (stats[extraClass.subjectId]) {
        stats[extraClass.subjectId].totalLectures++;
        stats[extraClass.subjectId].attendedLectures++;
      }
    });

    if (subjectId) {
      return stats[subjectId] ? [stats[subjectId]] : [];
    }
    return Object.values(stats);
  };

  const getTotalLecturesForSubject = async (
    subjectId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<number> => {
    // Count attendance records
    const attendanceCount = attendanceRecords.filter(
      (record) =>
        (record.actualSubjectId || record.originalSubjectId) === subjectId &&
        (!fromDate || record.date >= fromDate) &&
        (!toDate || record.date <= toDate)
    ).length;

    // Count extra classes
    const extraClassCount = extraClasses.filter(
      (extraClass) =>
        extraClass.subjectId === subjectId &&
        (!fromDate || extraClass.date >= fromDate) &&
        (!toDate || extraClass.date <= toDate)
    ).length;

    return attendanceCount + extraClassCount;
  };

  const importAttendance = async (data: Omit<ImportedAttendance, "id">) => {
    try {
      // Check if there's already an import record for this subject
      const existingImport = importedAttendance.find(
        (ia) => ia.subjectId === data.subjectId
      );

      // Delete existing attendance records for this subject on or before the import date
      const recordsToDelete = attendanceRecords.filter((record) => {
        // Check if record is for the same subject
        const recordSubjectId =
          record.actualSubjectId || record.originalSubjectId;
        if (recordSubjectId !== data.subjectId) return false;

        // Check if record date is on or before import date
        const recordDate = parseISO(record.date);
        const importDate = parseISO(data.importDate);
        return (
          isBefore(recordDate, importDate) || isEqual(recordDate, importDate)
        );
      });

      // Delete extra classes for this subject on or before the import date
      const extraClassesToDelete = extraClasses.filter((extraClass) => {
        if (extraClass.subjectId !== data.subjectId) return false;

        const extraClassDate = parseISO(extraClass.date);
        const importDate = parseISO(data.importDate);
        return (
          isBefore(extraClassDate, importDate) ||
          isEqual(extraClassDate, importDate)
        );
      });

      // Use transaction to ensure data consistency
      await db.transaction(
        "rw",
        db.importedAttendance,
        db.attendanceRecords,
        db.extraClasses,
        async () => {
          // Delete existing import record if it exists
          if (existingImport) {
            await db.importedAttendance.delete(existingImport.id);
          }

          // Delete old attendance records
          for (const record of recordsToDelete) {
            await db.attendanceRecords.delete(record.id);
          }

          // Delete old extra classes
          for (const extraClass of extraClassesToDelete) {
            await db.extraClasses.delete(extraClass.id);
          }

          // Add new import record
          const id = Date.now().toString();
          const newImportRecord = { ...data, id };
          await db.importedAttendance.add(newImportRecord);

          // Update state
          setImportedAttendance((prev) => {
            // Remove existing record if it exists
            const filtered = existingImport
              ? prev.filter((ia) => ia.id !== existingImport.id)
              : prev;
            // Add new record
            return [...filtered, newImportRecord];
          });

          // Update attendance records state
          setAttendanceRecords((prev) =>
            prev.filter(
              (record) =>
                !recordsToDelete.some((toDelete) => toDelete.id === record.id)
            )
          );

          // Update extra classes state
          setExtraClasses((prev) =>
            prev.filter(
              (extraClass) =>
                !extraClassesToDelete.some(
                  (toDelete) => toDelete.id === extraClass.id
                )
            )
          );
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const getImportedAttendanceForSubject = (
    subjectId: string
  ): ImportedAttendance | null => {
    return importedAttendance.find((ia) => ia.subjectId === subjectId) || null;
  };

  const isDateLockedForSubject = (date: string, subjectId: string): boolean => {
    const imported = getImportedAttendanceForSubject(subjectId);
    if (!imported) return false;

    const targetDate = parseISO(date);
    const importDate = parseISO(imported.importDate);

    // Date is locked if it's on or before the import date
    return isBefore(targetDate, importDate) || isEqual(targetDate, importDate);
  };

  const refreshData = async () => {
    await loadData();
  };

  const clearAllData = async () => {
    try {
      await db.clearAllData();
      setAttendanceRecords([]);
      setSpecialDates([]);
      setExtraClasses([]);
      setTermSettingsState(null);
      setImportedAttendance([]);
    } catch (error) {
      // Error handling without console logging
    }
  };

  // Debug function to check database state
  const debugDatabaseState = async () => {
    const dbState = await db.debugDatabaseState();
    return dbState;
  };

  // Make debug function available globally for console testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugScheduleState = debugDatabaseState;
      (window as any).clearScheduleData = async () => {
        await db.clearAllData();
        await loadData();
      };
    }
  }, []);

  return (
    <ScheduleContext.Provider
      value={{
        attendanceRecords,
        specialDates,
        extraClasses,
        termSettings,
        importedAttendance,
        markAttendance,
        updateAttendance,
        getAttendanceForDate,
        addSpecialDate,
        removeSpecialDate,
        isSpecialDate,
        addExtraClass,
        updateExtraClass,
        removeExtraClass,
        getExtraClassesForDate,
        setTermSettings,
        getActiveTermSettings,
        isDateInTerm,
        getAttendanceStats,
        getTotalLecturesForSubject,
        importAttendance,
        getImportedAttendanceForSubject,
        isDateLockedForSubject,
        clearAllData,
        refreshData,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
};