import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, BarChart3, Check, Database, Download, GitBranch, Moon, Search, ShieldCheck, Sun } from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { trackRoute } from './analytics';
import { blogPostsFromMarkdown, projectsFromMarkdown } from './content-loader';

// ============================================================================
// TYPE DEFINITIONS & ENTITY SCHEMA DECLARATIONS
// ============================================================================

type Project = {
  id: string;
  title: string;
  type: string;
  categories: string[];
  image?: string;
  tags: string[];
  summary: string;
  impact: string;
  date: string;
  featured?: boolean;
  why: string;
  approach: string;
  tradeoffs: string;
  result: string;
};

type BlogPost = {
  id: string;
  status: 'Published' | 'Coming soon';
  category: string;
  date: string;
  title: string;
  excerpt: string;
  body: string[];
};

// ============================================================================
// SYSTEM DATA LAYERS & LEGACY FALLBACK ENGINES
// ============================================================================

const legacyProjects: Project[] = [
  { id: 'atlikon', title: 'End-to-End FMCG Data Engineering', type: 'Data engineering', categories: ['data'], image: 'assets/projects/atlikon.png', tags: ['Databricks', 'PySpark', 'AWS S3', 'Delta Lake'], summary: 'A reliable lakehouse for two FMCG companies with fragmented schemas, historical backfill and daily incremental loads.', impact: '50K+ records unified', date: '2026', featured: true, why: 'Atlikon and Sportbar were reporting from different schemas and spreadsheet workflows after an acquisition. The goal was one trustworthy analytics layer without losing historical context.', approach: 'Ingest raw CSV data from S3 into a Databricks medallion architecture, apply validation and deduplication, then use Delta Lake merge logic for incremental updates. A star schema makes the final layer usable for BI.', tradeoffs: 'The design favours clear, testable layers over one clever transformation. That adds a little structure up front, but makes lineage, backfills and future source changes easier to reason about.', result: 'The pipeline creates a single source of truth ready for leadership dashboards and self-serve analysis.' },
  { id: 'foregith', title: 'Forggith Pharmaceuticals Sales Dashboard', type: 'Analytics', categories: ['analytics'], image: 'assets/projects/foregith-pharma.png', tags: ['Power BI', 'Forecasting', 'KPI design'], summary: 'A sales intelligence view for tracking revenue across channels, product classes and time.', impact: '32% efficiency gain', date: '2024', featured: true, why: 'Sales and operations teams needed a fast way to see what was changing, where revenue was coming from, and which segments needed attention.', approach: 'Shape the data around the decisions first, then build a focused KPI layer with drill-downs for channel, product class and period. Forecasting adds a forward-looking view instead of only reporting yesterday.', tradeoffs: 'A smaller set of decision-ready measures is more useful than a dashboard that tries to answer every possible question. Detail remains available through drill-down rather than competing with the headline view.', result: 'A governed, self-serve view that supports faster commercial conversations and more consistent reporting.' },
  { id: 'coronavirus', title: 'Coronavirus Dashboard', type: 'Analytics', categories: ['analytics'], image: 'assets/projects/coronavirus-dashboard.png', tags: ['R', 'Visualization', 'Statistics'], summary: 'Interactive visualizations that turn public pandemic data into clearer signals for everyday decisions.', impact: 'Interactive public analysis', date: '2021', featured: true, why: 'The pandemic produced a large stream of public data, but raw counts were difficult to interpret without context and visual comparison.', approach: 'Clean and structure the data, then use statistical summaries and interactive views to surface patterns across time and geography.', tradeoffs: 'The project prioritises clarity and accessibility over an encyclopedic dashboard. Fewer, stronger visual stories make the output easier to use.', result: 'A practical visual analysis that helps people explore change rather than stare at isolated numbers.' },
  { id: 'woolies', title: 'Inventory Data Lakehouse', type: 'Data engineering', categories: ['data'], image: 'assets/projects/inventory.png', tags: ['BigQuery', 'Power BI', 'Dimensional modelling'], summary: 'A unified inventory layer supporting distribution analytics across 20+ categories.', impact: '5M+ records processed', date: '2023', why: 'Regional inventory data needed a shared model that could support reliable reporting and demand analysis.', approach: 'Build BigQuery ETL pipelines, dimensional models and scheduled refreshes, then expose governed metrics through Power BI.', tradeoffs: 'A dimensional model takes more planning than querying source tables directly, but pays back in consistent definitions and better query performance.', result: 'A self-serve analytics foundation that improved reporting reliability and supported a 15% reduction in stockouts.' },
  { id: 'anz', title: 'ANZ Customer Segmentation', type: 'Analytics', categories: ['analytics'], image: 'assets/projects/anz.png', tags: ['Python', 'Pandas', 'Scikit-learn'], summary: 'A customer behaviour analysis using spending patterns, prediction and clustering.', impact: '4 behaviour groups', date: '2021', why: 'Understanding how customers spend can help financial services teams make more relevant product and service decisions.', approach: 'Explore transaction patterns, model likely behaviours and cluster customers using frequency and amount-based features.', tradeoffs: 'Segmentation is useful as a lens, not a label. The groups are designed to guide questions and testing rather than replace judgement.', result: 'Four behavioural segments with a clearer view of peak days, categories and likely future activity.' },
  { id: 'risk', title: 'SGFleet Financial Risk Dashboard', type: 'Analytics', categories: ['analytics'], tags: ['Power BI', 'RLS', 'Financial services'], summary: 'A governed view of lease performance and pricing KPIs across a vehicle leasing portfolio.', impact: 'Self-serve KPI access', date: '2025', why: 'Operations teams needed portfolio visibility without exposing every audience to every record.', approach: 'Translate stakeholder questions into a governed Power BI model with role-level access and pricing-focused KPI views.', tradeoffs: 'Governance is treated as part of the product, not a final permission step. This makes access safer and keeps definitions consistent.', result: 'A shared decision tool for ad-hoc analysis across finance, sales and operations.' },
  { id: 'smart-home', title: 'Smart Home', type: 'Software & IoT', categories: ['software'], image: 'assets/projects/smart-home.png', tags: ['Android', 'IoT', 'Firebase'], summary: 'An Android and IoT project exploring how connected devices can make everyday actions simpler.', impact: 'End-to-end prototype', date: '2020', why: 'The project explores the bridge between a physical environment and a software interface.', approach: 'Combine an Android interface with connected device logic and Firebase-backed state.', tradeoffs: 'A small, understandable system is more valuable for a prototype than a broad feature list that is difficult to test.', result: 'A hands-on experiment in product thinking, device interaction and software structure.' },
  { id: 'flower-trade', title: 'Flower Trade', type: 'Software', categories: ['software'], image: 'assets/projects/flower-trade.png', tags: ['HTML', 'CSS', 'JavaScript'], summary: 'A website development project focused on presenting a catalogue and trade workflow clearly.', impact: 'Responsive web build', date: '2020', why: 'A catalogue-led business needs a clear path from browsing to action.', approach: 'Structure the interface around product discovery, readable information and responsive layouts.', tradeoffs: 'The visual system stays simple so content remains the hero and the site is easy to maintain.', result: 'A complete front-end site demonstrating practical web development and interface structure.' },
  { id: 'time-series', title: 'Time Series Forecasting', type: 'Data science', categories: ['data', 'analytics'], image: 'assets/projects/time-series.png', tags: ['Python', 'Modelling', 'Visualization'], summary: 'A practical forecasting project exploring patterns over time and model evaluation.', impact: 'Model-led analysis', date: '2020', why: 'Forecasts are only useful when their assumptions and limitations are visible.', approach: 'Explore time-based patterns, build candidate models and evaluate them against held-out observations.', tradeoffs: 'Interpretability and evaluation discipline matter as much as model complexity.', result: 'A structured approach to turning historical patterns into useful planning signals.' },
  { id: 'data-science-a1', title: 'Practical Data Science A1', type: 'Data science', categories: ['data'], image: 'assets/projects/data-science-a1.png', tags: ['Python', 'Statistics', 'EDA'], summary: 'Exploratory analysis and modelling exercises that build a strong data science foundation.', impact: 'Foundational analysis', date: '2020', why: 'Good analysis starts with understanding the shape, quality and meaning of the data.', approach: 'Combine exploratory analysis, statistical reasoning and visual communication.', tradeoffs: 'The work favours explainable steps that can be checked and repeated.', result: 'A set of practical foundations for later modelling and production analytics.' },
  { id: 'data-science-a2', title: 'Practical Data Science A2', type: 'Data science', categories: ['data'], image: 'assets/projects/data-science-a2.png', tags: ['Python', 'Modelling', 'Evaluation'], summary: 'A second practical study in analysis, visualization and model evaluation.', impact: 'Applied modelling', date: '2020', why: 'A model should earn trust by making its evaluation and limitations clear.', approach: 'Prepare the data, compare approaches and communicate what the results mean in context.', tradeoffs: 'A transparent model with clear evaluation is preferable to unexplained complexity.', result: 'An applied project connecting statistical thinking with real-world interpretation.' },
  { id: 'advanced-java', title: 'Advanced Java', type: 'Software', categories: ['software'], image: 'assets/projects/advanced-java.png', tags: ['Java', 'OOP', 'Applications'], summary: 'An application-focused project exploring Java structure, logic and reusable components.', impact: 'Object-oriented build', date: '2019', why: 'Software quality depends on making behaviour understandable and changeable.', approach: 'Use object-oriented structure and reusable components to separate concerns.', tradeoffs: 'Good structure adds a little ceremony but keeps future changes safer.', result: 'A practical demonstration of Java application development fundamentals.' },
  { id: 'ancient-games', title: 'Ancient Games', type: 'Software & mobile', categories: ['software'], image: 'assets/projects/ancient-games.jpg', tags: ['Android', 'Firebase', 'Mobile'], summary: 'A mobile project bringing classic games into an accessible digital experience.', impact: 'Mobile experience', date: '2019', why: 'Small games are a useful way to practise interaction design, state and feedback.', approach: 'Build a mobile interface around clear game states and a simple, responsive experience.', tradeoffs: 'Keep the interaction focused so the experience feels immediate on a small screen.', result: 'A mobile prototype combining interface design and application logic.' }
];

