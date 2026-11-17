export const designs = [
  {
    id: "editorial",
    name: "Editorial",
    description: "Expressive typography, sculpted portrait and colorful cards.",
    tag: "Original",
  },
  {
    id: "studio",
    name: "Studio",
    description:
      "Centered introduction, generous whitespace and soft portrait.",
    tag: "Creative",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Structured split layout, crisp typography and compact cards.",
    tag: "Professional",
  },
] as const;
export const designDefaults = {
  websiteDesign: "editorial",
  websiteDensity: "comfortable",
  websiteCorners: "rounded",
  websiteMotion: "subtle",
  studioPortraitShape: "oval",
  executivePortraitSide: "left",
};
