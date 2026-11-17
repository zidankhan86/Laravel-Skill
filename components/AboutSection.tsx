import { EditText, contentSource } from "./EditBinding";
import { MixedText } from "./Presentation";
import { COPY } from "../content";

import React from "react";
import { Target, Eye, Brain } from "lucide-react";

const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-gradient-red text-4xl md:text-5xl font-brand font-black mb-8">
            <MixedText
              editSource={"settings/about/AboutSection_1"}
              text={COPY.about.AboutSection_1}
              phrase="Why I Exist"
            />
          </h2>
          <p className="text-xl text-neutral-300 leading-relaxed mb-6 font-medium">
            <EditText source={"settings/about/AboutSection_2"}>
              {COPY.about.AboutSection_2}
            </EditText>
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg">
            <span className="px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold">
              <EditText source={"settings/about/AboutSection_3"}>
                {COPY.about.AboutSection_3}
              </EditText>
            </span>
            <span className="text-neutral-500 text-2xl">
              <EditText source={"settings/about/AboutSection_4"}>
                {COPY.about.AboutSection_4}
              </EditText>
            </span>
            <span className="px-6 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold">
              <EditText source={"settings/about/AboutSection_5"}>
                {COPY.about.AboutSection_5}
              </EditText>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-red-500/30 transition-all hover-lift group">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-[1.025] transition-transform">
              <Target aria-hidden="true" size={32} />
            </div>
            <h3 className="text-2xl font-brand font-bold mb-4">
              <EditText source={"settings/about/AboutSection_7"}>
                {COPY.about.AboutSection_7}
              </EditText>
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              <EditText source={"settings/about/AboutSection_8"}>
                {COPY.about.AboutSection_8}
              </EditText>
            </p>
          </div>

          {/* Vision */}
          <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-red-500/30 transition-all hover-lift group">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-[1.025] transition-transform">
              <Eye aria-hidden="true" size={32} />
            </div>
            <h3 className="text-2xl font-brand font-bold mb-4">
              <EditText source={"settings/about/AboutSection_9"}>
                {COPY.about.AboutSection_9}
              </EditText>
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              <EditText source={"settings/about/AboutSection_10"}>
                {COPY.about.AboutSection_10}
              </EditText>
              <br />
              <EditText source={"settings/about/AboutSection_11"}>
                {COPY.about.AboutSection_11}
              </EditText>
            </p>
          </div>

          {/* Belief */}
          <div className="bg-neutral-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-red-500/30 transition-all hover-lift group">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-[1.025] transition-transform">
              <Brain aria-hidden="true" size={32} />
            </div>
            <h3 className="text-2xl font-brand font-bold mb-4">
              <EditText source={"settings/about/AboutSection_12"}>
                {COPY.about.AboutSection_12}
              </EditText>
            </h3>
            <p className="text-neutral-400 leading-relaxed italic">
              <EditText source={"settings/about/AboutSection_13"}>
                {COPY.about.AboutSection_13}
              </EditText>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
