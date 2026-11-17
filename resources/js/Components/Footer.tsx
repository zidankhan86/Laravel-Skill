"use client";

import { EditText, contentSource } from "./EditBinding";
import { COPY } from "@/lib/content";

import React from "react";
import {
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Github,
  Globe,
} from "lucide-react";
import { BRAND_INFO } from "@/lib/constants";

const Footer: React.FC = () => {
  const socialIcons: Record<string, any> = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
    github: Github,
  };
  return (
    <footer className="public-footer bg-black pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-2">
              {COPY.logos?.footerMode === "image" && COPY.logos.footerImage ? (
                <a href="/">
                  <img
                    className="public-image-logo"
                    src={COPY.logos.footerImage}
                    alt={COPY.logos.footerAlt || COPY.brand.name}
                  />
                </a>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gradient-red rounded-lg flex items-center justify-center font-brand font-black text-xl">
                    <EditText source={"settings/navigation/Footer_1"}>
                      {COPY.navigation.Footer_1}
                    </EditText>
                  </div>
                  <span className="font-brand font-bold text-2xl tracking-tight text-white">
                    <EditText source={"settings/navigation/Footer_2"}>
                      {COPY.navigation.Footer_2}
                    </EditText>
                    <span className="text-red-500">
                      <EditText source={"settings/navigation/Footer_3"}>
                        {COPY.navigation.Footer_3}
                      </EditText>
                    </span>
                  </span>
                </>
              )}
            </div>
            <p className="text-neutral-500 leading-relaxed font-medium">
              <EditText source={"settings/navigation/Footer_4"}>
                {COPY.navigation.Footer_4}
              </EditText>
            </p>
            <div className="pt-2">
              <a
                href={BRAND_INFO.founderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-red-500 font-bold hover:underline"
              >
                <Globe aria-hidden="true" size={18} />
                <EditText source={"settings/navigation/Footer_5"}>
                  {COPY.navigation.Footer_5}
                </EditText>
                <EditText source={"settings/brand/founderOf"}>
                  {BRAND_INFO.founderOf}
                </EditText>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {COPY.navigation.socialOrder
                .split(",")
                .filter((key) => socialIcons[key] && BRAND_INFO.socials[key])
                .map((key) => {
                  const Icon = socialIcons[key];
                  return (
                    <a
                      key={key}
                      href={BRAND_INFO.socials[key]}
                      aria-label={key}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-neutral-900 rounded-xl hover:text-red-500 transition-colors text-white"
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h2 className="font-brand font-bold text-white uppercase text-xs tracking-[0.2em]">
                <EditText source={"settings/navigation/Footer_6"}>
                  {COPY.navigation.Footer_6}
                </EditText>
              </h2>
              <ul className="space-y-2 text-neutral-500 text-sm font-semibold">
                {COPY.navigation.footerMenu
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => {
                    const [label, url] = line.split("|");
                    return (
                      <li key={line}>
                        <a href={url} className="hover:text-red-500">
                          <EditText source="settings/navigation/footerMenu">
                            {label}
                          </EditText>
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
            <div className="space-y-4">
              <h2 className="font-brand font-bold text-white uppercase text-xs tracking-[0.2em]">
                <EditText source={"settings/navigation/Footer_15"}>
                  {COPY.navigation.Footer_15}
                </EditText>
              </h2>
              <ul className="space-y-2 text-neutral-500 text-sm font-semibold">
                <li className="break-all">
                  <a href={`mailto:${BRAND_INFO.email}`}>
                    <EditText source={"settings/brand/email"}>
                      {BRAND_INFO.email}
                    </EditText>
                  </a>
                </li>
                <li>
                  <EditText source={"settings/navigation/Footer_16"}>
                    {COPY.navigation.Footer_16}
                  </EditText>
                  <EditText source={"settings/brand/phone"}>
                    {BRAND_INFO.phone}
                  </EditText>
                </li>
                <li>
                  <EditText source={"settings/navigation/Footer_17"}>
                    {COPY.navigation.Footer_17}
                  </EditText>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-sm font-medium">
          <p>
            <EditText source={"settings/navigation/Footer_18"}>
              {COPY.navigation.Footer_18}
            </EditText>
            {new Date().getFullYear()}{" "}
            <EditText source={"settings/brand/name"}>
              {BRAND_INFO.name}
            </EditText>
            <EditText source={"settings/navigation/Footer_19"}>
              {COPY.navigation.Footer_19}
            </EditText>
          </p>
          <p>
            <EditText source={"settings/navigation/Footer_20"}>
              {COPY.navigation.Footer_20}
            </EditText>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
