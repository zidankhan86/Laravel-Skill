"use client";

import { EditText, contentSource } from "./EditBinding";
import React from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Mail,
  Globe,
  ShoppingBag,
  Workflow,
  Brain,
  ArrowDownRight,
} from "lucide-react";
import { COPY } from "@/lib/content";
import { BRAND_INFO } from "@/lib/constants";
import { MixedText, MediaImage } from "./Presentation";

export default function Hero() {
  return (
    <section className="editorial-hero" aria-labelledby="hero-title">
      <div className="container mx-auto px-6">
        <div className="hero-composition">
          <div className="hero-copy">
            <a
              className="hero-founder"
              href={BRAND_INFO.founderUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={14} aria-hidden="true" />
              <EditText source={"settings/homepage/Hero_4"}>
                {COPY.homepage.Hero_4}
              </EditText>
              <EditText source={"settings/brand/founderOf"}>
                {BRAND_INFO.founderOf}
              </EditText>
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <h1 id="hero-title">
              <MixedText
                editSource={"settings/brand/name"}
                text={BRAND_INFO.name}
                phrase="Hossain"
              />
            </h1>
            <h2>
              <EditText source="settings/homepage/Hero_5">
                {COPY.homepage.Hero_5}
              </EditText>
              <MixedText
                editSource="settings/homepage/Hero_6"
                text={COPY.homepage.Hero_6}
                phrase="Automation Specialist"
              />
            </h2>
            <p className="hero-description">
              <EditText source={"settings/homepage/Hero_7"}>
                {COPY.homepage.Hero_7}
              </EditText>
              <strong>
                <EditText source={"settings/homepage/Hero_8"}>
                  {COPY.homepage.Hero_8}
                </EditText>
              </strong>
              <EditText source={"settings/homepage/Hero_9"}>
                {COPY.homepage.Hero_9}
              </EditText>
            </p>
            <div className="hero-actions">
              <a
                href={COPY.homepage.heroPrimaryTarget}
                className="p-button primary"
              >
                <CalendarDays size={18} aria-hidden="true" />
                <EditText source={"settings/homepage/Hero_10"}>
                  {COPY.homepage.Hero_10}
                </EditText>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a
                href={COPY.homepage.heroSecondaryTarget}
                className="p-button secondary"
              >
                <Mail size={18} aria-hidden="true" />
                <EditText source={"settings/homepage/Hero_11"}>
                  {COPY.homepage.Hero_11}
                </EditText>
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="portrait-card">
              <div className="portrait-caption">
                <span>
                  <EditText source="settings/ui/Hero_1">
                    {COPY.ui.Hero_1}
                  </EditText>
                </span>
                <ArrowDownRight size={24} aria-hidden="true" />
              </div>
              <MediaImage
                editSource={"settings/settings/heroPortrait"}
                src={COPY.settings.heroPortrait || COPY.settings.portrait}
                alt={BRAND_INFO.name}
                fetchPriority="high"
                width={600}
                height={750}
              />
              <div className="portrait-footer">
                <span>
                  <EditText source={"settings/homepage/Hero_1"}>
                    {COPY.homepage.Hero_1}
                  </EditText>
                </span>
                <strong>
                  <EditText source={"settings/homepage/Hero_2"}>
                    {COPY.homepage.Hero_2}
                  </EditText>
                </strong>
              </div>
            </div>
            <div className="hero-skill skill-one">
              <ShoppingBag size={18} aria-hidden="true" />
              <span>
                <EditText source="settings/ui/Hero_2">
                  {COPY.ui.Hero_2}
                </EditText>
              </span>
            </div>
            <div className="hero-skill skill-two">
              <Brain size={18} aria-hidden="true" />
              <span>
                <EditText source="settings/ui/Hero_3">
                  {COPY.ui.Hero_3}
                </EditText>
              </span>
            </div>
            <div className="hero-skill skill-three">
              <Workflow size={18} aria-hidden="true" />
              <span>
                <EditText source="settings/ui/Hero_4">
                  {COPY.ui.Hero_4}
                </EditText>
              </span>
            </div>
            <span className="hero-orbit" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
