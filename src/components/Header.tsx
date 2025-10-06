import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { useTimetable } from "../hooks/useTimetable";
import { useSchedule } from "../hooks/useSchedule";
import { Trash2, Calendar, CalendarDays, Grid3X3, Download, Menu, X } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import ConfirmDialog from "./ConfirmDialog";
import ImportExportDialog from "./ImportExportDialog";

const Header = () => {
  const { clearAllData: clearTimetableData, loadData: loadTimetableData } =
    useTimetable();
  const { clearAllData: clearScheduleData, refreshData: refreshScheduleData } =
    useSchedule();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClearAllData = async () => {
    try {
      // Clear all data from both providers
      await Promise.all([clearTimetableData(), clearScheduleData()]);

      // Refresh data in both providers
      await Promise.all([loadTimetableData(), refreshScheduleData()]);

      // Perform a full page refresh to ensure UI consistency
      window.location.reload();
    } catch (error) {
      // Error handling without console logging
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false); // Close menu on mobile after navigation
    }
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                TimeFlow
              </h1>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                Smart Schedule Management
              </p>
            </div>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 sm:hidden">
          <ImportExportDialog />
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("schedule")}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Today's Schedule
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("timetable")}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Timetable
            </Button>
          </div>

          <ImportExportDialog />
          <ThemeSwitcher />
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

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-background border-t px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 pb-2 border-b">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => scrollToSection("schedule")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Today's Schedule
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => scrollToSection("timetable")}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Timetable
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default Header;