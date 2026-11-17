import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { DEALS } from "../constants";
import { ChevronLeft, ExternalLink, Tag as TagIcon } from "lucide-react";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

const AllDeals: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="public-listing listing-alldeals pt-32 pb-24 bg-black min-h-screen">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-bold"
        >
          <ChevronLeft aria-hidden="true" />
          {COPY.homepage.AllDeals_1}
        </button>

        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-brand font-black text-gradient-red mb-6">
            <MixedText text={COPY.homepage.AllDeals_2} phrase="Deals" />
          </h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            {COPY.homepage.AllDeals_3}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEALS.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden"
            >
              <div className="aspect-video relative overflow-hidden">
                <MediaImage
                  loading="lazy"
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-gradient-red px-5 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest soft-shadow">
                    {deal.fields.expiresAt &&
                    new Date(deal.fields.expiresAt) < new Date()
                      ? "Offer expired"
                      : deal.discount}
                  </span>
                </div>
              </div>
              <div className="p-10">
                <div className="flex items-center gap-2 mb-4">
                  <TagIcon
                    aria-hidden="true"
                    size={14}
                    className="text-red-500"
                  />
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    {deal.tag}
                  </span>
                </div>
                <h2 className="text-2xl font-brand font-bold mb-4 text-white">
                  {deal.title}
                </h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                  {deal.description}
                </p>
                <a
                  href={
                    deal.fields.expiresAt &&
                    new Date(deal.fields.expiresAt) < new Date()
                      ? undefined
                      : deal.link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-gradient-red hover:border-transparent transition-all"
                >
                  {COPY.homepage.AllDeals_4}
                  <ExternalLink aria-hidden="true" size={18} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllDeals;