const projects: Project[] = projectsFromMarkdown.length ? projectsFromMarkdown : legacyProjects;

const experience = [
  { date: '2024 — now', role: 'Data Analyst / Engineer', company: 'SGFleet · Financial services', copy: 'Governed Databricks lakehouse, data-quality frameworks and self-serve Power BI for pricing and operations.', metric: '98%', label: 'reconciliation accuracy' },
  { date: '2022 — 2024', role: 'Data Analyst / Engineer', company: 'WooliesX · Retail operations', copy: 'BigQuery ETL, dimensional models and forecasting tools for regional inventory and distribution teams.', metric: '15%', label: 'stockout reduction' },
  { date: '2021 — 2022', role: 'Data Analyst / Engineer', company: 'Ford Motor Company', copy: 'Spark pipelines, warranty dashboards and automated quality checks across high-volume manufacturing telemetry.', metric: '10M+', label: 'telemetry records' },
  { date: '2021', role: 'Data Analyst / Engineer', company: 'Cureya', copy: 'SQL and Python ETL from SAP sources, SSRS reporting and behavioural segmentation for campaign insight.', metric: '18%', label: 'conversion lift' },
];

const thinking = [
  { id: 'context', title: 'Context before code.', copy: 'Before I touch a pipeline or dashboard, I map the people, systems, decisions, and constraints around it. A data product only works when it fits the real work.', tag: 'Understand the system' },
  { id: 'question', title: 'Find the decision underneath.', copy: '“Build a dashboard” is rarely the real brief. I work backwards from the decision someone needs to make, then keep every metric connected to that moment.', tag: 'Name the real question' },
  { id: 'approach', title: 'Choose the smallest useful system.', copy: 'I favour clear layers, explicit definitions and tools the team can actually operate. The right architecture earns its complexity by making change safer.', tag: 'Design for adoption' },
  { id: 'tradeoffs', title: 'Make the trade-offs visible.', copy: 'Speed, accuracy, governance and flexibility pull in different directions. I surface those choices early so the solution is intentional rather than accidental.', tag: 'Explain the why' },
  { id: 'result', title: 'Leave a better system.', copy: 'A successful delivery is more than a working output. It should improve trust, reduce manual glue and give the next person a clearer place to start.', tag: 'Create momentum' },
];

