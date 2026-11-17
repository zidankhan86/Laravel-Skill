import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { BRAND_INFO } from "../constants";
import { ArrowRight, UserCheck } from "lucide-react";

const motion = _motion as any;

interface AboutMeSectionProps {
  onViewMore: () => void;
}

const AboutMeSection: React.FC<AboutMeSectionProps> = ({ onViewMore }) => {
  return (
    <section id="aboutme" className="pb-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Side: Content */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs uppercase tracking-widest">
              <UserCheck aria-hidden="true" size={14} />
              <EditText source={"settings/about/AboutMeSection_1"}>
                {COPY.about.AboutMeSection_1}
              </EditText>
            </div>
            <h2 className="text-4xl md:text-5xl font-brand font-black text-white leading-tight">
              <EditText source={"settings/about/AboutMeSection_2"}>
                {COPY.about.AboutMeSection_2}
              </EditText>
              <br />
              <span className="text-gradient-red">
                <MixedText
                  editSource={"settings/about/AboutMeSection_3"}
                  text={COPY.about.AboutMeSection_3}
                  phrase="Absolute Control"
                />
              </span>
            </h2>
            <p className="text-xl text-neutral-400 leading-relaxed italic">
              <EditText source={"settings/about/AboutMeSection_4"}>
                {COPY.about.AboutMeSection_4}
              </EditText>
              <EditText source={"settings/brand/aboutBio"}>
                {BRAND_INFO.aboutBio}
              </EditText>
              <EditText source={"settings/about/AboutMeSection_5"}>
                {COPY.about.AboutMeSection_5}
              </EditText>
            </p>
            <div className="pt-4">
              <button
                onClick={onViewMore}
                className="group inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
              >
                <EditText source={"settings/about/AboutMeSection_6"}>
                  {COPY.about.AboutMeSection_6}
                </EditText>
                <ArrowRight
                  aria-hidden="true"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </motion.div>

          {/* Right Side: Image with Gradient Border */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative z-10 p-3 bg-gradient-red rounded-[3rem] shadow-2xl overflow-hidden aspect-square max-w-lg mx-auto">
              <div className="w-full h-full bg-neutral-900 rounded-[2.5rem] overflow-hidden">
                <MediaImage
                  editSource={"settings/settings/journeyPortrait"}
                  loading="lazy"
                  src={COPY.settings.journeyPortrait || COPY.settings.portrait}
                  alt={BRAND_INFO.name}
                  className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-200"
                />
              </div>
            </div>
            {/* Background Glow Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-900/10 blur-3xl -z-10 animate-pulse delay-700"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutMeSection;
