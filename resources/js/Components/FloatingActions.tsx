"use client";

import { EditText } from "./EditBinding";
import { COPY } from "@/lib/content";

import React, { useState, useEffect } from "react";
import { motion as _motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageCircle } from "lucide-react";
import { BRAND_INFO } from "@/lib/constants";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

const FloatingActions: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: document.documentElement.dataset.websiteMotion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <div className="floating-actions fixed inset-x-0 bottom-8 pointer-events-none z-[100] flex justify-between px-6 md:px-12">
      {/* Scroll to Top (Left) */}
      <div className="pointer-events-auto">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={false}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -50 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="w-14 h-14 rounded-full bg-gradient-red text-white flex items-center justify-center soft-shadow border border-white/20"
              aria-label="Scroll to Top"
            >
              <ArrowUp aria-hidden="true" size={28} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp Floating (Right) */}
      <div className="pointer-events-auto">
        <motion.a
          initial={false}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={`https://wa.me/${BRAND_INFO.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center soft-shadow border border-white/20 relative group"
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle aria-hidden="true" size={30} fill="currentColor" />
          <span className="absolute right-full mr-4 bg-white text-black text-sm font-bold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
            <EditText source="settings/homepage/FloatingActions_1">
              {COPY.homepage.FloatingActions_1}
            </EditText>
          </span>
        </motion.a>
      </div>
    </div>
  );
};

export default FloatingActions;
