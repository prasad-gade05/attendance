import React, { useState, useEffect } from "react";
import { format, isFuture } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Calendar, Upload, AlertCircle } from "lucide-react";
import { Subject } from "../types";
import CustomCalendar from "./CustomCalendar";
import { useSchedule } from "../hooks/useSchedule";
import { useTimetable } from "../hooks/useTimetable";

interface ImportAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: {
    subjectId: string;
    importDate: string;
    totalLectures: number;
    attendedLectures: number;
    missedLectures: number;
    cancelledLectures: number;
  }) => Promise<void>;
}

const ImportAttendanceDialog: React.FC<ImportAttendanceDialogProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const { subjects } = useTimetable();
  const { termSettings } = useSchedule();

  // Initialize selectedDate with time set to midnight to avoid timezone issues
  const initialDate = new Date();
  initialDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const [subjectId, setSubjectId] = useState("");
  const [totalLectures, setTotalLectures] = useState("");
  const [attendedLectures, setAttendedLectures] = useState("");
  const [missedLectures, setMissedLectures] = useState("");
  const [cancelledLectures, setCancelledLectures] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setSubjectId("");
    setTotalLectures("");
    setAttendedLectures("");
    setMissedLectures("");
    setCancelledLectures("");
    setError("");

    // Reset date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  const validateForm = () => {
    // Reset error
    setError("");

    // Check if subject is selected
    if (!subjectId) {
      setError("Please select a subject");
      return false;
    }

    // Check if all fields are filled (including "0" as a valid value)
    if (
      totalLectures === "" ||
      attendedLectures === "" ||
      missedLectures === "" ||
      cancelledLectures === ""
    ) {
      setError("Please fill in all lecture counts");
      return false;
    }

    const total = parseInt(totalLectures);
    const attended = parseInt(attendedLectures);
    const missed = parseInt(missedLectures);
    const cancelled = parseInt(cancelledLectures);

    // Validate numbers
    if (isNaN(total) || isNaN(attended) || isNaN(missed) || isNaN(cancelled)) {
      setError("Please enter valid numbers for all lecture counts");
      return false;
    }

    // Check if all numbers are non-negative
    if (total < 0 || attended < 0 || missed < 0 || cancelled < 0) {
      setError("Lecture counts cannot be negative");
      return false;
    }

    // Check if the sum matches
    if (attended + missed + cancelled !== total) {
      setError(
        "The sum of attended, missed, and cancelled lectures must equal total lectures"
      );
      return false;
    }

    // Check if import date is not in the future
    const importDateString = format(selectedDate, "yyyy-MM-dd");
    if (isFuture(selectedDate)) {
      setError("Import date cannot be in the future");
      return false;
    }

    // Check if import date is within term
    if (termSettings) {
      const termStart = new Date(termSettings.startDate);
      termStart.setHours(0, 0, 0, 0);
      const termEnd = new Date(termSettings.endDate);
      termEnd.setHours(23, 59, 59, 999);

      if (selectedDate < termStart || selectedDate > termEnd) {
        setError("Import date must be within the current term period");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onImport({
        subjectId,
        importDate: format(selectedDate, "yyyy-MM-dd"),
        totalLectures: parseInt(totalLectures),
        attendedLectures: parseInt(attendedLectures),
        missedLectures: parseInt(missedLectures),
        cancelledLectures: parseInt(cancelledLectures),
      });

      // Close dialog on success
      onOpenChange(false);
    } catch (err) {
      setError("Failed to import attendance data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Attendance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span>{subject.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Import Date</Label>
            <div className="border rounded-lg bg-card">
              <CustomCalendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const newDate = new Date(date);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select the date up to which attendance data is valid
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="total">Total Lectures</Label>
              <Input
                id="total"
                type="number"
                min="0"
                value={totalLectures}
                onChange={(e) => setTotalLectures(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attended">Attended</Label>
              <Input
                id="attended"
                type="number"
                min="0"
                value={attendedLectures}
                onChange={(e) => setAttendedLectures(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="missed">Missed</Label>
              <Input
                id="missed"
                type="number"
                min="0"
                value={missedLectures}
                onChange={(e) => setMissedLectures(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancelled">Cancelled</Label>
              <Input
                id="cancelled"
                type="number"
                min="0"
                value={cancelledLectures}
                onChange={(e) => setCancelledLectures(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                "Import Attendance"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAttendanceDialog;
