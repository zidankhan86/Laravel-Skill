"use client";

import { COPY } from "@/lib/content";
import { EditText, contentSource } from "./EditBinding";
import DateTimePicker from "./DateTimePicker";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SERVICES } from "@/lib/constants";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function RequestForm({
  initialKind = "booking",
  headingLevel: Heading = "h3",
}: {
  initialKind?: "booking" | "contact";
  headingLevel?: "h1" | "h3";
}) {
  const [selectedTime, setSelectedTime] = useState("");
  const [dateInvalid, setDateInvalid] = useState(false);
  const [kind, setKind] = useState(initialKind),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [key, setKey] = useState(() => crypto.randomUUID());

  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast?.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast?.show]);
  return (
    <form
      className="public-request-form w-full space-y-4 p-6 text-white"
      aria-describedby={message ? "request-feedback" : undefined}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (kind === "booking" && !selectedTime) {
          setDateInvalid(true);
          setError(true);
          setMessage("Please choose a preferred date and time.");
          setToast({
            show: true,
            type: "error",
            title: "Date & Time Required",
            message: "Please choose a preferred date and time for your call.",
          });
          e.currentTarget
            .querySelector<HTMLButtonElement>(".date-picker-trigger")
            ?.focus();
          return;
        }
        const form = e.currentTarget,
          f = new FormData(form);
        setBusy(true);
        setMessage("");
        try {
          const local = String(f.get("time") || "");
          const response = await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind,
              name: f.get("name"),
              email: f.get("email"),
              phone: f.get("phone"),
              service: f.get("service"),
              message: f.get("message"),
              requested_at: local ? new Date(local).toISOString() : null,
              timezone:
                Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "Asia/Dhaka",
              dedup_key: key,
              website: f.get("website"),
            }),
          });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || "Request failed");
          setMessage(data.message);
          setError(false);
          setToast({
            show: true,
            type: "success",
            title:
              kind === "booking"
                ? "Booking Request Received!"
                : "Message Sent!",
            message:
              data.message ||
              (kind === "booking"
                ? "Thank you! We've received your booking request and will contact you shortly."
                : "Thank you! Your message has been received."),
          });
          form.reset();
          setSelectedTime("");
          setDateInvalid(false);
          setKey(crypto.randomUUID());
        } catch (e: any) {
          setError(true);
          setMessage(e.message);
          setToast({
            show: true,
            type: "error",
            title: "Submission Error",
            message: e.message || "Failed to submit request. Please try again.",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heading className="request-heading text-2xl font-bold">
        <EditText
          source={
            "settings/ui/" +
            (kind === "booking" ? "bookingHeading" : "contactHeading")
          }
        >
          {kind === "booking" ? COPY.ui.bookingHeading : COPY.ui.contactHeading}
        </EditText>
      </Heading>
      <label className="block">
        <EditText source="settings/ui/RequestForm_1">
          {COPY.ui.RequestForm_1}
        </EditText>
        <select
          className="block w-full p-3 rounded-lg bg-neutral-900 border border-white/20"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as "booking" | "contact");
            setKey(crypto.randomUUID());
          }}
        >
          <option value="booking">Request a call</option>
          <option value="contact">Send a message</option>
        </select>
      </label>
      {["name", "email", "phone"].map((name) => (
        <label className="block capitalize" key={name}>
          <EditText source={"settings/ui/" + name + "Label"}>
            {COPY.ui[name + "Label"]}
          </EditText>
          <input
            required={name !== "phone"}
            type={
              name === "email" ? "email" : name === "phone" ? "tel" : "text"
            }
            autoComplete={
              name === "name" ? "name" : name === "email" ? "email" : "tel"
            }
            name={name}
            maxLength={name === "name" ? 150 : name === "email" ? 254 : 50}
            className="block w-full p-3 rounded-lg bg-neutral-900 border border-white/20"
          />
        </label>
      ))}
      <label className="block">
        <EditText source="settings/ui/RequestForm_2">
          {COPY.ui.RequestForm_2}
        </EditText>
        <select
          name="service"
          className="block w-full p-3 rounded-lg bg-neutral-900 border border-white/20"
        >
          <option value="">General enquiry</option>
          {SERVICES.map((s) => (
            <option key={s.id}>{s.title}</option>
          ))}
        </select>
      </label>
      {kind === "booking" && (
        <DateTimePicker
          value={selectedTime}
          invalid={dateInvalid}
          onChange={(value) => {
            setSelectedTime(value);
            setDateInvalid(false);
            setMessage("");
          }}
        />
      )}
      <label className="block">
        <EditText source="settings/ui/RequestForm_3">
          {COPY.ui.RequestForm_3}
        </EditText>
        <textarea
          name="message"
          required
          maxLength={5000}
          className="block w-full p-3 rounded-lg bg-neutral-900 border border-white/20"
        />
      </label>
      <label className="hidden" aria-hidden="true">
        <EditText source="settings/ui/RequestForm_4">
          {COPY.ui.RequestForm_4}
        </EditText>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button
        disabled={busy}
        className="bg-gradient-red px-6 py-3 rounded-xl font-bold disabled:opacity-50"
      >
        {busy ? (
          "Submitting…"
        ) : (
          <EditText
            source={
              "settings/ui/" +
              (kind === "booking" ? "sendBooking" : "sendContact")
            }
          >
            {kind === "booking" ? COPY.ui.sendBooking : COPY.ui.sendContact}
          </EditText>
        )}
      </button>
      {message && (
        <p id="request-feedback" role={error ? "alert" : "status"}>
          {message}
        </p>
      )}

      {mounted &&
        toast?.show &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] w-[92vw] max-w-lg pointer-events-auto"
            style={{
              animation: "toastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className={`relative flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                toast.type === "success"
                  ? "bg-neutral-950/95 border-emerald-500/50 text-white shadow-[0_12px_45px_-10px_rgba(16,185,129,0.4)]"
                  : "bg-neutral-950/95 border-red-500/50 text-white shadow-[0_12px_45px_-10px_rgba(239,68,68,0.4)]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  toast.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={22} className="stroke-[2.2]" />
                ) : (
                  <AlertCircle size={22} className="stroke-[2.2]" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-bold text-sm sm:text-base text-white tracking-wide">
                  {toast.title}
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setToast((prev) => (prev ? { ...prev, show: false } : null))
                }
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close notification"
              >
                <X size={18} />
              </button>

              <div
                className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${
                  toast.type === "success"
                    ? "bg-emerald-500/50"
                    : "bg-red-500/50"
                }`}
              />
            </div>
          </div>,
          document.body
        )}
    </form>
  );
}
