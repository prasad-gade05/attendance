import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-slate-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 -m-6 mb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-medium text-slate-900">
              {getIcon()}
              {title}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6 pb-2">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-slate-300 hover:bg-slate-50 transition-all duration-200"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={variant}
            className={`flex-1 transition-all duration-200 ${
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog