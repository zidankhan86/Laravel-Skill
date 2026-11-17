"use client";

import ClosingCtaSection from "./ClosingCtaSection";
import GallerySection from "./GallerySection";
import { MotionConfig } from "framer-motion";
import RequestForm from "./RequestForm";
import { COPY, RECORDS } from "@/lib/content";
import DetailPage from "./DetailPage";

import React, { useState, useEffect } from "react";
import { motion as _motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Hero from "./Hero";
import TrustStrip from "./TrustStrip";
import AboutSection from "./AboutSection";
import AboutMeSection from "./AboutMeSection";
import AboutPage from "./AboutPage";
import ServicesSection from "./ServicesSection";
import YouTubeSection from "./YouTubeSection";
import ProjectsSection from "./ProjectsSection";
import DealsSection from "./DealsSection";
import ResourcesSection from "./ResourcesSection";
import TestimonialsSection from "./TestimonialsSection";
import BookingSection from "./BookingSection";
import Footer from "./Footer";
import AllServices from "./AllServices";
import AllProjects from "./AllProjects";
import AllDeals from "./AllDeals";
import AllResources from "./AllResources";
import FloatingActions from "./FloatingActions";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

export interface AppProps {
  initialView?: string;
}

const App: React.FC<AppProps> = ({ initialView }) => {
  const [view, updateView] = useState<any>(() => {
    if (typeof window === "undefined") return initialView || "home";
    const segment = location.pathname.split("/")[1];
    return segment || initialView || "home";
  });

  const setView = (next: any) => {
    if (typeof window !== "undefined") {
      history.pushState({}, "", next === "home" ? "/" : "/" + next);
    }
    updateView(next);
  };

  useEffect(() => {
    const pop = () => updateView(location.pathname.split("/")[1] || "home");
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-enter");
            entry.target.setAttribute("data-reveal", "visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "80px 0px" },
    );
    const prepare = (element: Element) => {
      if (element.getAttribute("data-reveal") === "visible") return;
      element.setAttribute(
        "data-reveal",
        element.getBoundingClientRect().top >= window.innerHeight
          ? "pending"
          : "visible",
      );
      observer.observe(element);
    };
    document
      .querySelectorAll(
        ".portfolio .hero-visual, .portfolio .expertise-strip, .portfolio section .grid > div, .portfolio .service-tile, .portfolio .quote-card, .portfolio .video-card, .portfolio .public-request-form, .portfolio .closing-cta, .portfolio .public-footer > .container",
      )
      .forEach(prepare);
    document
      .querySelectorAll(
        ".portfolio section:not(.editorial-hero) > .container > .section-intro, .portfolio section:not(.editorial-hero) > .container > .text-center.mb-16, .portfolio #about > .container > .max-w-4xl, .portfolio #aboutme h2, .portfolio #booking h2",
      )
      .forEach((element) => {
        element.classList.add("section-heading-reveal");
        prepare(element);
      });
    const finish = () =>
      document
        .querySelectorAll('[data-reveal="pending"]')
        .forEach((element) => element.setAttribute("data-reveal", "visible"));
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      document
        .querySelectorAll('[data-reveal="pending"]')
        .forEach((element) => element.removeAttribute("data-reveal"));
      preference.removeEventListener("change", finish);
    };
  }, [view]);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (
        event.key === "portfolio-content-updated" &&
        new URLSearchParams(location.search).get("edit") !== "1"
      )
        location.reload();
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const path = typeof window !== "undefined" ? location.pathname.split("/").filter(Boolean) : [];
  const detail =
    path.length === 2
      ? RECORDS.find((r) => r.collection === path[0] && r.slug === path[1])
      : null;

  const sections: Record<string, React.ReactNode> = {
    hero: <Hero />,
    trust: <TrustStrip />,
    about: <AboutSection />,
    journey: <AboutMeSection onViewMore={() => setView("about")} />,
    services: <ServicesSection onViewMore={() => setView("services")} />,
    videos: <YouTubeSection />,
    projects: <ProjectsSection onViewMore={() => setView("projects")} />,
    deals: <DealsSection onViewMore={() => setView("deals")} />,
    gallery: <GallerySection />,
    resources: <ResourcesSection onViewMore={() => setView("resources")} />,
    testimonials: <TestimonialsSection />,
    booking: <BookingSection />,
    closingCta: <ClosingCtaSection />,
    footer: <Footer />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && location.hash)
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }, 450);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [view]);

  const enabled = (COPY.homepage?.sections || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const ordered = enabled;

  return (
    <MotionConfig
      reducedMotion={
        COPY.appearance?.websiteMotion === "off" ? "always" : "user"
      }
    >
      <main
        id="main-content"
        tabIndex={-1}
        className="portfolio selection:bg-red-500/30 selection:text-white min-h-screen relative"
      >
        <a className="skip-link" href="#page-content">
          Skip to content
        </a>
        {(view !== "home" || enabled.includes("navigation")) && (
          <Navbar onNavigate={setView} currentView={view} />
        )}

        <div id="page-content" tabIndex={-1}>
          <AnimatePresence mode="wait">
            {(view === "booking" || view === "contact") && (
              <section className="pt-32 pb-20 max-w-2xl mx-auto">
                <RequestForm
                  headingLevel="h1"
                  initialKind={view === "contact" ? "contact" : "booking"}
                />
              </section>
            )}
            {(path.length === 2 || view === "blog") && (
              <DetailPage
                record={detail}
                listing={view === "blog" && path.length === 1}
              />
            )}
            {view === "home" && (
              <motion.div
                key="home"
                className={
                  enabled.includes("navigation") &&
                  ordered.find((key) => sections[key]) !== "hero"
                    ? "homepage-content needs-header-space"
                    : "homepage-content"
                }
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {ordered
                  .filter((key, index, all) => all.indexOf(key) === index)
                  .map((key) => (
                    <React.Fragment key={key}>
                      {[
                        "services",
                        "projects",
                        "deals",
                        "resources",
                        "testimonials",
                      ].includes(key.trim()) &&
                      !RECORDS.some(
                        (r) => r.collection === key.trim() && r.featured,
                      )
                        ? null
                        : sections[key.trim()]}
                    </React.Fragment>
                  ))}
              </motion.div>
            )}

            {view === "about" && path.length <= 1 && (
              <motion.div
                key="about"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <AboutPage onBack={() => setView("home")} />
                <Footer />
              </motion.div>
            )}

            {view === "services" && path.length <= 1 && (
              <motion.div
                key="all-services"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <AllServices onBack={() => setView("home")} />
                <Footer />
              </motion.div>
            )}

            {view === "projects" && path.length <= 1 && (
              <motion.div
                key="all-projects"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <AllProjects onBack={() => setView("home")} />
                <Footer />
              </motion.div>
            )}

            {view === "deals" && path.length <= 1 && (
              <motion.div
                key="all-deals"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <AllDeals onBack={() => setView("home")} />
                <Footer />
              </motion.div>
            )}

            {view === "resources" && path.length <= 1 && (
              <motion.div
                key="all-resources"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <AllResources onBack={() => setView("home")} />
                <Footer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {(view !== "home" || enabled.includes("floatingActions")) && (
          <FloatingActions />
        )}
      </main>
    </MotionConfig>
  );
};

export default App;
