import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useTimetable } from "../hooks/useTimetable";
import { useSchedule } from "../hooks/useSchedule";
import { db } from "../lib/db";
import { Download, Upload } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface ExportData {
  subjects: any[];
  timeSlots: any[];
  daySlots: any[];
  combinedSlots: any[];
  attendanceRecords: any[];
  specialDates: any[];
  extraClasses: any[];
  termSettings: any[];
  importedAttendance: any[];
}

const ImportExportDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const { loadData: loadTimetableData } = useTimetable();
  const { refreshData: refreshScheduleData } = useSchedule();

  const handleExport = async () => {
    try {
      // Get all data from the database
      const exportData: ExportData = {
        subjects: await db.subjects.toArray(),
        timeSlots: await db.timeSlots.toArray(),
        daySlots: await db.daySlots.toArray(),
        combinedSlots: await db.combinedSlots.toArray(),
        attendanceRecords: await db.attendanceRecords.toArray(),
        specialDates: await db.specialDates.toArray(),
        extraClasses: await db.extraClasses.toArray(),
        termSettings: await db.termSettings.toArray(),
        importedAttendance: await db.importedAttendance.toArray(),
      };

      // Create a blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      setImportSuccess(false);

      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Clear existing data
      await db.clearAllData();

      // Import data in batches to avoid transaction limits
      // Import subjects
      if (importData.subjects?.length) {
        await db.subjects.bulkAdd(importData.subjects);
      }

      // Import time slots
      if (importData.timeSlots?.length) {
        await db.timeSlots.bulkAdd(importData.timeSlots);
      }

      // Import day slots
      if (importData.daySlots?.length) {
        await db.daySlots.bulkAdd(importData.daySlots);
      }

      // Import combined slots
      if (importData.combinedSlots?.length) {
        await db.combinedSlots.bulkAdd(importData.combinedSlots);
      }

      // Import attendance records
      if (importData.attendanceRecords?.length) {
        await db.attendanceRecords.bulkAdd(importData.attendanceRecords);
      }

      // Import special dates
      if (importData.specialDates?.length) {
        await db.specialDates.bulkAdd(importData.specialDates);
      }

      // Import extra classes
      if (importData.extraClasses?.length) {
        await db.extraClasses.bulkAdd(importData.extraClasses);
      }

      // Import term settings
      if (importData.termSettings?.length) {
        await db.termSettings.bulkAdd(importData.termSettings);
      }

      // Import imported attendance
      if (importData.importedAttendance?.length) {
        await db.importedAttendance.bulkAdd(importData.importedAttendance);
      }

      // Refresh data in both providers
      await Promise.all([loadTimetableData(), refreshScheduleData()]);

      setImportSuccess(true);
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Import failed:", error);
      setImportError(
        error instanceof Error ? error.message : "Failed to import data"
      );
      
      // Reset file input
      event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import/Export Data</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download all your attendance data as a JSON file.
            </p>
            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Import Data</h3>
            <p className="text-sm text-muted-foreground">
              Import attendance data from a previously exported JSON file.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file">
              <Button asChild className="w-full">
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </span>
              </Button>
            </label>
            
            {importSuccess && (
              <Alert>
                <AlertDescription>
                  Data imported successfully! The page will refresh momentarily.
                </AlertDescription>
              </Alert>
            )}
            
            {importError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {importError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>
              <strong>Note:</strong> Importing data will replace all current data.
              Make sure to export your current data first if you want to keep it.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportDialog;