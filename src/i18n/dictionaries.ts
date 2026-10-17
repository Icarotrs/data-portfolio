import type { FolderId, ProjectKind } from "@site";
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
  explorer: {
    foldersNav: string;
    /** Title of the pop-up window, e.g. "PROJECT" → PROJECT_01.EXE */
    file: string;
    close: string;
    folders: Record<FolderId, string>;
  };
  services: {
    eyebrow: string;
    title: string;
    items: { title: string; tools: string; body: string }[];
  };
  contact: { eyebrow: string; title: string; body: string };
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
    basis: { estimated: string; simulated: string; setting: string; public: string };
  };
  theme: { dark: string; light: string; group: string };
}

const en: Dictionary = {
  meta: {
    title: "Business Automation & AI Integration | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres connects the tools small businesses and online stores already use, automates the manual work and adds AI where it saves time. Google Sheets, Apps Script, n8n, Make and the Claude API, plus clear dashboards.",
  },
  nav: { projects: "Examples", services: "Services", contact: "Contact", hire: "Hire me", skip: "Skip to content", language: "Language" },
  role: "Business Automation & AI Integration",
  kinds: { integration: "Integration", automation: "Automation", ai: "AI integration", extraction: "Data extraction", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "My portfolio",
    intro:
      "I connect the tools your business already uses, automate the manual work and add AI where it actually saves time. Plus clear dashboards to see the results.",
    cta: "Email me",
    seeProjects: "See examples",
    steps: ["Connect", "Automate", "See results"],
  },
  projects: {
    eyebrow: "Examples",
    title: "Some of my specialties",
    intro: "A few examples of what I build, not the full list. Each one is a demo built around a common small-business problem, with simulated or public data: open it to see the problem, the build and the expected result.",
    viewCase: "View case study",
  },
  explorer: {
    foldersNav: "Folders",
    file: "PROJECT",
    close: "Close",
    folders: { automation: "Automation", "internal-systems": "Internal systems", data: "Data & analysis", experiments: "Experiments" },
  },

  services: {
    eyebrow: "Services",
    title: "How I can help",
    items: [
      { title: "Process automation", tools: "Google Sheets · Apps Script · n8n · Make", body: "Connect the tools you already use and stop copy-pasting. Orders, forms, stock and emails that update themselves." },
      { title: "AI integration", tools: "Claude & OpenAI APIs · n8n · Apps Script", body: "AI inside the workflows you already have: classify requests, summarize text, draft replies. Low-confidence results go to a person to check." },
      { title: "Data extraction & cleanup", tools: "Python · SQL · Power Query", body: "CSV, Excel, PDF and web data turned into clean, usable tables." },
      { title: "Dashboards & reporting", tools: "Power BI · Google Sheets · Looker Studio", body: "Clear reports that show what the automation saves and where the money goes." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk?",
    body: "Tell me what you still do by hand. Send me an email.",
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
    hire: "Email me",
    screenshots: "Screens",
    comingSoon: "coming soon",
    nextProject: "Next project",
    shotsNote: "Screens and videos are mock-ups of the deliverable with fictitious or simulated data.",
    basis: { estimated: "Estimated", simulated: "Simulated", setting: "Design rule", public: "Public data" },
  },
  theme: { dark: "Dark theme", light: "Light theme", group: "Color theme" },
};

const pt: Dictionary = {
  meta: {
    title: "Automação de Processos e Integração de IA | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres conecta as ferramentas que pequenas empresas e lojas online já usam, automatiza o trabalho manual e adiciona IA onde ela realmente economiza tempo. Google Sheets, Apps Script, n8n, Make e a API da Claude, além de dashboards claros.",
  },
  nav: { projects: "Exemplos", services: "Serviços", contact: "Contato", hire: "Contratar", skip: "Pular para o conteúdo", language: "Idioma" },
  role: "Automação de Processos e Integração de IA",
  kinds: { integration: "Integração", automation: "Automação", ai: "Integração de IA", extraction: "Extração de dados", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Meu portfólio",
    intro:
      "Conecto as ferramentas que sua empresa já usa, automatizo o trabalho manual e adiciono IA onde ela realmente economiza tempo. E dashboards claros para ver os resultados.",
    cta: "Fale comigo por e-mail",
    seeProjects: "Ver exemplos",
    steps: ["Conectar", "Automatizar", "Ver resultados"],
  },
  projects: {
    eyebrow: "Exemplos",
    title: "Algumas das minhas especialidades",
    intro: "Alguns exemplos do que eu construo, não a lista completa. Cada um é uma demonstração montada em torno de um problema comum de pequenas empresas, com dados simulados ou públicos: abra para ver o problema, a solução e o resultado esperado.",
    viewCase: "Ver estudo de caso",
  },
  explorer: {
    foldersNav: "Pastas",
    file: "PROJETO",
    close: "Fechar",
    folders: { automation: "Automação", "internal-systems": "Sistemas internos", data: "Dados e análise", experiments: "Experimentos" },
  },

  services: {
    eyebrow: "Serviços",
    title: "Como posso ajudar",
    items: [
      { title: "Automação de processos", tools: "Google Sheets · Apps Script · n8n · Make", body: "Conecte as ferramentas que você já usa e pare de copiar e colar. Pedidos, formulários, estoque e e-mails que se atualizam sozinhos." },
      { title: "Integração de IA", tools: "APIs da Claude e da OpenAI · n8n · Apps Script", body: "IA dentro dos fluxos que você já tem: classificar pedidos, resumir textos, rascunhar respostas. Resultados de baixa confiança vão para uma pessoa conferir." },
      { title: "Extração e limpeza de dados", tools: "Python · SQL · Power Query", body: "Dados de CSV, Excel, PDF e da web viram tabelas limpas e prontas para usar." },
      { title: "Dashboards e relatórios", tools: "Power BI · Google Sheets · Looker Studio", body: "Relatórios claros que mostram o que a automação economiza e para onde vai o dinheiro." },
    ],
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar?",
    body: "Me conte o que você ainda faz à mão. Mande um e-mail.",
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
    hire: "Fale comigo por e-mail",
    screenshots: "Telas",
    comingSoon: "em breve",
    nextProject: "Próximo projeto",
    shotsNote: "Telas e vídeos são simulações da entrega com dados fictícios ou simulados.",
    basis: { estimated: "Estimado", simulated: "Simulado", setting: "Regra do projeto", public: "Dado público" },
  },
  theme: { dark: "Tema escuro", light: "Tema claro", group: "Tema de cores" },
};

const es: Dictionary = {
  meta: {
    title: "Automatización de Procesos e Integración de IA | Google Sheets, n8n, Apps Script",
    description:
      "Icaro Torres conecta las herramientas que ya usan las pequeñas empresas y tiendas online, automatiza el trabajo manual y añade IA donde de verdad ahorra tiempo. Google Sheets, Apps Script, n8n, Make y la API de Claude, además de dashboards claros.",
  },
  nav: { projects: "Ejemplos", services: "Servicios", contact: "Contacto", hire: "Contratar", skip: "Saltar al contenido", language: "Idioma" },
  role: "Automatización de Procesos e Integración de IA",
  kinds: { integration: "Integración", automation: "Automatización", ai: "Integración de IA", extraction: "Extracción de datos", dashboard: "Dashboard" },
  hero: {
    eyebrow: "Icaro Torres",
    title: "Mi portafolio",
    intro:
      "Conecto las herramientas que tu empresa ya usa, automatizo el trabajo manual y añado IA donde de verdad ahorra tiempo. Y dashboards claros para ver los resultados.",
    cta: "Escríbeme por correo",
    seeProjects: "Ver ejemplos",
    steps: ["Conectar", "Automatizar", "Ver resultados"],
  },
  projects: {
    eyebrow: "Ejemplos",
    title: "Algunas de mis especialidades",
    intro: "Algunos ejemplos de lo que construyo, no la lista completa. Cada uno es una demostración construida sobre un problema común de pequeñas empresas, con datos simulados o públicos: ábrelo para ver el problema, la solución y el resultado esperado.",
    viewCase: "Ver caso de estudio",
  },
  explorer: {
    foldersNav: "Carpetas",
    file: "PROYECTO",
    close: "Cerrar",
    folders: { automation: "Automatización", "internal-systems": "Sistemas internos", data: "Datos y análisis", experiments: "Experimentos" },
  },

  services: {
    eyebrow: "Servicios",
    title: "Cómo puedo ayudar",
    items: [
      { title: "Automatización de procesos", tools: "Google Sheets · Apps Script · n8n · Make", body: "Conecta las herramientas que ya usas y deja de copiar y pegar. Pedidos, formularios, stock y correos que se actualizan solos." },
      { title: "Integración de IA", tools: "APIs de Claude y OpenAI · n8n · Apps Script", body: "IA dentro de los flujos que ya tienes: clasificar solicitudes, resumir textos, redactar respuestas. Los resultados de baja confianza pasan a una persona para revisarlos." },
      { title: "Extracción y limpieza de datos", tools: "Python · SQL · Power Query", body: "Datos de CSV, Excel, PDF y la web convertidos en tablas limpias y listas para usar." },
      { title: "Dashboards e informes", tools: "Power BI · Google Sheets · Looker Studio", body: "Informes claros que muestran lo que ahorra la automatización y adónde va el dinero." },
    ],
  },
  contact: {
    eyebrow: "Contacto",
    title: "¿Hablamos?",
    body: "Cuéntame qué sigues haciendo a mano. Envíame un correo.",
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
    hire: "Escríbeme por correo",
    screenshots: "Pantallas",
    comingSoon: "próximamente",
    nextProject: "Siguiente proyecto",
    shotsNote: "Las pantallas y videos son simulaciones de la entrega con datos ficticios o simulados.",
    basis: { estimated: "Estimado", simulated: "Simulado", setting: "Regla de diseño", public: "Dato público" },
  },
  theme: { dark: "Tema oscuro", light: "Tema claro", group: "Tema de color" },
};

const dictionaries: Record<Locale, Dictionary> = { en, pt, es };

export const getDictionary = (locale: Locale) => dictionaries[locale];
