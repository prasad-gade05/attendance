import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, BookOpen } from "lucide-react";
import {
  format,
  parseISO,
  eachDayOfInterval,
  isWithinInterval,
  getDay,
  isBefore,
  isEqual,
} from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useTimetable } from "../hooks/useTimetable";
import { useSchedule } from "../hooks/useSchedule";
import { AttendanceStats } from "../types";

interface AttendanceStatsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AttendanceStatsPanel: React.FC<AttendanceStatsPanelProps> = ({
  open,
  onOpenChange,
}) => {
  const [detailedStats, setDetailedStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(false);

  const { subjects, timeSlots, daySlots, combinedSlots } = useTimetable();
  const {
    attendanceRecords,
    specialDates,
    extraClasses,
    termSettings,
    getAttendanceStats,
    isDateInTerm,
    importedAttendance,
    isDateLockedForSubject,
    getImportedAttendanceForSubject,
  } = useSchedule();

  useEffect(() => {
    if (open) {
      calculateDetailedStats();
    }
  }, [
    open,
    attendanceRecords,
    termSettings,
    specialDates,
    extraClasses,
    subjects,
    timeSlots,
    daySlots,
    importedAttendance, // Add importedAttendance as dependency
  ]);

  const calculateDetailedStats = async () => {
    if (!termSettings) return;

    setLoading(true);
    try {
      const stats: { [key: string]: AttendanceStats } = {};

      // Initialize stats for all subjects
      subjects.forEach((subject) => {
        stats[subject.id] = {
          subjectId: subject.id,
          totalLectures: 0,
          attendedLectures: 0,
          missedLectures: 0,
          cancelledLectures: 0,
        };
      });

      // Calculate total lectures that should have happened
      const termStart = parseISO(termSettings.startDate);
      const termEnd = parseISO(termSettings.endDate);
      const today = new Date();
      const calculationEnd = today < termEnd ? today : termEnd;

      // Get all days in the term up to today
      const allDays = eachDayOfInterval({
        start: termStart,
        end: calculationEnd,
      });

      // Process each subject to handle imported attendance
      for (const subject of subjects) {
        const imported = getImportedAttendanceForSubject(subject.id);

        if (imported) {
          // Use imported data as base
          stats[subject.id] = {
            subjectId: subject.id,
            totalLectures: imported.totalLectures,
            attendedLectures: imported.attendedLectures,
            missedLectures: imported.missedLectures,
            cancelledLectures: imported.cancelledLectures,
          };
        }
      }

      for (const date of allDays) {
        const dateString = format(date, "yyyy-MM-dd");
        const dayName = DAYS[getDay(date)];

        // Skip special dates (holidays/exams)
        const isSpecial = specialDates.some((sd) => sd.date === dateString);
        if (isSpecial) continue;

        // Get scheduled lectures for this day
        const dayLectures = daySlots.filter(
          (ds) => ds.day === dayName && ds.subjectId
        );

        // Process regular lectures
        for (const daySlot of dayLectures) {
          // Check if this slot is part of a combined slot
          const combinedSlot = combinedSlots.find(
            (cs) => cs.day === dayName && cs.daySlotIds.includes(daySlot.id)
          );

          let subjectId = daySlot.subjectId!;
          let shouldCount = true;

          if (combinedSlot) {
            // Only count the first slot of a combined slot
            const firstDaySlotId = combinedSlot.daySlotIds
              .map((id) => daySlots.find((ds) => ds.id === id))
              .filter(Boolean)
              .sort((a, b) => {
                const aTimeSlot = timeSlots.find(
                  (ts) => ts.id === a!.timeSlotId
                );
                const bTimeSlot = timeSlots.find(
                  (ts) => ts.id === b!.timeSlotId
                );
                return aTimeSlot!.startTime.localeCompare(bTimeSlot!.startTime);
              })[0]?.id;

            shouldCount = daySlot.id === firstDaySlotId;
            subjectId = combinedSlot.subjectId;
          }

          // Check if this date is locked for this subject
          if (isDateLockedForSubject(dateString, subjectId)) {
            shouldCount = false;
          }

          if (shouldCount) {
            // Check if there's an attendance record for this lecture
            const attendanceRecord = attendanceRecords.find(
              (ar) =>
                ar.date === dateString && ar.timeSlotId === daySlot.timeSlotId
            );

            if (attendanceRecord) {
              const actualSubjectId =
                attendanceRecord.actualSubjectId ||
                attendanceRecord.originalSubjectId ||
                subjectId;

              if (attendanceRecord.status !== "cancelled") {
                stats[actualSubjectId].totalLectures++;

                if (attendanceRecord.status === "attended") {
                  stats[actualSubjectId].attendedLectures++;
                } else if (attendanceRecord.status === "missed") {
                  stats[actualSubjectId].missedLectures++;
                }
              } else {
                stats[actualSubjectId].cancelledLectures++;
              }
            } else {
              // No attendance record - count as total lecture but not attended/missed
              stats[subjectId].totalLectures++;
            }
          }
        }
      }

      // Process extra classes
      extraClasses.forEach((extraClass) => {
        // Only count extra classes that are within the term
        if (isDateInTerm(extraClass.date)) {
          const subjectId = extraClass.subjectId;

          // Check if this date is locked for this subject
          if (isDateLockedForSubject(extraClass.date, subjectId)) {
            return; // Skip locked dates
          }

          // Initialize stats for this subject if not already present
          if (!stats[subjectId]) {
            stats[subjectId] = {
              subjectId: subjectId,
              totalLectures: 0,
              attendedLectures: 0,
              missedLectures: 0,
              cancelledLectures: 0,
            };
          }

          // Check if there's an attendance record for this extra class
          const attendanceRecord = attendanceRecords.find(
            (ar) =>
              ar.date === extraClass.date &&
              ar.timeSlotId === extraClass.timeSlotId
          );

          if (attendanceRecord) {
            // Use the actual attendance record status
            if (attendanceRecord.status !== "cancelled") {
              stats[subjectId].totalLectures++;

              if (attendanceRecord.status === "attended") {
                stats[subjectId].attendedLectures++;
              } else if (attendanceRecord.status === "missed") {
                stats[subjectId].missedLectures++;
              }
            } else {
              stats[subjectId].cancelledLectures++;
            }
          } else {
            // No attendance record - count as total lecture and attended by default
            // (This matches the behavior in TodayScheduleItem where extra classes default to attended)
            stats[subjectId].totalLectures++;
            stats[subjectId].attendedLectures++;
          }
        }
      });

      setDetailedStats(
        Object.values(stats).filter((stat) => stat.totalLectures > 0)
      );
    } catch (error) {
      // Error handling without console logging
    } finally {
      setLoading(false);
    }
  };

  const getAttendancePercentage = (stat: AttendanceStats) => {
    if (stat.totalLectures === 0) return 0;
    return Math.round((stat.attendedLectures / stat.totalLectures) * 100);
  };

  const getTotalStats = () => {
    return detailedStats.reduce(
      (total, stat) => ({
        totalLectures: total.totalLectures + stat.totalLectures,
        attendedLectures: total.attendedLectures + stat.attendedLectures,
        missedLectures: total.missedLectures + stat.missedLectures,
        cancelledLectures: total.cancelledLectures + stat.cancelledLectures,
      }),
      {
        totalLectures: 0,
        attendedLectures: 0,
        missedLectures: 0,
        cancelledLectures: 0,
      }
    );
  };

  const totalStats = getTotalStats();
  const overallPercentage =
    totalStats.totalLectures > 0
      ? Math.round(
          (totalStats.attendedLectures / totalStats.totalLectures) * 100
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Statistics
          </DialogTitle>
        </DialogHeader>

        {!termSettings ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Please set up term dates to view attendance statistics
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">
              Calculating statistics...
            </p>
          </div>
        ) : (
          <Tabs defaultValue="by-subject" className="space-y-4">
            <TabsList>
              <TabsTrigger value="by-subject">By Subject</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Overall Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {overallPercentage}%
                      </span>
                      <Badge
                        variant={
                          overallPercentage >= 75 ? "default" : "destructive"
                        }
                      >
                        {overallPercentage >= 75 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                    <Progress value={overallPercentage} className="h-2" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalStats.totalLectures}
                        </div>
                        <div className="text-muted-foreground">
                          Total Lectures
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {totalStats.attendedLectures}
                        </div>
                        <div className="text-muted-foreground">Attended</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {totalStats.missedLectures}
                        </div>
                        <div className="text-muted-foreground">Missed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {totalStats.cancelledLectures}
                        </div>
                        <div className="text-muted-foreground">Cancelled</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Term Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Term Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Term Start:</span>
                      <div className="font-medium">
                        {format(
                          parseISO(termSettings.startDate),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Term End:</span>
                      <div className="font-medium">
                        {format(parseISO(termSettings.endDate), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-subject" className="space-y-4">
              {detailedStats.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No attendance data available for the current term
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {detailedStats
                    .sort(
                      (a, b) =>
                        getAttendancePercentage(b) - getAttendancePercentage(a)
                    )
                    .map((stat) => {
                      const subject = subjects.find(
                        (s) => s.id === stat.subjectId
                      );
                      const percentage = getAttendancePercentage(stat);
                      const imported = getImportedAttendanceForSubject(
                        stat.subjectId
                      );

                      if (!subject) return null;

                      return (
                        <Card key={stat.subjectId}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: subject.color }}
                                />
                                <CardTitle className="text-lg">
                                  {subject.name}
                                  {imported && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      (Imported)
                                    </span>
                                  )}
                                </CardTitle>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">
                                  {percentage}%
                                </div>
                                <Badge
                                  variant={
                                    percentage >= 75 ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {percentage >= 75 ? "Good" : "Low"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Progress value={percentage} className="h-2 mb-4" />
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-blue-600">
                                  {stat.totalLectures}
                                </div>
                                <div className="text-muted-foreground">
                                  Total
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-600">
                                  {stat.attendedLectures}
                                </div>
                                <div className="text-muted-foreground">
                                  Attended
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">
                                  {stat.missedLectures}
                                </div>
                                <div className="text-muted-foreground">
                                  Missed
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-yellow-600">
                                  {stat.cancelledLectures}
                                </div>
                                <div className="text-muted-foreground">
                                  Cancelled
                                </div>
                              </div>
                            </div>
                            {imported && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Imported data up to {imported.importDate}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceStatsPanel;
