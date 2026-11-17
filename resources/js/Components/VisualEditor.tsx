"use client";

import React, { useEffect, useRef, useState } from "react";
import App from "./App";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import { initializePublicTheme } from "@/lib/public-theme";
import { editorApi } from "@/lib/editor-api";
import { EditingContext } from "./EditBinding";
import { Save, X, ImagePlus, Undo2, ArrowLeft, Search } from "lucide-react";
type Change = {
  kind: string;
  id: string;
  path: string;
  value: string;
  version: number;
};
const get = (object: any, path: string) =>
  path.split(".").reduce((v, k) => v?.[k], object);
function put(object: any, path: string, value: string) {
  const keys = path.split(".");
  const last = keys.pop()!;
  keys.reduce((v, k) => v[k], object)[last] = value;
}
export default function VisualEditor() {
  const [snapshot, setSnapshot] = useState<any>(null),
    [changes, setChanges] = useState<Record<string, Change>>({}),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<{
      source: string;
      kind: string;
    } | null>(null),
    [text, setText] = useState("");
  const [media, setMedia] = useState<any[]>([]),
    [total, setTotal] = useState(0),
    [search, setSearch] = useState(""),
    [uploading, setUploading] = useState(false);
  const toolbar = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    selectedElement = useRef<HTMLElement | null>(null);
  const dirty = Object.keys(changes).length > 0;
  useEffect(() => {
    if (!ready || !toolbar.current) return;
    const observer = new ResizeObserver(([entry]) =>
      document.documentElement.style.setProperty(
        "--editor-toolbar-height",
        entry.target.getBoundingClientRect().height + "px",
      ),
    );
    observer.observe(toolbar.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--editor-toolbar-height");
    };
  }, [ready]);
  const renderDocument = (base: any, drafts: Record<string, Change>) => {
    const data = {
      settings: Object.fromEntries(
        Object.entries(base.settings).map(([k, v]: any) => [
          k,
          structuredClone(v.value),
        ]),
      ),
      content: structuredClone(base.content),
    };
    for (const e of Object.values(drafts))
      put(
        e.kind === "settings"
          ? data.settings[e.id]
          : data.content.find((r: any) => r.id === e.id),
        e.path,
        e.value,
      );
    hydrate(data);
    setContent(data);
    initializePublicTheme(data.settings.appearance);
  };
  const load = async () => {
    const base = await editorApi("admin/editor");
    renderDocument(base, {});
    setSnapshot(base);
    setChanges({});
    setReady(true);
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
    document.documentElement.dataset.visualEditor = "true";
    return () => {
      delete document.documentElement.dataset.visualEditor;
    };
  }, []);
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key === "portfolio-content-updated")
        setError(
          "Website content changed in another window. Save checks for conflicts; reload latest to start fresh.",
        );
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      selectedElement.current?.focus();
    };
  }, [selected]);
  const loadMedia = async (offset = 0) => {
    const d = await editorApi("admin/media?limit=60&offset=" + offset);
    setMedia((prev) => (offset ? [...prev, ...d.items] : d.items));
    setTotal(d.total);
  };
  const select = (source: string, kind: string, element: HTMLElement) => {
    const [type, id, path] = source.split("/");
    const base =
      type === "settings"
        ? snapshot.settings[id]?.value
        : snapshot.content.find((r: any) => r.id === id);
    if (typeof get(base, path) !== "string") {
      setError("This field is not available. Reload the editor.");
      return;
    }
    selectedElement.current = element;
    setError("");
    setText(changes[source]?.value ?? get(base, path));
    setSelected({ source, kind });
    if (kind === "image") {
      setSearch("");
      loadMedia().catch((e) => setError(e.message));
    }
  };
  const apply = (value: string) => {
    if (!selected) return;
    const [kind, id, path] = selected.source.split("/");
    const base =
      kind === "settings"
        ? snapshot.settings[id]
        : snapshot.content.find((r: any) => r.id === id);
    const next = { ...changes };
    if (value === get(kind === "settings" ? base.value : base, path))
      delete next[selected.source];
    else
      next[selected.source] = { kind, id, path, value, version: base.version };
    renderDocument(snapshot, next);
    setChanges(next);
    setNotice("Draft updated — save to publish.");
    dialog.current?.close();
    setSelected(null);
  };
  const capture = (event: React.SyntheticEvent) => {
    const element = event.target as HTMLElement;
    const target =
      element.closest<HTMLElement>("[data-edit-source]") ||
      element
        .closest("a,button,.portrait-card")
        ?.querySelector<HTMLElement>("[data-edit-source]");
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      if (!busy)
        select(
          target.dataset.editSource!,
          target.dataset.editKind || "text",
          target,
        );
      return;
    }
    const link = (event.target as HTMLElement).closest("a");
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      const url = new URL(link.href, location.origin);
      if (url.origin === location.origin && url.hash)
        document
          .getElementById(url.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
      else
        setNotice(
          "Navigation is paused while editing. Open the public website from admin to follow links.",
        );
    }
  };
  if (!ready)
    return (
      <div className="visual-editor-shell">
        <p role={error ? "alert" : "status"}>
          {error || "Opening website editor…"}
        </p>
        <a href="/admin">Back to admin</a>
      </div>
    );
  return (
    <>
      <header className="editor-toolbar" ref={toolbar}>
        <a
          href="/admin"
          onClick={(e) => {
            if (
              dirty &&
              !confirm("Discard unsaved changes and return to admin?")
            )
              e.preventDefault();
          }}
        >
          <ArrowLeft size={16} />
          Admin
        </a>
        <div>
          <strong>Website editor</strong>
          <small>Click text or an image to edit</small>
        </div>
        <span className="editor-status" role="status">
          {busy
            ? "Saving…"
            : dirty
              ? `${Object.keys(changes).length} unsaved changes`
              : notice || "All changes saved"}
        </span>
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={() => {
            if (confirm("Discard all unsaved changes?")) {
              renderDocument(snapshot, {});
              setChanges({});
              setNotice("Changes discarded");
              setError("");
            }
          }}
        >
          <Undo2 size={16} />
          Discard
        </button>
        <button
          type="button"
          className="editor-save"
          disabled={!dirty || busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await editorApi("admin/editor", "PATCH", {
                changes: Object.values(changes),
              });
              await load();
              setNotice("Changes saved");
              try {
                localStorage.setItem(
                  "portfolio-content-updated",
                  String(Date.now()),
                );
              } catch {}
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Save size={16} />
          Save changes
        </button>
      </header>
      {error && !selected && (
        <div className="editor-error" role="alert">
          {error}
          <button
            onClick={() => {
              if (!dirty || confirm("Reload and discard unsaved changes?"))
                load()
                  .then(() => setError(""))
                  .catch((e) => setError(e.message));
            }}
          >
            Reload latest
          </button>
        </div>
      )}
      <EditingContext.Provider value={true}>
        <div
          className="editor-canvas"
          onClickCapture={capture}
          onSubmitCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDownCapture={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              (e.target as HTMLElement).hasAttribute("data-edit-source")
            )
              capture(e);
          }}
        >
          <App />
        </div>
      </EditingContext.Provider>
      <dialog
        ref={dialog}
        className="editor-dialog"
        onClose={() => setSelected(null)}
        aria-labelledby="editor-dialog-title"
      >
        <header>
          <h2 id="editor-dialog-title">
            {selected?.kind === "image" ? "Choose an image" : "Edit text"}
          </h2>
          <button
            aria-label="Close editor"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        {selected?.kind === "text" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply(text);
            }}
          >
            <label>
              {selected?.source.endsWith("/menu") ||
              selected?.source.endsWith("/footerMenu")
                ? "Menu — one Label|URL per line"
                : selected?.source.endsWith("/expertise")
                  ? "Expertise — one label per line"
                  : "Text"}
              <textarea
                aria-label="Edit text value"
                autoFocus
                rows={6}
                value={text}
                maxLength={10000}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <small>
              Changes appear on the page immediately after Apply. Save changes
              publishes your draft.
            </small>
            <button className="editor-save" type="submit">
              Apply text
            </button>
          </form>
        ) : (
          <>
            <div className="editor-media-tools">
              <label>
                <Search size={16} />
                <input
                  aria-label="Search images"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search loaded images"
                />
              </label>
              <label className="editor-upload">
                <ImagePlus size={16} />
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={async (e) => {
                    const input = e.currentTarget,
                      file = input.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setError("Choose an image smaller than 5 MB.");
                      return;
                    }
                    setUploading(true);
                    setError("");
                    try {
                      const body = new FormData();
                      body.append("file", file);
                      body.append("alt", file.name);
                      const result = await editorApi(
                        "admin/media",
                        "POST",
                        body,
                      );
                      apply(result.url);
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setUploading(false);
                      input.value = "";
                    }
                  }}
                />
              </label>
            </div>
            <p>
              Choose from your library or upload PNG, JPEG or WebP (up to 5 MB).
              Uploads stay in the library even if you discard the page draft.
            </p>
            <div className="editor-media-grid">
              {media
                .filter(
                  (m) =>
                    m.mime.startsWith("image/") &&
                    (m.name + " " + m.alt)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => apply("/media/" + m.id)}
                    aria-label={"Select " + m.name}
                  >
                    <img
                      loading="lazy"
                      src={"/api/admin/media/" + m.id + "/file"}
                      alt={m.alt || m.name}
                    />
                    <span>{m.name}</span>
                  </button>
                ))}
            </div>
            {!media.length && (
              <p>No images yet. Upload your first image above.</p>
            )}
            {media.length < total && (
              <button
                onClick={() =>
                  loadMedia(media.length).catch((e) => setError(e.message))
                }
              >
                Load more images
              </button>
            )}
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </dialog>
    </>
  );
}
