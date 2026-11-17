import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Mail,
  Phone,
  MessageCircle,
  ArrowLeft,
  Pencil,
  Save,
} from "lucide-react";
const statuses = ["new", "contacted", "scheduled", "completed", "cancelled"];
export default function ContactInbox({
  api,
  onDirtyChange,
}: {
  api: any;
  onDirtyChange: (v: boolean) => void;
}) {
  const [items, setItems] = useState<any[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [revision, setRevision] = useState(0),
    [selected, setSelected] = useState<any>(null),
    [draft, setDraft] = useState<any>(null),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const sequence = useRef(0),
    dirty = !!selected && JSON.stringify(draft) !== JSON.stringify(selected);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(
      "admin/requests?kind=contact&limit=20&offset=" +
        (page - 1) * 20 +
        "&q=" +
        encodeURIComponent(search),
    )
      .then((d: any) => {
        if (active) {
          setItems(d.items);
          setTotal(d.total);
        }
      })
      .catch((e: any) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, page, revision]);
  useEffect(
    () => () => {
      sequence.current++;
    },
    [],
  );
  const open = async (row: any) => {
    if (busy || (dirty && !confirm("Discard unsaved contact changes?"))) return;
    const n = ++sequence.current;
    setError("");
    setNotice("");
    try {
      const d = await api("admin/requests/" + row.id);
      if (sequence.current === n) {
        setSelected(d);
        setDraft(d);
        setEditing(false);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };
  const field = (key: string, value: string) =>
    setDraft({ ...draft, [key]: value });
  return (
    <div className="contact-workspace">
      <h2>Contact inbox</h2>
      <p>
        Read incoming form messages and follow up by phone, WhatsApp or email.
        Replies open in those apps; this inbox does not send messages.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
          {selected && (
            <button onClick={() => open(selected)}>Reload message</button>
          )}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className={"contact-inbox" + (selected ? " has-selection" : "")}>
        <section className="contact-list" aria-label="Incoming messages">
          <label className="asset-search">
            <Search size={17} />
            <input
              aria-label="Search contact messages"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
            />
          </label>
          <small>{total} messages</small>
          {loading && <p role="status">Loading…</p>}
          {items.map((row) => (
            <button
              key={row.id}
              className={
                "contact-thread" + (row.id === selected?.id ? " selected" : "")
              }
              onClick={() => open(row)}
            >
              <span className="contact-avatar">{row.name.slice(0, 1)}</span>
              <span>
                <strong>{row.name}</strong>
                <span className={"lead-status lead-status-" + row.status}>
                  {row.status}
                </span>
                <small>{row.message}</small>
                <time>{new Date(row.created_at).toLocaleDateString()}</time>
              </span>
            </button>
          ))}
          {!loading && !items.length && <p>No messages found.</p>}
          <div className="asset-pagination">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </section>
        <section className="contact-conversation" aria-label="Message details">
          {!selected ? (
            <div className="empty-state">
              <MessageCircle size={36} />
              <h3>Select a message</h3>
              <p>Choose a contact from the list to read their request.</p>
            </div>
          ) : (
            <>
              <header>
                <button
                  type="button"
                  className="contact-back"
                  aria-label="Back to message list"
                  onClick={() => {
                    if (!dirty || confirm("Discard unsaved changes?")) {
                      setSelected(null);
                      setDraft(null);
                      sequence.current++;
                    }
                  }}
                >
                  <ArrowLeft size={19} />
                </button>
                <div>
                  <h3>{selected.name}</h3>
                  <span
                    className={"lead-status lead-status-" + selected.status}
                  >
                    {selected.status}
                  </span>
                </div>
                <button disabled={busy} onClick={() => setEditing((v) => !v)}>
                  <Pencil size={16} />
                  Edit details
                </button>
              </header>
              <div className="contact-actions">
                <a href={"mailto:" + selected.email}>
                  <Mail size={16} />
                  {selected.email}
                </a>
                {selected.phone && (
                  <a href={"tel:" + selected.phone.replace(/[^+0-9]/g, "")}>
                    <Phone size={16} />
                    {selected.phone}
                  </a>
                )}
                {/^\+?[0-9 ()-]{7,50}$/.test(selected.phone) && (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={
                      "https://wa.me/" +
                      selected.phone
                        .replace(/\D/g, "")
                        .replace(/^01(\d{9})$/, "8801$1")
                    }
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
              </div>
              <div className="contact-message-bubble">
                <small>Submitted message</small>
                <p>{selected.message}</p>
                <time>{new Date(selected.created_at).toLocaleString()}</time>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    const {
                      name,
                      email,
                      phone,
                      service,
                      message,
                      status,
                      notes,
                      version,
                    } = draft;
                    const fresh = await api(
                      "admin/requests/" + selected.id,
                      "PATCH",
                      {
                        name,
                        email,
                        phone,
                        service,
                        message,
                        status,
                        notes,
                        version,
                      },
                    );
                    setSelected(fresh);
                    setDraft(fresh);
                    setEditing(false);
                    setRevision((x) => x + 1);
                    setNotice("Contact updated");
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <fieldset disabled={busy}>
                  {editing && (
                    <div className="contact-edit-fields">
                      {["name", "email", "phone", "service", "message"].map(
                        (key) => (
                          <label key={key}>
                            {key}
                            {key === "message" ? (
                              <textarea
                                aria-label={"Contact " + key}
                                value={draft[key]}
                                maxLength={5000}
                                required
                                onChange={(e) => field(key, e.target.value)}
                              />
                            ) : (
                              <input
                                aria-label={"Contact " + key}
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
                                value={draft[key]}
                                onChange={(e) => field(key, e.target.value)}
                              />
                            )}
                          </label>
                        ),
                      )}
                    </div>
                  )}
                  <label>
                    Status
                    <select
                      aria-label="Contact status"
                      value={draft.status}
                      onChange={(e) => field("status", e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Internal notes
                    <textarea
                      aria-label="Contact notes"
                      value={draft.notes}
                      maxLength={10000}
                      onChange={(e) => field("notes", e.target.value)}
                    />
                  </label>
                  <button disabled={busy || !dirty}>
                    <Save size={16} />
                    Save contact
                  </button>
                </fieldset>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
