import React from 'react'
import { TimetableProvider } from './hooks/useTimetable'
import { ScheduleProvider } from './hooks/useSchedule'
import { ThemeProvider } from './contexts/ThemeContext'
import Timetable from './components/Timetable'
import TodaySchedule from './components/TodaySchedule'
import Header from './components/Header'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <TimetableProvider>
        <ScheduleProvider>
          <div className="min-h-screen bg-background relative">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in relative z-10">
              <section id="schedule">
                <TodaySchedule />
              </section>
              <section id="timetable" className="mt-12">
                <Timetable />
              </section>
            </main>
          </div>
        </ScheduleProvider>
      </TimetableProvider>
    </ThemeProvider>
  )
}

export default App