export type NavLink = {
  id: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: "hero", label: "Home" },
  { id: "weather", label: "Weather" },
  { id: "intro", label: "Intro" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "impact", label: "Impact" },
  { id: "why-ai", label: "Why AI" },
];

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
};

export const SERVICES: ServiceItem[] = [
  {
    id: "service-custom-ai",
    title: "Custom AI Solutions",
    description:
      "Tailored AI models designed to solve your unique business challenges.",
  },
  {
    id: "service-generative-ai",
    title: "Generative AI Development",
    description:
      "Harness the power of Large Language Models to create content, code, and more.",
  },
  {
    id: "service-data-engineering",
    title: "Data Strategy & Engineering",
    description:
      "Unlock the value of your data with actionable insights and robust pipelines.",
  },
  {
    id: "service-model-ops",
    title: "AI Model Ops & Governance",
    description:
      "Deploy, monitor, and govern AI systems with confidence and compliance.",
  },
];

export const PROCESS_STEPS = [
  {
    step: "1",
    title: "Define clear goals and desired outcomes",
    description:
      "Start by pinpointing the exact problem you want to solve and why it matters. Identify who will use the solution, what value it should deliver, and how you'll measure success. Set specific, realistic outcomes so every decision that follows stays aligned with your end goal.",
  },
  {
    step: "2",
    title: "Define clear goals and desired outcomes",
    description:
      "Start by pinpointing the exact problem you want to solve and why it matters. Identify who will use the solution, what value it should deliver, and how you'll measure success. Set specific, realistic outcomes so every decision that follows stays aligned with your end goal.",
  },
  {
    step: "3",
    title: "Define clear goals and desired outcomes",
    description:
      "Start by pinpointing the exact problem you want to solve and why it matters. Identify who will use the solution, what value it should deliver, and how you'll measure success. Set specific, realistic outcomes so every decision that follows stays aligned with your end goal.",
  },
];

export type ImpactCard = {
  title: string;
  description: string;
  image: string;
  accent: string;
};

export const IMPACT_CARDS: ImpactCard[] = [
  {
    title: "AI for healthcare",
    description:
      "Reduce administrative burden and enhance patient care workflows with clinical AI.",
    image: "/ai%20impact/healthcare1.png",
    accent: "#D85A30",
  },
  {
    title: "AI for talent acquisition",
    description:
      "Automate candidate screening and improve hiring decisions to reduce time-to-hire.",
    image: "/ai%20impact/talent.png",
    accent: "#1D6EEB",
  },
  {
    title: "AI for financial markets",
    description:
      "Analyze market signals, manage risk, and generate trading intelligence faster.",
    image: "/ai%20impact/financial.png",
    accent: "#25AFC5",
  },
  {
    title: "AI for knowledge management",
    description:
      "Turn scattered enterprise information into accessible, actionable intelligence.",
    image: "/ai%20impact/knowledge_management.png",
    accent: "#38B9A8",
  },
  {
    title: "AI for workflow automation",
    description:
      "Reduce manual effort and free teams to focus on higher-value activities.",
    image: "/ai%20impact/Workflow.png",
    accent: "#E48C3B",
  },
  {
    title: "AI for IoT & operations",
    description:
      "Monitor, analyse, and act on real-time data from connected devices and systems.",
    image: "/ai%20impact/IoT_Operations.png",
    accent: "#1E8BD7",
  },
  {
    title: "AI for enterprise applications",
    description:
      "Embed intelligence into core enterprise applications for smarter decision-making.",
    image: "/ai%20impact/ernterprise_app.png",
    accent: "#49BCAF",
  },
];
