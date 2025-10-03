import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { useTimetable } from '../hooks/useTimetable'
import { Trash2, Calendar } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const Header = () => {
  const { clearAllData } = useTimetable()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleClearAllData = () => {
    clearAllData()
  }

  return (
    <header className="glass-subtle border-b border-subtle backdrop-blur-xl animate-slide-up">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-slate-900">
                TimeFlow
              </h1>
              <p className="text-xs text-slate-500">
                Schedule Management
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowClearDialog(true)}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
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