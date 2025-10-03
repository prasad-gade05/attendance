import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { useTimetable } from '../hooks/useTimetable'
import { Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const Header = () => {
  const { clearAllData } = useTimetable()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleClearAllData = () => {
    clearAllData()
    // You could add a toast notification here instead of alert
  }

  return (
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Timetable Manager</h1>
          <span className="text-sm text-gray-500">
            Create and manage your weekly schedule
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowClearDialog(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
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