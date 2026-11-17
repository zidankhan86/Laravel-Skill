"use client";

import React, { useEffect, useState } from "react";
type Api = (path: string, method?: string, body?: any) => Promise<any>;
export function announcePublicUpdate() {
  try {
    localStorage.setItem("portfolio-content-updated", String(Date.now()));
  } catch {}
}
export default function AdminGallery({ api }: { api: Api }) {
  const [photos, setPhotos] = useState<any[]>([]),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(false);
  async function load() {
    const [settings, images] = await Promise.all([
      api("admin/settings"),
      api("admin/content/gallery?limit=100"),
    ]);
    setPhotos(images.items);
    setTitle(settings.homepage.value.galleryTitle || "");
    setDescription(settings.homepage.value.galleryDescription || "");
  }
  useEffect(() => {
    load().catch((e) => {
      setError(true);
      setNotice(e.message);
    });
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    setError(false);
    try {
      await fn();
      announcePublicUpdate();
      setNotice("Saved");
    } catch (e: any) {
      setError(true);
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="simple-gallery-admin">
      {notice && (
        <p
          className={error ? "notice error" : "notice"}
          role={error ? "alert" : "status"}
        >
          {notice}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const latest = (await api("admin/settings")).homepage;
            await api("admin/settings/homepage", "PUT", {
              version: latest.version,
              value: {
                ...latest.value,
                galleryTitle: title,
                galleryDescription: description,
              },
            });
          });
        }}
      >
        <h2>Gallery text</h2>
        <label>
          Section heading
          <input
            value={title}
            required
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Section description
          <textarea
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button disabled={busy}>Save gallery text</button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const files = new FormData(form).getAll("photos") as File[];
          run(async () => {
            for (const file of files) {
              const data = new FormData();
              data.set("file", file);
              data.set("alt", file.name.replace(/\.[^.]+$/, ""));
              const uploaded = await api("admin/media", "POST", data);
              await api("admin/content/gallery", "POST", {
                title: file.name.slice(0, 255),
                slug: "photo-" + crypto.randomUUID(),
                status: "published",
                fields: {
                  image: "/media/" + uploaded.id,
                  alt: file.name.replace(/\.[^.]+$/, "").slice(0, 500),
                },
              });
            }
            form.reset();
            setPhotos((await api("admin/content/gallery?limit=100")).items);
          });
        }}
      >
        <h2>Gallery images</h2>
        <label>
          Add photos
          <input
            type="file"
            name="photos"
            accept="image/png,image/jpeg,image/webp"
            multiple
            required
            disabled={busy}
          />
        </label>
        <small>
          PNG, JPEG or WebP, up to 5 MB each. Uploaded photos appear on the
          website automatically.
        </small>
        <button disabled={busy}>{busy ? "Saving…" : "Add images"}</button>
      </form>
      <div className="gallery-admin-images">
        {photos.map((photo) => (
          <div key={photo.id}>
            <img
              src={
                photo.fields.image.startsWith("/media/")
                  ? photo.fields.image.replace("/media/", "/api/admin/media/") +
                    "/file"
                  : photo.fields.image
              }
              alt={photo.fields.alt || photo.title}
            />
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Remove this photo from the gallery?"))
                  run(async () => {
                    await api(
                      `admin/content/gallery/${photo.id}/delete`,
                      "POST",
                      {},
                    );
                    setPhotos((items) =>
                      items.filter((item) => item.id !== photo.id),
                    );
                  });
              }}
            >
              Remove image
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
