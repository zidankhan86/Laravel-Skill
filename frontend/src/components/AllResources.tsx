"use client";

import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "@/lib/content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { RESOURCES, BRAND_INFO } from "@/lib/constants";
import { ChevronLeft, Download, MessageCircle, FileText } from "lucide-react";

const motion = _motion as any;

const AllResources: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const handlePaidRequest = (title: string, destination?: string) => {
    const message = encodeURIComponent(
      `I am interested in getting the "${title}". Please share the details.`,
    );
    window.open(
      destination || `https://wa.me/${BRAND_INFO.whatsapp}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="public-listing listing-allresources pt-32 pb-24 bg-black min-h-screen">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-bold"
        >
          <ChevronLeft aria-hidden="true" />
          {COPY.homepage.AllResources_1}
        </button>

        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-brand font-black text-gradient-red mb-6">
            <MixedText text={COPY.homepage.AllResources_2} phrase="Resources" />
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {COPY.homepage.AllResources_3}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {RESOURCES.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden hover:border-red-500/20 transition-all"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <MediaImage
                  loading="lazy"
                  src={resource.image}
                  alt={resource.title}
                  className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-200"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest soft-shadow ${
                      resource.type === "free"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {resource.type}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText
                    aria-hidden="true"
                    size={14}
                    className="text-red-500"
                  />
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    {resource.tag}
                  </span>
                </div>
                <h2 className="text-xl font-brand font-bold mb-4 text-white ">
                  {resource.title}
                </h2>
                <p className="text-neutral-400 mb-8 text-sm leading-relaxed ">
                  {resource.description}
                </p>

                {resource.type === "free" && !resource.downloadUrl ? (
                  <span className="block text-center text-neutral-500 py-3">
                    Download unavailable
                  </span>
                ) : resource.type === "free" ? (
                  <a
                    href={resource.downloadUrl}
                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-gradient-red hover:border-transparent transition-all"
                  >
                    {COPY.homepage.AllResources_4}
                    <Download aria-hidden="true" size={18} />
                  </a>
                ) : (
                  <button
                    onClick={() =>
                      handlePaidRequest(resource.title, resource.whatsappUrl)
                    }
                    className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-green-600 hover:border-transparent transition-all"
                  >
                    {COPY.homepage.AllResources_5}
                    <MessageCircle aria-hidden="true" size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllResources;
