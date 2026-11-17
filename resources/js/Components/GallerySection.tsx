"use client";

import { EditText, contentSource } from "./EditBinding";
import React, { useRef, useState, useEffect } from "react";
import { X, Expand } from "lucide-react";
import { COPY, RECORDS } from "@/lib/content";
import { MediaImage, MixedText } from "./Presentation";
export default function GallerySection() {
  const photos = RECORDS.filter(
    (r) => r.collection === "gallery" && r.fields.image,
  );
  const [selected, setSelected] = useState<any>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);
  if (!photos.length) return null;
  return (
    <section id="gallery" className="public-section gallery-section">
      <div className="container mx-auto px-6">
        <div className="section-intro">
          <h2>
            <MixedText
              editSource="settings/homepage/galleryTitle"
              text={COPY.homepage.galleryTitle || "Events & Activities"}
              phrase="Activities"
            />
          </h2>
          {COPY.homepage.galleryDescription && (
            <p>
              <EditText source={"settings/homepage/galleryDescription"}>
                {COPY.homepage.galleryDescription}
              </EditText>
            </p>
          )}
        </div>
        <div className="event-masonry">
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className={index % 3 === 1 ? "gallery-tall" : "gallery-wide"}
            >
              <button
                type="button"
                aria-label={`View photo: ${photo.title}`}
                onClick={() => setSelected(photo)}
              >
                <MediaImage
                  editSource={contentSource(photo.id, "fields.image")}
                  loading="lazy"
                  src={photo.fields.image}
                  alt={photo.fields.alt || photo.title}
                />
                <span className="gallery-expand">
                  <Expand size={18} aria-hidden="true" />
                </span>
              </button>
            </figure>
          ))}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label={selected?.title || "Event photo"}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {selected && (
          <div>
            <button
              type="button"
              className="gallery-close"
              aria-label="Close photo"
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden="true" />
            </button>
            <MediaImage
              src={selected.fields.image}
              alt={selected.fields.alt || selected.title}
            />
          </div>
        )}
      </dialog>
    </section>
  );
}
