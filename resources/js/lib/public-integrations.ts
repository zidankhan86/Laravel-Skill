// Owner-configured public extensions. Never run inside admin or authoring previews.
let installed = false;
export function installPublicExtensions(settings: Record<string, any>) {
  if (
    installed ||
    typeof window === "undefined" ||
    location.pathname.startsWith("/admin") ||
    new URLSearchParams(location.search).has("edit") ||
    new URLSearchParams(location.search).has("preview")
  )
    return;
  installed = true;
  const w = window as any,
    i = settings.integrations || {},
    c = settings.customCode || {};
  const script = (src: string) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };
  if (i.facebookEnabled === "on" && /^\d{5,25}$/.test(i.facebookId)) {
    if (!w.fbq) {
      const fbq: any = function (...args: any[]) {
        fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
      };
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.push = fbq;
      w.fbq = fbq;
      w._fbq = fbq;
      script("https://connect.facebook.net/en_US/fbevents.js");
    }
    w.fbq("init", i.facebookId);
    w.fbq("track", "PageView");
  }
  if (i.gtmEnabled === "on" && /^GTM-[A-Z0-9]{4,20}$/.test(i.gtmId)) {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    script(
      "https://www.googletagmanager.com/gtm.js?id=" +
        encodeURIComponent(i.gtmId),
    );
  }
  if (i.tiktokEnabled === "on" && /^[A-Z0-9]{10,30}$/.test(i.tiktokId)) {
    w.TiktokAnalyticsObject = "ttq";
    const ttq = (w.ttq = w.ttq || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];
    ttq.setAndDefer = (target: any, method: string) => {
      target[method] = (...args: any[]) => target.push([method, ...args]);
    };
    ttq.methods.forEach((m: string) => ttq.setAndDefer(ttq, m));
    ttq.instance = (id: string) => {
      const a = ttq._i[id] || [];
      ttq.methods.forEach((m: string) => ttq.setAndDefer(a, m));
      return a;
    };
    ttq._i = ttq._i || {};
    ttq._i[i.tiktokId] = [];
    ttq._i[i.tiktokId]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._t = ttq._t || {};
    ttq._t[i.tiktokId] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[i.tiktokId] = {};
    script(
      "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" +
        encodeURIComponent(i.tiktokId) +
        "&lib=ttq",
    );
    ttq.page();
  }
  if (c.enabled === "on") {
    for (const loc of ["header", "body"]) {
      const target = loc === "header" ? document.head : document.body;
      // Recreate script elements: scripts in parsed HTML are otherwise inert.
      const template = document.createElement("template");
      template.innerHTML = c[loc + "Html"] || "";
      const scripts = Array.from(template.content.querySelectorAll("script"));
      for (const old of scripts) {
        const fresh = document.createElement("script");
        for (const a of Array.from(old.attributes))
          fresh.setAttribute(a.name, a.value);
        fresh.textContent = old.textContent;
        fresh.async = false;
        old.replaceWith(fresh);
      }
      target.appendChild(template.content);
      if (c[loc + "Css"]) {
        const style = document.createElement("style");
        style.textContent = c[loc + "Css"];
        target.appendChild(style);
      }
      if (c[loc + "Js"]) {
        const js = document.createElement("script");
        js.textContent = c[loc + "Js"];
        target.appendChild(js);
      }
    }
  }
}
