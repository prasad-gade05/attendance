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

  console.log('🔥 ScheduleProvider: Component rendered, current termSettings state:', termSettings)

  useEffect(() => {
    console.log('🔥 ScheduleProvider: useEffect triggered for loadData')
    loadData()
  }, [])

  useEffect(() => {
    console.log('🔥 ScheduleProvider: termSettings state changed to:', termSettings)
  }, [termSettings])

  const loadData = async () => {
    console.log('🔥 useSchedule: loadData called')
    try {
      console.log('🔥 useSchedule: Loading data from database')
      
      // Load all data including a fallback for term settings
      const [
        loadedAttendance,
        loadedSpecialDates,
        loadedExtraClasses,
        loadedTermSettings
      ] = await Promise.all([
        db.attendanceRecords.toArray(),
        db.specialDates.toArray(),
        db.extraClasses.toArray(),
        db.termSettings.filter(term => term.isActive === true).first()
      ])
      
      console.log('🔥 useSchedule: Loaded data:')
      console.log('🔥 useSchedule: - attendanceRecords:', loadedAttendance?.length || 0)
      console.log('🔥 useSchedule: - specialDates:', loadedSpecialDates?.length || 0)
      console.log('🔥 useSchedule: - extraClasses:', loadedExtraClasses?.length || 0)
      console.log('🔥 useSchedule: - termSettings:', loadedTermSettings)
      
      // Fallback: if no active term settings found, get the most recent one
      let finalTermSettings = loadedTermSettings;
      if (!finalTermSettings) {
        console.log('🔥 useSchedule: No active term settings found, checking for any term settings')
        try {
          const allTermSettings = await db.termSettings.toArray();
          console.log('🔥 useSchedule: All term settings in DB:', allTermSettings)
          
          if (allTermSettings.length > 0) {
            // Get the most recently created term settings
            finalTermSettings = allTermSettings.reduce((mostRecent, current) => {
              // Handle case where IDs might not be parseable as numbers
              try {
                return parseInt(current.id) > parseInt(mostRecent.id) ? current : mostRecent;
              } catch (e) {
                // If parsing fails, compare as strings
                return current.id > mostRecent.id ? current : mostRecent;
              }
            });
            console.log('🔥 useSchedule: Using most recent term settings as fallback:', finalTermSettings)
          }
        } catch (dbError) {
          console.error('🔥 useSchedule: Error fetching term settings from DB:', dbError)
        }
      }
      
      setAttendanceRecords(loadedAttendance)
      setSpecialDates(loadedSpecialDates)
      setExtraClasses(loadedExtraClasses)
      setTermSettingsState(finalTermSettings || null)
      
      console.log('🔥 useSchedule: State updated successfully, final termSettings:', finalTermSettings)
    } catch (error) {
      console.error('🔥 useSchedule: Failed to load schedule data:', error)
      // Set default empty state on error
      setAttendanceRecords([])
      setSpecialDates([])
      setExtraClasses([])
      setTermSettingsState(null)
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
    console.log('🔥 useSchedule: setTermSettings called with:', settings)
    try {
      console.log('🔥 useSchedule: Starting database transaction')
      
      let savedSettings: TermSettings | null = null
      
      // Use a transaction to ensure data consistency
      await db.transaction('rw', db.termSettings, async () => {
        console.log('🔥 useSchedule: Inside transaction')
        
        try {
          // First, let's check what's currently in the database
          const existingSettings = await db.termSettings.toArray()
          console.log('🔥 useSchedule: Existing term settings in DB:', existingSettings)
          
          // Deactivate all existing term settings
          console.log('🔥 useSchedule: Deactivating existing term settings')
          const deactivateResult = await db.termSettings.toCollection().modify({ isActive: false })
          console.log('🔥 useSchedule: Deactivate result:', deactivateResult)
          
          // Add new active term settings
          const id = Date.now().toString()
          const newSettings = { ...settings, id, isActive: true }
          console.log('🔥 useSchedule: Creating new term settings:', newSettings)
          
          const addResult = await db.termSettings.add(newSettings)
          console.log('🔥 useSchedule: Add result:', addResult)
          
          // Verify the data was saved
          const verifySettings = await db.termSettings.where('id').equals(id).first()
          console.log('🔥 useSchedule: Verification - saved data:', verifySettings)
          
          // Store the settings to update state after transaction
          savedSettings = newSettings
        } catch (transactionError) {
          console.error('🔥 useSchedule: Error during transaction:', transactionError)
          throw transactionError
        }
      })
      
      console.log('🔥 useSchedule: Transaction completed successfully')
      console.log('🔥 useSchedule: About to update state with:', savedSettings)
      
      // Update the state AFTER the transaction completes
      if (savedSettings) {
        setTermSettingsState(savedSettings)
        console.log('🔥 useSchedule: State updated with savedSettings')
      } else {
        // If for some reason savedSettings is null, reload from DB
        try {
          const reloadedSettings = await db.termSettings.filter(term => term.isActive === true).first()
          if (reloadedSettings) {
            setTermSettingsState(reloadedSettings)
            console.log('🔥 useSchedule: State reloaded from DB due to null savedSettings')
          }
        } catch (reloadError) {
          console.error('🔥 useSchedule: Error reloading term settings:', reloadError)
        }
      }
      
    } catch (error) {
      console.error('🔥 useSchedule: Failed to set term settings:', error)
      console.error('🔥 useSchedule: Error details:', error.stack)
      throw error // Re-throw to allow calling code to handle it
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
    const stats: { [key: string]: AttendanceStats } = {}
    
    // Count regular attendance records
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
    
    // Count extra classes as additional lectures conducted (attended)
    extraClasses.forEach(extraClass => {
      if (subjectId && extraClass.subjectId !== subjectId) return
      
      if (!stats[extraClass.subjectId]) {
        stats[extraClass.subjectId] = {
          subjectId: extraClass.subjectId,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0
        }
      }
      
      // Extra classes count as both total lectures and attended lectures
      stats[extraClass.subjectId].totalLectures++
      stats[extraClass.subjectId].attendedLectures++
    })
    
    return Object.values(stats)
  }

  const getTotalLecturesForSubject = async (subjectId: string, fromDate?: string, toDate?: string): Promise<number> => {
    // Count attendance records
    const attendanceCount = attendanceRecords.filter(record => 
      (record.actualSubjectId || record.originalSubjectId) === subjectId &&
      (!fromDate || record.date >= fromDate) &&
      (!toDate || record.date <= toDate)
    ).length
    
    // Count extra classes
    const extraClassCount = extraClasses.filter(extraClass =>
      extraClass.subjectId === subjectId &&
      (!fromDate || extraClass.date >= fromDate) &&
      (!toDate || extraClass.date <= toDate)
    ).length
    
    return attendanceCount + extraClassCount
  }

  // Debug function to check database state
  const debugDatabaseState = async () => {
    console.log('🔥 useSchedule: debugDatabaseState called')
    const dbState = await db.debugDatabaseState()
    console.log('🔥 useSchedule: Current hook state:')
    console.log('🔥 useSchedule: - termSettings:', termSettings)
    console.log('🔥 useSchedule: - attendanceRecords:', attendanceRecords.length)
    console.log('🔥 useSchedule: - specialDates:', specialDates.length)
    console.log('🔥 useSchedule: - extraClasses:', extraClasses.length)
    return dbState
  }

  // Make debug function available globally for console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugScheduleState = debugDatabaseState
      ;(window as any).clearScheduleData = async () => {
        console.log('🔥 useSchedule: Clearing all data')
        await db.clearAllData()
        await loadData()
      }
    }
  }, [])

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