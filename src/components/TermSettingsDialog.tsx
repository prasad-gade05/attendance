import React, { useState, useEffect } from 'react'
import { Settings, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useSchedule } from '../hooks/useSchedule'

interface TermSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TermSettingsDialog: React.FC<TermSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { termSettings, setTermSettings } = useSchedule()

  useEffect(() => {
    console.log('🔥 TermSettingsDialog: useEffect triggered')
    console.log('🔥 TermSettingsDialog: termSettings from hook =', termSettings)
    if (termSettings) {
      console.log('🔥 TermSettingsDialog: Setting form values from termSettings')
      console.log('🔥 TermSettingsDialog: startDate =', termSettings.startDate)
      console.log('🔥 TermSettingsDialog: endDate =', termSettings.endDate)
      setStartDate(termSettings.startDate)
      setEndDate(termSettings.endDate)
    } else {
      console.log('🔥 TermSettingsDialog: No termSettings found, clearing form')
    }
  }, [termSettings])

  const handleSubmit = async () => {
    console.log('🔥 TermSettingsDialog: handleSubmit called')
    console.log('🔥 TermSettingsDialog: startDate =', startDate)
    console.log('🔥 TermSettingsDialog: endDate =', endDate)
    
    if (!startDate || !endDate) {
      console.log('🔥 TermSettingsDialog: Validation failed - missing dates')
      alert('Please select both start and end dates')
      return
    }

    if (startDate >= endDate) {
      console.log('🔥 TermSettingsDialog: Validation failed - end date not after start date')
      alert('End date must be after start date')
      return
    }

    console.log('🔥 TermSettingsDialog: Validation passed, calling setTermSettings')
    try {
      await setTermSettings({
        startDate,
        endDate
      })
      console.log('🔥 TermSettingsDialog: setTermSettings completed successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('🔥 TermSettingsDialog: Failed to save term settings:', error)
      alert('Failed to save term settings. Please try again.')
    }
  }

  const resetForm = () => {
    if (termSettings) {
      setStartDate(termSettings.startDate)
      setEndDate(termSettings.endDate)
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Term Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {termSettings && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Current Term
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">
                      {format(parseISO(termSettings.startDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End:</span>
                    <span className="font-medium">
                      {format(parseISO(termSettings.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Term Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Term End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1">Important Note</h4>
              <p className="text-sm text-blue-700">
                Setting new term dates will affect schedule calculations for attendance statistics. 
                Only dates within the term period will have active schedules.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Term Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TermSettingsDialog