const legacyBlogPosts: BlogPost[] = [
  {
    id: 'single-source-of-truth',
    status: 'Published',
    category: 'Data engineering',
    date: 'September 2026',
    title: 'The hardest part of a single source of truth is the sentence after the number.',
    excerpt: 'A data platform becomes useful when people can explain where a number came from, what it means, and what to do next.',
    body: [
      'A “single source of truth” sounds like an architecture problem. In practice, the difficult part is rarely moving records from one system to another. It is getting a group of people to agree on the sentence that should follow the number.',
      'At SGFleet, the same contract data could be reconciled by different teams in different ways. The result was not just duplicated logic. It was a loss of confidence: every report arrived with a quiet question attached — which version should we believe?',
      'The useful work happened in the space between the pipeline and the dashboard. Definitions had to be explicit. Ownership had to be visible. Lineage had to be something a person could follow without booking a meeting. A governed lakehouse helped, but only because it made those decisions easier to see and repeat.',
      'That is the part of data work I keep coming back to: trust is not a decorative layer added after delivery. It is a product feature. If the person downstream can understand the shape of the data and the limits of the metric, they can make a better decision with it.',
      'The best data platform is not the one with the most layers. It is the one that makes the next good question easier to ask — and easier to answer together.',
    ],
  },
  {
    id: 'dashboards-next-question',
    status: 'Coming soon',
    category: 'Analytics',
    date: 'Drafting now',
    title: 'Dashboards that answer the next question.',
    excerpt: 'A good KPI view should feel like a conversation, not a wall of charts.',
    body: [],
  },
  {
    id: 'first-platform-migration',
    status: 'Coming soon',
    category: 'Career',
    date: 'Drafting now',
    title: 'What I wish I knew before my first data platform migration.',
    excerpt: 'Notes on ambiguity, governance, and learning to design for the people downstream.',
    body: [],
  },
];

const blogPosts: BlogPost[] = blogPostsFromMarkdown.length ? blogPostsFromMarkdown : legacyBlogPosts;

type SignalId = 'pipeline' | 'decision' | 'quality';

const signalViews: { id: SignalId; label: string; title: string; copy: string; metric: string; metricLabel: string }[] = [
  { id: 'pipeline', label: 'Signal', title: 'Raw → ready', copy: 'A clear path from messy sources to a model your team can trust.', metric: '5M+', metricLabel: 'records shaped' },
  { id: 'decision', label: 'Decision', title: 'Numbers → next move', copy: 'The right measure is the one that helps someone decide what to do next.', metric: '32%', metricLabel: 'efficiency gain' },
  { id: 'quality', label: 'Quality', title: 'Quality → confidence', copy: 'Checks, ownership and lineage make accuracy visible instead of assumed.', metric: '95%', metricLabel: 'pipeline health' },
];

const achievements = [
  { metric: '$200M+', label: 'warranty cost savings', detail: 'Indirect savings impact surfaced through warranty analytics and quality signals.' },
  { metric: '100%', label: 'user adoption', detail: 'Decision tools designed around the people who use them.' },
  { metric: '98%', label: 'report accuracy', detail: 'Reconciliation and reporting made visible and dependable.' },
  { metric: '15%', label: 'stockout reduction', detail: 'Inventory insight translated into a measurable operational outcome.' },
  { metric: '32%', label: 'efficiency gain', detail: 'Time and manual effort reduced through clearer KPI workflows.' },
];

