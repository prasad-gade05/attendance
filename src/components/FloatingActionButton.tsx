import React from 'react'
import { Button } from './ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <Plus className="h-5 w-5" />,
  children,
  className
}) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 z-50",
        children && "w-auto px-6",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div>
          {icon}
        </div>
        {children && (
          <>
            {children}
          </> 
        )}
      </div>
    </Button>
  )
}
export default FloatingActionButton