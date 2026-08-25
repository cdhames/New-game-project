import type {
  EvidenceQuality,
  Instrument,
  ObservationCategory,
  SafeRouteDescriptor,
  SourceClass,
  StableId,
} from "@long-map/protocol";

export const NODE_NAMES: Readonly<Record<StableId, string>> = {
  harbor: "Lantern Harbor",
  shoal: "Whisper Shoal",
  "glass-cay": "Glass Cay",
  "north-mark": "North Mark",
  "reed-bank": "Reed Bank",
  "pale-inlet": "Pale Inlet",
  "deep-spur": "Deep Spur",
  "rain-key": "Rain Key",
  "far-sound": "Far Sound",
  "needle-rock": "Needle Rock",
  "outer-light": "Outer Light",
  "last-cairn": "Last Cairn",
};

export const NODE_COORDINATES: Readonly<Record<StableId, readonly [number, number]>> = {
  harbor: [92, 236],
  shoal: [205, 165],
  "glass-cay": [202, 315],
  "north-mark": [345, 118],
  "reed-bank": [365, 215],
  "pale-inlet": [350, 344],
  "deep-spur": [505, 120],
  "rain-key": [515, 260],
  "far-sound": [520, 375],
  "needle-rock": [670, 145],
  "outer-light": [675, 295],
  "last-cairn": [815, 230],
};

export const INSTRUMENTS: ReadonlyArray<{
  id: Instrument;
  name: string;
  description: string;
}> = [
  {
    id: "sounding-line",
    name: "Sounding Line",
    description: "Verifies whether a nearby route is passable.",
  },
  {
    id: "weather-glass",
    name: "Weather Glass",
    description: "Measures local hazards and changing conditions.",
  },
  {
    id: "field-lens",
    name: "Field Lens",
    description: "Assesses opportunities found on nearby shores.",
  },
];

export const displayName = (id: StableId): string => NODE_NAMES[id] ?? humanize(id);

export const humanize = (value: string): string =>
  value
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const routeName = (route: SafeRouteDescriptor): string =>
  `${displayName(route.a)} ↔ ${displayName(route.b)}`;

export const categoryName = (category: ObservationCategory): string => humanize(category);

export const qualityLabel = (quality: EvidenceQuality): string =>
  ({ low: "Low evidence · ◇", medium: "Medium evidence · ◇◇", high: "High evidence · ◇◇◇" })[
    quality
  ];

export const sourceLabel = (source: SourceClass): string =>
  ({ player: "Local explorer", baseline: "Baseline survey", synthetic: "Synthetic explorer" })[
    source
  ];

export const readingLabel = (category: ObservationCategory, value: string | number): string => {
  if (typeof value === "string") return humanize(value);
  const scales: Record<ObservationCategory, readonly string[]> = {
    route: ["Unknown", "Known"],
    hazard: ["Calm", "Watchful", "Risky", "Severe", "Extreme"],
    condition: ["Clear", "Light", "Variable", "Rough", "Extreme"],
    opportunity: ["None", "Modest", "Useful", "Rich", "Exceptional", "Rare"],
  };
  return `${scales[category][value] ?? `Level ${value}`} (${value})`;
};
