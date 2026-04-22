// Weekly schedule card — fully functional calendar
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  X,
  Clock,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Event type
interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // "9:00 AM"
  title: string;
  description: string;
  color: string;
  avatars: string[];
}

// Color presets for new events
const colorPresets = [
  "#f3350c",
  "#3b82f6",
  "#22c55e",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
];

// 24-hour time slot options (every 30 min for event creation)
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

// Visible hourly slots on the grid (full 24 hours)
const visibleSlots = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);

// Helper — format date to YYYY-MM-DD
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Helper — get day name
function getDayName(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
}

// Helper — get the Monday of the week for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper - get week days (Mon-Sat, 6 days)
function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Helper — format 24h time for display ("09:00" → "9:00 AM", "14:30" → "2:30 PM")
function formatTime24to12(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// Initial events — loaded from API (see useEffect in WeeklyScheduleCard)

// Add Event Modal
function AddEventModal({
  selectedDate,
  onClose,
  onAdd,
}: {
  selectedDate: string;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [color, setColor] = useState(colorPresets[0]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      date: selectedDate,
      time,
      title: title.trim(),
      description: description.trim(),
      color,
      avatars: ["You"],
    });
    onClose();
  };

  const dateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString(
    "en-IN",
    { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Kolkata" }
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{ backgroundColor: "rgba(241,239,237,0.95)", borderRadius: "24px" }}
    >
      <div className="w-full max-w-sm px-6 py-5 space-y-4">
        {/* Modal header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" style={{ color: "#f3350c" }} />
            <h4 className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>
              New Event
            </h4>
          </div>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
        </div>

        <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          {dateLabel}
        </p>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          autoFocus
          className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none transition-colors focus:border-[#f3350c]/40 placeholder:text-[#ccc]"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.08)",
            color: "#ffffff",
          }}
        />

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none transition-colors focus:border-[#f3350c]/40 placeholder:text-[#ccc]"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.08)",
            color: "#ffffff",
          }}
        />

        {/* Time select */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.6)" }} />
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none transition-colors focus:border-[#f3350c]/40 appearance-none cursor-pointer"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.08)",
              color: "#ffffff",
            }}
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t} ({formatTime24to12(t)})</option>
            ))}
          </select>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            Color
          </span>
          <div className="flex gap-1.5">
            {colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-5 w-5 rounded-full transition-transform",
                  color === c && "scale-125 ring-2 ring-offset-1"
                )}
                style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-colors hover:bg-white/[0.06]"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", color: "#777" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={cn(
              "flex-1 py-2 rounded-xl text-[12px] font-semibold text-white transition-all",
              title.trim()
                ? "hover:opacity-90 active:scale-[0.98]"
                : "opacity-40 cursor-not-allowed"
            )}
            style={{ backgroundColor: "#ffffff" }}
          >
            Add Event
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function WeeklyScheduleCard() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => toDateStr(today), [today]);

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(today)
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch meetings from API for the current week
  const fetchMeetings = useCallback(async (weekStart: Date) => {
    setLoadingEvents(true);
    try {
      const from = toDateStr(weekStart) + "T00:00:00";
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const to = toDateStr(weekEnd) + "T23:59:59";
      const res = await fetch(`/api/meetings?from=${from}&to=${to}&limit=100`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped: CalendarEvent[] = (data.items || []).map((m: Record<string, unknown>) => {
        const start = new Date(m.startTime as string);
        const hours = String(start.getHours()).padStart(2, "0");
        const mins = String(start.getMinutes()).padStart(2, "0");
        const attendees = (m.attendeeIds as Array<Record<string, string>>) || [];
        return {
          id: (m.id as string) || "",
          date: toDateStr(start),
          time: `${hours}:${mins}`,
          title: (m.title as string) || "",
          description: (m.description as string) || "",
          color: colorPresets[Math.abs(((m.title as string) || "").length) % colorPresets.length],
          avatars: attendees.slice(0, 3).map((a) =>
            (a.name || "?")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          ),
        };
      });
      setEvents(mapped);
    } catch {
      // Keep empty
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Refetch when week changes
  useEffect(() => {
    fetchMeetings(currentWeekStart);
  }, [currentWeekStart, fetchMeetings]);

  // Computed week days
  const weekDays = useMemo(
    () => getWeekDays(currentWeekStart),
    [currentWeekStart]
  );

  // Current month label from the middle of the week
  const monthLabel = useMemo(() => {
    const mid = new Date(currentWeekStart);
    mid.setDate(mid.getDate() + 3);
    return mid.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }, [currentWeekStart]);

  // Navigate weeks
  const prevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(getWeekStart(today));
    setSelectedDate(todayStr);
  }, [today, todayStr]);

  // Ref for auto-scroll to current time
  const timeGridRef = useRef<HTMLDivElement>(null);

  // Events for selected day (sorted by 24h time)
  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate]
  );

  // Auto-scroll to current hour on mount
  useEffect(() => {
    const el = timeGridRef.current;
    if (!el) return;
    const hour = new Date().getHours();
    // Each slot row is ~44px, scroll to current hour minus 1 for context
    const scrollTarget = Math.max(0, (hour - 1)) * 44;
    el.scrollTop = scrollTarget;
  }, [selectedDate]);

  // Event count per day (for dot indicators)
  const eventCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => {
      map[e.date] = (map[e.date] || 0) + 1;
    });
    return map;
  }, [events]);

  // Add event via meetings API
  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, "id">) => {
    try {
      // Build startTime and endTime from date + time
      const startTime = new Date(`${eventData.date}T${eventData.time}:00`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendeeIds: [],
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      // Add to local state
      setEvents((prev) => [
        ...prev,
        {
          ...eventData,
          id: created.id || `evt-${Date.now()}`,
        },
      ]);
    } catch {
      // Fallback: add locally only
      setEvents((prev) => [
        ...prev,
        { ...eventData, id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ]);
    }
  }, []);

  // Delete event via meetings API
  const deleteEvent = useCallback(async (id: string) => {
    // Remove from local state immediately
    setEvents((prev) => prev.filter((e) => e.id !== id));
    // Try to delete from API (best-effort)
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    } catch {
      // Ignore — already removed from UI
    }
  }, []);

  // Check if a date is today
  const isToday = (d: Date) => toDateStr(d) === todayStr;

  // Check if week contains today
  const weekContainsToday = useMemo(() => {
    return weekDays.some((d) => isToday(d));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, todayStr]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden backdrop-blur-xl border border-white/10 relative"
      style={{
        backgroundColor: "rgba(11, 17, 32, 0.6)",
        borderRadius: "24px",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4" style={{ color: "#f3350c" }} />
          <h3
            className="text-[14px] font-semibold"
            style={{ color: "#ffffff" }}
          >
            Schedule
          </h3>
          {!weekContainsToday && (
            <button
              onClick={goToToday}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#f3350c" }}
            >
              Today
            </button>
          )}
        </div>
        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
          <span
            className="text-[12px] font-semibold min-w-[80px] text-center"
            style={{ color: "#ffffff" }}
          >
            {monthLabel}
          </span>
          <button
            onClick={nextWeek}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      <div
        className="mx-5 h-px flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      />

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-0.5 px-4 py-2.5 flex-shrink-0">
        {weekDays.map((day) => {
          const dateStr = toDateStr(day);
          const isTodayDay = isToday(day);
          const isSelected = dateStr === selectedDate;
          const eventCount = eventCountMap[dateStr] || 0;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: isSelected
                  ? isTodayDay
                    ? "#f3350c"
                    : "rgba(0,0,0,0.05)"
                  : "transparent",
              }}
            >
              <span
                className="text-[9px] uppercase font-medium"
                style={{
                  color:
                    isSelected && isTodayDay
                      ? "rgba(255,255,255,0.7)"
                      : "#bbb",
                }}
              >
                {getDayName(day)}
              </span>
              <span
                className="flex items-center justify-center h-7 w-7 rounded-full text-[13px] font-semibold"
                style={{
                  color:
                    isSelected && isTodayDay
                      ? "#fff"
                      : isSelected
                      ? "#1a1a1a"
                      : isTodayDay
                      ? "#f3350c"
                      : "#555",
                }}
              >
                {day.getDate()}
              </span>
              {/* Event dots / today dot */}
              <div className="flex gap-0.5 h-1.5">
                {isTodayDay && !isSelected && (
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: "#f3350c" }}
                  />
                )}
                {isTodayDay && isSelected && (
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: "#fff" }}
                  />
                )}
                {!isTodayDay && eventCount > 0 && (
                  <>
                    {Array.from({ length: Math.min(eventCount, 3) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: isSelected ? "#1a1a1a" : "#ccc",
                          }}
                        />
                      )
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="mx-5 h-px flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      />

      {/* Events header for selected day */}
      <div className="px-5 pt-2.5 pb-1.5 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", {
            weekday: "long",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Kolkata",
          })}
          {dayEvents.length > 0 && (
            <span style={{ color: "rgba(255,255,255,0.3)" }}>
              {" "}
              · {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-6 w-6 flex items-center justify-center rounded-full transition-colors hover:bg-white/5"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <Plus className="h-3 w-3" style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
      </div>

      {/* Time grid with events — all 24 hours, scrollable */}
      <div ref={timeGridRef} className="flex-1 overflow-y-auto px-5 pb-3">
        {loadingEvents ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 animate-pulse" style={{ minHeight: 200 }}>
            <Calendar className="h-5 w-5" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Loading events...</p>
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8" style={{ minHeight: 200 }}>
            <Calendar className="h-5 w-5" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              No events scheduled
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[11px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "#f3350c" }}
            >
              + Add event
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {visibleSlots.map((slotTime) => {
              // Collect events matching this hour or its :30 half
              const halfTime = slotTime.replace(":00", ":30");
              const allSlotEvents = dayEvents.filter(
                (e) => e.time === slotTime || e.time === halfTime
              );
              const currentHour = new Date().getHours();
              const slotHour = parseInt(slotTime.split(":")[0], 10);
              const isCurrentHour =
                selectedDate === todayStr && slotHour === currentHour;

              return (
                <div
                  key={slotTime}
                  className="flex gap-2.5 min-h-[44px] relative"
                  style={{ borderTop: "1px dashed rgba(255,255,255,0.04)" }}
                >
                  {/* Current hour indicator */}
                  {isCurrentHour && (
                    <div
                      className="absolute left-0 right-0 h-px z-10"
                      style={{ backgroundColor: "#f3350c", top: 0 }}
                    >
                      <div
                        className="absolute -left-0.5 -top-[3px] w-[7px] h-[7px] rounded-full"
                        style={{ backgroundColor: "#f3350c" }}
                      />
                    </div>
                  )}
                  <span
                    className="w-10 flex-shrink-0 text-[10px] pt-2 tabular-nums"
                    style={{ color: isCurrentHour ? "#f3350c" : "#ccc" }}
                  >
                    {slotTime}
                  </span>
                  <div className="flex-1 py-0.5 space-y-1">
                    {allSlotEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group flex items-center justify-between p-2.5 rounded-xl transition-shadow hover:shadow-sm cursor-pointer"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderLeft: `3px solid ${event.color}`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-[13px] font-semibold truncate"
                              style={{ color: "#ffffff" }}
                            >
                              {event.title}
                            </p>
                            <span
                              className="text-[9px] flex-shrink-0"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              {formatTime24to12(event.time)}
                            </span>
                          </div>
                          {event.description && (
                            <p
                              className="text-[11px] truncate"
                              style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                          {/* Avatar stack */}
                          <div className="flex -space-x-1.5">
                            {event.avatars.map((av, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-center h-5 w-5 rounded-full border-[1.5px] border-white text-[8px] font-semibold text-white"
                                style={{
                                  backgroundColor:
                                    idx === 0
                                      ? event.color
                                      : idx === 1
                                        ? "#3b82f6"
                                        : "#888",
                                }}
                              >
                                {av}
                              </div>
                            ))}
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(event.id);
                            }}
                            className="h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2
                              className="h-3 w-3"
                              style={{ color: "#f3350c" }}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddEventModal
            selectedDate={selectedDate}
            onClose={() => setShowAddModal(false)}
            onAdd={addEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
