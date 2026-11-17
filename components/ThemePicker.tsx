import React, { useEffect, useRef, useState } from "react";
import { designs } from "../design-themes";
import { Monitor, Smartphone, Check } from "lucide-react";
export default function ThemePicker({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null),
    wrap = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState("desktop"),
    [width, setWidth] = useState(800),
    [loaded, setLoaded] = useState(false);
  const design =
    designs.find((d) => d.id === value.websiteDesign) || designs[0];
  const viewport = device === "desktop" ? 1280 : 390;
  const send = () =>
    iframe.current?.contentWindow?.postMessage(
      { type: "portfolio-design-preview", appearance: value },
      location.origin,
    );
  useEffect(() => {
    send();
  }, [value, loaded]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === iframe.current?.contentWindow &&
        event.data?.type === "portfolio-preview-ready"
      )
        send();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [value]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    if (wrap.current) observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="theme-picker" aria-label="Portfolio themes">
      <div className="theme-picker-heading">
        <div>
          <h3>Choose your portfolio theme</h3>
          <p>
            One portfolio. Three distinct styles. Your content stays the same.
          </p>
        </div>
        <span>Preview before saving</span>
      </div>
      <div className="theme-options">
        {designs.map((d) => (
          <button
            type="button"
            key={d.id}
            className={"theme-option " + (design.id === d.id ? "selected" : "")}
            aria-pressed={design.id === d.id}
            onClick={() => onChange({ ...value, websiteDesign: d.id })}
          >
            <div
              className={"theme-thumbnail theme-thumbnail-" + d.id}
              aria-hidden="true"
            >
              <div className="thumbnail-browser">
                <i />
                <i />
                <i />
                <span />
              </div>
              <div className="thumbnail-page">
                <div className="thumbnail-nav">
                  <b>PORTFOLIO.</b>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="thumbnail-hero">
                  <div className="thumbnail-copy">
                    <small>DESIGN. CREATE. INSPIRE.</small>
                    <strong>
                      {d.id === "editorial" ? (
                        <>
                          Ideas with
                          <br />
                          <em>impact.</em>
                        </>
                      ) : d.id === "studio" ? (
                        <>
                          Independent.
                          <br />
                          <em>By design.</em>
                        </>
                      ) : (
                        <>
                          Expertise that
                          <br />
                          drives growth.
                        </>
                      )}
                    </strong>
                    <span />
                    <span />
                    <b />
                  </div>
                  <div className="thumbnail-portrait">
                    <i />
                  </div>
                </div>
                <div className="thumbnail-cards">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
            <div className="theme-option-title">
              <strong>{d.name}</strong>
              <span>
                {design.id === d.id ? (
                  <>
                    <Check size={14} />
                    Selected
                  </>
                ) : (
                  d.tag
                )}
              </span>
            </div>
            <p>{d.description}</p>
          </button>
        ))}
      </div>
      <div className="theme-preview-bar">
        <div>
          <strong>{design.name} · live preview</strong>
          <small>
            Uses your actual published content and the colors below. Nothing
            changes publicly until Save Appearance.
          </small>
        </div>
        <div role="group" aria-label="Preview device">
          <button
            type="button"
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            <Monitor size={16} />
            Desktop
          </button>
          <button
            type="button"
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone size={16} />
            Mobile
          </button>
        </div>
      </div>
      <div className="theme-preview-stage" ref={wrap}>
        <div
          style={{
            width: viewport * Math.min(width / viewport, 1),
            height: Math.min(width / viewport, 1) * 760,
          }}
        >
          <iframe
            title="Live portfolio theme preview"
            ref={iframe}
            src="/?preview=design"
            onLoad={() => setLoaded(true)}
            style={{
              width: viewport,
              height: 760,
              transform: `scale(${Math.min(width / viewport, 1)})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
      <p className="theme-settings-note">
        {design.id === "studio"
          ? "Studio settings: choose an oval or square portrait below."
          : design.id === "executive"
            ? "Executive settings: place your portrait to the left or right below."
            : "Editorial keeps the sculpted portrait and expressive card layouts."}{" "}
        Spacing, corners, colors and motion are shared across themes.
      </p>
    </section>
  );
}
