"use client";

import { MixedText } from "./Presentation";
import { COPY } from "@/lib/content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { SERVICES, ICON_MAP } from "@/lib/constants";
import { CheckCircle2, ChevronLeft, Layers } from "lucide-react";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

const AllServices: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="public-listing listing-allservices pt-32 pb-24 bg-black">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-bold"
        >
          <ChevronLeft aria-hidden="true" />
          {COPY.homepage.AllServices_1}
        </button>

        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-brand font-black text-gradient-red mb-6">
            <MixedText text={COPY.homepage.AllServices_2} phrase="Services" />
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {COPY.homepage.AllServices_3}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SERVICES.map((service, index) => {
            const Icon = ICON_MAP[service.icon] || Layers;
            return (
              <motion.div
                key={service.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-8 group-hover:scale-[1.025] transition-transform">
                  <Icon aria-hidden="true" size={32} />
                </div>
                <h2 className="text-3xl font-brand font-bold mb-4 text-white">
                  <a href={"/services/" + service.slug}>{service.title}</a>
                </h2>
                <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                  {service.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-neutral-300 font-medium"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-red-500"
                        size={20}
                      />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllServices;
