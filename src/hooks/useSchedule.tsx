import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/db'
import { AttendanceRecord, SpecialDate, ExtraClass, TermSettings, AttendanceStats } from '../types'
import { format, isWithinInterval, parseISO, getDay } from 'date-fns'

interface ScheduleContextType {
  attendanceRecords: AttendanceRecord[]
  specialDates: SpecialDate[]
  extraClasses: ExtraClass[]
  termSettings: TermSettings | null
  
  // Attendance methods
  markAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>
  getAttendanceForDate: (date: string) => AttendanceRecord[]
  
  // Special dates methods
  addSpecialDate: (specialDate: Omit<SpecialDate, 'id'>) => Promise<void>
  removeSpecialDate: (id: string) => Promise<void>
  isSpecialDate: (date: string) => SpecialDate | null
  
  // Extra classes methods
  addExtraClass: (extraClass: Omit<ExtraClass, 'id'>) => Promise<void>
  updateExtraClass: (id: string, updates: Partial<ExtraClass>) => Promise<void>
  removeExtraClass: (id: string) => Promise<void>
  getExtraClassesForDate: (date: string) => ExtraClass[]
  
  // Term settings methods
  setTermSettings: (settings: Omit<TermSettings, 'id' | 'isActive'>) => Promise<void>
  getActiveTermSettings: () => TermSettings | null
  isDateInTerm: (date: string) => boolean
  
  // Statistics methods
  getAttendanceStats: (subjectId?: string) => AttendanceStats[]
  getTotalLecturesForSubject: (subjectId: string, fromDate?: string, toDate?: string) => Promise<number>
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [extraClasses, setExtraClasses] = useState<ExtraClass[]>([])
  const [termSettings, setTermSettingsState] = useState<TermSettings | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [
        loadedAttendance,
        loadedSpecialDates,
        loadedExtraClasses,
        loadedTermSettings
      ] = await Promise.all([
        db.attendanceRecords.toArray(),
        db.specialDates.toArray(),
        db.extraClasses.toArray(),
        db.termSettings.where('isActive').equals(true).first()
      ])
      
      setAttendanceRecords(loadedAttendance)
      setSpecialDates(loadedSpecialDates)
      setExtraClasses(loadedExtraClasses)
      setTermSettingsState(loadedTermSettings || null)
    } catch (error) {
      console.error('Failed to load schedule data:', error)
    }
  }

  const markAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
    try {
      const id = Date.now().toString()
      const newRecord = { ...record, id }
      await db.attendanceRecords.add(newRecord)
      setAttendanceRecords(prev => [...prev, newRecord])
    } catch (error) {
      console.error('Failed to mark attendance:', error)
    }
  }

  const updateAttendance = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      await db.attendanceRecords.update(id, updates)
      setAttendanceRecords(prev => 
        prev.map(record => record.id === id ? { ...record, ...updates } : record)
      )
    } catch (error) {
      console.error('Failed to update attendance:', error)
    }
  }

  const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    return attendanceRecords.filter(record => record.date === date)
  }

  const addSpecialDate = async (specialDate: Omit<SpecialDate, 'id'>) => {
    try {
      const id = Date.now().toString()
      const newSpecialDate = { ...specialDate, id }
      await db.specialDates.add(newSpecialDate)
      setSpecialDates(prev => [...prev, newSpecialDate])
    } catch (error) {
      console.error('Failed to add special date:', error)
    }
  }

  const removeSpecialDate = async (id: string) => {
    try {
      await db.specialDates.delete(id)
      setSpecialDates(prev => prev.filter(date => date.id !== id))
    } catch (error) {
      console.error('Failed to remove special date:', error)
    }
  }

  const isSpecialDate = (date: string): SpecialDate | null => {
    return specialDates.find(special => special.date === date) || null
  }

  const addExtraClass = async (extraClass: Omit<ExtraClass, 'id'>) => {
    try {
      const id = Date.now().toString()
      const newExtraClass = { ...extraClass, id }
      await db.extraClasses.add(newExtraClass)
      setExtraClasses(prev => [...prev, newExtraClass])
    } catch (error) {
      console.error('Failed to add extra class:', error)
    }
  }

  const updateExtraClass = async (id: string, updates: Partial<ExtraClass>) => {
    try {
      await db.extraClasses.update(id, updates)
      setExtraClasses(prev => 
        prev.map(extraClass => extraClass.id === id ? { ...extraClass, ...updates } : extraClass)
      )
    } catch (error) {
      console.error('Failed to update extra class:', error)
    }
  }

  const removeExtraClass = async (id: string) => {
    try {
      await db.extraClasses.delete(id)
      setExtraClasses(prev => prev.filter(extraClass => extraClass.id !== id))
    } catch (error) {
      console.error('Failed to remove extra class:', error)
    }
  }

  const getExtraClassesForDate = (date: string): ExtraClass[] => {
    return extraClasses.filter(extraClass => extraClass.date === date)
  }

  const setTermSettings = async (settings: Omit<TermSettings, 'id' | 'isActive'>) => {
    try {
      // Deactivate all existing term settings
      await db.termSettings.toCollection().modify({ isActive: false })
      
      // Add new active term settings
      const id = Date.now().toString()
      const newSettings = { ...settings, id, isActive: true }
      await db.termSettings.add(newSettings)
      
      setTermSettingsState(newSettings)
    } catch (error) {
      console.error('Failed to set term settings:', error)
    }
  }

  const getActiveTermSettings = (): TermSettings | null => {
    return termSettings
  }

  const isDateInTerm = (date: string): boolean => {
    if (!termSettings) return false
    
    try {
      const targetDate = parseISO(date)
      const startDate = parseISO(termSettings.startDate)
      const endDate = parseISO(termSettings.endDate)
      
      return isWithinInterval(targetDate, { start: startDate, end: endDate })
    } catch (error) {
      console.error('Failed to check if date is in term:', error)
      return false
    }
  }

  const getAttendanceStats = (subjectId?: string): AttendanceStats[] => {
    // This is a simplified version - would need more complex logic for actual implementation
    const stats: { [key: string]: AttendanceStats } = {}
    
    attendanceRecords.forEach(record => {
      const actualSubjectId = record.actualSubjectId || record.originalSubjectId
      if (!actualSubjectId || (subjectId && actualSubjectId !== subjectId)) return
      
      if (!stats[actualSubjectId]) {
        stats[actualSubjectId] = {
          subjectId: actualSubjectId,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0
        }
      }
      
      stats[actualSubjectId].totalLectures++
      
      switch (record.status) {
        case 'attended':
          stats[actualSubjectId].attendedLectures++
          break
        case 'missed':
          stats[actualSubjectId].missedLectures++
          break
        case 'cancelled':
          stats[actualSubjectId].cancelledLectures++
          break
      }
    })
    
    return Object.values(stats)
  }

  const getTotalLecturesForSubject = async (subjectId: string, fromDate?: string, toDate?: string): Promise<number> => {
    // This would require complex calculation based on timetable, term settings, special dates, etc.
    // For now, returning a simple count
    return attendanceRecords.filter(record => 
      (record.actualSubjectId || record.originalSubjectId) === subjectId &&
      (!fromDate || record.date >= fromDate) &&
      (!toDate || record.date <= toDate)
    ).length
  }

  return (
    <ScheduleContext.Provider
      value={{
        attendanceRecords,
        specialDates,
        extraClasses,
        termSettings,
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
        getTotalLecturesForSubject
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

export const useSchedule = () => {
  const context = useContext(ScheduleContext)
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
}