import React from 'react'
import { Loader2, Clock } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        <Clock className={`${sizeClasses[size]} absolute inset-0 animate-pulse-gentle text-purple-400 opacity-50`} />
      </div>
      {text && (
        <p className="text-sm text-slate-600 animate-pulse-gentle">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner