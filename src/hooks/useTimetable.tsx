import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/db'
import { Subject, TimeSlot, DaySlot, CombinedSlot } from '../types'

interface TimetableContextType {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  daySlots: DaySlot[]
  combinedSlots: CombinedSlot[]
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
  addTimeSlot: (timeSlot: Omit<TimeSlot, 'id'>) => Promise<void>
  deleteTimeSlot: (id: string) => Promise<void>
  assignSubjectToSlot: (timeSlotId: string, day: string, subjectId?: string) => Promise<void>
  combineSlots: (timeSlotId: string, day: string, adjacentTimeSlotIds: string[]) => Promise<void>
  uncombineSlot: (combinedSlotId: string) => Promise<void>
  clearAllData: () => Promise<void>
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined)

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [daySlots, setDaySlots] = useState<DaySlot[]>([])
  const [combinedSlots, setCombinedSlots] = useState<CombinedSlot[]>([])

  // Load data from IndexedDB on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [loadedSubjects, loadedTimeSlots, loadedDaySlots, loadedCombinedSlots] = await Promise.all([
        db.subjects.toArray(),
        db.timeSlots.toArray(),
        db.daySlots.toArray(),
        db.combinedSlots.toArray()
      ])
      setSubjects(loadedSubjects)
      setTimeSlots(loadedTimeSlots)
      setDaySlots(loadedDaySlots)
      setCombinedSlots(loadedCombinedSlots)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    try {
      const id = Date.now().toString()
      const newSubject = { ...subject, id }
      await db.subjects.add(newSubject)
      setSubjects(prev => [...prev, newSubject])
    } catch (error) {
      console.error('Failed to add subject:', error)
    }
  }

  const updateSubject = async (id: string, subject: Partial<Subject>) => {
    try {
      await db.subjects.update(id, subject)
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...subject } : s))
    } catch (error) {
      console.error('Failed to update subject:', error)
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      await db.subjects.delete(id)
      setSubjects(prev => prev.filter(s => s.id !== id))
      
      // Remove subject from any day slots that had this subject
      const updatedDaySlots = daySlots.map(slot => 
        slot.subjectId === id ? { ...slot, subjectId: undefined } : slot
      )
      setDaySlots(updatedDaySlots)
      await db.daySlots.where('subjectId').equals(id).modify({ subjectId: undefined })
      
      // Remove any combined slots with this subject
      const combinedSlotsToRemove = combinedSlots.filter(cs => cs.subjectId === id)
      for (const cs of combinedSlotsToRemove) {
        await uncombineSlot(cs.id)
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
    }
  }

  const addTimeSlot = async (timeSlot: Omit<TimeSlot, 'id'>) => {
    try {
      const id = Date.now().toString()
      const newTimeSlot = { ...timeSlot, id }
      await db.timeSlots.add(newTimeSlot)
      setTimeSlots(prev => [...prev, newTimeSlot])
      
      // Create empty day slots for all days
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const newDaySlots: DaySlot[] = []
      
      for (const day of days) {
        const daySlotId = `${id}-${day}-${Date.now()}`
        const daySlot: DaySlot = {
          id: daySlotId,
          timeSlotId: id,
          day,
          subjectId: undefined
        }
        newDaySlots.push(daySlot)
        await db.daySlots.add(daySlot)
      }
      
      setDaySlots(prev => [...prev, ...newDaySlots])
    } catch (error) {
      console.error('Failed to add time slot:', error)
    }
  }

  const deleteTimeSlot = async (id: string) => {
    try {
      // Delete the time slot
      await db.timeSlots.delete(id)
      setTimeSlots(prev => prev.filter(slot => slot.id !== id))
      
      // Delete all associated day slots
      const daySlotIdsToDelete = daySlots.filter(ds => ds.timeSlotId === id).map(ds => ds.id)
      for (const daySlotId of daySlotIdsToDelete) {
        await db.daySlots.delete(daySlotId)
      }
      setDaySlots(prev => prev.filter(ds => ds.timeSlotId !== id))
      
      // Delete any combined slots that include these day slots
      const combinedSlotsToDelete = combinedSlots.filter(cs => 
        cs.daySlotIds.some(dsId => daySlotIdsToDelete.includes(dsId))
      )
      for (const cs of combinedSlotsToDelete) {
        await db.combinedSlots.delete(cs.id)
      }
      setCombinedSlots(prev => prev.filter(cs => 
        !cs.daySlotIds.some(dsId => daySlotIdsToDelete.includes(dsId))
      ))
    } catch (error) {
      console.error('Failed to delete time slot:', error)
    }
  }

  const assignSubjectToSlot = async (timeSlotId: string, day: string, subjectId?: string) => {
    try {
      const daySlot = daySlots.find(ds => ds.timeSlotId === timeSlotId && ds.day === day)
      if (daySlot) {
        await db.daySlots.update(daySlot.id, { subjectId })
        setDaySlots(prev => prev.map(ds => 
          ds.id === daySlot.id ? { ...ds, subjectId } : ds
        ))
      }
    } catch (error) {
      console.error('Failed to assign subject to slot:', error)
    }
  }

  const combineSlots = async (timeSlotId: string, day: string, adjacentTimeSlotIds: string[]) => {
    try {
      // Get the main day slot and adjacent day slots
      const mainDaySlot = daySlots.find(ds => ds.timeSlotId === timeSlotId && ds.day === day)
      const adjacentDaySlots = daySlots.filter(ds => 
        adjacentTimeSlotIds.includes(ds.timeSlotId) && ds.day === day
      )
      
      if (!mainDaySlot || adjacentDaySlots.length === 0) return
      
      // Check if all slots have the same subject
      const allSlots = [mainDaySlot, ...adjacentDaySlots]
      const subjectIds = [...new Set(allSlots.map(ds => ds.subjectId).filter(Boolean))]
      
      if (subjectIds.length !== 1) {
        throw new Error('All slots must have the same subject to combine')
      }
      
      const subjectId = subjectIds[0]
      if (!subjectId) {
        throw new Error('Cannot combine empty slots')
      }
      
      // Create combined slot
      const combinedSlotId = Date.now().toString()
      const combinedSlot: CombinedSlot = {
        id: combinedSlotId,
        daySlotIds: allSlots.map(ds => ds.id),
        subjectId,
        day
      }
      
      await db.combinedSlots.add(combinedSlot)
      setCombinedSlots(prev => [...prev, combinedSlot])
    } catch (error) {
      console.error('Failed to combine slots:', error)
      throw error
    }
  }

  const uncombineSlot = async (combinedSlotId: string) => {
    try {
      await db.combinedSlots.delete(combinedSlotId)
      setCombinedSlots(prev => prev.filter(cs => cs.id !== combinedSlotId))
    } catch (error) {
      console.error('Failed to uncombine slot:', error)
    }
  }

  const clearAllData = async () => {
    try {
      await db.clearAllData()
      setSubjects([])
      setTimeSlots([])
      setDaySlots([])
      setCombinedSlots([])
    } catch (error) {
      console.error('Failed to clear all data:', error)
    }
  }

  return (
    <TimetableContext.Provider
      value={{
        subjects,
        timeSlots,
        daySlots,
        combinedSlots,
        addSubject,
        updateSubject,
        deleteSubject,
        addTimeSlot,
        deleteTimeSlot,
        assignSubjectToSlot,
        combineSlots,
        uncombineSlot,
        clearAllData
      }}
    >
      {children}
    </TimetableContext.Provider>
  )
}

export const useTimetable = () => {
  const context = useContext(TimetableContext)
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider')
  }
  return context
}