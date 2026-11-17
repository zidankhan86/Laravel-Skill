import SiteExtensions, { LogoSettings } from "./SiteExtensions";
import ContactInbox from "./ContactInbox";
import AdminMediaLibrary from "./AdminMediaLibrary";
import LeadBoard from "./LeadBoard";
import ThemePicker from "./ThemePicker";
import AdminGallery, { announcePublicUpdate } from "./AdminGallery";
import VisibilitySettings from "./VisibilitySettings";
import SectionToggles from "./SectionToggles";
import React, { useEffect, useState } from "react";
import {
  Globe,
  Pencil,
  LayoutDashboard,
  Home,
  UserRound,
  BriefcaseBusiness,
  FolderKanban,
  FileText,
  BookOpen,
  Youtube,
  Tags,
  MessageSquareQuote,
  CalendarDays,
  Mail,
  Images,
  PanelBottom,
  Settings2,
  ShieldCheck,
  Palette,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Layers,
  CircleCheck,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { applyAppearance, appearanceDefaults } from "../theme";
import definition from "../server/settings-definition.json";
import "./admin.css";
import "./admin-workspace.css";
let csrf = "";
async function api(path: string, method = "GET", body?: any) {
  const response = await fetch("/api/" + path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(
      data.issues?.map((i: any) => `${i.path}: ${i.message}`).join("; ") ||
        data.error ||
        "Request failed",
    );
  return data;
}
const modules = [
  ["dashboard", "Dashboard"],
  ["homepage", "Homepage"],
  ["about", "About & Journey"],
  ["services", "Services"],
  ["projects", "Portfolio"],
  ["blog", "Blog"],
  ["resources", "Ebooks & Resources"],
  ["gallery", "Events & Gallery"],
  ["videos", "YouTube Videos"],
  ["deals", "Deals & Recommendations"],
  ["testimonials", "Testimonials"],
  ["booking", "Booking Requests / Leads"],
  ["contact", "Contact Messages"],
  ["media", "Media Library"],
  ["navigation", "Menus & Footer"],
  ["settings", "SEO & Site Settings"],
  ["appearance", "Appearance"],
  ["security", "Account & Security"],
];
const moduleIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  homepage: Home,
  about: UserRound,
  services: BriefcaseBusiness,
  projects: FolderKanban,
  blog: FileText,
  resources: BookOpen,
  gallery: Images,
  videos: Youtube,
  deals: Tags,
  testimonials: MessageSquareQuote,
  booking: CalendarDays,
  contact: Mail,
  media: Images,
  navigation: PanelBottom,
  settings: Settings2,
  appearance: Palette,
  security: ShieldCheck,
};
const defaults: any = {
  gallery: { alt: "", location: "" },
  services: {
    icon: "Code",
    features: [],
    ctaLabel: "Book a Strategy Call",
    ctaUrl: "/#booking",
  },
  projects: {
    client: "",
    technologies: [],
    gallery: [],
    liveUrl: "",
    outcomes: "",
  },
  blog: { author: "Md Tanvir Hossain", tags: [] },
  resources: {
    type: "free",
    tag: "",
    price: null,
    currency: "BDT",
    downloadUrl: "",
    fileId: null,
    private: false,
    whatsappUrl: "",
  },
  videos: { youtubeUrl: "", duration: "" },
  deals: { discount: "", tag: "", link: "", coupon: "", expiresAt: null },
  testimonials: { name: "", role: "", rating: 5, videoUrl: "" },
};
const newRecord = (module: string) => ({
  title: "",
  slug: "",
  summary: "",
  body: "",
  status: "draft",
  featured: false,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  published_at: null,
  fields: { image: "", category: "", ...defaults[module] },
});
const label = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());

