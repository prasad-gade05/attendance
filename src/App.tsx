import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
          <Router>
            <div className="min-h-screen bg-background relative">
              <Header />
              <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in relative z-10">
                <Routes>
                  <Route path="/" element={<Navigate to="/schedule" replace />} />
                  <Route path="/timetable" element={<Timetable />} />
                  <Route path="/schedule" element={<TodaySchedule />} />
                </Routes>
              </main>
            </div>
          </Router>
        </ScheduleProvider>
      </TimetableProvider>
    </ThemeProvider>
  )
}

export default App