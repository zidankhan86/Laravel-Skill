export let COPY: Record<string, Record<string, string>> = {
  homepage: { sections: "hero,trust,about,journey,services,videos,projects,deals,gallery,resources,testimonials,booking,closingCta,footer" },
  navigation: { menu: "" },
  brand: {},
  settings: {},
  appearance: {},
  logos: {},
  integrations: {},
  customCode: {},
};

export let RECORDS: any[] = [];

export function setContent(data: { settings: typeof COPY; content: any[] }) {
  if (data?.settings) {
    COPY = {
      ...COPY,
      ...data.settings,
      homepage: { ...COPY.homepage, ...(data.settings.homepage || {}) },
      navigation: { ...COPY.navigation, ...(data.settings.navigation || {}) },
      brand: { ...COPY.brand, ...(data.settings.brand || {}) },
      settings: { ...COPY.settings, ...(data.settings.settings || {}) },
      appearance: { ...COPY.appearance, ...(data.settings.appearance || {}) },
      logos: { ...COPY.logos, ...(data.settings.logos || {}) },
      integrations: { ...COPY.integrations, ...(data.settings.integrations || {}) },
      customCode: { ...COPY.customCode, ...(data.settings.customCode || {}) },
    };
  }
  if (data?.content) {
    RECORDS = data.content;
  }
}

export const collection = (key: string, featured = false) =>
  RECORDS.filter((r) => r.collection === key && (!featured || r.featured));
