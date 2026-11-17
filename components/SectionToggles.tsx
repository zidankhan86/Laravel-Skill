import React, { useEffect, useId, useRef, useState } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import sections from "../homepage-sections.json";
import {
  normalizeSectionOrder,
  moveSection,
  enabledSectionOrder,
} from "../section-order.mjs";
const fixed = ["navigation", "blog", "floatingActions"];
const movable = Object.keys(sections).filter((k) => !fixed.includes(k));
export default function SectionToggles({
  value,
  order,
  disabled = false,
  onChange,
}: {
  value: string;
  order?: string;
  disabled?: boolean;
  onChange: (value: string, order: string) => void;
}) {
  const enabled = value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const items = normalizeSectionOrder(order || value, movable);
  const help = useId();
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState<string | null>(null),
    [drop, setDrop] = useState<{ key: string; after: boolean } | null>(null);
  const drag = useRef<{
      key: string;
      start: number;
      x: number;
      y: number;
      active: boolean;
      over: { key: string; after: boolean } | null;
      order: string[];
    } | null>(null),
    frame = useRef(0),
    list = useRef<HTMLOListElement>(null);
  const stop = () => {
    cancelAnimationFrame(frame.current);
    drag.current = null;
    setDragging(null);
    setDrop(null);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const commit = (next: string[], active = enabled) =>
    onChange(enabledSectionOrder(next, active, fixed), next.join(","));
  const announce = (key: string, next: string[]) =>
    setAnnouncement(
      `${sections[key]} moved to position ${next.indexOf(key) + 1} of ${next.length}. Save to update the website.`,
    );
  const move = (key: string, to: number) => {
    const from = items.indexOf(key);
    if (to < 0 || to >= items.length || from === to) return;
    const next = moveSection(items, key, items[to], to > from);
    commit(next);
    announce(key, next);
  };
  const hit = () => {
    const d = drag.current;
    if (!d?.active) return;
    const row = document
      .elementFromPoint(d.x, d.y)
      ?.closest<HTMLElement>("[data-section-key]");
    if (
      row &&
      list.current?.contains(row) &&
      row.dataset.sectionKey !== d.key
    ) {
      const box = row.getBoundingClientRect();
      d.over = {
        key: row.dataset.sectionKey!,
        after: d.y > box.top + box.height / 2,
      };
      setDrop(d.over);
    } else {
      d.over = null;
      setDrop(null);
    }
  };
  const scroll = () => {
    const d = drag.current;
    if (!d?.active) return;
    const speed = d.y < 100 ? -12 : d.y > innerHeight - 110 ? 12 : 0;
    if (speed) {
      window.scrollBy(0, speed);
      hit();
    }
    frame.current = requestAnimationFrame(scroll);
  };
  const toggle = (key: string, on: boolean) =>
    commit(items, on ? [...enabled, key] : enabled.filter((k) => k !== key));
  return (
    <fieldset className="section-toggles" disabled={disabled}>
      <legend>Homepage sections & order</legend>
      <p id={help}>
        Drag the grip to arrange sections. Use the arrows or focus the grip and
        press ↑ / ↓ to move a section. Turn a section off to hide it without
        losing its position.
      </p>
      <ol
        className="section-order-list"
        ref={list}
        aria-label="Homepage section order"
      >
        {items.map((key, index) => (
          <li
            key={key}
            data-section-key={key}
            className={`section-toggle section-order-row${dragging === key ? " is-dragging" : ""}${drop?.key === key ? (drop.after ? " drop-after" : " drop-before") : ""}`}
          >
            <button
              type="button"
              className="section-grip"
              aria-label={`Move ${sections[key]}`}
              aria-describedby={help}
              title="Drag to reorder; arrow keys also work"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  stop();
                  setAnnouncement("Move cancelled");
                  return;
                }
                if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
                  e.preventDefault();
                  move(
                    key,
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? items.length - 1
                        : index + (e.key === "ArrowUp" ? -1 : 1),
                  );
                }
              }}
              onPointerDown={(e) => {
                if (e.button !== 0 || disabled) return;
                e.preventDefault();
                e.currentTarget.focus();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = {
                  key,
                  start: e.clientY,
                  x: e.clientX,
                  y: e.clientY,
                  active: false,
                  over: null,
                  order: items,
                };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                d.x = e.clientX;
                d.y = e.clientY;
                if (!d.active && Math.abs(d.y - d.start) > 5) {
                  d.active = true;
                  setDragging(d.key);
                  frame.current = requestAnimationFrame(scroll);
                }
                hit();
              }}
              onPointerUp={(e) => {
                const d = drag.current;
                if (d?.active && d.over) {
                  const next = moveSection(
                    d.order,
                    d.key,
                    d.over.key,
                    d.over.after,
                  );
                  commit(next);
                  announce(d.key, next);
                }
                stop();
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={stop}
              onLostPointerCapture={() => {
                if (drag.current) stop();
              }}
            >
              <GripVertical size={20} />
            </button>
            <span className="section-position" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <label className="section-row-label">
              <span>
                {sections[key]}
                <small>
                  {enabled.includes(key) ? "Visible" : "Hidden — position kept"}
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label={sections[key]}
                checked={enabled.includes(key)}
                onChange={(e) => toggle(key, e.target.checked)}
              />
            </label>
            <div className="section-move-buttons">
              <button
                type="button"
                aria-label={`Move ${sections[key]} up`}
                disabled={disabled || index === 0}
                onClick={() => move(key, index - 1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label={`Move ${sections[key]} down`}
                disabled={disabled || index === items.length - 1}
                onClick={() => move(key, index + 1)}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p
        className="section-order-announcement"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </p>
      <h3>Navigation & floating controls</h3>
      <p>
        These controls stay in their usual positions. They are not homepage
        content sections.
      </p>
      <div className="section-fixed-controls">
        {fixed.map((key) => (
          <label key={key} className="section-toggle">
            <span>{sections[key]}</span>
            <input
              type="checkbox"
              role="switch"
              checked={enabled.includes(key)}
              onChange={(e) => toggle(key, e.target.checked)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
