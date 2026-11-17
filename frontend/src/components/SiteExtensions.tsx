"use client";

import React, { useState, useEffect } from "react";
import { Globe, Code2, Radio, Save } from "lucide-react";
import { announcePublicUpdate } from "./AdminGallery";
type Props = {
  dirty?: boolean;
  onDiscard?: () => void;
  data: any;
  api: any;
  onDirtyChange: (v: boolean) => void;
  children?: React.ReactNode;
  ImageField?: any;
};
function Group({
  id,
  initial,
  onSaved,
  api,
  onDirtyChange,
  children,
}: {
  id: string;
  initial: any;
  onSaved?: (record: any) => void;
  api: any;
  onDirtyChange: any;
  children: (
    value: any,
    change: (key: string, value: string) => void,
  ) => React.ReactNode;
}) {
  const [record, setRecord] = useState(initial),
    [value, setValue] = useState(initial.value),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const dirty = JSON.stringify(value) !== JSON.stringify(record.value);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  return (
    <form
      className="extension-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
          await api("admin/settings/" + id, "PUT", {
            value,
            version: record.version,
          });
          const updated = { value, version: record.version + 1 };
          setRecord(updated);
          onSaved?.(updated);
          announcePublicUpdate();
          setNotice("Saved. Changes apply on the next website load.");
        } catch (e: any) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        {children(value, (k, v) => setValue({ ...value, [k]: v }))}
      </fieldset>
      {error && (
        <p role="alert" className="notice error">
          {error}{" "}
          <button
            type="button"
            onClick={async () => {
              if (dirty && !confirm("Discard changes and reload?")) return;
              try {
                const d = await api("admin/settings");
                setRecord(d[id]);
                onSaved?.(d[id]);
                setValue(d[id].value);
                setError("");
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Reload settings
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <button disabled={busy || !dirty}>
        <Save size={16} />{" "}
        {busy
          ? "Saving…"
          : "Save " + (id === "customCode" ? "custom code" : id)}
      </button>
    </form>
  );
}
export default function SiteExtensions({
  data,
  api,
  onDirtyChange,
  children,
  dirty,
  onDiscard,
}: Props) {
  const [tab, setTab] = useState("seo");
  const [saved, setSaved] = useState({
    integrations: data.integrations,
    customCode: data.customCode,
  });
  return (
    <>
      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Site settings tabs"
      >
        {[
          ["seo", "SEO & Site Settings", Globe],
          ["integrations", "Integration", Radio],
          ["customCode", "Custom Code", Code2],
        ].map(([id, title, Icon]: any) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              if (tab !== id) {
                if (
                  dirty &&
                  !confirm("Discard unsaved changes and switch tabs?")
                )
                  return;
                onDiscard?.();
                onDirtyChange(false);
                setTab(id);
              }
            }}
          >
            <Icon size={17} />
            {title}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "seo" ? (
          children
        ) : (
          <Group
            key={tab}
            id={tab}
            initial={saved[tab]}
            onSaved={(record) =>
              setSaved((prev) => ({ ...prev, [tab]: record }))
            }
            api={api}
            onDirtyChange={onDirtyChange}
          >
            {(v, change) =>
              tab === "integrations" ? (
                <>
                  <p>
                    Add the provider ID, enable its card and save. This installs
                    browser page-view tracking, not a server-side conversion
                    API. Avoid installing the same pixel here and through GTM.
                  </p>
                  <div className="integration-grid">
                    {[
                      ["facebook", "Meta / Facebook Pixel", "123456789012345"],
                      ["gtm", "Google Tag Manager", "GTM-XXXXXXX"],
                      ["tiktok", "TikTok Pixel", "Your TikTok Pixel ID"],
                    ].map(([key, title, placeholder]) => (
                      <section className="integration-card" key={key}>
                        <Radio size={24} />
                        <h3>{title}</h3>
                        <label>
                          <input
                            type="checkbox"
                            checked={v[key + "Enabled"] === "on"}
                            onChange={(e) =>
                              change(
                                key + "Enabled",
                                e.target.checked ? "on" : "off",
                              )
                            }
                          />{" "}
                          Enabled
                        </label>
                        <label>
                          {title} ID
                          <input
                            value={v[key + "Id"]}
                            placeholder={placeholder}
                            maxLength={40}
                            onChange={(e) =>
                              change(key + "Id", e.target.value.trim())
                            }
                          />
                        </label>
                        <small>
                          {v[key + "Enabled"] === "on"
                            ? "Enabled after save — verify events in your provider dashboard."
                            : "Disabled"}
                        </small>
                      </section>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={v.enabled === "on"}
                      onChange={(e) =>
                        change("enabled", e.target.checked ? "on" : "off")
                      }
                    />{" "}
                    Enable custom code
                  </label>
                  <p>
                    Runs only on the public website, after it loads—not in
                    admin, the visual editor or theme previews. Use trusted
                    code; JavaScript can change the page and access visitor
                    information. Do not paste passwords or secret API keys.
                  </p>
                  {["header", "body"].map((loc) => (
                    <section className="integration-card" key={loc}>
                      <h3>
                        {loc === "header"
                          ? "Header — inside <head>"
                          : "Body — end of <body>"}
                      </h3>
                      {["Html", "Css", "Js"].map((type) => (
                        <label key={type}>
                          {loc} {type.toUpperCase()}
                          <textarea
                            aria-label={loc + " " + type.toUpperCase()}
                            className="code-field"
                            rows={7}
                            maxLength={20000}
                            spellCheck={false}
                            value={v[loc + type]}
                            onChange={(e) => change(loc + type, e.target.value)}
                            placeholder={
                              type === "Html"
                                ? "HTML / vendor snippets"
                                : type === "Css"
                                  ? "CSS only, without <style> tags"
                                  : "JavaScript only, without <script> tags"
                            }
                          />
                        </label>
                      ))}
                    </section>
                  ))}
                </>
              )
            }
          </Group>
        )}
      </div>
    </>
  );
}
export function LogoSettings({ data, api, onDirtyChange, ImageField }: Props) {
  return (
    <section>
      <h2>Header & footer logos</h2>
      <p>
        Choose text or an image independently. Image slots are 160 × 40 px
        (4:1); use a transparent 640 × 160 px PNG or WebP for a sharp logo.
        Images fit without stretching.
      </p>
      <Group
        id="logos"
        initial={data.logos}
        api={api}
        onDirtyChange={onDirtyChange}
      >
        {(v, change) => (
          <div className="integration-grid">
            {["header", "footer"].map((loc) => (
              <section className="integration-card" key={loc}>
                <h3>{loc === "header" ? "Header logo" : "Footer logo"}</h3>
                <label>
                  Logo type
                  <select
                    aria-label={loc + " logo type"}
                    value={v[loc + "Mode"]}
                    onChange={(e) => change(loc + "Mode", e.target.value)}
                  >
                    <option value="text">Text (existing brand)</option>
                    <option value="image">Image logo</option>
                  </select>
                </label>
                {v[loc + "Mode"] === "image" && (
                  <>
                    <ImageField
                      title={loc + " logo"}
                      value={v[loc + "Image"]}
                      onChange={(url: string) => change(loc + "Image", url)}
                      disabled={false}
                    />
                    <label>
                      Alternative text
                      <input
                        value={v[loc + "Alt"]}
                        maxLength={200}
                        onChange={(e) => change(loc + "Alt", e.target.value)}
                      />
                    </label>
                  </>
                )}
              </section>
            ))}
          </div>
        )}
      </Group>
    </section>
  );
}
