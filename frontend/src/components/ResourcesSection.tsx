"use client";

import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "@/lib/content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { RESOURCES, BRAND_INFO } from "@/lib/constants";
import {
  BookOpen,
  Download,
  MessageCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

const motion = _motion as any;

interface ResourcesSectionProps {
  onViewMore: () => void;
}

const ResourcesSection: React.FC<ResourcesSectionProps> = ({ onViewMore }) => {
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
    <section id="resources" className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-brand font-black mb-4">
            <MixedText
              editSource={"settings/homepage/ResourcesSection_1"}
              text={COPY.homepage.ResourcesSection_1}
              phrase="Resources"
            />
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
            <EditText source={"settings/homepage/ResourcesSection_2"}>
              {COPY.homepage.ResourcesSection_2}
            </EditText>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {RESOURCES.filter((item) => item.featured)
            .slice(0, 4)
            .map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-neutral-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-red-500/30 transition-all"
              >
                <div className="aspect-[3/4] overflow-hidden relative">
                  <MediaImage
                    editSource={contentSource(resource.id, "fields.image")}
                    loading="lazy"
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest soft-shadow ${
                        resource.type === "free"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      <EditText
                        source={
                          "settings/ui/" +
                          (resource.type === "free" ? "freeLabel" : "paidLabel")
                        }
                      >
                        {resource.type === "free"
                          ? COPY.ui.freeLabel
                          : COPY.ui.paidLabel}
                      </EditText>
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <FileText
                      aria-hidden="true"
                      size={14}
                      className="text-red-500"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      <EditText
                        source={contentSource(resource.id, "fields.tag")}
                      >
                        {resource.tag}
                      </EditText>
                    </span>
                  </div>
                  <h3 className="text-lg font-brand font-bold mb-3 text-white ">
                    <EditText source={contentSource(resource.id, "title")}>
                      {resource.title}
                    </EditText>
                  </h3>

                  {resource.type === "free" && !resource.downloadUrl ? (
                    <span className="block text-center text-neutral-500 py-3">
                      <EditText source="settings/ui/ResourcesSection_1">
                        {COPY.ui.ResourcesSection_1}
                      </EditText>
                    </span>
                  ) : resource.type === "free" ? (
                    <a
                      href={resource.downloadUrl}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-gradient-red hover:border-transparent transition-all text-sm"
                    >
                      <Download aria-hidden="true" size={16} />
                      <EditText source={"settings/homepage/ResourcesSection_3"}>
                        {COPY.homepage.ResourcesSection_3}
                      </EditText>
                    </a>
                  ) : (
                    <button
                      onClick={() =>
                        handlePaidRequest(resource.title, resource.whatsappUrl)
                      }
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-green-600 hover:border-transparent transition-all text-sm"
                    >
                      <MessageCircle aria-hidden="true" size={16} />
                      <EditText source={"settings/homepage/ResourcesSection_4"}>
                        {COPY.homepage.ResourcesSection_4}
                      </EditText>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
        </div>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1 }}
          className="text-center"
        >
          <button
            onClick={onViewMore}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-white hover:bg-white/10 transition-all"
          >
            <EditText source={"settings/homepage/ResourcesSection_5"}>
              {COPY.homepage.ResourcesSection_5}
            </EditText>
            <ArrowRight
              aria-hidden="true"
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ResourcesSection;
