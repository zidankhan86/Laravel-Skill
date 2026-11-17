import { EditText, contentSource } from "./EditBinding";
import React from "react";
import { COPY } from "../content";
import { VIDEOS, BRAND_INFO } from "../constants";
import { Play, ArrowUpRight } from "lucide-react";
import { MixedText, MediaImage } from "./Presentation";
export default function YouTubeSection() {
  return (
    <section id="youtube" className="public-section video-section">
      <div className="container mx-auto px-6">
        <div className="section-intro">
          <div>
            <span className="eyebrow">
              <EditText source="settings/ui/YouTubeSection_1">
                {COPY.ui.YouTubeSection_1}
              </EditText>
            </span>
            <h2>
              <MixedText
                editSource={"settings/homepage/YouTubeSection_1"}
                text={COPY.homepage.YouTubeSection_1}
                phrase="eCommerce Really Works"
              />
            </h2>
          </div>
          <div>
            <p>
              <EditText source={"settings/homepage/YouTubeSection_2"}>
                {COPY.homepage.YouTubeSection_2}
              </EditText>
            </p>
            <a
              className="text-link"
              href={BRAND_INFO.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
            >
              <EditText source={"settings/homepage/YouTubeSection_3"}>
                {COPY.homepage.YouTubeSection_3}
              </EditText>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="video-grid">
          {VIDEOS.map((video) => (
            <article className="video-card" key={video.id}>
              <a
                className="video-cover"
                href={video.youtubeUrl || undefined}
                aria-disabled={!video.youtubeUrl}
                aria-label={
                  video.youtubeUrl
                    ? `Watch ${video.title}`
                    : `${video.title}: video link unavailable`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <MediaImage
                  editSource={contentSource(video.id, "fields.image")}
                  loading="lazy"
                  width={480}
                  height={270}
                  src={video.thumbnail}
                  alt={video.title}
                />
                {video.youtubeUrl && (
                  <span className="play-chip">
                    <Play size={20} fill="currentColor" aria-hidden="true" />
                  </span>
                )}
                {video.duration && (
                  <span className="duration-chip">
                    <EditText
                      source={contentSource(video.id, "fields.duration")}
                    >
                      {video.duration}
                    </EditText>
                  </span>
                )}
              </a>
              <h3>
                <a
                  href={video.youtubeUrl || undefined}
                  aria-disabled={!video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <EditText source={contentSource(video.id, "title")}>
                    {video.title}
                  </EditText>
                </a>
              </h3>
              {!video.youtubeUrl && (
                <p className="media-unavailable">
                  <EditText source="settings/ui/YouTubeSection_2">
                    {COPY.ui.YouTubeSection_2}
                  </EditText>
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
