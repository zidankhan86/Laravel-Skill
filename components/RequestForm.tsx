import { COPY } from "../content";
import { EditText, contentSource } from "./EditBinding";
import DateTimePicker from "./DateTimePicker";
import React, { useState } from "react";
import { SERVICES } from "../constants";
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
          form.reset();
          setSelectedTime("");
          setDateInvalid(false);
          setKey(crypto.randomUUID());
        } catch (e: any) {
          setError(true);
          setMessage(e.message);
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
    </form>
  );
}
