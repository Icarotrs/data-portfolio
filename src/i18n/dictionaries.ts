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
  hero: { eyebrow: string; title: string; intro: string; cta: string; seeProjects: string; steps: [string, string, string] };
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
    hireForThis: string;
    code: string;
    demo: string;
    sections: { demo: string; tools: string; result: string };
    flow: string;
    type: string;
    data: string;
    clientData: string;
    hire: string;
    screenshots: string;
    comingSoon: string;
    nextProject: string;
    shotsNote: string;
    basis: { estimated: string; simulated: string };
  };
  theme: { dark: string; light: string; group: string };
}

const en: Dictionary = {
  meta: {
    title: "Business Automation & AI Integration | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres connects the tools small businesses and online stores already use, automates the manual work and adds AI where it saves time. Google Sheets, Apps Script, n8n, Make, Claude and OpenAI APIs, plus clear dashboards.",
  },
  nav: { projects: "Projects", services: "Services", contact: "Contact", hire: "Hire me", skip: "Skip to content", language: "Language" },
  role: "Business Automation & AI Integration",
  kinds: { integration: "Integration", automation: "Automation", ai: "AI integration", extraction: "Data extraction", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "My portfolio",
    intro:
      "I connect the tools your business already uses, automate the manual work and add AI where it actually saves time. Plus clear dashboards to see the results.",
    cta: "Hire me on Upwork",
    seeProjects: "See projects",
    steps: ["Connect", "Automate", "See results"],
  },
  projects: {
    eyebrow: "Work",
    title: "Projects",
    intro: "Workflows built for small businesses and online stores. Open one to see the problem, the build and the result.",
    viewCase: "View case study",
  },
  services: {
    eyebrow: "Services",
    title: "How I can help",
    items: [
      { title: "Process automation", tools: "Google Sheets · Apps Script · n8n · Make", body: "Connect the tools you already use and stop copy-pasting. Orders, forms, stock and emails that update themselves." },
      { title: "AI integration", tools: "Claude & OpenAI APIs · n8n · Apps Script", body: "AI inside the workflows you already have: classify requests, summarize text, draft replies. A person still checks what matters." },
      { title: "Data extraction & cleanup", tools: "Python · SQL · Power Query", body: "CSV, Excel, PDF and web data turned into clean, usable tables." },
      { title: "Dashboards & reporting", tools: "Power BI · Google Sheets · Looker Studio", body: "Clear reports that show what the automation saves and where the money goes." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk?",
    body: "Tell me what you still do by hand. Send me a message on Upwork.",
    cta: "Hire me on Upwork",
  },
  footer: { note: "Demo projects use public, simulated or fictitious data" },
  project: {
    allProjects: "All projects",
    project: "Project",
    hireForThis: "Hire me for this",
    code: "Code",
    demo: "Live demo",
    sections: { demo: "03 · Demo", tools: "04 · Tools", result: "05 · Result" },
    flow: "How it works",
    type: "Type",
    data: "Data",
    clientData: "Client data",
    hire: "Hire me on Upwork",
    screenshots: "Screens",
    comingSoon: "coming soon",
    nextProject: "Next project",
    shotsNote: "Screens and videos are mock-ups of the deliverable with fictitious or simulated data.",
    basis: { estimated: "Estimated", simulated: "Simulated" },
  },
  theme: { dark: "Dark theme", light: "Light theme", group: "Color theme" },
};

const pt: Dictionary = {
  meta: {
    title: "Automação de Processos e Integração de IA | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres conecta as ferramentas que pequenas empresas e lojas online já usam, automatiza o trabalho manual e adiciona IA onde ela realmente economiza tempo. Google Sheets, Apps Script, n8n, Make, APIs da Claude e da OpenAI, além de dashboards claros.",
  },
  nav: { projects: "Projetos", services: "Serviços", contact: "Contato", hire: "Contratar", skip: "Pular para o conteúdo", language: "Idioma" },
  role: "Automação de Processos e Integração de IA",
  kinds: { integration: "Integração", automation: "Automação", ai: "Integração de IA", extraction: "Extração de dados", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Meu portfólio",
    intro:
      "Conecto as ferramentas que sua empresa já usa, automatizo o trabalho manual e adiciono IA onde ela realmente economiza tempo. E dashboards claros para ver os resultados.",
    cta: "Contratar no Upwork",
    seeProjects: "Ver projetos",
    steps: ["Conectar", "Automatizar", "Ver resultados"],
  },
  projects: {
    eyebrow: "Trabalhos",
    title: "Projetos",
    intro: "Fluxos feitos para pequenas empresas e lojas online. Abra um para ver o problema, a solução e o resultado.",
    viewCase: "Ver estudo de caso",
  },
  services: {
    eyebrow: "Serviços",
    title: "Como posso ajudar",
    items: [
      { title: "Automação de processos", tools: "Google Sheets · Apps Script · n8n · Make", body: "Conecte as ferramentas que você já usa e pare de copiar e colar. Pedidos, formulários, estoque e e-mails que se atualizam sozinhos." },
      { title: "Integração de IA", tools: "APIs da Claude e da OpenAI · n8n · Apps Script", body: "IA dentro dos fluxos que você já tem: classificar pedidos, resumir textos, rascunhar respostas. Uma pessoa continua conferindo o que importa." },
      { title: "Extração e limpeza de dados", tools: "Python · SQL · Power Query", body: "Dados de CSV, Excel, PDF e da web viram tabelas limpas e prontas para usar." },
      { title: "Dashboards e relatórios", tools: "Power BI · Google Sheets · Looker Studio", body: "Relatórios claros que mostram o que a automação economiza e para onde vai o dinheiro." },
    ],
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar?",
    body: "Me conte o que você ainda faz à mão. Mande uma mensagem pelo Upwork.",
    cta: "Contratar no Upwork",
  },
  footer: { note: "Projetos de demonstração com dados públicos, simulados ou fictícios" },
  project: {
    allProjects: "Todos os projetos",
    project: "Projeto",
    hireForThis: "Quero algo assim",
    code: "Código",
    demo: "Demo ao vivo",
    sections: { demo: "03 · Demonstração", tools: "04 · Ferramentas", result: "05 · Resultado" },
    flow: "Como funciona",
    type: "Tipo",
    data: "Dados",
    clientData: "Dados do cliente",
    hire: "Contratar no Upwork",
    screenshots: "Telas",
    comingSoon: "em breve",
    nextProject: "Próximo projeto",
    shotsNote: "Telas e vídeos são simulações da entrega com dados fictícios ou simulados.",
    basis: { estimated: "Estimado", simulated: "Simulado" },
  },
  theme: { dark: "Tema escuro", light: "Tema claro", group: "Tema de cores" },
};

const es: Dictionary = {
  meta: {
    title: "Automatización de Procesos e Integración de IA | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres conecta las herramientas que ya usan las pequeñas empresas y tiendas online, automatiza el trabajo manual y añade IA donde de verdad ahorra tiempo. Google Sheets, Apps Script, n8n, Make, APIs de Claude y OpenAI, además de dashboards claros.",
  },
  nav: { projects: "Proyectos", services: "Servicios", contact: "Contacto", hire: "Contratar", skip: "Saltar al contenido", language: "Idioma" },
  role: "Automatización de Procesos e Integración de IA",
  kinds: { integration: "Integración", automation: "Automatización", ai: "Integración de IA", extraction: "Extracción de datos", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Mi portafolio",
    intro:
      "Conecto las herramientas que tu empresa ya usa, automatizo el trabajo manual y añado IA donde de verdad ahorra tiempo. Y dashboards claros para ver los resultados.",
    cta: "Contratar en Upwork",
    seeProjects: "Ver proyectos",
    steps: ["Conectar", "Automatizar", "Ver resultados"],
  },
  projects: {
    eyebrow: "Trabajos",
    title: "Proyectos",
    intro: "Flujos hechos para pequeñas empresas y tiendas online. Abre uno para ver el problema, la solución y el resultado.",
    viewCase: "Ver caso de estudio",
  },
  services: {
    eyebrow: "Servicios",
    title: "Cómo puedo ayudar",
    items: [
      { title: "Automatización de procesos", tools: "Google Sheets · Apps Script · n8n · Make", body: "Conecta las herramientas que ya usas y deja de copiar y pegar. Pedidos, formularios, stock y correos que se actualizan solos." },
      { title: "Integración de IA", tools: "APIs de Claude y OpenAI · n8n · Apps Script", body: "IA dentro de los flujos que ya tienes: clasificar solicitudes, resumir textos, redactar respuestas. Una persona sigue revisando lo importante." },
      { title: "Extracción y limpieza de datos", tools: "Python · SQL · Power Query", body: "Datos de CSV, Excel, PDF y la web convertidos en tablas limpias y listas para usar." },
      { title: "Dashboards e informes", tools: "Power BI · Google Sheets · Looker Studio", body: "Informes claros que muestran lo que ahorra la automatización y adónde va el dinero." },
    ],
  },
  contact: {
    eyebrow: "Contacto",
    title: "¿Hablamos?",
    body: "Cuéntame qué sigues haciendo a mano. Envíame un mensaje por Upwork.",
    cta: "Contratar en Upwork",
  },
  footer: { note: "Proyectos de demostración con datos públicos, simulados o ficticios" },
  project: {
    allProjects: "Todos los proyectos",
    project: "Proyecto",
    hireForThis: "Quiero algo así",
    code: "Código",
    demo: "Demo en vivo",
    sections: { demo: "03 · Demo", tools: "04 · Herramientas", result: "05 · Resultado" },
    flow: "Cómo funciona",
    type: "Tipo",
    data: "Datos",
    clientData: "Datos del cliente",
    hire: "Contratar en Upwork",
    screenshots: "Pantallas",
    comingSoon: "próximamente",
    nextProject: "Siguiente proyecto",
    shotsNote: "Las pantallas y videos son simulaciones de la entrega con datos ficticios o simulados.",
    basis: { estimated: "Estimado", simulated: "Simulado" },
  },
  theme: { dark: "Tema oscuro", light: "Tema claro", group: "Tema de color" },
};

const dictionaries: Record<Locale, Dictionary> = { en, pt, es };

export const getDictionary = (locale: Locale) => dictionaries[locale];
