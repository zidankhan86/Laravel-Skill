"use client";

import React, { useState } from "react";
import SectionToggles from "./SectionToggles";
import { announcePublicUpdate } from "./AdminGallery";
export default function VisibilitySettings({
  initial,
  initialOrder,
  api,
}: {
  initial: string;
  initialOrder?: string;
  api: (path: string, method?: string, body?: any) => Promise<any>;
}) {
  const [sections, setSections] = useState(initial),
    [order, setOrder] = useState(initialOrder || initial),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(false);
  return (
    <form
      className="visibility-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setNotice("");
        setError(false);
        try {
          const latest = (await api("admin/settings")).homepage;
          await api("admin/settings/homepage", "PUT", {
            version: latest.version,
            value: { ...latest.value, sections, sectionOrder: order },
          });
          announcePublicUpdate();
          setNotice(
            "Section order and visibility saved. Open website tabs will refresh.",
          );
        } catch (e: any) {
          setError(true);
          setNotice(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <SectionToggles
        value={sections}
        order={order}
        disabled={busy}
        onChange={(value, nextOrder) => {
          setSections(value);
          setOrder(nextOrder);
          setNotice("");
        }}
      />
      <button disabled={busy}>
        {busy ? "Saving…" : "Save section order & visibility"}
      </button>
      {notice && (
        <p
          role={error ? "alert" : "status"}
          className={error ? "notice error" : "notice"}
        >
          {notice}
        </p>
      )}
    </form>
  );
}
