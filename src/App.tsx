import React from 'react'
import { TimetableProvider } from './hooks/useTimetable'
import Timetable from './components/Timetable'
import Header from './components/Header'
import './App.css'

function App() {
  return (
    <TimetableProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
          <Timetable />
        </main>
      </div>
    </TimetableProvider>
  )
}

export default App