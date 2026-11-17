"use client";

import React, { useEffect, useState } from "react";
import App from "./App";
import VisualEditor from "./VisualEditor";
import PublicLoading from "./PublicLoading";

export default function EditorOrApp() {
  const [isEditor, setIsEditor] = useState<boolean | null>(null);

  useEffect(() => {
    const checkEditor = async () => {
      if (new URLSearchParams(window.location.search).get("edit") === "1") {
        try {
          const session = await (await fetch("/api/auth/session")).json();
          if (!session.authenticated) {
            window.location.replace("/admin");
            return;
          }
          setIsEditor(true);
        } catch {
          window.location.replace("/admin");
        }
      } else {
        setIsEditor(false);
      }
    };

    checkEditor();
  }, []);

  if (isEditor === null) {
    return <PublicLoading />;
  }

  if (isEditor) {
    return <VisualEditor />;
  }

  return <App initialView="home" />;
}
