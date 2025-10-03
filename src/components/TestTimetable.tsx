import React from 'react'
import { TimetableProvider } from '../hooks/useTimetable'
import Timetable from './Timetable'

const TestTimetable = () => {
  return (
    <TimetableProvider>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Timetable Test</h1>
        <Timetable />
      </div>
    </TimetableProvider>
  )
}

export default TestTimetable