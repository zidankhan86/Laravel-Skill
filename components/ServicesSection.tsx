import { EditText, contentSource } from "./EditBinding";
import React from "react";
import { COPY } from "../content";
import { SERVICES, ICON_MAP } from "../constants";
import { Check, ArrowUpRight, ArrowRight, Layers } from "lucide-react";
import { MixedText } from "./Presentation";
export default function ServicesSection({
  onViewMore,
}: {
  onViewMore: () => void;
}) {
  return (
    <section id="services" className="public-section services-section">
      <div className="container mx-auto px-6">
        <div className="section-intro">
          <div>
            <span className="eyebrow">
              <EditText source="settings/ui/ServicesSection_1">
                {COPY.ui.ServicesSection_1}
              </EditText>
            </span>
            <h2>
              <MixedText
                editSource={"settings/homepage/ServicesSection_1"}
                text={COPY.homepage.ServicesSection_1}
                phrase="Solutions"
              />
            </h2>
          </div>
          <p>
            <EditText source={"settings/homepage/ServicesSection_2"}>
              {COPY.homepage.ServicesSection_2}
            </EditText>
          </p>
        </div>
        <div className="service-bento">
          {SERVICES.filter((item) => item.featured)
            .slice(0, 3)
            .map((service, index) => {
              const Icon = ICON_MAP[service.icon] || Layers;
              return (
                <article
                  key={service.id}
                  className={`service-tile service-tile-${index}`}
                >
                  <div className="tile-top">
                    <span className="service-icon">
                      <Icon size={25} aria-hidden="true" />
                    </span>
                    <span className="tile-number">0{index + 1}</span>
                  </div>
                  <h3>
                    <a href={"/services/" + service.slug}>
                      <EditText source={contentSource(service.id, "title")}>
                        {service.title}
                      </EditText>
                    </a>
                  </h3>
                  <p>
                    <EditText source={contentSource(service.id, "summary")}>
                      {service.description}
                    </EditText>
                  </p>
                  <ul>
                    {service.features.map((feature: string, i: number) => (
                      <li key={i}>
                        <Check size={15} aria-hidden="true" />
                        <EditText
                          source={contentSource(
                            service.id,
                            `fields.features.${i}`,
                          )}
                        >
                          {feature}
                        </EditText>
                      </li>
                    ))}
                  </ul>
                  <a className="tile-action" href={service.ctaUrl}>
                    <EditText
                      source={contentSource(service.id, "fields.ctaLabel")}
                    >
                      {service.ctaLabel}
                    </EditText>
                    <span>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </span>
                  </a>
                </article>
              );
            })}
        </div>
        <div className="section-outro">
          <button className="p-button secondary" onClick={onViewMore}>
            <EditText source={"settings/homepage/ServicesSection_5"}>
              {COPY.homepage.ServicesSection_5}
            </EditText>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