function SettingsImageField({
  title,
  value,
  onChange,
  disabled,
}: {
  title: string;
  value: string;
  onChange: (url: string) => void;
  disabled: boolean;
}) {
  const [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const mediaId = value.match(/^\/media\/([a-f0-9-]{36})$/)?.[1];
  return (
    <fieldset className="settings-image">
      <legend>{title}</legend>
      {value && (
        <img
          src={mediaId ? "/api/admin/media/" + mediaId + "/file" : value}
          alt={title + " preview"}
          className="settings-image-preview"
        />
      )}
      <label>
        {title} URL
        <input
          value={value}
          disabled={disabled || uploading}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Choose/upload an image or paste its URL"
        />
      </label>
      <MediaPicker onSelect={(id) => onChange("/media/" + id)} />
      <label>
        Upload {title.toLowerCase()}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled || uploading}
          onChange={async (e) => {
            const input = e.currentTarget,
              file = input.files?.[0];
            if (!file) return;
            setUploading(true);
            setError("");
            try {
              const body = new FormData();
              body.append("file", file);
              body.append("alt", title);
              const result = await api("admin/media", "POST", body);
              onChange(result.url);
            } catch (e: any) {
              setError(e.message);
            } finally {
              setUploading(false);
              input.value = "";
            }
          }}
        />
      </label>
      <small>
        PNG, JPEG or WebP, up to 5 MB. Save after choosing or uploading. Each
        image is independent.
      </small>
      {uploading && <p role="status">Uploading image…</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}

function MediaPicker({
  onSelect,
  documents = false,
}: {
  onSelect: (id: string) => void;
  documents?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<any[]>([]),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  const dialog = React.useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      api("admin/media?limit=100")
        .then((d) => setItems(d.items))
        .catch((e) => setError(e.message));
    } else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Choose from media
      </button>
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        aria-label="Choose media"
        className="media-dialog"
      >
        <h2>Choose media</h2>
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
        <input
          aria-label="Search media"
          placeholder="Search filenames"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {error && <p role="alert">{error}</p>}
        {items
          .filter(
            (item) =>
              (documents || item.mime.startsWith("image/")) &&
              item.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
            >
              {item.mime.startsWith("image/") && (
                <img
                  width="80"
                  src={"/api/admin/media/" + item.id + "/file"}
                  alt={item.alt}
                />
              )}
              <span>{item.name}</span>
            </button>
          ))}
        {!items.length && <p>No media yet. Upload files in Media Library.</p>}
      </dialog>
    </>
  );
}

