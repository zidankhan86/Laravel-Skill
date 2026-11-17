"use client";

import { EditText } from "./EditBinding";
import { COPY } from "@/lib/content";

import React from "react";
import { ShieldCheck, Zap, Brain, Globe, Award } from "lucide-react";

const TrustStrip: React.FC = () => {
  const icons = [
    <Award aria-hidden="true" />,
    <Zap aria-hidden="true" />,
    <Brain aria-hidden="true" />,
    <Globe aria-hidden="true" />,
    <ShieldCheck aria-hidden="true" />,
  ];
  const items = COPY.homepage.expertise
    .split("\n")
    .filter(Boolean)
    .map((text, index) => ({ text, icon: icons[index % icons.length] }));

  return (
    <div className="expertise-strip bg-neutral-900/50 border-y border-white/5 py-10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 group">
              <div className="text-red-500 group-hover:scale-[1.025] transition-transform">
                {/* Fix: cast element to any to allow dynamic property injection in cloneElement */}
                {React.cloneElement(item.icon as React.ReactElement<any>, {
                  size: 24,
                })}
              </div>
              <span className="text-sm md:text-base font-bold text-neutral-300 uppercase tracking-wider">
                <EditText source="settings/homepage/expertise">
                  {item.text}
                </EditText>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustStrip;
