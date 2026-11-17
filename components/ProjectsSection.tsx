import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import { MediaImage } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { motion as _motion } from "framer-motion";
import { PROJECTS } from "../constants";
import { ArrowUpRight, ArrowRight } from "lucide-react";

// Fix: Cast motion to any to bypass environment-specific type resolution issues for motion props
const motion = _motion as any;

interface ProjectsSectionProps {
  onViewMore: () => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onViewMore }) => {
  return (
    <section id="projects" className="py-24 bg-neutral-950">
      <div className="container mx-auto px-6">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-brand font-black mb-4">
            <MixedText
              editSource={"settings/homepage/ProjectsSection_1"}
              text={COPY.homepage.ProjectsSection_1}
              phrase="Built"
            />
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto">
            <EditText source={"settings/homepage/ProjectsSection_2"}>
              {COPY.homepage.ProjectsSection_2}
            </EditText>
          </p>
        </motion.div>

        <div className="project-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {PROJECTS.filter((item) => item.featured).map((project, index) => (
            <motion.div
              key={project.id}
              initial={false}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-3xl overflow-hidden border border-white/5 bg-neutral-900"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <MediaImage
                  editSource={contentSource(project.id, "fields.image")}
                  loading="lazy"
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-200"
                />
              </div>
              <div className="p-8">
                <span className="text-red-500 text-xs font-black uppercase tracking-widest mb-2 block">
                  <EditText
                    source={contentSource(project.id, "fields.category")}
                  >
                    {project.category}
                  </EditText>
                </span>
                <h3 className="text-2xl font-brand font-bold mb-3 text-white">
                  <a href={"/projects/" + project.slug}>
                    <EditText source={contentSource(project.id, "title")}>
                      {project.title}
                    </EditText>
                  </a>
                </h3>
                <p className="text-neutral-400 mb-6 ">
                  <EditText source={contentSource(project.id, "summary")}>
                    {project.description}
                  </EditText>
                </p>
                {project.technologies?.length > 0 && (
                  <ul className="technology-chips">
                    {project.technologies.map((tech: string, i: number) => (
                      <li key={i}>
                        <EditText
                          source={contentSource(
                            project.id,
                            `fields.technologies.${i}`,
                          )}
                        >
                          {tech}
                        </EditText>
                      </li>
                    ))}
                  </ul>
                )}
                <a
                  href={project.liveUrl || undefined}
                  aria-disabled={!project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-bold text-white group/btn"
                >
                  <EditText
                    source={
                      project.liveUrl
                        ? "settings/homepage/ProjectsSection_3"
                        : "settings/ui/previewUnavailable"
                    }
                  >
                    {project.liveUrl
                      ? COPY.homepage.ProjectsSection_3
                      : COPY.ui.previewUnavailable}
                  </EditText>
                  <ArrowUpRight
                    aria-hidden="true"
                    size={18}
                    className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                  />
                </a>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/20 transition-all rounded-3xl pointer-events-none"></div>
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
            <EditText source={"settings/homepage/ProjectsSection_4"}>
              {COPY.homepage.ProjectsSection_4}
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

export default ProjectsSection;
