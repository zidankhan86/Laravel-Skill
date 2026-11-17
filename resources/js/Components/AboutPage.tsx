"use client";

import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "@/lib/content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { ChevronLeft, Award, Target, Brain, Quote } from "lucide-react";
import { BRAND_INFO } from "@/lib/constants";

const motion = _motion as any;

const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="public-listing listing-aboutpage pt-32 pb-24 bg-black min-h-screen">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12 font-bold"
        >
          <ChevronLeft aria-hidden="true" />
          {COPY.about.AboutPage_1}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-brand font-black text-gradient-red">
              {COPY.about.AboutPage_2}
              <br />
              <MixedText text={COPY.about.AboutPage_3} phrase="Systems." />
            </h1>
            <div className="prose prose-invert prose-lg text-neutral-400 leading-relaxed space-y-6">
              <p className="text-xl text-white font-medium">
                {COPY.about.AboutPage_4}
              </p>
              <p>{BRAND_INFO.aboutBio}</p>
              <p>{COPY.about.AboutPage_5}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10">
                <div className="p-6 bg-neutral-900 rounded-3xl border border-white/5">
                  <Award
                    aria-hidden="true"
                    className="text-red-500 mb-4"
                    size={32}
                  />
                  <h2 className="text-white font-bold mb-2">
                    {COPY.about.AboutPage_6}
                  </h2>
                  <p className="text-sm">{COPY.about.AboutPage_7}</p>
                </div>
                <div className="p-6 bg-neutral-900 rounded-3xl border border-white/5">
                  <Target
                    aria-hidden="true"
                    className="text-red-500 mb-4"
                    size={32}
                  />
                  <h2 className="text-white font-bold mb-2">
                    {COPY.about.AboutPage_8}
                  </h2>
                  <p className="text-sm">{COPY.about.AboutPage_9}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="sticky top-32 space-y-12">
              <div className="p-4 bg-gradient-red rounded-[3rem] shadow-2xl">
                <MediaImage
                  loading="lazy"
                  src={COPY.settings.journeyPortrait || COPY.settings.portrait}
                  alt={BRAND_INFO.name}
                  className="w-full rounded-[2.5rem] grayscale hover:grayscale-0 transition-all duration-200"
                />
              </div>
              <div className="p-10 bg-neutral-900 rounded-[3rem] border border-white/5">
                <Quote
                  aria-hidden="true"
                  className="text-red-500/20 mb-6"
                  size={48}
                />
                <p className="text-2xl font-brand font-bold text-white leading-tight">
                  {COPY.about.AboutPage_10}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
