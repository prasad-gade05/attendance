import React from 'react'
import { TimetableProvider } from './hooks/useTimetable'
import Timetable from './components/Timetable'
import Header from './components/Header'
import './App.css'

function App() {
  return (
    <TimetableProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <Timetable />
        </main>
      </div>
    </TimetableProvider>
  )
}

export default App