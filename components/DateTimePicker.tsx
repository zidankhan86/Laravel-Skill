import { COPY } from "../content";
import { EditText } from "./EditBinding";
import React, { useRef, useState, useId, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export default function DateTimePicker({
  value,
  onChange,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);
  const [day, setDay] = useState(key(new Date())),
    [time, setTime] = useState("09:00"),
    [month, setMonth] = useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const first = new Date(month.getFullYear(), month.getMonth(), 1),
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const open = () => {
    const selected = value ? new Date(value) : new Date();
    setDay(key(selected));
    setTime(value ? value.slice(11, 16) : "09:00");
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    dialog.current?.showModal();
    setOpened(true);
  };
  function moveDay(date: Date, amount: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    requestAnimationFrame(() =>
      dialog.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${key(next)}"]`)
        ?.focus(),
    );
  }
  return (
    <div className="date-time-field">
      <span id={titleId}>
        <EditText source="settings/ui/dateLabel">{COPY.ui.dateLabel}</EditText>
      </span>
      <input type="hidden" name="time" value={value} />
      <button
        ref={trigger}
        type="button"
        className="date-picker-trigger"
        aria-labelledby={titleId}
        aria-haspopup="dialog"
        aria-invalid={invalid}
        onClick={open}
      >
        <CalendarDays size={19} aria-hidden="true" />
        <span>
          {value ? (
            new Date(value).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          ) : (
            <EditText source="settings/ui/datePlaceholder">
              {COPY.ui.datePlaceholder}
            </EditText>
          )}
        </span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
      <small>
        <EditText source="settings/ui/timezoneLabel">
          {COPY.ui.timezoneLabel}
        </EditText>{" "}
        {Intl.DateTimeFormat().resolvedOptions().timeZone}.{" "}
        <EditText source="settings/ui/bookingNotice">
          {COPY.ui.bookingNotice}
        </EditText>
      </small>
      <dialog
        className="date-picker-dialog"
        onClose={() => setOpened(false)}
        ref={dialog}
        aria-label="Choose a date and time"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="calendar-top">
          <div>
            <span className="eyebrow">LET’S FIND A TIME</span>
            <h2>Plan your conversation</h2>
          </div>
          <button
            type="button"
            className="calendar-icon"
            aria-label="Close calendar"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <div className="calendar-month">
          <button
            type="button"
            className="calendar-icon"
            aria-label="Previous month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={20} />
          </button>
          <strong aria-live="polite">
            {month.toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </strong>
          <button
            type="button"
            className="calendar-icon"
            aria-label="Next month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="calendar-grid">
          <div className="calendar-week" aria-hidden="true">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <div className="calendar-days">
            {Array.from({ length: first.getDay() }, (_, i) => (
              <span key={"blank" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  i + 1,
                ),
                dateKey = key(date);
              return (
                <button
                  type="button"
                  key={dateKey}
                  data-date={dateKey}
                  aria-label={date.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  aria-pressed={day === dateKey}
                  className={dateKey === key(new Date()) ? "is-today" : ""}
                  onClick={() => setDay(dateKey)}
                  onKeyDown={(e) => {
                    const offsets: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    };
                    if (e.key in offsets) {
                      e.preventDefault();
                      moveDay(date, offsets[e.key]);
                    }
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="calendar-time">
          <span>Preferred time</span>
          <div>
            <label>
              Hour
              <select
                aria-label="Hour"
                value={time.slice(0, 2)}
                onChange={(e) => setTime(e.target.value + time.slice(2))}
              >
                {Array.from({ length: 24 }, (_, i) =>
                  String(i).padStart(2, "0"),
                ).map((hour) => (
                  <option key={hour}>{hour}</option>
                ))}
              </select>
            </label>
            <span aria-hidden="true">:</span>
            <label>
              Minute
              <select
                aria-label="Minute"
                value={time.slice(3)}
                onChange={(e) => setTime(time.slice(0, 3) + e.target.value)}
              >
                {Array.from({ length: 60 }, (_, i) =>
                  String(i).padStart(2, "0"),
                ).map((minute) => (
                  <option key={minute}>{minute}</option>
                ))}
              </select>
            </label>
          </div>
          <small>
            {Intl.DateTimeFormat().resolvedOptions().timeZone} · 24-hour time
          </small>
        </div>
        <button
          type="button"
          className="p-button primary calendar-confirm"
          onClick={() => {
            onChange(day + "T" + time);
            dialog.current?.close();
          }}
        >
          <Check size={18} aria-hidden="true" />
          Confirm date & time
        </button>
      </dialog>
    </div>
  );
}
