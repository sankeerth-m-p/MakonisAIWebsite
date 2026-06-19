export type NavLink = {
  id: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: "hero", label: "Home" },
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
    title: "Strategy & Planning",
    description: "Defining the roadmap and identifying the right AI opportunities.",
  },
  {
    step: "2",
    title: "Design & Development",
    description: "Building custom solutions tailored to your business needs.",
  },
  {
    step: "3",
    title: "Deployment & Scaling",
    description: "Launching, integrating, and growing your AI capabilities.",
  },
];

export const IMPACT_CARDS = [
  {
    title: "Increased Efficiency",
    description: "Automate repetitive tasks and streamline operations.",
  },
  {
    title: "Enhanced Innovation",
    description: "Unlock new possibilities and stay ahead of the curve.",
  },
  {
    title: "Data-Driven Decisions",
    description: "Gain deeper insights and make smarter business moves.",
  },
  {
    title: "Competitive Advantage",
    description: "Lead your industry with AI-powered differentiation.",
  },
];
