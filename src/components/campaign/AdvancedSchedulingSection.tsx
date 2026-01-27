/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Repeat, CalendarX } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface AdvancedSchedulingSectionProps {
  runMode: "INSTANT" | "SCHEDULE";
  runSchedule?: string;
  isRecurring: boolean;
  isOnGoing: boolean;
  recurringPeriod?: string;
  durationValue: string;
  timeUnit: "minute" | "hour" | "day" | "month" | "year";
  onRunModeChange: (mode: "INSTANT" | "SCHEDULE") => void;
  onRunScheduleChange: (schedule: string) => void;
  onRecurringChange: (recurring: boolean) => void;
  onOngoingChange: (ongoing: boolean) => void;
  onDurationChange: (value: string) => void;
  onTimeUnitChange: (
    unit: "minute" | "hour" | "day" | "month" | "year",
  ) => void;
  onEndDateChange?: (endDate: string | undefined) => void;
  endDate?: string;
}

export function AdvancedSchedulingSection({
  runMode,
  runSchedule,
  isRecurring,
  isOnGoing,
  durationValue,
  timeUnit,
  onRunModeChange,
  onRunScheduleChange,
  onRecurringChange,
  onOngoingChange,
  onDurationChange,
  onTimeUnitChange,
  onEndDateChange,
  endDate,
}: AdvancedSchedulingSectionProps) {
  const [nextRuns, setNextRuns] = useState<string[]>([]);

  useEffect(() => {
    if (isRecurring && runSchedule && durationValue && timeUnit) {
      const scheduleDate = dayjs(runSchedule);
      const duration = parseInt(durationValue, 10);
      const runs: string[] = [];
      let currentDate = scheduleDate;

      for (let i = 0; i < 5; i++) {
        if (endDate && currentDate.isAfter(dayjs(endDate))) {
          break;
        }
        runs.push(currentDate.format("MMM D, YYYY [at] h:mm A"));
        currentDate = currentDate.add(duration, timeUnit);
      }

      setNextRuns(runs);
    } else {
      setNextRuns([]);
    }
  }, [isRecurring, runSchedule, durationValue, timeUnit, endDate]);

  const minDateTime = dayjs().add(5, "minute").format("YYYY-MM-DDTHH:mm");

  return (
    <div className="space-y-4">
      {/* Send Time Selection */}
      <div>
        <Label className="mb-3 block">Send Time *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-colors hover:border-sidebar-primary/50",
              runMode === "INSTANT" &&
                "border-sidebar-primary bg-sidebar-primary/10",
            )}
            onClick={() => onRunModeChange("INSTANT")}
          >
            <CardContent className="p-4 text-center">
              <Clock
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  runMode === "INSTANT"
                    ? "text-sidebar-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="font-medium">Send Now</div>
              <div className="text-xs text-muted-foreground mt-1">
                Execute immediately
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "cursor-pointer transition-colors hover:border-sidebar-primary/50",
              runMode === "SCHEDULE" &&
                "border-sidebar-primary bg-sidebar-primary/10",
            )}
            onClick={() => onRunModeChange("SCHEDULE")}
          >
            <CardContent className="p-4 text-center">
              <Calendar
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  runMode === "SCHEDULE"
                    ? "text-sidebar-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="font-medium">Schedule</div>
              <div className="text-xs text-muted-foreground mt-1">
                Schedule for later
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scheduled Date/Time */}
      {runMode === "SCHEDULE" && (
        <div className="space-y-2">
          <Label>Schedule Date & Time *</Label>
          <Input
            type="datetime-local"
            min={minDateTime}
            value={runSchedule || minDateTime}
            onChange={(e) => onRunScheduleChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Campaign will start at this date and time (minimum 5 minutes from
            now)
          </p>
          {runSchedule && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Scheduled for:</p>
              <p className="text-sm text-muted-foreground">
                {dayjs(runSchedule).format("dddd, MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Campaign Type Options */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Ongoing Campaign</Label>
            <p className="text-sm text-muted-foreground">
              Keep this campaign running continuously without end date
            </p>
          </div>
          <Checkbox
            checked={isOnGoing}
            onCheckedChange={(checked) => {
              onOngoingChange(checked as boolean);
              if (checked) {
                onRecurringChange(false);
                onEndDateChange?.(undefined);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Repeat Campaign</Label>
            <p className="text-sm text-muted-foreground">
              Campaign will repeat at specified intervals
            </p>
          </div>
          <Checkbox
            checked={isRecurring}
            onCheckedChange={(checked) => {
              onRecurringChange(checked as boolean);
              if (checked) {
                onOngoingChange(false);
              }
            }}
          />
        </div>
      </div>

      {/* Recurring Configuration */}
      {isRecurring && (
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              Recurring Settings
            </CardTitle>
            <CardDescription>
              Configure how often the campaign repeats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Repeat Every</Label>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  placeholder="1"
                  value={durationValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      onDurationChange(val);
                    }
                  }}
                  className="w-24"
                  min="1"
                />
                <Select
                  value={timeUnit}
                  onValueChange={(
                    val: "minute" | "hour" | "day" | "month" | "year",
                  ) => onTimeUnitChange(val)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Minute(s)</SelectItem>
                    <SelectItem value="hour">Hour(s)</SelectItem>
                    <SelectItem value="day">Day(s)</SelectItem>
                    <SelectItem value="month">Month(s)</SelectItem>
                    <SelectItem value="year">Year(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {durationValue && (
                <p className="text-sm text-muted-foreground">
                  Campaign will repeat every {durationValue} {timeUnit}
                  {parseInt(durationValue) > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Next Runs Preview */}
            {nextRuns.length > 0 && runSchedule && (
              <div className="mt-4 p-4 bg-muted/50 border rounded-lg">
                <Label className="text-sm font-medium mb-3 block">
                  Next Scheduled Runs:
                </Label>
                <div className="space-y-2">
                  {nextRuns.map((run, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <Badge
                        variant="secondary"
                        className="text-xs min-w-[60px] justify-center"
                      >
                        Run {index + 1}
                      </Badge>
                      <span className="text-muted-foreground">{run}</span>
                    </div>
                  ))}
                  {endDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <CalendarX className="h-3 w-3" />
                      Ends on {dayjs(endDate).format("MMM D, YYYY")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ongoing Campaign Info */}
      {isOnGoing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ongoing Campaign</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This campaign will run continuously and check for new matching
                  contacts every minute. It will keep running until manually
                  paused or archived.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
