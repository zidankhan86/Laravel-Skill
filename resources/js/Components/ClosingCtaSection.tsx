"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { COPY } from "@/lib/content";
import { BRAND_INFO } from "@/lib/constants";
import { EditText } from "./EditBinding";
export default function ClosingCtaSection() {
  return (
    <section id="closing-cta" className="public-section closing-cta-section">
      <div className="container mx-auto px-6">
        <div className="closing-cta">
          <div>
            <span className="eyebrow">
              <EditText source="settings/ui/BookingSection_1">
                {COPY.ui.BookingSection_1}
              </EditText>
            </span>
            <p>
              <EditText source={"settings/homepage/BookingSection_12"}>
                {COPY.homepage.BookingSection_12}
              </EditText>
            </p>
          </div>
          <a
            className="p-button"
            href={`https://wa.me/${BRAND_INFO.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <EditText source={"settings/homepage/BookingSection_13"}>
                {COPY.homepage.BookingSection_13}
              </EditText>
            </span>
            <ArrowUpRight size={22} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