function Fields({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <>
      {Object.entries(value)
        .filter(
          ([k]) =>
            ![
              "id",
              "created_at",
              "updated_at",
              "collection",
              "deleted_at",
              "version",
              "dedup_key",
            ].includes(k),
        )
        .map(([key, v]: any) => {
          const change = (x: any) => onChange({ ...value, [key]: x });
          if (v && typeof v === "object" && !Array.isArray(v))
            return (
              <fieldset key={key}>
                <legend>{label(key)}</legend>
                <Fields value={v} onChange={change} />
              </fieldset>
            );
          if (typeof v === "boolean")
            return (
              <label key={key} className="check">
                <input
                  type="checkbox"
                  checked={v}
                  onChange={(e) => change(e.target.checked)}
                />
                {label(key)}
              </label>
            );
          if (key === "status" || key === "type")
            return (
              <label key={key}>
                {label(key)}
                <select
                  aria-label={label(key)}
                  value={v}
                  onChange={(e) => change(e.target.value)}
                >
                  {(key === "type"
                    ? ["free", "paid"]
                    : ["draft", "published"]
                  ).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            );
          if (Array.isArray(v))
            return (
              <label key={key}>
                {label(key)}
                {"(one per line)"}
                <textarea
                  value={v.join("\n")}
                  onChange={(e) => change(e.target.value.split("\n"))}
                />
                {key === "gallery" && (
                  <MediaPicker
                    onSelect={(id) => change([...v, "/media/" + id])}
                  />
                )}
              </label>
            );
          const large =
            ["body", "summary", "outcomes", "message", "notes"].includes(key) ||
            String(v || "").length > 120;
          return (
            <label key={key}>
              {label(key)}
              {key === "body" && (
                <small>
                  {
                    "Rich HTML: paragraphs, headings, lists, bold, italic and links. Unsafe markup is removed on save."
                  }
                </small>
              )}
              {["published_at", "expiresAt"].includes(key) ? (
                <input
                  type="datetime-local"
                  value={v ? new Date(v).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    change(
                      e.target.value
                        ? new Date(e.target.value + "Z").toISOString()
                        : null,
                    )
                  }
                />
              ) : large ? (
                <textarea
                  rows={key === "body" ? 10 : 3}
                  value={v || ""}
                  onChange={(e) => change(e.target.value)}
                />
              ) : (
                <input
                  type={
                    typeof v === "number" || key === "price" ? "number" : "text"
                  }
                  value={v ?? ""}
                  onChange={(e) =>
                    change(
                      key === "price"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : typeof v === "number"
                          ? Number(e.target.value)
                          : e.target.value ||
                            (["fileId"].includes(key) ? null : ""),
                    )
                  }
                />
              )}
              {["image", "fileId"].includes(key) && (
                <MediaPicker
                  documents={key === "fileId"}
                  onSelect={(id) =>
                    change(key === "fileId" ? id : "/media/" + id)
                  }
                />
              )}
              {["published_at", "expiresAt"].includes(key) && (
                <small>{"UTC. Leave blank to publish immediately."}</small>
              )}
            </label>
          );
        })}
    </>
  );
}
export default function Admin() {
  const [ready, setReady] = useState(false),
    [auth, setAuth] = useState(false),
    [module, setModule] = useState("dashboard"),
    [data, setData] = useState<any>(null),
    [edit, setEdit] = useState<any>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failure, setFailure] = useState(false),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [menu, setMenu] = useState(false),
    [revision, setRevision] = useState(0);
  const [appearance, setAppearance] =
    useState<Record<string, string>>(appearanceDefaults);
  useEffect(() => applyAppearance(appearance, "admin"), [appearance]);
  useEffect(() => {
    api("public/appearance")
      .then(setAppearance)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 851px)");
    const close = () => {
      if (wide.matches) setMenu(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", key);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previous;
    };
  }, [menu]);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(q), 300);
    return () => clearTimeout(timer);
  }, [q]);
  const notify = (s: string, error = false) => {
    setMessage(s);
    setFailure(error);
  };
  useEffect(() => {
    api("auth/session")
      .then((s) => {
        csrf = s.csrf;
        setAuth(s.authenticated);
        setReady(true);
      })
      .catch((e) => {
        notify(e.message, true);
        setReady(true);
      });
  }, []);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  useEffect(() => {
    if (!auth) return;
    let active = true;
    setEdit(null);
    setDirty(false);
    const search = `?page=${page}&q=${encodeURIComponent(searchQuery)}&status=${filter}&deleted=${filter === "deleted"}`;
    const endpoint =
      module === "dashboard"
        ? "admin/dashboard"
        : module === "media"
          ? null
          : [
                "homepage",
                "about",
                "navigation",
                "settings",
                "appearance",
              ].includes(module)
            ? "admin/settings"
            : ["booking", "contact"].includes(module)
              ? null
              : module === "security"
                ? null
                : "admin/content/" + module + search;
    if (endpoint)
      api(endpoint)
        .then((d) => {
          if (active) setData(d);
        })
        .catch((e) => {
          if (active) {
            notify(e.message, true);
            setData((previous: any) => previous || { loadFailed: true });
          }
        });
    else setData({});
    return () => {
      active = false;
    };
  }, [auth, module, page, searchQuery, filter, revision]);
  async function action(fn: () => Promise<any>, success = "Saved") {
    setBusy(true);
    notify("");
    try {
      await fn();
      setDirty(false);
      setEdit(null);
      setRevision((n) => n + 1);
      notify(success);
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  function navigate(key: string) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setData(null);
    setModule(key);
    setPage(1);
    setQ("");
    setSearchQuery("");
    setFilter("");
    setMenu(false);
    notify("");
  }
  const changed = (v: any) => {
    setEdit(v);
    setDirty(true);
  };
  if (!ready)
    return (
      <div className="admin">
        <p role="status">{"Loading account…"}</p>
      </div>
    );
  if (!auth)
    return (
      <main className="admin login">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            action(async () => {
              const s = await api("auth/login", "POST", {
                email: f.get("email"),
                password: f.get("password"),
              });
              csrf = s.csrf;
              setAuth(true);
            }, "Signed in");
          }}
        >
          <h1>{"Tanvir / Admin"}</h1>
          <p>{"Manage your website"}</p>
          <label>
            {"Email"}
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            {"Password"}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy}>{"Sign in"}</button>
          <p role="alert">{message}</p>
        </form>
      </main>
    );
  return (
    <div className="admin">
      <button
        className="mobile-toggle"
        onClick={() => setMenu(!menu)}
        aria-expanded={menu}
      >
        {menu ? <X size={20} /> : <Menu size={20} />} <span>Admin menu</span>
      </button>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label="Close admin menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside aria-label="Admin navigation" className={menu ? "open" : ""}>
        <a href={"/"} className="brand">
          <span className="brand-mark">
            t<span>.</span>
          </span>
          <div>
            TANVIR<span className="brand-subtitle">PORTFOLIO STUDIO</span>
          </div>
        </a>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {modules.map(([key, title]) => (
            <button
              className={key === module ? "selected" : ""}
              aria-current={key === module ? "page" : undefined}
              key={key}
              onClick={() => navigate(key)}
            >
              {React.createElement(moduleIcons[key], {
                size: 17,
                strokeWidth: 1.7,
              })}
              <span>{title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" /> Your creative workspace
          <small>Everything behind your website, in one place.</small>
        </div>
        <button
          className="signout"
          onClick={() =>
            action(async () => {
              await api("auth/logout", "POST");
              setAuth(false);
              const s = await api("auth/session");
              csrf = s.csrf;
            }, "Signed out")
          }
        >
          <LogOut size={17} /> {"Sign out"}
        </button>
      </aside>
      <main inert={menu ? true : undefined}>
        <header className="admin-header">
          <div>
            <small>
              Workspace / {modules.find((x) => x[0] === module)?.[1]}
            </small>
            <h1>{modules.find((x) => x[0] === module)?.[1]}</h1>
            <p>
              {module === "dashboard"
                ? "A little overview of everything you’re building."
                : module === "appearance"
                  ? "Make your website and workspace feel like you."
                  : "Keep your portfolio fresh, organized, and up to date."}
            </p>
          </div>
          <div className="header-actions">
            <a
              className="website-action website-action-view"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              <Globe size={18} />
              View website <ArrowUpRight size={14} />
            </a>
            <a
              className="website-action website-action-edit"
              href="/?edit=1"
              target="_blank"
              rel="noreferrer"
            >
              <Pencil size={18} />
              Edit Website <ArrowUpRight size={14} />
            </a>
            <button
              className="account-chip"
              aria-label="Account and security"
              onClick={() => navigate("security")}
            >
              <span>TH</span>
              <div>
                Tanvir<small>Administrator</small>
              </div>
            </button>
          </div>
        </header>
        {message && (
          <div
            className={failure ? "notice error" : "notice"}
            role={failure ? "alert" : "status"}
          >
            {message}
          </div>
        )}
        {!data ? (
          <p role="status">{"Loading…"}</p>
        ) : data.loadFailed ? (
          <button onClick={() => setRevision((n) => n + 1)}>
            Retry loading
          </button>
        ) : (
          <>
            {module === "dashboard" && (
              <>
                <div className="overview-stats">
                  {[
                    {
                      label: "Total content",
                      value: data.counts.reduce(
                        (n: number, c: any) => n + Number(c.count),
                        0,
                      ),
                      icon: Layers,
                      caption: "Across your collections",
                    },
                    {
                      label: "Published",
                      value: data.counts
                        .filter((c: any) => c.status === "published")
                        .reduce((n: number, c: any) => n + Number(c.count), 0),
                      icon: CircleCheck,
                      caption: "Published content records",
                    },
                    {
                      label: "New enquiries",
                      value: data.requests
                        .filter((r: any) => r.status === "new")
                        .reduce((n: number, r: any) => n + Number(r.count), 0),
                      icon: Inbox,
                      caption: "Ready for your attention",
                    },
                  ].map(({ label, value, icon: Icon, caption }) => (
                    <div className="overview-card" key={label}>
                      <span className="stat-icon">
                        <Icon size={22} />
                      </span>
                      <div>
                        <span>{label}</span>
                        <strong>{value.toLocaleString()}</strong>
                        <small>{caption}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="section-heading">
                  <div>
                    <h2>Your content, at a glance</h2>
                    <p>Choose a collection to start creating.</p>
                  </div>
                  <span className="section-tag">
                    {Object.keys(defaults).length} collections
                  </span>
                </div>
                <div className="collection-grid">
                  {Object.keys(defaults).map((key, index) => {
                    const count = data.counts
                      .filter((c: any) => c.collection === key)
                      .reduce((n: number, c: any) => n + Number(c.count), 0);
                    const published = data.counts
                      .filter(
                        (c: any) =>
                          c.collection === key && c.status === "published",
                      )
                      .reduce((n: number, c: any) => n + Number(c.count), 0);
                    return (
                      <button
                        className={
                          index === 0
                            ? "collection-card featured-card"
                            : "collection-card"
                        }
                        key={key}
                        onClick={() => navigate(key)}
                      >
                        <div>
                          <span>{modules.find((m) => m[0] === key)?.[1]}</span>
                          <ArrowUpRight size={15} />
                        </div>
                        <strong>{String(count).padStart(2, "0")}</strong>
                        <div>
                          <small>
                            <span className="live-dot" />
                            {published} published
                          </small>
                          {React.createElement(moduleIcons[key], {
                            size: 26,
                            strokeWidth: 1.5,
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="section-heading">
                  <div>
                    <h2>Recent requests</h2>
                    <p>The latest conversations from your website.</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => navigate("booking")}
                  >
                    View requests <ArrowRight size={15} />
                  </button>
                </div>

                {!data.recent.length ? (
                  <div className="empty-state">
                    <Inbox size={30} />
                    <h3>All caught up</h3>
                    <p>New bookings and messages will appear here.</p>
                  </div>
                ) : (
                  data.recent.map((r: any) => (
                    <div className="row" key={r.id}>
                      {r.name}
                      {"· "}
                      {r.kind}
                      {"· "}
                      {r.status}
                      {"· "}
                      {new Date(r.created_at).toLocaleString("en-GB", {
                        timeZone: "Asia/Dhaka",
                      })}
                    </div>
                  ))
                )}
              </>
            )}
            {[
              "homepage",
              "about",
              "navigation",
              "settings",
              "appearance",
            ].includes(module) && (
              <>
                {module === "homepage" && data.homepage && (
                  <VisibilitySettings
                    initial={data.homepage.value.sections}
                    initialOrder={data.homepage.value.sectionOrder}
                    api={api}
                  />
                )}
                {module === "navigation" && data.logos && (
                  <LogoSettings
                    data={data}
                    api={api}
                    onDirtyChange={setDirty}
                    ImageField={SettingsImageField}
                  />
                )}
                <SettingsWrapper
                  onDiscard={() => {
                    setEdit(null);
                    setDirty(false);
                  }}
                  dirty={dirty}
                  module={module}
                  data={data}
                  api={api}
                  onDirtyChange={setDirty}
                >
                  {[
                    ...(module === "homepage" ? ["settings"] : []),
                    module,
                    ...(["settings", "homepage"].includes(module)
                      ? ["brand"]
                      : []),
                  ].map((key) => {
                    const item = data[key];
                    if (!item)
                      return (
                        <p key={key}>
                          {"Run the initial import to create "}
                          {key}
                          {"settings."}
                        </p>
                      );
                    const current = edit?.key === key ? edit.value : item.value;
                    return (
                      <form
                        key={key}
                        onSubmit={(e) => {
                          e.preventDefault();
                          action(async () => {
                            const latest =
                              key === "homepage"
                                ? (await api("admin/settings")).homepage
                                : item;
                            const value =
                              key === "homepage"
                                ? {
                                    ...current,
                                    sections: latest.value.sections,
                                    sectionOrder: latest.value.sectionOrder,
                                    galleryTitle: latest.value.galleryTitle,
                                    galleryDescription:
                                      latest.value.galleryDescription,
                                  }
                                : current;
                            await api("admin/settings/" + key, "PUT", {
                              value,
                              version: latest.version,
                            });
                            if (key === "appearance") {
                              setAppearance(current);
                              announcePublicUpdate();
                            }
                          });
                        }}
                      >
                        <h2>
                          {module === "homepage" && key === "settings"
                            ? "Homepage images"
                            : label(key)}
                        </h2>
                        {key === "appearance" && (
                          <p className="appearance-intro">
                            Choose independent colors and modes for your public
                            website and admin. System follows the device’s light
                            or dark preference. Changes apply after you save.
                          </p>
                        )}
                        {key === "appearance" && (
                          <ThemePicker
                            value={current}
                            onChange={(value) => changed({ key, value })}
                          />
                        )}
                        <div
                          className={
                            key === "appearance"
                              ? "appearance-fields"
                              : "settings-fields"
                          }
                        >
                          {Object.entries(current)
                            .filter(
                              ([field]) =>
                                key !== "appearance" ||
                                (field !== "websiteDesign" &&
                                  (field !== "studioPortraitShape" ||
                                    current.websiteDesign === "studio") &&
                                  (field !== "executivePortraitSide" ||
                                    current.websiteDesign === "executive")),
                            )
                            .sort(([a], [b]) =>
                              a === "sections" ? -1 : b === "sections" ? 1 : 0,
                            )
                            .filter(
                              ([field]) =>
                                !(
                                  key === "homepage" &&
                                  [
                                    "sections",
                                    "sectionOrder",
                                    "galleryTitle",
                                    "galleryDescription",
                                  ].includes(field)
                                ),
                            )
                            .filter(
                              ([field]) =>
                                !(
                                  module === "homepage" && key === "settings"
                                ) ||
                                ["heroPortrait", "journeyPortrait"].includes(
                                  field,
                                ),
                            )
                            .map(([field, v]: any) =>
                              key === "homepage" && field === "sections" ? (
                                <SectionToggles
                                  key={field}
                                  value={v}
                                  onChange={(sections) =>
                                    changed({
                                      key,
                                      value: { ...current, sections },
                                    })
                                  }
                                />
                              ) : key === "appearance" ? (
                                <label className="appearance-field" key={field}>
                                  {(definition as any).appearance[field].label}
                                  {field === "websiteLoadingBar" ? (
                                    <input
                                      type="checkbox"
                                      role="switch"
                                      checked={v !== "off"}
                                      onChange={(e) =>
                                        changed({
                                          key,
                                          value: {
                                            ...current,
                                            [field]: e.target.checked
                                              ? "on"
                                              : "off",
                                          },
                                        })
                                      }
                                    />
                                  ) : field.endsWith("Color") ? (
                                    <div className="color-control">
                                      <input
                                        type="color"
                                        value={v}
                                        onChange={(e) =>
                                          changed({
                                            key,
                                            value: {
                                              ...current,
                                              [field]: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                      <input
                                        aria-label={`${(definition as any).appearance[field].label} hex`}
                                        pattern="#[a-fA-F0-9]{6}"
                                        maxLength={7}
                                        value={v}
                                        onChange={(e) =>
                                          changed({
                                            key,
                                            value: {
                                              ...current,
                                              [field]: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <select
                                      value={v}
                                      onChange={(e) =>
                                        changed({
                                          key,
                                          value: {
                                            ...current,
                                            [field]: e.target.value,
                                          },
                                        })
                                      }
                                    >
                                      {(
                                        (definition as any).appearance[field]
                                          .enum || []
                                      ).map((option: string) => (
                                        <option key={option} value={option}>
                                          {label(option)}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <small>
                                    {!field.startsWith("admin")
                                      ? "Visible on your public portfolio"
                                      : "Only changes your admin workspace"}
                                  </small>
                                </label>
                              ) : ["heroPortrait", "journeyPortrait"].includes(
                                  field,
                                ) ? (
                                <SettingsImageField
                                  key={field}
                                  title={(definition as any)[key][field].label}
                                  value={v}
                                  disabled={busy}
                                  onChange={(url) =>
                                    changed({
                                      key,
                                      value: { ...current, [field]: url },
                                    })
                                  }
                                />
                              ) : (
                                <label key={field}>
                                  {(definition as any)[key]?.[field]?.label ||
                                    label(field)}
                                  <textarea
                                    rows={String(v).length > 120 ? 4 : 2}
                                    value={v}
                                    onChange={(e) =>
                                      changed({
                                        key,
                                        value: {
                                          ...current,
                                          [field]: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                </label>
                              ),
                            )}
                        </div>
                        <button disabled={busy}>
                          {"Save "}
                          {module === "homepage" && key === "settings"
                            ? "homepage images"
                            : label(key)}
                        </button>
                      </form>
                    );
                  })}
                </SettingsWrapper>
              </>
            )}
            {module === "gallery" && <AdminGallery api={api} />}
            {defaults[module] && module !== "gallery" && (
              <>
                {module === "gallery" && (
                  <p>
                    One record per event photo. Upload photos in Media Library,
                    then choose an image here. Add a title, caption (summary),
                    alt text and location; set Published to show it. Display
                    order controls the masonry gallery.
                  </p>
                )}
                <div className="toolbar">
                  <input
                    aria-label="Search content"
                    placeholder="Search by title…"
                    value={q}
                    onChange={(e) => {
                      if (!dirty) {
                        setQ(e.target.value);
                        setPage(1);
                      }
                    }}
                  />
                  <select
                    aria-label="Publication filter"
                    value={filter}
                    onChange={(e) => {
                      if (!dirty) {
                        setFilter(e.target.value);
                        setPage(1);
                      }
                    }}
                  >
                    <option value="">{"All active"}</option>
                    <option value="draft">{"Draft"}</option>
                    <option value="published">{"Published"}</option>
                    <option value="deleted">{"Deleted"}</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!dirty || window.confirm("Discard unsaved changes?"))
                        changed(newRecord(module));
                    }}
                  >
                    {"Create"}
                  </button>
                </div>
                {edit ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const payload = { ...edit };
                      for (const k of [
                        "id",
                        "collection",
                        "created_at",
                        "updated_at",
                        "deleted_at",
                      ])
                        delete payload[k];
                      action(() =>
                        api(
                          "admin/content/" +
                            module +
                            (edit.id ? "/" + edit.id : ""),
                          edit.id ? "PUT" : "POST",
                          payload,
                        ),
                      );
                    }}
                  >
                    <h2>
                      {edit.id ? "Edit" : "Create"} {label(module)}
                    </h2>
                    <Fields value={edit} onChange={changed} />
                    <div className="toolbar">
                      <button disabled={busy}>{"Save"}</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !dirty ||
                            window.confirm("Discard unsaved changes?")
                          ) {
                            setEdit(null);
                            setDirty(false);
                          }
                        }}
                      >
                        {"Cancel"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {!data.items.length && <p>{"No records found."}</p>}
                    {data.items.map((r: any) => (
                      <div className="row content-row" key={r.id}>
                        <div>
                          <strong>{r.title}</strong>
                          <small>
                            {"/"}
                            {module}
                            {"/"}
                            {r.slug} {r.featured ? "· Featured" : ""}
                          </small>
                        </div>
                        <span className={`status-badge status-${r.status}`}>
                          {r.deleted_at ? "Deleted" : r.status}
                        </span>
                        {!r.deleted_at && (
                          <button onClick={() => setEdit(r)}>{"Edit"}</button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                r.deleted_at
                                  ? "Restore this record?"
                                  : "Move this record to deleted items?",
                              )
                            )
                              action(() =>
                                api(
                                  `admin/content/${module}/${r.id}/${r.deleted_at ? "restore" : "delete"}`,
                                  "POST",
                                ),
                              );
                          }}
                        >
                          {r.deleted_at ? "Restore" : "Delete"}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
            {module === "booking" && (
              <LeadBoard
                key={module}
                kind={module}
                api={api}
                onDirtyChange={setDirty}
              />
            )}
            {module === "contact" && (
              <ContactInbox api={api} onDirtyChange={setDirty} />
            )}
            {module === "media" && (
              <AdminMediaLibrary api={api} onDirtyChange={setDirty} />
            )}
            {module === "security" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  action(async () => {
                    await api("auth/password", "POST", {
                      currentPassword: f.get("current"),
                      password: f.get("password"),
                    });
                    setAuth(false);
                    csrf = (await api("auth/session")).csrf;
                  }, "Password changed. All sessions have been invalidated.");
                }}
              >
                <h2>{"Change password"}</h2>
                <label>
                  {"Current password"}
                  <input
                    name="current"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label>
                  {"New password"}
                  <input
                    name="password"
                    type="password"
                    minLength={14}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button disabled={busy}>
                  {"Change password and sign out"}
                </button>
              </form>
            )}
            {data.items && !edit && (
              <div className="toolbar">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {"Previous"}
                </button>
                <span>
                  {"Page "}
                  {page}
                  {"· "}
                  {data.total}
                  {"records"}
                </span>
                <button
                  disabled={page * 20 >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {"Next"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SettingsWrapper({ module, children, ...props }: any) {
  return module === "settings" ? (
    <SiteExtensions {...props}>{children}</SiteExtensions>
  ) : (
    <>{children}</>
  );
}
