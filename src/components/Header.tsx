import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useTimetable } from '../hooks/useTimetable'
import { useSchedule } from '../hooks/useSchedule'
import { Trash2, Calendar, CalendarDays, Grid3X3 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const Header = () => {
  const { clearAllData: clearTimetableData, loadData: loadTimetableData } = useTimetable()
  const { clearAllData: clearScheduleData, refreshData: refreshScheduleData } = useSchedule()
  const [showClearDialog, setShowClearDialog] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleClearAllData = async () => {
    try {
      // Clear all data from both providers
      await Promise.all([
        clearTimetableData(),
        clearScheduleData()
      ])
      
      // Refresh data in both providers
      await Promise.all([
        loadTimetableData(),
        refreshScheduleData()
      ])
      
      // Perform a full page refresh to ensure UI consistency
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear all data:', error)
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                TimeFlow
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Smart Schedule Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant={location.pathname === '/timetable' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/timetable')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Timetable
            </Button>
            <Button
              variant={location.pathname === '/schedule' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/schedule')}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Today's Schedule
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
      
      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Data"
        message="Are you sure you want to delete all data? This action cannot be undone."
        onConfirm={handleClearAllData}
        confirmText="Delete All"
        variant="destructive"
      />
    </header>
  )
}

export default Header