const skillRows = [
  { label: '01 / Languages', direction: 'forward', items: [{ mark: 'SQL', name: 'SQL' }, { mark: 'Py', name: 'Python' }, { mark: 'J', name: 'Java' }] },
  { label: '02 / Visualisation', direction: 'reverse', items: [{ mark: 'PBI', name: 'Power BI' }, { mark: 'Tb', name: 'Tableau' }, { mark: 'G', name: 'Google' }] },
  { label: '03 / Cloud + data', direction: 'forward', items: [{ mark: 'Az', name: 'Azure' }, { mark: 'DB', name: 'Databricks' }, { mark: 'SF', name: 'Snowflake' }, { mark: 'dbt', name: 'dbt' }] },
  { label: '04 / Ways of working', direction: 'reverse', items: [{ mark: '↔', name: 'Stakeholder engagement' }, { mark: '◒', name: 'Data visualisation' }, { mark: '✓', name: 'Quality governance' }, { mark: '→', name: 'Data storytelling' }] },
];

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    document.querySelectorAll('meta[property="og:title"]').forEach((node) => node.setAttribute('content', title));
    document.querySelectorAll('meta[property="og:description"]').forEach((node) => node.setAttribute('content', description));
  }, [description, title]);
}

function AnimatedNumber({ value }: { value: string }) {
  const match = value.match(/^([^0-9]*)([\d,.]+)(.*)$/);
  const prefix = match?.[1] ?? '';
  const numberText = match?.[2] ?? '0';
  const suffix = match?.[3] ?? '';
  const target = Number(numberText.replace(/,/g, '')) || 0;
  const decimals = numberText.includes('.') ? numberText.split('.')[1].length : 0;
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setStarted(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setCurrent(target);
      return undefined;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, target]);

  const formatted = current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} aria-label={value}>{prefix}{formatted}{suffix}</span>;
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>{children}</div>;
}

