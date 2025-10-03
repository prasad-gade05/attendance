import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { useTimetable } from '../hooks/useTimetable'
import { Trash2, Calendar, Sparkles } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const Header = () => {
  const { clearAllData } = useTimetable()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleClearAllData = () => {
    clearAllData()
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
        
        <div className="flex items-center gap-3">
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