import { EditText, contentSource } from "./EditBinding";
import { MediaImage } from "./Presentation";
import React, { useEffect } from "react";
import { RECORDS, COPY } from "../content";
import Footer from "./Footer";
import { BRAND_INFO } from "../constants";
export default function DetailPage({
  record,
  listing,
}: {
  record: any;
  listing: boolean;
}) {
  useEffect(() => {
    document.title =
      record?.seo_title ||
      record?.title ||
      (listing ? "Blog" : COPY.settings.siteTitle);
  }, [record, listing]);
  return (
    <>
      <section className="public-detail pt-36 pb-24 min-h-screen container mx-auto px-6">
        <a href="/" className="text-neutral-400">
          <EditText source="settings/ui/DetailPage_1">
            {COPY.ui.DetailPage_1}
          </EditText>
        </a>
        {listing ? (
          <>
            <h1 className="text-5xl font-brand font-black text-gradient-red my-10">
              <EditText source="settings/ui/DetailPage_2">
                {COPY.ui.DetailPage_2}
              </EditText>
            </h1>
            <div className="grid md:grid-cols-2 gap-8">
              {RECORDS.filter((r) => r.collection === "blog").length === 0 ? (
                <p className="text-neutral-400">
                  <EditText source="settings/ui/DetailPage_3">
                    {COPY.ui.DetailPage_3}
                  </EditText>
                </p>
              ) : (
                RECORDS.filter((r) => r.collection === "blog").map((r) => (
                  <a
                    className="p-8 rounded-3xl bg-neutral-900"
                    key={r.id}
                    href={"/blog/" + r.slug}
                  >
                    {r.fields.image && (
                      <MediaImage
                        src={r.fields.image}
                        alt={r.title}
                        className="aspect-video object-cover rounded-xl mb-6"
                        loading="lazy"
                      />
                    )}
                    <h2 className="text-2xl font-bold">{r.title}</h2>
                    <p className="text-neutral-400 mt-4">{r.summary}</p>
                  </a>
                ))
              )}
            </div>
          </>
        ) : record ? (
          <article className="max-w-4xl mx-auto mt-10">
            <h1 className="text-4xl md:text-6xl font-brand font-black text-gradient-red">
              <EditText source={contentSource(record.id, "title")}>
                {record.title}
              </EditText>
            </h1>
            {record.collection === "blog" && (
              <p className="text-neutral-400 mt-4">
                {record.fields.author}
                {record.published_at
                  ? " · " + new Date(record.published_at).toLocaleDateString()
                  : ""}
              </p>
            )}
            {record.fields.image && (
              <MediaImage
                editSource={contentSource(record.id, "fields.image")}
                loading="lazy"
                src={record.fields.image}
                alt={record.title}
                className="w-full max-h-[500px] object-cover rounded-3xl my-8"
              />
            )}
            <p className="text-xl text-neutral-300 my-8">
              <EditText source={contentSource(record.id, "summary")}>
                {record.summary}
              </EditText>
            </p>
            <div
              className="rich-content text-lg text-neutral-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: record.body }}
            />
            {record.fields.features && (
              <ul className="my-8 space-y-3">
                {record.fields.features.map((f: string) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            )}
            {record.collection === "services" && (
              <a
                className="inline-block bg-gradient-red px-8 py-4 rounded-xl"
                href={record.fields.ctaUrl}
              >
                {record.fields.ctaLabel}
              </a>
            )}
            {record.fields.gallery?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 my-8">
                {record.fields.gallery.map((url: string) => (
                  <MediaImage
                    key={url}
                    src={url}
                    alt={record.title}
                    loading="lazy"
                    className="rounded-xl"
                  />
                ))}
              </div>
            )}
            {record.fields.technologies?.length > 0 && (
              <p className="my-5">
                <EditText source="settings/ui/DetailPage_4">
                  {COPY.ui.DetailPage_4}
                </EditText>
                {record.fields.technologies.join(", ")}
              </p>
            )}
            {record.fields.outcomes && (
              <p className="my-5 whitespace-pre-line">
                {record.fields.outcomes}
              </p>
            )}
            {record.collection === "resources" &&
              (record.fields.type === "paid" ? (
                <a
                  href={
                    record.fields.whatsappUrl ||
                    "https://wa.me/" +
                      BRAND_INFO.whatsapp +
                      "?text=" +
                      encodeURIComponent("I am interested in " + record.title)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <EditText source="settings/ui/DetailPage_5">
                    {COPY.ui.DetailPage_5}
                  </EditText>
                </a>
              ) : record.fields.private ? (
                <p>
                  <EditText source="settings/ui/DetailPage_6">
                    {COPY.ui.DetailPage_6}
                  </EditText>
                </p>
              ) : record.fields.fileId || record.fields.downloadUrl ? (
                <a
                  href={
                    record.fields.fileId
                      ? "/media/" + record.fields.fileId
                      : record.fields.downloadUrl
                  }
                >
                  <EditText source="settings/ui/DetailPage_7">
                    {COPY.ui.DetailPage_7}
                  </EditText>
                </a>
              ) : (
                <p>
                  <EditText source="settings/ui/DetailPage_8">
                    {COPY.ui.DetailPage_8}
                  </EditText>
                </p>
              ))}
            {record.fields.liveUrl && (
              <a
                href={record.fields.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <EditText source="settings/ui/DetailPage_9">
                  {COPY.ui.DetailPage_9}
                </EditText>
              </a>
            )}
          </article>
        ) : (
          <h1 className="text-4xl my-12">
            <EditText source="settings/ui/DetailPage_10">
              {COPY.ui.DetailPage_10}
            </EditText>
          </h1>
        )}
      </section>
      <Footer />
    </>
  );
}
