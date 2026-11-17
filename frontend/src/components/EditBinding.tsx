"use client";

import React, { createContext, useContext } from "react";
export const EditingContext = createContext(false);
export function EditText({
  source,
  children,
}: {
  source: string;
  children: React.ReactNode;
}) {
  const editing = useContext(EditingContext);
  return editing ? (
    <span
      data-edit-source={source}
      data-edit-kind="text"
      tabIndex={0}
      role="button"
      aria-label="Edit text"
      className="editable-text"
    >
      {children || <span className="empty-edit">Add text</span>}
    </span>
  ) : (
    <>{children}</>
  );
}
export const contentSource = (id: string, path: string) =>
  `content/${id}/${path}`;
