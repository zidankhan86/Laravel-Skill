import React, { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Image as ImageIcon,
  FileText,
  Search,
  Pencil,
  RefreshCw,
  Copy,
  Trash2,
  X,
  Upload,
} from "lucide-react";
import { announcePublicUpdate } from "./AdminGallery";
type Api = (path: string, method?: string, body?: any) => Promise<any>;
export default function AdminMediaLibrary({
  api,
  onDirtyChange,
}: {
  api: Api;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [items, setItems] = useState<any[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<any>(null),
    [name, setName] = useState(""),
    [alt, setAlt] = useState(""),
    [usage, setUsage] = useState<any>(null);
  const panel = useRef<HTMLElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    selection = useRef(0);
  const dirty = !!selected && (name !== selected.name || alt !== selected.alt);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(
      `admin/media?limit=24&offset=${(page - 1) * 24}&q=${encodeURIComponent(query)}&type=${type}`,
    )
      .then((d) => {
        if (active) {
          setItems(d.items);
          setTotal(d.total);
          setPage((p) => Math.min(p, Math.max(1, Math.ceil(d.total / 24))));
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, query, type, revision]);
  const open = async (item: any, button?: HTMLElement) => {
    if (dirty && !confirm("Discard unsaved media details?")) return;
    const token = ++selection.current;
    lastFocus.current = button || null;
    setSelected(item);
    setName(item.name);
    setAlt(item.alt);
    setUsage(null);
    setError("");
    try {
      const u = await api(`admin/media/${item.id}/usage`);
      if (token === selection.current) setUsage(u);
    } catch (e: any) {
      if (token === selection.current) setError(e.message);
    }
    requestAnimationFrame(() =>
      panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  };
  const refresh = () => setRevision((v) => v + 1);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (input: HTMLInputElement) => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    await run(async () => {
      let completed = 0;
      try {
        for (const f of files) {
          if (f.size > 5 * 1024 * 1024)
            throw Error(`${f.name}: file exceeds 5 MB`);
          const body = new FormData();
          body.append("file", f);
          body.append("alt", "");
          await api("admin/media", "POST", body);
          completed++;
        }
      } finally {
        refresh();
        setNotice(`${completed} file${completed === 1 ? "" : "s"} uploaded`);
        input.value = "";
      }
    });
  };
  return (
    <div className="media-library">
      <div className="asset-heading">
        <div>
          <h2>Your media collection</h2>
          <p>
            Choose a file to edit its details or replace it wherever it is used.
          </p>
        </div>
        <label className="asset-upload">
          <Upload size={18} />
          Upload files
          <input
            aria-label="Upload media files"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={busy}
            onChange={(e) => upload(e.currentTarget)}
          />
        </label>
      </div>
      <div className="asset-toolbar">
        <label className="asset-search">
          <Search size={17} />
          <input
            aria-label="Search media library"
            placeholder="Search name or alternative text…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label="Media type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All files</option>
          <option value="image">Images</option>
          <option value="document">PDF documents</option>
        </select>
        <span>{total} files</span>
      </div>
      <p className="asset-hint">PNG, JPEG, WebP or PDF · Up to 5 MB per file</p>
      {error && (
        <p className="notice error" role="alert">
          {error}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              refresh();
              setSelected(null);
              setError("");
            }}
          >
            Reload library
          </button>
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {selected && (
        <section
          className="asset-editor"
          ref={panel}
          aria-label="Edit media details"
        >
          <div className="asset-editor-preview">
            {selected.mime.startsWith("image/") ? (
              <img
                src={`/api/admin/media/${selected.id}/file?v=${selected.version}`}
                alt={alt || name}
              />
            ) : (
              <FileText size={80} />
            )}
          </div>
          <div className="asset-editor-content">
            <div className="asset-editor-title">
              <div>
                <h3>Edit media</h3>
                <small>
                  {selected.mime} · {(selected.size / 1024).toFixed(1)} KB
                </small>
              </div>
              <button
                type="button"
                className="asset-icon"
                aria-label="Close media editor"
                disabled={busy}
                onClick={() => {
                  if (!dirty || confirm("Discard unsaved media details?")) {
                    setSelected(null);
                    lastFocus.current?.focus();
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await api("admin/media/" + selected.id, "PUT", {
                    name,
                    alt,
                    version: selected.version,
                  });
                  setSelected({
                    ...selected,
                    name,
                    alt,
                    version: selected.version + 1,
                  });
                  setNotice("Media details saved");
                  refresh();
                });
              }}
            >
              <label>
                File name
                <input
                  aria-label="File name"
                  value={name}
                  required
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Alternative text
                <textarea
                  aria-label="Alternative text"
                  rows={3}
                  value={alt}
                  maxLength={500}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe what is in this image"
                />
              </label>
              <small>
                Library description for this image. Content-specific captions
                and image descriptions remain editable in their content section.
              </small>
              <button disabled={busy || !dirty} type="submit">
                <Pencil size={15} />
                Save details
              </button>
            </form>
            <div className="asset-file-actions">
              <label
                className={"asset-change" + (busy || dirty ? " disabled" : "")}
              >
                <RefreshCw size={16} />
                Change file
                <input
                  aria-label="Replace selected media file"
                  type="file"
                  accept={
                    selected.mime.startsWith("image/")
                      ? "image/png,image/jpeg,image/webp"
                      : "application/pdf"
                  }
                  disabled={busy || dirty}
                  onChange={(e) => {
                    const input = e.currentTarget,
                      f = input.files?.[0];
                    if (!f) return;
                    if (
                      !confirm(
                        "Replace this file everywhere it is used? Its URL stays the same.",
                      )
                    ) {
                      input.value = "";
                      return;
                    }
                    run(async () => {
                      const body = new FormData();
                      body.append("file", f);
                      body.append("version", String(selected.version));
                      await api(`admin/media/${selected.id}/file`, "PUT", body);
                      setSelected({
                        ...selected,
                        mime: f.type,
                        size: f.size,
                        version: selected.version + 1,
                      });
                      refresh();
                      announcePublicUpdate();
                      setNotice("File replaced everywhere it is used");
                    }).finally(() => {
                      input.value = "";
                    });
                  }}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  navigator.clipboard
                    .writeText(location.origin + "/media/" + selected.id)
                    .then(() => setNotice("Media link copied"))
                    .catch(() =>
                      setError("Could not copy. Use the media URL below."),
                    )
                }
              >
                <Copy size={15} />
                Copy link
              </button>
              <button
                className="asset-delete"
                type="button"
                disabled={
                  busy ||
                  !usage ||
                  !!(usage.content.length + usage.settings.length)
                }
                onClick={() => {
                  if (confirm("Permanently delete this unused file?"))
                    run(async () => {
                      await api("admin/media/" + selected.id, "DELETE");
                      setSelected(null);
                      refresh();
                      setNotice("File deleted");
                    });
                }}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
            {dirty && (
              <p className="asset-hint">
                Save your details before changing the file.
              </p>
            )}
            <code className="asset-url">/media/{selected.id}</code>
            <div className="asset-usage">
              <strong>Used in</strong>
              {usage ? (
                <>
                  {usage.content.length + usage.settings.length === 0 ? (
                    <p>Not used yet. You can safely delete this file.</p>
                  ) : (
                    <ul>
                      {usage.content.map((r: any) => (
                        <li key={r.id}>
                          {r.collection}: {r.title}
                        </li>
                      ))}
                      {usage.settings.map((r: any) => (
                        <li key={r.settings_id}>{r.settings_id} settings</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p>Checking usage…</p>
              )}
            </div>
          </div>
        </section>
      )}
      <div className="asset-grid" aria-busy={loading}>
        {items.map((item) => (
          <button
            type="button"
            className={
              "asset-card" + (selected?.id === item.id ? " selected" : "")
            }
            key={item.id}
            onClick={(e) => open(item, e.currentTarget)}
            aria-label={"Edit " + item.name}
          >
            <div className="asset-card-preview">
              {item.mime.startsWith("image/") ? (
                <img
                  loading="lazy"
                  src={`/api/admin/media/${item.id}/file?v=${item.version}`}
                  alt={item.alt || item.name}
                />
              ) : (
                <FileText size={52} />
              )}
              <span className="asset-edit-chip">
                <Pencil size={13} />
                Edit
              </span>
            </div>
            <div className="asset-card-info">
              <strong>{item.name}</strong>
              <small>
                {item.mime.split("/")[1].toUpperCase()} ·{" "}
                {(item.size / 1024).toFixed(1)} KB
              </small>
              <p>{item.alt || "Add alternative text"}</p>
            </div>
          </button>
        ))}
      </div>
      {!loading && !items.length && (
        <div className="empty-state">
          <ImageIcon size={34} />
          <h3>No files found</h3>
          <p>Upload files or try another search.</p>
        </div>
      )}
      {loading && <p role="status">Loading media…</p>}
      <div className="asset-pagination">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / 24))}
        </span>
        <button
          type="button"
          disabled={page * 24 >= total || loading}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
