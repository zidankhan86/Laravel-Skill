import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  GripVertical,
  Mail,
  Phone,
  CalendarDays,
  MessageSquare,
  ArrowUpRight,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
const stages = [
  {
    key: "new",
    label: "New",
    hint: "Ready for your first response",
    color: "#3586df",
  },
  {
    key: "contacted",
    label: "Contacted",
    hint: "Conversation in progress",
    color: "#9c6cda",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    hint: "Meeting or follow-up planned",
    color: "#cc922a",
  },
  {
    key: "completed",
    label: "Completed",
    hint: "Successfully wrapped up",
    color: "#2d9d75",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    hint: "Closed without proceeding",
    color: "#d16c74",
  },
];
const label = (status: string) =>
  stages.find((s) => s.key === status)?.label || status;
const date = (v: string, zone = "Asia/Dhaka") =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        timeZone: zone,
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not specified";
type Api = (path: string, method?: string, body?: any) => Promise<any>;
export default function LeadBoard({
  kind,
  api,
  onDirtyChange,
}: {
  kind: string;
  api: Api;
  onDirtyChange: (v: boolean) => void;
}) {
  const [columns, setColumns] = useState<
      Record<string, { items: any[]; total: number }>
    >({}),
    [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<any>(null),
    [status, setStatus] = useState("new"),
    [details, setDetails] = useState<any>({}),
    [notes, setNotes] = useState(""),
    [hover, setHover] = useState<string | null>(null),
    [dragging, setDragging] = useState<string | null>(null);
  const board = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    epoch = useRef(0),
    selection = useRef(0),
    pending = useRef(false),
    frame = useRef(0),
    suppressed = useRef(false);
  const drag = useRef<{
    row: any;
    x: number;
    y: number;
    startX: number;
    startY: number;
    active: boolean;
    over: string | null;
  } | null>(null);
  const dirty =
    !!selected &&
    (selected.status !== status ||
      selected.notes !== notes ||
      Object.keys(details).some((k) => details[k] !== selected[k]));
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const endpoint = (s: string, offset = 0) =>
    `admin/requests?kind=${kind}&status=${s}&q=${encodeURIComponent(search)}&limit=20&offset=${offset}`;
  const load = async () => {
    const n = ++epoch.current;
    setLoading(true);
    try {
      const data = await Promise.all(
        stages.map(async (s) => [s.key, await api(endpoint(s.key))]),
      );
      if (n === epoch.current) setColumns(Object.fromEntries(data));
    } catch (e: any) {
      if (n === epoch.current) setError(e.message);
    } finally {
      if (n === epoch.current) setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return () => {
      epoch.current++;
      selection.current++;
      cancelAnimationFrame(frame.current);
    };
  }, [kind, search]);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      lastFocus.current?.focus();
    };
  }, [selected?.id]);
  const open = async (row: any, element: HTMLElement) => {
    if (pending.current) return;
    const n = ++selection.current;
    lastFocus.current = element;
    setError("");
    try {
      const fresh = await api("admin/requests/" + row.id);
      if (n !== selection.current) return;
      setSelected(fresh);
      setDetails(
        Object.fromEntries(
          ["name", "email", "phone", "service", "message"].map((k) => [
            k,
            fresh[k],
          ]),
        ),
      );
      setStatus(fresh.status);
      setNotes(fresh.notes);
    } catch (e: any) {
      setError(e.message);
    }
  };
  const close = () => {
    if (busy) return;
    if (!dirty || confirm("Discard unsaved lead changes?")) {
      dialog.current?.close();
      setSelected(null);
    }
  };
  const save = async (
    row: any,
    next: string,
    nextNotes?: string,
    edits?: any,
  ) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const fresh = await api("admin/requests/" + row.id, "PATCH", {
        ...edits,
        status: next,
        ...(nextNotes === undefined ? {} : { notes: nextNotes }),
        version: row.version,
      });
      setColumns((prev) =>
        Object.fromEntries(
          stages.map((s) => {
            const col = prev[s.key] || { items: [], total: 0 };
            return [
              s.key,
              {
                items:
                  s.key === fresh.status
                    ? [fresh, ...col.items.filter((r) => r.id !== fresh.id)]
                    : col.items.filter((r) => r.id !== fresh.id),
                total:
                  col.total +
                  (row.status !== fresh.status
                    ? s.key === fresh.status
                      ? 1
                      : s.key === row.status
                        ? -1
                        : 0
                    : 0),
              },
            ];
          }),
        ),
      );
      if (selected?.id === row.id) {
        setSelected(fresh);
        setDetails(
          Object.fromEntries(
            ["name", "email", "phone", "service", "message"].map((k) => [
              k,
              fresh[k],
            ]),
          ),
        );
        setStatus(fresh.status);
        setNotes(fresh.notes);
      }
      setNotice(
        `${fresh.name} moved to ${label(fresh.status)}. Changes saved.`,
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const stop = () => {
    cancelAnimationFrame(frame.current);
    drag.current = null;
    setDragging(null);
    setHover(null);
  };
  const hit = () => {
    const d = drag.current;
    if (!d?.active) return;
    const col = document
      .elementFromPoint(d.x, d.y)
      ?.closest<HTMLElement>("[data-lead-stage]");
    d.over =
      col && board.current?.contains(col) ? col.dataset.leadStage! : null;
    setHover(d.over);
  };
  const scroll = () => {
    const d = drag.current,
      el = board.current;
    if (!d?.active || !el) return;
    const box = el.getBoundingClientRect();
    const dx =
      d.x < box.left + 65
        ? -12
        : d.x > Math.min(box.right, innerWidth) - 65
          ? 12
          : 0;
    if (dx) el.scrollLeft += dx;
    if (d.y < 80) window.scrollBy(0, -8);
    else if (d.y > innerHeight - 85) window.scrollBy(0, 8);
    hit();
    frame.current = requestAnimationFrame(scroll);
  };
  const more = async (stage: string) => {
    setBusy(true);
    setError("");
    const n = epoch.current;
    try {
      const d = await api(endpoint(stage, columns[stage].items.length));
      if (n === epoch.current)
        setColumns((prev) => ({
          ...prev,
          [stage]: {
            items: [
              ...prev[stage].items,
              ...d.items.filter(
                (r: any) => !prev[stage].items.some((x) => x.id === r.id),
              ),
            ],
            total: d.total,
          },
        }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const badge = (s: string) => (
    <span className={"lead-status lead-status-" + s}>
      <i />
      {label(s)}
    </span>
  );
  return (
    <div className="lead-workspace">
      <div className="lead-board-heading">
        <div>
          <h2>
            {kind === "booking"
              ? "Booking pipeline"
              : "Contact & lead pipeline"}
          </h2>
          <p>
            Drag a card to change status, or open a lead to update its details.
            Status changes save automatically.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={busy || loading}
          onClick={load}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <div className="lead-board-tools">
        <label className="asset-search">
          <Search size={17} />
          <input
            aria-label="Search leads"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
          />
        </label>
        <span>
          {Object.values(columns).reduce((sum, c) => sum + c.total, 0)} leads
          {search ? " matching your search" : ""}
        </span>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}{" "}
          <button
            disabled={busy}
            onClick={() => {
              setError("");
              load();
            }}
          >
            Reload board
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {loading && <p role="status">Updating board…</p>}
      <div
        className="lead-kanban"
        ref={board}
        aria-label={kind + " lead board"}
        aria-busy={loading}
      >
        {stages.map((stage) => {
          const col = columns[stage.key] || { items: [], total: 0 };
          return (
            <section
              key={stage.key}
              data-lead-stage={stage.key}
              className={
                "lead-column" + (hover === stage.key ? " is-drop-target" : "")
              }
              style={{ "--lead-color": stage.color } as React.CSSProperties}
              aria-label={stage.label + " leads"}
            >
              <header>
                <div>
                  {badge(stage.key)}
                  <span className="lead-count">{col.total}</span>
                </div>
                <p>{stage.hint}</p>
              </header>
              <div className="lead-cards">
                {col.items.map((row) => (
                  <article
                    key={row.id}
                    data-lead-id={row.id}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && drag.current) {
                        e.preventDefault();
                        stop();
                        setNotice("Move cancelled");
                      }
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0 || pending.current || loading) return;
                      suppressed.current = false;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      drag.current = {
                        row,
                        x: e.clientX,
                        y: e.clientY,
                        startX: e.clientX,
                        startY: e.clientY,
                        active: false,
                        over: null,
                      };
                    }}
                    onPointerMove={(e) => {
                      const d = drag.current;
                      if (!d) return;
                      d.x = e.clientX;
                      d.y = e.clientY;
                      if (
                        !d.active &&
                        Math.hypot(d.x - d.startX, d.y - d.startY) > 6
                      ) {
                        d.active = true;
                        suppressed.current = true;
                        setDragging(row.id);
                        frame.current = requestAnimationFrame(scroll);
                      }
                      hit();
                    }}
                    onPointerUp={(e) => {
                      const d = drag.current;
                      stop();
                      if (e.currentTarget.hasPointerCapture(e.pointerId))
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      if (d && !d.active) {
                        suppressed.current = true;
                        open(row, e.currentTarget.querySelector("button")!);
                      }
                      if (d?.active && d.over && d.over !== d.row.status)
                        save(d.row, d.over);
                    }}
                    onPointerCancel={stop}
                    onLostPointerCapture={() => {
                      if (drag.current) stop();
                    }}
                    className={
                      "lead-card" + (dragging === row.id ? " is-dragging" : "")
                    }
                  >
                    <button
                      type="button"
                      className="lead-card-open"
                      aria-label={"Open lead " + row.name}
                      onClick={(e) => {
                        if (e.detail === 0 || !suppressed.current)
                          open(row, e.currentTarget);
                        suppressed.current = false;
                      }}
                      disabled={busy}
                    >
                      <div className="lead-initial">
                        {row.name.slice(0, 1).toUpperCase()}
                      </div>
                      <strong>{row.name}</strong>
                      <span className="lead-email">
                        <Mail size={13} />
                        {row.email}
                      </span>
                      {row.service && (
                        <span className="lead-service">{row.service}</span>
                      )}
                      <p>{row.message}</p>
                      <span className="lead-created">
                        <CalendarDays size={13} />
                        {new Date(row.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        <ArrowUpRight size={14} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="lead-grip"
                      aria-label={"Move lead " + row.name}
                      title="Drag to another column. Press Enter to choose a status."
                      disabled={busy || loading}
                      onClick={(e) => {
                        if (e.detail === 0) open(row, e.currentTarget);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          stop();
                          setNotice("Move cancelled");
                        }
                      }}
                    >
                      <GripVertical size={17} />
                    </button>
                  </article>
                ))}
              </div>
              {!col.items.length && !loading && (
                <div className="lead-empty">
                  <MessageSquare size={22} />
                  <span>No {stage.label.toLowerCase()} leads</span>
                </div>
              )}
              {col.items.length < col.total && (
                <button
                  className="lead-load-more"
                  type="button"
                  disabled={busy || loading}
                  onClick={() => more(stage.key)}
                >
                  Load more ({col.total - col.items.length})
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="lead-board-help">
        On a phone, swipe the board to view columns. Drag with the grip, or tap
        a lead and use its status selector.
      </p>
      <dialog
        ref={dialog}
        className="lead-dialog"
        aria-labelledby="lead-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <header>
              <div>
                <small>
                  {kind === "booking" ? "BOOKING REQUEST" : "CONTACT LEAD"}
                </small>
                <h2 id="lead-dialog-title">{selected.name}</h2>
                {badge(selected.status)}
              </div>
              <button
                type="button"
                className="asset-icon"
                aria-label="Close lead details"
                onClick={close}
                disabled={busy}
              >
                <X size={20} />
              </button>
            </header>
            <div className="lead-detail-grid">
              <div>
                <small>Email</small>
                <a href={"mailto:" + selected.email}>
                  <Mail size={15} />
                  {selected.email}
                </a>
              </div>
              <div>
                <small>Phone</small>
                {selected.phone ? (
                  <a href={"tel:" + selected.phone}>
                    <Phone size={15} />
                    {selected.phone}
                  </a>
                ) : (
                  <span>Not provided</span>
                )}
              </div>
              <div>
                <small>Service</small>
                <span>{selected.service || "General enquiry"}</span>
              </div>
              <div>
                <small>Received</small>
                <span>{date(selected.created_at)}</span>
              </div>
              {selected.requested_at && (
                <div>
                  <small>Preferred appointment · {selected.timezone}</small>
                  <span>{date(selected.requested_at, selected.timezone)}</span>
                </div>
              )}
            </div>
            <div className="lead-message">
              <h3>Message</h3>
              <p>{selected.message}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(selected, status, notes, details);
              }}
            >
              <div className="contact-edit-fields">
                {["name", "email", "phone", "service", "message"].map((key) => (
                  <label key={key}>
                    {key}
                    {key === "message" ? (
                      <textarea
                        aria-label={"Lead " + key}
                        value={details[key] || ""}
                        maxLength={5000}
                        required
                        onChange={(e) =>
                          setDetails({ ...details, [key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        aria-label={"Lead " + key}
                        type={key === "email" ? "email" : "text"}
                        required={["name", "email"].includes(key)}
                        maxLength={
                          (
                            {
                              name: 150,
                              email: 254,
                              phone: 50,
                              service: 255,
                            } as any
                          )[key]
                        }
                        value={details[key] || ""}
                        onChange={(e) =>
                          setDetails({ ...details, [key]: e.target.value })
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
              <label>
                Status
                <select
                  aria-label="Lead status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {stages.map((s) => (
                    <option value={s.key} key={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Internal notes
                <textarea
                  aria-label="Lead notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={10000}
                  placeholder="Add follow-up details for your team…"
                />
              </label>
              <p className="asset-hint">
                Status and notes are internal. This does not send a message or
                calendar invitation.
              </p>
              {error && (
                <p role="alert" className="notice error">
                  {error}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !dirty ||
                        confirm("Discard unsaved changes and reload this lead?")
                      )
                        open(selected, lastFocus.current!);
                    }}
                  >
                    Reload lead
                  </button>
                </p>
              )}
              <footer>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={close}
                >
                  Close
                </button>
                <button type="submit" disabled={busy || !dirty}>
                  <Check size={16} />
                  {busy ? "Saving…" : "Save lead"}
                </button>
              </footer>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
