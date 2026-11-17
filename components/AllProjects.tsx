import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { PROJECTS } from "../constants";
import { ChevronLeft, ArrowUpRight } from "lucide-react";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

const AllProjects: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="public-listing listing-allprojects pt-32 pb-24 bg-black">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-bold"
        >
          <ChevronLeft aria-hidden="true" />
          {COPY.homepage.AllProjects_1}
        </button>

        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-brand font-black text-gradient-red mb-6">
            <MixedText text={COPY.homepage.AllProjects_2} phrase="Portfolio" />
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {COPY.homepage.AllProjects_3}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group space-y-6"
            >
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10">
                <MediaImage
                  loading="lazy"
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity flex items-end p-10">
                  <a
                    href={project.liveUrl || undefined}
                    aria-disabled={!project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2"
                  >
                    {project.liveUrl ? "Live Preview" : "Preview unavailable"}
                  </a>
                </div>
              </div>
              <div>
                <span className="text-red-500 font-black uppercase text-xs tracking-widest">
                  {project.category}
                </span>
                <h2 className="text-3xl font-brand font-bold text-white mt-2 group-hover:text-red-400 transition-colors">
                  <a href={"/projects/" + project.slug}>{project.title}</a>
                </h2>
                <p className="text-neutral-400 text-lg mt-3">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllProjects;
