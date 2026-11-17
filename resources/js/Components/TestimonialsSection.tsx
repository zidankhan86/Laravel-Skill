"use client";

import { EditText, contentSource } from "./EditBinding";
import React from "react";
import { Quote, Star } from "lucide-react";
import { COPY } from "@/lib/content";
import { REVIEWS } from "@/lib/constants";
import { MixedText, MediaImage } from "./Presentation";
export default function TestimonialsSection() {
  if (!REVIEWS.length) return null;
  return (
    <section id="testimonials" className="public-section testimonials-section">
      <div className="container mx-auto px-6">
        <div className="section-intro">
          <div>
            <span className="eyebrow">
              <EditText source="settings/ui/TestimonialsSection_1">
                {COPY.ui.TestimonialsSection_1}
              </EditText>
            </span>
            <h2>
              <MixedText
                editSource={"settings/homepage/TestimonialsSection_1"}
                text={COPY.homepage.TestimonialsSection_1}
                phrase="Founders Say"
              />
            </h2>
          </div>
          <p>
            <EditText source={"settings/homepage/TestimonialsSection_2"}>
              {COPY.homepage.TestimonialsSection_2}
            </EditText>
          </p>
        </div>
        <div className="quote-grid">
          {REVIEWS.map((review) => (
            <figure className="quote-card" key={review.id}>
              <Quote size={32} aria-hidden="true" />
              <blockquote>
                <EditText source={"settings/homepage/TestimonialsSection_3"}>
                  {COPY.homepage.TestimonialsSection_3}
                </EditText>
                <EditText source={contentSource(review.id, "summary")}>
                  {review.quote}
                </EditText>
                <EditText source={"settings/homepage/TestimonialsSection_4"}>
                  {COPY.homepage.TestimonialsSection_4}
                </EditText>
              </blockquote>
              <div
                className="review-stars"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: review.rating }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <figcaption>
                <MediaImage
                  editSource={contentSource(review.id, "fields.image")}
                  loading="lazy"
                  src={review.image}
                  alt={review.name}
                  width={48}
                  height={48}
                />
                <div>
                  <strong>
                    <EditText source={contentSource(review.id, "fields.name")}>
                      {review.name}
                    </EditText>
                  </strong>
                  <span>
                    <EditText source={contentSource(review.id, "fields.role")}>
                      {review.role}
                    </EditText>
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
