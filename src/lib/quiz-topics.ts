export const BUILT_IN_TOPICS = [
  {
    id: "JAVASCRIPT",
    label: "JavaScript",
    icon: "ri-javascript-line",
    color: "text-yellow-400",
  },
  {
    id: "TYPESCRIPT",
    label: "TypeScript",
    icon: "ri-code-s-slash-line",
    color: "text-blue-400",
  },
  {
    id: "PYTHON",
    label: "Python",
    icon: "ri-code-line",
    color: "text-green-400",
  },
  { id: "CSS", label: "CSS", icon: "ri-css3-line", color: "text-blue-300" },
  {
    id: "HTML",
    label: "HTML",
    icon: "ri-html5-line",
    color: "text-orange-400",
  },
  {
    id: "REACT",
    label: "React",
    icon: "ri-reactjs-line",
    color: "text-cyan-400",
  },
  {
    id: "NODE",
    label: "Node.js",
    icon: "ri-server-line",
    color: "text-green-500",
  },
  {
    id: "DATABASES",
    label: "Databases",
    icon: "ri-database-2-line",
    color: "text-purple-400",
  },
  {
    id: "SYSTEM_DESIGN",
    label: "System Design",
    icon: "ri-flow-chart",
    color: "text-pink-400",
  },
  {
    id: "GENERAL_CS",
    label: "General CS",
    icon: "ri-cpu-line",
    color: "text-zinc-300",
  },
] as const;

export type BuiltInTopicId = (typeof BUILT_IN_TOPICS)[number]["id"];

export const BUILT_IN_TOPIC_LABELS = Object.fromEntries(
  BUILT_IN_TOPICS.map((t) => [t.id, t.label]),
);
