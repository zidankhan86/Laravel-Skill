import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { DEALS } from "../constants";
import { Tag as TagIcon, ExternalLink, ArrowRight } from "lucide-react";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

interface DealsSectionProps {
  onViewMore: () => void;
}

const DealsSection: React.FC<DealsSectionProps> = ({ onViewMore }) => {
  return (
    <section id="deals" className="py-24 bg-neutral-900/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-brand font-black mb-4">
            <MixedText
              editSource={"settings/homepage/DealsSection_1"}
              text={COPY.homepage.DealsSection_1}
              phrase="Tools & Deals"
            />
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
            <EditText source={"settings/homepage/DealsSection_2"}>
              {COPY.homepage.DealsSection_2}
            </EditText>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {DEALS.filter((item) => item.featured)
            .slice(0, 3)
            .map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  <MediaImage
                    editSource={contentSource(deal.id, "fields.image")}
                    loading="lazy"
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-200"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-red px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-widest soft-shadow">
                      {deal.fields.expiresAt &&
                      new Date(deal.fields.expiresAt) < new Date() ? (
                        "Offer expired"
                      ) : (
                        <EditText
                          source={contentSource(deal.id, "fields.discount")}
                        >
                          {deal.discount}
                        </EditText>
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <TagIcon
                      aria-hidden="true"
                      size={14}
                      className="text-red-500"
                    />
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      <EditText source={contentSource(deal.id, "fields.tag")}>
                        {deal.tag}
                      </EditText>
                    </span>
                  </div>
                  <h3 className="text-2xl font-brand font-bold mb-3 text-white group-hover:text-red-400 transition-colors">
                    <EditText source={contentSource(deal.id, "title")}>
                      {deal.title}
                    </EditText>
                  </h3>
                  <p className="text-neutral-400 mb-6 ">
                    <EditText source={contentSource(deal.id, "summary")}>
                      {deal.description}
                    </EditText>
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
                    className="inline-flex items-center gap-2 text-white font-bold group/btn"
                  >
                    <EditText source={"settings/homepage/DealsSection_3"}>
                      {COPY.homepage.DealsSection_3}
                    </EditText>
                    <ExternalLink
                      aria-hidden="true"
                      size={18}
                      className="text-red-500 group-hover/btn:translate-x-1 transition-transform"
                    />
                  </a>
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
            <EditText source={"settings/homepage/DealsSection_4"}>
              {COPY.homepage.DealsSection_4}
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

export default DealsSection;
