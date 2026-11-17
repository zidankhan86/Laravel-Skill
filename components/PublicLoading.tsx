import React, { useEffect, useState } from "react";
export default function PublicLoading() {
  const [appearance, setAppearance] = useState<Record<string, string> | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/appearance", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then(setAppearance)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const enabled = appearance && appearance.websiteLoadingBar !== "off";
  const color = /^#[\da-f]{6}$/i.test(appearance?.websitePrimaryColor || "")
    ? appearance!.websitePrimaryColor
    : "#d0f56a";
  return (
    <div className="public-loading-shell" aria-busy="true">
      <span className="sr-only" role="status">
        Loading website…
      </span>
      {enabled && (
        <div className="public-loading-line" aria-hidden="true">
          <span style={{ backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}
