import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays } from 'date-fns';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onDateSelect }) => {
  // Initialize currentMonth with time set to midnight to avoid timezone issues
  const initialMonth = new Date();
  initialMonth.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const nextMonth = () => {
    const next = addMonths(currentMonth, 1);
    next.setHours(0, 0, 0, 0);
    setCurrentMonth(next);
  };

  const prevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    prev.setHours(0, 0, 0, 0);
    setCurrentMonth(prev);
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={prevMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <h2 className="text-sm font-medium text-foreground">
          {format(currentMonth, 'MMM yyyy')}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={nextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = 'eeeee';
    const startDate = startOfWeek(currentMonth);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = endOfMonth(monthStart);
    monthEnd.setHours(23, 59, 59, 999);
    const startDate = startOfWeek(monthStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = endOfWeek(monthEnd);
    endDate.setHours(23, 59, 59, 999);

    const rows = [];
    let days = [];
    let day = new Date(startDate);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isSelected = isSameDay(day, selectedDate);
        
        const cellDay = new Date(day); // Create a copy for the cell
        
        days.push(
          <div
            key={day.toString()}
            className={`h-8 sm:h-10 flex items-center justify-center text-xs sm:text-sm cursor-pointer rounded
              ${!isCurrentMonth ? 'text-muted-foreground opacity-50' : 'text-foreground'}
              ${isSelected ? 'bg-primary text-primary-foreground' : ''}
              ${isSameDay(day, new Date(new Date().setHours(0, 0, 0, 0))) && !isSelected ? 'bg-accent text-accent-foreground' : ''}
              hover:bg-muted transition-colors
            `}
            onClick={() => {
              // Create a new Date object to avoid timezone issues
              const selectedDateObj = new Date(cellDay);
              // Reset time to midnight to avoid timezone issues
              selectedDateObj.setHours(0, 0, 0, 0);
              onDateSelect(selectedDateObj);
            }}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="p-2 sm:p-3 border rounded-lg bg-card">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default CustomCalendar;