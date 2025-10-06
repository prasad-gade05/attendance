# Import Attendance Feature: Scenarios and Considerations

## Feature Description

The "Import Attendance" feature is designed for users who have been tracking their attendance outside of TimeFlow and want to import their existing data into the application. This feature allows users to input their total attendance figures for a specific subject up to a chosen date. Once the data is imported, TimeFlow will take over and continue tracking attendance from that date forward.

### Why is this feature useful?

- **Seamless Onboarding**: New users can easily migrate their existing attendance data without having to manually mark each past lecture.
- **Data Correction**: If a user makes a mistake in their attendance tracking, they can use this feature to correct their data up to a certain point.
- **Flexibility**: It provides a way to synchronize the app with external records, such as an official university attendance portal.

### How it works

1.  **User-Friendly Dialog**: The user will be presented with a simple dialog where they can:
    *   Select the subject they want to import attendance for.
    *   Choose a date up to which the attendance data is valid.
    *   Enter the total number of lectures conducted, attended, missed, and cancelled.

2.  **Data Locking**: After the import, all attendance records for that subject on or before the selected date will be locked and cannot be edited. This ensures data consistency.

3.  **Continuous Tracking**: For all dates after the import date, the application will continue to track attendance as usual, with all calculations building upon the imported data.

This document outlines the various scenarios and edge cases to consider when implementing the "Import Attendance" feature in the TimeFlow application. The goal of this feature is to allow users to input their attendance data for a specific subject up to a certain date, after which the application will take over for future calculations.

## 1. Core Logic and Data Handling

### 1.1. Data Storage
- **New Table for Imported Data**: Create a new table in IndexedDB, `importedAttendance`, to store the imported data. This table should include:
  - `id` (primary key)
  - `subjectId`
  - `importDate` (the date up to which the attendance is imported)
  - `totalLectures`
  - `attendedLectures`
  - `missedLectures`
  - `cancelledLectures`
- **Locking Mechanism**: The `importedAttendance` table will serve as a locking mechanism. If a record exists for a subject, any date for that subject on or before the `importDate` will be locked for editing.

### 1.2. Data Overwriting and Consistency
- **Existing Attendance Records**: When a user imports attendance for a subject up to a specific date, all existing `attendanceRecords` for that subject on or before that date must be deleted to avoid conflicts.
- **Extra Classes**: Any `extraClasses` for the subject on or before the import date should also be deleted, as they would have been included in the imported totals.
- **Combined Slots**: The import process should not be affected by combined slots, as it deals with the total number of lectures. However, the UI should be locked for these slots as well.

## 2. User Interface and User Experience

### 2.1. Import Dialog
- **Input Fields**: The import dialog should have the following fields:
  - A dropdown to select the `subject`.
  - A date picker for the `importDate`.
  - Numeric inputs for `totalLectures`, `attendedLectures`, `missedLectures`, and `cancelledLectures`.
- **Validation**:
  - The sum of `attendedLectures`, `missedLectures`, and `cancelledLectures` must equal `totalLectures`.
  - The `importDate` cannot be in the future.
  - A subject can only have one import record. If a user tries to import again, they should be asked if they want to overwrite the previous import.

### 2.2. UI Locking and Visual Feedback
- **Locked Dates**: In the `TodaySchedule` view, if the selected date is on or before the `importDate` for a subject, the attendance controls for that subject should be disabled.
- **Visual Indicator**: A visual indicator (e.g., a lock icon) should be displayed next to the subject on the `TodayScheduleItem` to indicate that the attendance has been imported and is locked.
- **Tooltip**: A tooltip on the lock icon should explain why the controls are disabled (e.g., "Attendance for this subject has been imported up to [importDate] and cannot be edited.").

## 3. Calculation and Statistics

### 3.1. Attendance Statistics (`AttendanceStatsPanel.tsx`)
- **`calculateDetailedStats` Function**: This function needs to be updated to incorporate the imported data.
- **Logic**:
  1. For each subject, check if there is an `importedAttendance` record.
  2. If a record exists, use the imported values as the base for calculations up to the `importDate`.
  3. For dates *after* the `importDate`, calculate the attendance as usual and add it to the imported totals.
  4. If no import record exists, the calculation remains as it is.

### 3.2. Attendance Simulation (`SimulationDialog.tsx`)
- **`calculateSimulationData` Function**: This function also needs to be updated.
- **Logic**:
  1. The "current" attendance stats should be calculated using the same logic as in the `AttendanceStatsPanel` (i.e., including imported data).
  2. The "future lectures" calculation should only consider lectures scheduled *after* the `importDate`.

## 4. Edge Case Scenarios

### 4.1. Holidays and Exam Days
- **Before Import Date**: Holidays and exam days on or before the `importDate` are irrelevant to the imported subject, as the user provides the final counts.
- **After Import Date**: Holidays and exam days after the `importDate` should be handled as usual, excluding them from future attendance calculations.

### 4.2. Subject Changes
- **Changed Lectures Before Import Date**: If a lecture for another subject was changed *to* the imported subject on a date before the `importDate`, this record should be deleted during the import process.
- **Changed Lectures After Import Date**: If a lecture is changed to the imported subject *after* the `importDate`, it should be counted as a new lecture for that subject.

### 4.3. Deleting Subjects
- **Deleting an Imported Subject**: If a user deletes a subject that has an `importedAttendance` record, the corresponding record in the `importedAttendance` table must also be deleted.

### 4.4. Clearing All Data
- **`clearAllData` Function**: This function should also clear the new `importedAttendance` table.

By addressing these scenarios, you can ensure that the "Import Attendance" feature is robust, reliable, and maintains the integrity of the application's data.