function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useHashLocation(); 
  const [dark, setDark] = useState(() => typeof window === 'undefined' ? true : localStorage.getItem('shonil-theme') !== 'light');
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    trackRoute(location);
  }, [location]);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('shonil-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const isProjects = location.startsWith('/projects');

  return (
    <div className="min-h-[100dvh]">
      <div className="ambient-stars" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <span key={index} />)}</div>
      <div className="ambient-binary" aria-hidden="true"><span>01001011 01100101 01100101 01110000</span><span>01100011 01101100 01100101 01100001 01110010</span><span>01010011 01101001 01100111 01101110 01100001 01101100</span></div>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header" id="top">
        <nav className="nav shell" aria-label="Primary navigation">
          {/* Fixed: Standardized to explicit hash anchors for robust navigation matching */}
          <a href="#/" className="brand" data-testid="link-home">
            <span className="brand-mark">SD</span><span>Shonil<span className="brand-dot">.</span></span>
          </a>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen((open) => !open)} data-testid="button-menu">
            {menuOpen ? <span aria-hidden="true">×</span> : <><span /><span /><span /></>}
          </button>
          <div className={`nav-menu ${menuOpen ? 'open' : ''}`} id="site-menu">
            <a href="#/" className={`nav-link ${location === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-nav-home">Home</a>
            <a href="#/projects" className={`nav-link ${isProjects ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-nav-projects">Projects</a>
            <a href="#/experience" className={`nav-link ${location === '/experience' ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-nav-experience">Experience</a>
            <a href="#/thinking" className={`nav-link ${location === '/thinking' ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-nav-thinking">How I think</a>
            <a href="#/notes" className={`nav-link ${location === '/notes' ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid="link-nav-notes">Notes</a>
            <a href="#/#contact" className="nav-link nav-cta" onClick={() => setMenuOpen(false)} data-testid="link-nav-contact">Contact <span aria-hidden="true">↗</span></a>
            <button className="theme-toggle" type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)} data-testid="button-theme">
              <span className="theme-symbol" aria-hidden="true">{dark ? <Moon size={15} /> : <Sun size={15} />}</span><span>{dark ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </nav>
      </header>
      {children}
      <footer className="footer shell">
        <span data-testid="text-footer-copyright">© {new Date().getFullYear()} Shonil Dabreo</span>
        <span>Systems, signals, useful things.</span>
        <a href="#top" data-testid="link-back-top">Back to top ↑</a>
      </footer>
    </div>
  );
}


function ProjectCard({ project }: { project: Project }) {
  return (
    // Fixed: Swapped to an explicit hash route layout to unlock card clicks smoothly
    <a href={`#/projects/${project.id}`} className="project-card" data-testid={`card-project-${project.id}`}>
      <ProjectMedia project={project} />
      <div className="project-body">
        <span className="project-type">{project.date} · {project.tags.slice(0, 2).join(' · ')}</span>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <div className="card-footer"><span className="impact">{project.impact}</span><span className="card-arrow" aria-hidden="true">↗</span></div>
      </div>
    </a>
  );
}

function ProjectMedia({ project, detail = false }: { project: Project; detail?: boolean }) {
  if (project.image) {
    // Dynamic Fix: Prepend the absolute base path so it resolves from the root directory on every subpage
    const base = import.meta.env.BASE_URL;
    const fullImagePath = `${base}${project.image}`;

    const image = <img src={fullImagePath} alt={`${project.title} preview`} loading={detail ? 'eager' : 'lazy'} />;
    return <div className={`project-image ${detail ? 'project-image-detail' : ''}`}>{detail ? <a className="project-image-link" href={fullImagePath} target="_blank" rel="noreferrer" title="Open image at full size">{image}</a> : image}<span className="project-badge">{project.type}</span></div>;
  }
  return <div className={`project-image project-image-signal ${detail ? 'project-image-detail' : ''}`}><div className="risk-visual"><div className="risk-visual-top"><span>PORTFOLIO RISK</span><strong><AnimatedNumber value="72.4" /></strong><small>STABLE</small></div><div className="risk-visual-chart"><i /><i /><i /><i /><i /><i /><i /></div><div className="risk-visual-axis"><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div></div><span className="project-badge">{project.type}</span></div>;
}


function SignalExplorer() {
  const [active, setActive] = useState<SignalId>('pipeline');
  const view = signalViews.find((item) => item.id === active) ?? signalViews[0];
  return (
    <div className="signal-explorer" aria-label="Interactive work explorer">
      <div className="signal-window-bar"><div className="window-controls" aria-hidden="true"><i /><i /><i /></div><span className="signal-window-title">shonil / workbench</span><span className="signal-live"><span /> live view</span></div>
      <div className="signal-workspace">
        <div className="signal-tree" role="tablist" aria-label="Select a work lens">
          <p className="tree-label">WORK LENSES</p>
          {signalViews.map((item, index) => <button key={item.id} type="button" className={`tree-item ${active === item.id ? 'active' : ''}`} role="tab" aria-selected={active === item.id} onClick={() => setActive(item.id)} data-testid={`button-signal-${item.id}`}><span className="tree-index">0{index + 1}</span><span>{item.label}</span><ArrowUpRight size={14} /></button>)}
          <div className="tree-foot"><span className="tree-dot" /> built for the people downstream</div>
        </div>
        <div className="signal-stage" key={active}>
          <div className="stage-heading"><span className="stage-kicker">{view.label}</span><span className="stage-status">● connected</span></div>
          <div className={`signal-graphic graphic-${active}`} aria-hidden="true">
            {active === 'pipeline' && <><div className="flow-node flow-source"><Database size={16} /><span>source</span></div><span className="flow-arrow">→</span><div className="flow-node flow-layer"><GitBranch size={16} /><span>shape</span></div><span className="flow-arrow">→</span><div className="flow-node flow-ready"><ShieldCheck size={16} /><span>ready</span></div></>}
             {active === 'decision' && <><div className="decision-kpi"><span>REVENUE SIGNAL</span><strong><AnimatedNumber value="+32%" /></strong><small>efficiency</small></div><div className="decision-chart"><i /><i /><i /><i /><i /><i /><i /><i /></div><BarChart3 className="decision-chart-icon" size={22} /></>}
             {active === 'quality' && <><div className="quality-ring"><strong><AnimatedNumber value="95" /></strong><span>health</span></div><div className="quality-list"><span><i /> schema mapped</span><span><i /> nulls checked</span><span><i /> lineage tracked</span></div></>}
          </div>
           <div className="stage-copy"><h3>{view.title}</h3><p>{view.copy}</p><div className="stage-metric"><strong><AnimatedNumber value={view.metric} /></strong><span>{view.metricLabel}</span></div></div>
        </div>
      </div>
    </div>
  );
}

function ContactBanner() {
  return (
    <section className="contact-banner shell" id="contact">
      <div><p className="eyebrow">A clear next step</p><h2>Have a data question?<br /><em>Let’s make it useful.</em></h2></div>
      <div className="contact-actions">
        <a className="button button-light" href="mailto:dabreoshonil@gmail.com" data-testid="link-contact-email">Start a conversation <ArrowUpRight size={15} /></a>
        <div className="social-row"><a href="https://github.com/shonil24" target="_blank" rel="noreferrer" data-testid="link-github">GitHub</a><a href="https://www.linkedin.com/in/shonil24/" target="_blank" rel="noreferrer" data-testid="link-linkedin">LinkedIn</a></div>
      </div>
    </section>
  );
}

function Achievements() {
  const [feature, ...supporting] = achievements;
  return (
    <section className="section-pad shell achievements" aria-labelledby="achievements-title">
      <div className="section-heading"><div><p className="eyebrow">Selected impact</p><h2 id="achievements-title">The numbers<br /><em>worth remembering.</em></h2></div><p className="section-intro">A few outcomes from making data more dependable, more adopted, and easier to act on.</p></div>
      <div className="achievements-layout">
        <article className="achievement-feature"><span className="achievement-label">Top outcome</span><strong><AnimatedNumber value={feature.metric} /></strong><h3>{feature.label}</h3><p>{feature.detail}</p></article>
        <div className="achievement-list">{supporting.map((item) => <article className="achievement-item" key={item.label}><strong><AnimatedNumber value={item.metric} /></strong><div><h3>{item.label}</h3><p>{item.detail}</p></div></article>)}</div>
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className="section-pad skills-section" aria-labelledby="skills-title">
      <div className="shell">
        <div className="section-heading"><div><p className="eyebrow">Tech stack + skills</p><h2 id="skills-title">Tools for the<br /><em>work behind the work.</em></h2></div><p className="section-intro">A practical stack across data platforms, visualisation and the human work that makes adoption stick.</p></div>
        <div className="skills-rows">
          {skillRows.map((row) => <div className="skill-row" key={row.label}><div className="skill-row-label">{row.label}</div><div className="skill-track-viewport"><div className={`skill-track ${row.direction}`} aria-hidden="true">{[...row.items, ...row.items].map((skill, index) => <span className="skill-chip" key={`${row.label}-${skill.name}-${index}`}><span className="skill-mark">{skill.mark}</span>{skill.name}</span>)}</div></div></div>)}
        </div>
      </div>
    </section>
  );
}

function Home() {
  usePageMeta('Shonil Dabreo — Data Engineer & Analyst', 'Portfolio of Shonil Dabreo, a data engineer and analyst in Melbourne building dependable pipelines, governed analytics and clear decision tools.');
  const [activeThinking, setActiveThinking] = useState('context');
  const selectedThinking = thinking.find((item) => item.id === activeThinking) ?? thinking[0];
  return (
    <main id="main">
      <section className="hero shell section-pad">
        <Reveal><div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Data engineer / analyst · Melbourne, AU</p>
          <h1>I turn raw data into<br /><em>trusted decisions.</em></h1>
          <p className="hero-lede">Dependable pipelines, governed analytics, and clear decision tools for teams that need to move with confidence.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#/projects" data-testid="link-hero-projects">Explore the work <ArrowUpRight size={15} /></a>
            <a className="button button-quiet" href="/assets/Shonil-Dabreo-Resume.pdf" target="_blank" rel="noreferrer" data-testid="link-hero-resume">View resume <Download size={14} /></a>
          </div>
          <div className="hero-proof"><span>Currently building at <strong>SGFleet</strong></span><span className="proof-separator">·</span><span>Open to relocation</span></div>
        </div></Reveal>
        <Reveal className="reveal-delay-1"><SignalExplorer /></Reveal>
      </section>
      <section className="impact-strip shell" aria-label="Career highlights">
         {[['5+', 'years in data'], ['50K+', 'SAP contracts unified'], ['10M+', 'telemetry records processed'], ['32%', 'operational efficiency gain']].map(([stat, label]) => <div className="impact-item" key={stat}><strong><AnimatedNumber value={stat} /></strong><span data-testid={`text-impact-${stat}`}>{label}</span></div>)}
      </section>
       <Achievements />
       <TechStack />
      <section className="section-pad shell" id="work">
        <Reveal><div className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Proof, not just promises.</h2></div><a className="text-link" href="#/projects" data-testid="link-view-all-projects">View all projects <ArrowUpRight size={14} /></a></div></Reveal>
        <div className="featured-grid">{projects.filter((project) => project.featured).map((project, index) => <Reveal key={project.id} className={`reveal-delay-${Math.min(index, 2)}`}><ProjectCard project={project} /></Reveal>)}</div>
      </section>
      <section className="section-pad shell" id="thinking">
        <Reveal><div className="section-heading"><div><p className="eyebrow">The way I work</p><h2>Curiosity, made practical.</h2></div><p className="section-intro">The best solution is not the most complicated one. It is the one that makes the next good decision easier.</p></div></Reveal>
        <div className="thinking-layout">
          <div className="thinking-tabs" role="tablist" aria-label="How Shonil approaches work">{thinking.map((item, index) => <button key={item.id} className={`thinking-tab ${activeThinking === item.id ? 'active' : ''}`} role="tab" aria-selected={activeThinking === item.id} onClick={() => setActiveThinking(item.id)} data-testid={`button-thinking-${item.id}`}><span>0{index + 1}</span>{item.id === 'context' ? 'Start with context' : item.id === 'question' ? 'Ask the real question' : item.id === 'approach' ? 'Choose the approach' : item.id === 'tradeoffs' ? 'Make trade-offs visible' : 'Leave a better system'}</button>)}</div>
           <Reveal className="reveal-delay-1"><article className="thinking-panel" id="thinking-panel" role="tabpanel"><p className="panel-kicker">Working method</p><h3>{selectedThinking.title}</h3><p>{selectedThinking.copy}</p><div className="panel-footer"><span>{selectedThinking.tag}</span><ArrowUpRight size={19} className="panel-arrow" /></div></article></Reveal>
        </div>
      </section>
      <section className="section-pad shell" id="experience">
        <Reveal><div className="section-heading"><div><p className="eyebrow">Experience</p><h2>Building trust, layer by layer.</h2></div><p className="section-intro">A timeline of turning operational questions into scalable data products.</p></div></Reveal>
        <div className="timeline">{experience.map((item, index) => <Reveal key={item.company} className={`reveal-delay-${Math.min(index, 2)}`}><article className="timeline-item"><div className="timeline-date">{item.date}</div><div><div className="timeline-role">{item.role}</div><div className="timeline-company">{item.company}</div><p className="timeline-copy">{item.copy}</p></div><div className="timeline-metric"><strong><AnimatedNumber value={item.metric} /></strong>{item.label}</div></article></Reveal>)}</div>
      </section>
      <section className="section-pad notes-section" id="notes">
        <Reveal><div className="section-heading"><div><p className="eyebrow">Field notes</p><h2>Things I’m thinking through.</h2></div><span className="coming-soon">Writing desk · 2026</span></div></Reveal>
        <div className="notes-grid">
          <Reveal><article className="note-card note-feature"><span className="note-number">01</span><p className="note-type">Data engineering · In progress</p><h3>Why "single source of truth" is a people problem first.</h3><p>Consolidating systems is only half the work. The other half is making definitions, ownership, and confidence visible to the people who use the data.</p><a href="#/notes" className="text-link" data-testid="link-note-feature">Read the field notes <ArrowUpRight size={14} /></a></article></Reveal>
          <Reveal className="reveal-delay-1"><article className="note-card"><span className="note-number">02</span><p className="note-type">Analytics · Coming soon</p><h3>Dashboards that answer the next question.</h3><p>A good KPI view should feel like a conversation, not a wall of charts.</p><span className="note-read">Drafting now</span></article></Reveal>
          <Reveal className="reveal-delay-2"><article className="note-card"><span className="note-number">03</span><p className="note-type">Career · Coming soon</p><h3>What I wish I knew before my first data platform migration.</h3><p>Notes on ambiguity, governance, and learning to design for the people downstream.</p><span className="note-read">Drafting now</span></article></Reveal>
        </div>
      </section>
      <ContactBanner />
    </main>
  );
}

function Projects() {
  usePageMeta('Projects — Shonil Dabreo', 'Selected data engineering, analytics, software and IoT projects by Shonil Dabreo.');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => ({ all: projects.length, data: projects.filter((p) => p.categories.includes('data')).length, analytics: projects.filter((p) => p.categories.includes('analytics')).length, software: projects.filter((p) => p.categories.includes('software')).length }), []);
  const visible = useMemo(() => projects.filter((project) => (filter === 'all' || project.categories.includes(filter)) && (!query.trim() || `${project.title} ${project.summary} ${project.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))), [filter, query]);
  return <main id="main"><section className="page-intro shell section-pad"><p className="eyebrow">Project archive</p><h1>A closer look at<br /><em>the work.</em></h1><p className="page-lede">A selection of data platforms, dashboards, software and experiments. Open any project to see the problem, approach, trade-offs and outcome.</p></section>
    <section className="shell projects-controls"><div className="filter-group" role="group" aria-label="Filter projects">{(['all', 'data', 'analytics', 'software'] as const).map((item) => <button key={item} className={`filter-button ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} data-testid={`button-filter-${item}`}>{item[0].toUpperCase() + item.slice(1)} <span>{counts[item]}</span></button>)}</div><label className="search-box"><Search size={15} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" aria-label="Search projects" data-testid="input-project-search" /></label></section>
    <section className="shell section-pad projects-grid" aria-live="polite">{visible.length ? visible.map((project) => <Reveal key={project.id}><ProjectCard project={project} /></Reveal>) : <p className="empty-state" data-testid="status-projects-empty">No projects match that search yet. Try a broader phrase.</p>}</section>
  </main>;
}

function ProjectDetail({ id }: { id?: string }) {
  const project = projects.find((item) => item.id === id) ?? projects[0];
  const detailSections = [
    ['why', '01-context.md', 'Why this mattered', project.why],
    ['approach', '02-approach.md', 'Approach', project.approach],
    ['tradeoffs', '03-trade-offs.md', 'Trade-offs and reasoning', project.tradeoffs],
    ['outcome', '04-outcome.md', 'Outcome', project.result],
  ] as const;
  const [activeSection, setActiveSection] = useState<(typeof detailSections)[number][0]>('why');
  usePageMeta(`${project.title} — Shonil Dabreo`, `${project.summary} Read the problem, approach, trade-offs and outcome.`);
  return <main id="main" className="project-detail shell section-pad"><a className="detail-back" href="#/projects" data-testid="link-back-projects"><ArrowLeft size={14} /> Back to project archive</a>
     <header className="detail-header"><div><p className="eyebrow">{project.type} · {project.date}</p><h1>{project.title}</h1><p className="detail-deck">{project.summary}</p><div className="detail-meta">{project.tags.map((tag) => <span className="meta-pill" key={tag}>{tag}</span>)}</div></div><div className="detail-aside"><span className="aside-label">Impact snapshot</span><div className="aside-stat"><strong><AnimatedNumber value={project.impact.split(' ')[0]} /></strong><span>{project.impact.split(' ').slice(1).join(' ')}</span></div></div></header>
    <Reveal><div className="detail-hero-image"><ProjectMedia project={project} detail /></div></Reveal>
      <div className="detail-layout"><div className="detail-content"><h2>From the problem<br />to the useful thing.</h2><div className="detail-explorer" id="project-story"><nav className="detail-tabs" role="tablist" aria-label="Project story files"><div className="detail-folder">📁 {project.id}/</div>{detailSections.map(([key, file, title]) => <button className={`detail-tab ${activeSection === key ? 'active' : ''}`} key={key} type="button" role="tab" aria-selected={activeSection === key} onClick={() => setActiveSection(key)}><span className="detail-file-index">{file.slice(0, 2)}</span><span className="detail-file-name">{file}</span><span className="detail-tab-caption">{title}</span></button>)}</nav><div className="detail-story-panel">{detailSections.map(([key, file, title, copy]) => activeSection === key ? <article className="detail-block detail-block-active" key={key} role="tabpanel"><span className="detail-section-kicker">{file}</span><h3>{title}</h3><p>{copy}</p></article> : null)}</div></div></div><aside className="detail-aside"><span className="aside-label">Tools used</span>{project.tags.map((tag) => <div className="aside-stat" key={tag}><strong>{tag}</strong><span>in the working stack</span></div>)}</aside></div>
  </main>;
}

function Thinking() {
  return <main id="main"><section className="page-intro shell section-pad route-copy"><p className="eyebrow">Working method</p><h1>Curiosity,<br /><em>made practical.</em></h1><p className="lede">The work starts before the work. I use context, a clear question and visible trade-offs to make technical decisions people can trust.</p></section><section className="shell principles section-pad">{thinking.map((item, index) => <Reveal key={item.id}><article className="principle"><span className="principle-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.copy}</p></article></Reveal>)}</section><section className="shell working-agreement section-pad"><Reveal><div className="section-heading"><div><p className="eyebrow">Working together</p><h2>Clear by default,<br /><em>human throughout.</em></h2></div><p className="section-intro">A few gentle defaults I bring to a project. They are invitations, not rules.</p></div></Reveal><div className="agreement-grid"><Reveal><article className="agreement-card do-card"><span className="agreement-label">I try to</span><h3>Make the useful thing obvious.</h3><ul><li>Start with the decision, not the decoration.</li><li>Use language people already understand.</li><li>Show the why, the limits, and the next step.</li></ul></article></Reveal><Reveal className="reveal-delay-1"><article className="agreement-card dont-card"><span className="agreement-label">I try not to</span><h3>Add cleverness where clarity works.</h3><ul><li>Hide uncertainty behind unnecessary precision.</li><li>Build a dashboard before the question is clear.</li><li>Leave the person downstream to figure it out alone.</li></ul></article></Reveal></div></section><ContactBanner /></main>;
}

function Experience() {
  usePageMeta('Experience — Shonil Dabreo', 'A timeline of Shonil Dabreo building dependable data products across financial services, retail and manufacturing.');
  return <main id="main"><section className="page-intro shell section-pad route-copy"><p className="eyebrow">Experience</p><h1>Building trust,<br /><em>layer by layer.</em></h1><p className="lede">From operational questions to scalable data products, each role has sharpened the same practice: make the system clearer for the people downstream.</p></section><section className="shell section-pad"><div className="timeline">{experience.map((item, index) => <Reveal key={item.company} className={`reveal-delay-${Math.min(index, 2)}`}><article className="timeline-item"><div className="timeline-date">{item.date}</div><div><div className="timeline-role">{item.role}</div><div className="timeline-company">{item.company}</div><p className="timeline-copy">{item.copy}</p></div><div className="timeline-metric"><strong>{item.metric}</strong>{item.label}</div></article></Reveal>)}</div></section><Achievements /><ContactBanner /></main>;
}

function Notes() {
  usePageMeta('Field notes — Shonil Dabreo', 'Working notes on data engineering, analytics, governance and building systems for people.');
  const [copied, setCopied] = useState(false);
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <main id="main"><section className="page-intro shell section-pad route-copy"><p className="eyebrow">Field notes · 2026</p><h1>Things I'm<br /><em>thinking through.</em></h1><p className="lede">A writing desk for the questions that sit between data, systems and the people who have to use them.</p></section><section className="shell notes-list section-pad">{blogPosts.map((post, index) => <Reveal key={post.id} className={`reveal-delay-${Math.min(index, 2)}`}><article className={`note-card ${index === 0 ? 'note-feature note-long' : ''}`}><span className="note-number">0{index + 1}</span><p className="note-type">{post.category} · {post.status}{post.status === 'Published' ? ` · ${post.date}` : ''}</p><h3>{post.title}</h3><p>{post.excerpt}</p>{post.status === 'Published' ? <div className="note-actions"><a href={`#/notes/${post.id}`} className="text-link" data-testid={`link-note-${post.id}`}>Read the post <ArrowUpRight size={14} /></a><button className="note-share" onClick={copyLink} data-testid="button-copy-notes">{copied ? <><Check size={14} /> Link copied</> : <>Share <ArrowUpRight size={14} /></>}</button></div> : <span className="note-read">Drafting now</span>}</article></Reveal>)}</section><ContactBanner /></main>;
}

function BlogPost({ id }: { id?: string }) {
  const post = blogPosts.find((item) => item.id === id) ?? blogPosts[0];
  usePageMeta(`${post.title} — Shonil Dabreo`, post.excerpt);
  return <main id="main" className="blog-post shell section-pad"><a className="detail-back" href="#/notes" data-testid="link-back-notes"><ArrowLeft size={14} /> Back to field notes</a><header className="blog-post-header"><p className="eyebrow">{post.category} · {post.date}</p><h1>{post.title}</h1><p className="blog-post-deck">{post.excerpt}</p></header><article className="blog-post-body">{post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article><div className="blog-post-footer"><a className="text-link" href="#/notes">More field notes <ArrowUpRight size={14} /></a><a className="text-link" href="https://www.linkedin.com/in/shonil24/" target="_blank" rel="noreferrer">Follow along on LinkedIn <ArrowUpRight size={14} /></a></div></main>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id">{(params) => <ProjectDetail id={params.id} />}</Route>
      <Route path="/experience" component={Experience} />
      <Route path="/thinking" component={Thinking} />
      <Route path="/notes/:id">{(params) => <BlogPost id={params.id} />}</Route>
      <Route path="/notes" component={Notes} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteShell>
          <ErrorBoundary>
            {/* Safe & Reusable baseline: Bypasses folder pathing entirely using hash navigation */}
            <WouterRouter hook={useHashLocation}>
              <Router />
            </WouterRouter>
          </ErrorBoundary>
        </SiteShell>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
