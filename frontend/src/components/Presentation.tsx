"use client";

import { EditText, EditingContext } from "./EditBinding";
import React, { useEffect, useRef, useState, useContext } from "react";
import { Image as ImageIcon } from "lucide-react";

/** Decoration stays in the frontend: changed CMS text always falls back intact. */
export function MixedText({
  text,
  phrase,
  editSource,
}: {
  text: string;
  phrase?: string;
  editSource?: string;
}) {
  if (editSource)
    return (
      <EditText source={editSource}>
        <MixedText text={text} phrase={phrase} />
      </EditText>
    );
  if (
    !text ||
    !phrase ||
    !text.includes(phrase) ||
    /[\u0980-\u09ff]/.test(phrase)
  )
    return <>{text}</>;
  const at = text.indexOf(phrase);
  return (
    <>
      {text.slice(0, at)}
      <em className="editorial-accent">{phrase}</em>
      {text.slice(at + phrase.length)}
    </>
  );
}
/** Keep the image's layout while loading; reveal only a fully decoded frame. */
export function MediaImage({
  alt,
  src,
  className = "",
  loading,
  editSource,
  onLoad,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { editSource?: string }) {
  const editing = useContext(EditingContext);
  const editProps =
    editing && editSource
      ? {
          "data-edit-source": editSource,
          "data-edit-kind": "image",
          tabIndex: 0,
        }
      : {};
  let resolvedSrc = typeof src === "string" ? src : undefined;
  if (editing && resolvedSrc?.startsWith("/media/"))
    resolvedSrc = "/api/admin/media/" + resolvedSrc.split("/").pop() + "/file";
  const ref = useRef<HTMLImageElement>(null);
  const [failedSource, setFailedSource] = useState<string>();
  const [readySource, setReadySource] = useState<string>();
  const [nearSource, setNearSource] = useState<string>();
  useEffect(() => {
    const image = ref.current;
    if (!image || !resolvedSrc) return;
    let active = true;
    const ready = async () => {
      if (!image.naturalWidth) return;
      try {
        await image.decode();
      } catch {
        /* Loaded images can still render if decode is unsupported. */
      }
      if (active && image.naturalWidth && resolvedSrc) setReadySource(resolvedSrc);
    };
    image.addEventListener("load", ready);
    if (image.complete) {
      if (image.naturalWidth) void ready();
      else if (resolvedSrc) setFailedSource(resolvedSrc);
    }
    const observer =
      loading === "lazy" && "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                if (resolvedSrc) setNearSource(resolvedSrc);
                observer?.disconnect();
              }
            },
            { rootMargin: "1000px 0px" },
          )
        : null;
    observer?.observe(image);
    return () => {
      active = false;
      observer?.disconnect();
      image.removeEventListener("load", ready);
    };
  }, [resolvedSrc, loading]);
  if (!resolvedSrc || failedSource === resolvedSrc)
    return (
      <span
        {...editProps}
        role="img"
        aria-label={alt || "Image unavailable"}
        className={`media-fallback ${className}`}
      >
        <ImageIcon aria-hidden="true" size={32} />
        <span>{alt || "Image unavailable"}</span>
      </span>
    );
  return (
    <img
      {...props}
      {...editProps}
      ref={ref}
      src={resolvedSrc}
      alt={alt || ""}
      loading={nearSource === resolvedSrc ? "eager" : loading}
      decoding="async"
      className={`media-image ${className}`}
      data-ready={readySource === resolvedSrc}
      onLoad={onLoad}
      onError={(event) => {
        if (resolvedSrc) setFailedSource(resolvedSrc);
        onError?.(event);
      }}
    />
  );
}
export function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !("IntersectionObserver" in window)) return;
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      setShown(value);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / 950, 1);
        setShown(Math.round(value * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    media.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", finish);
    };
  }, [value]);
  return (
    <span className="verified-count" ref={ref}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{String(shown).padStart(2, "0")}</span>
    </span>
  );
}
