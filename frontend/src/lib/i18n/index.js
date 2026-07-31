import en from "./en";
import sw from "./sw";
import ar from "./ar";
import hi from "./hi";
import fr from "./fr";
import es from "./es";
import pt from "./pt";
import id from "./id";
import ms from "./ms";
import ko from "./ko";
import vi from "./vi";
import zh from "./zh";
import th from "./th";
import lo from "./lo";
import my from "./my";

export const LANGUAGE_GROUPS = [
  {
    group: "AU Integrated Languages",
    languages: [
      { code: "en", label: "English" },
      { code: "sw", label: "Swahili" },
      { code: "ar", label: "Arabic" },
    ],
  },
  {
    group: "EU Integrated Languages",
    languages: [
      { code: "fr", label: "French" },
      { code: "pt", label: "Portuguese" },
      { code: "es", label: "Spanish" },
    ],
  },
  {
    group: "Asia-Pacific",
    languages: [
      { code: "id", label: "Indonesian" },
      { code: "ms", label: "Malay" },
      { code: "hi", label: "Hindi" },
      { code: "zh", label: "Mandarin" },
      { code: "th", label: "Thai" },
      { code: "lo", label: "Lao" },
      { code: "my", label: "Myanmar" },
      { code: "ko", label: "Korean" },
      { code: "vi", label: "Vietnamese" },
    ],
  },
];

// Flat list for backward compatibility
export const LANGUAGES = LANGUAGE_GROUPS.flatMap(group => 
  group.languages.map(lang => ({ ...lang, sublabel: lang.label }))
);

const translations = { en, sw, ar, hi, fr, es, pt, id, ms, ko, vi, zh, th, lo, my };

export default translations;
