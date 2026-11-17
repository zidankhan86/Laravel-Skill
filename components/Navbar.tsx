import { MediaImage } from "./Presentation";
import { EditText, contentSource } from "./EditBinding";
import React, { useEffect, useRef, useState } from "react";
import { Menu, X, Sun, Moon, ArrowUpRight } from "lucide-react";
import { COPY } from "../content";
import { setPublicMode } from "../public-theme";

export default function Navbar({
  onNavigate,
  currentView,
}: {
  onNavigate: (view: any) => void;
  currentView: string;
}) {
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(
    document.documentElement.dataset.websiteTheme === "dark",
  );
  const links = COPY.navigation.menu
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, url] = line.split("|");
      return { name, href: url.startsWith("#") ? "/" + url : url };
    });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (currentView !== "home") {
        setActiveSection(currentView);
        return;
      }
      let active = "home";
      document
        .querySelectorAll<HTMLElement>(".portfolio section[id]")
        .forEach((section) => {
          if (section.getBoundingClientRect().top <= 180) active = section.id;
        });
      setActiveSection(active === "aboutme" ? "about" : active);
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, [currentView]);
  const linkActive = (href: string) => {
    try {
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return false;
      const key = url.hash
        ? url.hash.slice(1)
        : url.pathname.split("/").filter(Boolean)[0] || "home";
      return (
        key === activeSection ||
        (activeSection === "videos" && key === "youtube")
      );
    } catch {
      return false;
    }
  };
  const closeMenu = () => {
    const element = dialog.current;
    if (!element?.open) return;
    if (
      document.documentElement.dataset.websiteMotion === "off" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      element.close();
      return;
    }
    element
      .animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }],
        { duration: 200, easing: "ease-in", fill: "forwards" },
      )
      .finished.then(() => {
        element.close();
        element.getAnimations().forEach((animation) => animation.cancel());
      })
      .catch(() => {});
  };
  const booking = COPY.homepage.sections
    .split(",")
    .map((x) => x.trim())
    .includes("booking")
    ? "/#booking"
    : "/booking";
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.dataset.websiteTheme === "dark"),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-website-theme"],
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const wide = matchMedia("(min-width: 1100px)");
    const close = () => {
      if (wide.matches) dialog.current?.close();
    };
    wide.addEventListener("change", close);
    return () => {
      document.body.style.overflow = previous;
      wide.removeEventListener("change", close);
    };
  }, [open]);
  const toggle = (
    <button
      className="theme-toggle"
      aria-label={dark ? "Use light mode" : "Use dark mode"}
      onClick={() => setPublicMode(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun size={19} aria-hidden="true" />
      ) : (
        <Moon size={19} aria-hidden="true" />
      )}
    </button>
  );
  return (
    <>
      <nav
        className={`public-nav${scrolled ? " is-scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-6 nav-inner">
          <a
            href="/"
            className="public-brand"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                onNavigate("home");
              }
            }}
          >
            {COPY.logos?.headerMode === "image" && COPY.logos.headerImage ? (
              <img
                className="public-image-logo"
                src={COPY.logos.headerImage}
                alt={COPY.logos.headerAlt || COPY.brand.name}
              />
            ) : (
              <>
                <span className="brand-symbol">
                  {COPY.settings.brandLogo ? (
                    <MediaImage
                      editSource="settings/settings/brandLogo"
                      src={COPY.settings.brandLogo}
                      alt=""
                      width={40}
                      height={40}
                    />
                  ) : (
                    <EditText source="settings/navigation/Navbar_1">
                      {COPY.navigation.Navbar_1}
                    </EditText>
                  )}
                </span>
                <span>
                  <EditText source={"settings/navigation/Navbar_2"}>
                    {COPY.navigation.Navbar_2}
                  </EditText>
                  <i>
                    <EditText source={"settings/navigation/Navbar_3"}>
                      {COPY.navigation.Navbar_3}
                    </EditText>
                  </i>
                </span>
              </>
            )}
          </a>
          <div className="desktop-links">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                aria-current={
                  linkActive(link.href)
                    ? currentView === "home"
                      ? "location"
                      : "page"
                    : undefined
                }
              >
                <EditText source="settings/navigation/menu">
                  {link.name}
                </EditText>
              </a>
            ))}
          </div>
          <div className="nav-actions">
            {toggle}
            {COPY.homepage.sections.split(",").includes("booking") && (
              <a className="p-button nav-cta" href={booking}>
                <EditText source={"settings/navigation/Navbar_4"}>
                  {COPY.navigation.Navbar_4}
                </EditText>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            <button
              className="nav-menu-button"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="public-mobile-menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>
      <dialog
        ref={dialog}
        id="public-mobile-menu"
        aria-label="Navigation"
        className="public-mobile-menu"
        onCancel={(e) => {
          e.preventDefault();
          closeMenu();
        }}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className="mobile-menu-content">
          <div className="mobile-menu-top">
            <span>
              <EditText source={"settings/navigation/Navbar_5"}>
                {COPY.navigation.Navbar_5}
              </EditText>
              <EditText source={"settings/navigation/Navbar_6"}>
                {COPY.navigation.Navbar_6}
              </EditText>
            </span>
            <button aria-label="Close navigation" onClick={closeMenu}>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {links.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                aria-current={
                  linkActive(link.href)
                    ? currentView === "home"
                      ? "location"
                      : "page"
                    : undefined
                }
                onClick={closeMenu}
              >
                <span>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <EditText source="settings/navigation/menu">
                    {link.name}
                  </EditText>
                </span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            ))}
          </nav>
          {COPY.homepage.sections.split(",").includes("booking") && (
            <a className="p-button primary" href={booking} onClick={closeMenu}>
              <EditText source={"settings/navigation/Navbar_7"}>
                {COPY.navigation.Navbar_7}
              </EditText>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}
