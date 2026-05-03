export type Language = "JAVASCRIPT" | "TYPESCRIPT" | "PYTHON" | "CPP" | "JAVA";

export interface LanguageConfig {
  id: Language;
  label: string;
  monacoId: string; // Monaco editor language identifier
  extension: string; // file extension
  comment: string; // single line comment prefix
}

export const LANGUAGES: LanguageConfig[] = [
  {
    id: "JAVASCRIPT",
    label: "JavaScript",
    monacoId: "javascript",
    extension: "js",
    comment: "//",
  },
  {
    id: "TYPESCRIPT",
    label: "TypeScript",
    monacoId: "typescript",
    extension: "ts",
    comment: "//",
  },
  {
    id: "PYTHON",
    label: "Python",
    monacoId: "python",
    extension: "py",
    comment: "#",
  },
  { id: "CPP", label: "C++", monacoId: "cpp", extension: "cpp", comment: "//" },
  {
    id: "JAVA",
    label: "Java",
    monacoId: "java",
    extension: "java",
    comment: "//",
  },
];

export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l]),
) as Record<Language, LanguageConfig>;

export function getMonacoLanguage(lang: Language): string {
  return LANGUAGE_MAP[lang]?.monacoId ?? "javascript";
}
