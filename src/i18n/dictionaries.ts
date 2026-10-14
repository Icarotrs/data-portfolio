import type { ProjectKind } from "@site";
import type { Locale } from "./config";

/**
 * Every piece of interface text, per language. Project content (titles,
 * summaries, case studies) lives in content/projects/<slug>/.
 */
export interface Dictionary {
  meta: { title: string; description: string };
  nav: { projects: string; services: string; contact: string; hire: string; skip: string; language: string };
  role: string;
  kinds: Record<ProjectKind, string>;
  hero: { eyebrow: string; title: string; intro: string; cta: string; seeProjects: string };
  projects: { eyebrow: string; title: string; intro: string; viewCase: string };
  services: {
    eyebrow: string;
    title: string;
    items: { title: string; tools: string; body: string }[];
  };
  contact: { eyebrow: string; title: string; body: string; cta: string };
  footer: { note: string };
  project: {
    allProjects: string;
    project: string;
    result: string;
    hireForThis: string;
    code: string;
    demo: string;
    type: string;
    stack: string;
    data: string;
    clientData: string;
    glance: string;
    hire: string;
    screenshots: string;
    comingSoon: string;
    nextProject: string;
    shotsNote: string;
  };
  theme: { dark: string; light: string; group: string };
}

const en: Dictionary = {
  meta: {
    title: "Icaro Torres — Data & Automation Portfolio",
    description:
      "Portfolio of Icaro Torres, freelance data & automation specialist: Power BI and Google Sheets dashboards, Apps Script automation, data cleaning and automated reports.",
  },
  nav: { projects: "Projects", services: "Services", contact: "Contact", hire: "Hire me", skip: "Skip to content", language: "Language" },
  role: "Data & Automation Freelancer",
  kinds: { dashboard: "Dashboard / BI", automation: "Automation / Apps Script", cleaning: "Data cleaning / AI" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "My portfolio",
    intro:
      "I turn messy spreadsheets into clear dashboards and automations that give people their hours back. Here's some of my work.",
    cta: "Hire me on Upwork",
    seeProjects: "See projects",
  },
  projects: {
    eyebrow: "Work",
    title: "Projects",
    intro: "Click any one to see how it was done.",
    viewCase: "View case study",
  },
  services: {
    eyebrow: "Services",
    title: "How I can help",
    items: [
      { title: "Dashboards & reports", tools: "Power BI · Google Sheets · Looker Studio", body: "Your numbers in one clear view, built on the tools you already use." },
      { title: "Sheets & Apps Script automation", tools: "Apps Script · Sheets · Forms · Gmail", body: "The copy-paste work, done for you every day." },
      { title: "Data cleaning & import", tools: "Python · SQL · Power Query", body: "Messy exports turned into one table you can trust." },
      { title: "AI-assisted analysis", tools: "Python · LLM APIs · Sheets", body: "Thousands of reviews or answers sorted by topic, checked by a human." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk?",
    body: "Send me a message on Upwork.",
    cta: "Hire me on Upwork",
  },
  footer: { note: "Demo projects use public or fictitious data" },
  project: {
    allProjects: "All projects",
    project: "Project",
    result: "Result",
    hireForThis: "Hire me for this",
    code: "Code",
    demo: "Live demo",
    type: "Type",
    stack: "Stack",
    data: "Data",
    clientData: "Client data",
    glance: "At a glance",
    hire: "Hire me on Upwork",
    screenshots: "Screenshots",
    comingSoon: "coming soon",
    nextProject: "Next project",
    shotsNote: "Screenshots are mock-ups of the deliverable with fictitious data.",
  },
  theme: { dark: "Dark theme", light: "Light theme", group: "Color theme" },
};

const pt: Dictionary = {
  meta: {
    title: "Icaro Torres — Portfólio de Dados e Automação",
    description:
      "Portfólio de Icaro Torres, freelancer de dados e automação: dashboards em Power BI e Google Sheets, automações com Apps Script, limpeza de dados e relatórios automáticos.",
  },
  nav: { projects: "Projetos", services: "Serviços", contact: "Contato", hire: "Contratar", skip: "Pular para o conteúdo", language: "Idioma" },
  role: "Freelancer de Dados e Automação",
  kinds: { dashboard: "Dashboard / BI", automation: "Automação / Apps Script", cleaning: "Limpeza de dados / IA" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Meu portfólio",
    intro:
      "Transformo planilhas bagunçadas em dashboards claros e automações que devolvem horas da semana. Aqui estão alguns trabalhos.",
    cta: "Contratar no Upwork",
    seeProjects: "Ver projetos",
  },
  projects: {
    eyebrow: "Trabalhos",
    title: "Projetos",
    intro: "Clique em um para ver como foi feito.",
    viewCase: "Ver estudo de caso",
  },
  services: {
    eyebrow: "Serviços",
    title: "Como posso ajudar",
    items: [
      { title: "Dashboards e relatórios", tools: "Power BI · Google Sheets · Looker Studio", body: "Seus números numa visão clara, nas ferramentas que você já usa." },
      { title: "Automação com Sheets e Apps Script", tools: "Apps Script · Sheets · Forms · Gmail", body: "O trabalho de copiar e colar, feito sozinho todo dia." },
      { title: "Limpeza e importação de dados", tools: "Python · SQL · Power Query", body: "Exportações bagunçadas viram uma tabela confiável." },
      { title: "Análise com apoio de IA", tools: "Python · APIs de LLM · Sheets", body: "Milhares de avaliações ou respostas organizadas por tema, com conferência humana." },
    ],
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar?",
    body: "Me mande uma mensagem pelo Upwork.",
    cta: "Contratar no Upwork",
  },
  footer: { note: "Projetos de demonstração com dados públicos ou fictícios" },
  project: {
    allProjects: "Todos os projetos",
    project: "Projeto",
    result: "Resultado",
    hireForThis: "Quero algo assim",
    code: "Código",
    demo: "Demo ao vivo",
    type: "Tipo",
    stack: "Ferramentas",
    data: "Dados",
    clientData: "Dados do cliente",
    glance: "Resumo",
    hire: "Contratar no Upwork",
    screenshots: "Telas",
    comingSoon: "em breve",
    nextProject: "Próximo projeto",
    shotsNote: "As telas são simulações da entrega com dados fictícios.",
  },
  theme: { dark: "Tema escuro", light: "Tema claro", group: "Tema de cores" },
};

const es: Dictionary = {
  meta: {
    title: "Icaro Torres — Portafolio de Datos y Automatización",
    description:
      "Portafolio de Icaro Torres, freelancer de datos y automatización: dashboards en Power BI y Google Sheets, automatizaciones con Apps Script, limpieza de datos e informes automáticos.",
  },
  nav: { projects: "Proyectos", services: "Servicios", contact: "Contacto", hire: "Contratar", skip: "Saltar al contenido", language: "Idioma" },
  role: "Freelancer de Datos y Automatización",
  kinds: { dashboard: "Dashboard / BI", automation: "Automatización / Apps Script", cleaning: "Limpieza de datos / IA" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Mi portafolio",
    intro:
      "Convierto hojas de cálculo desordenadas en dashboards claros y automatizaciones que devuelven horas a la semana. Aquí hay algunos trabajos.",
    cta: "Contratar en Upwork",
    seeProjects: "Ver proyectos",
  },
  projects: {
    eyebrow: "Trabajos",
    title: "Proyectos",
    intro: "Haz clic en uno para ver cómo se hizo.",
    viewCase: "Ver caso de estudio",
  },
  services: {
    eyebrow: "Servicios",
    title: "Cómo puedo ayudar",
    items: [
      { title: "Dashboards e informes", tools: "Power BI · Google Sheets · Looker Studio", body: "Tus números en una vista clara, con las herramientas que ya usas." },
      { title: "Automatización con Sheets y Apps Script", tools: "Apps Script · Sheets · Forms · Gmail", body: "El trabajo de copiar y pegar, hecho solo cada día." },
      { title: "Limpieza e importación de datos", tools: "Python · SQL · Power Query", body: "Exportaciones desordenadas convertidas en una tabla confiable." },
      { title: "Análisis con apoyo de IA", tools: "Python · APIs de LLM · Sheets", body: "Miles de reseñas o respuestas ordenadas por tema, con revisión humana." },
    ],
  },
  contact: {
    eyebrow: "Contacto",
    title: "¿Hablamos?",
    body: "Envíame un mensaje por Upwork.",
    cta: "Contratar en Upwork",
  },
  footer: { note: "Proyectos de demostración con datos públicos o ficticios" },
  project: {
    allProjects: "Todos los proyectos",
    project: "Proyecto",
    result: "Resultado",
    hireForThis: "Quiero algo así",
    code: "Código",
    demo: "Demo en vivo",
    type: "Tipo",
    stack: "Herramientas",
    data: "Datos",
    clientData: "Datos del cliente",
    glance: "Resumen",
    hire: "Contratar en Upwork",
    screenshots: "Pantallas",
    comingSoon: "próximamente",
    nextProject: "Siguiente proyecto",
    shotsNote: "Las pantallas son simulaciones de la entrega con datos ficticios.",
  },
  theme: { dark: "Tema oscuro", light: "Tema claro", group: "Tema de color" },
};

const dictionaries: Record<Locale, Dictionary> = { en, pt, es };

export const getDictionary = (locale: Locale) => dictionaries[locale];
