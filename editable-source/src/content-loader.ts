export type EditableProject = {
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

export type EditableBlogPost = {
  id: string;
  status: "Published" | "Coming soon";
  category: string;
  date: string;
  title: string;
  excerpt: string;
  body: string[];
};

type ParsedDocument = {
  meta: Record<string, string>;
  sections: Record<string, string>;
};

// Keep the parser deliberately small: portfolio content only needs frontmatter
// plus named sections, which makes Markdown comfortable to edit in any editor.
function parseDocument(raw: string): ParsedDocument {
  const frontMatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta: Record<string, string> = {};
  const frontMatter = frontMatterMatch?.[1] ?? "";
  frontMatter.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator > 0)
      meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  });

  const body = raw.slice(frontMatterMatch?.[0].length ?? 0);
  const sections: Record<string, string> = {};
  const headings = [...body.matchAll(/^##\s+(.+)$/gm)];
  headings.forEach((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? body.length;
    sections[heading[1].trim()] = body.slice(start, end).trim();
  });
  return { meta, sections };
}

function list(value: string | undefined) {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

const projectFiles = import.meta.glob("../content/projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const blogFiles = import.meta.glob("../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Glob order is not a content decision, so keep the archive intentional.
const projectOrder = [
  "atlikon",
  "foregith",
  "coronavirus",
  "woolies",
  "anz",
  "risk",
  "smart-home",
  "flower-trade",
  "time-series",
  "data-science-a1",
  "data-science-a2",
  "advanced-java",
  "ancient-games",
];

export const projectsFromMarkdown: EditableProject[] = Object.values(
  projectFiles,
)
  .map((raw) => {
    const { meta, sections } = parseDocument(raw);
    return {
      id: meta.id,
      title: meta.title,
      type: meta.type,
      categories: list(meta.categories),
      image: meta.image || undefined,
      tags: list(meta.tags),
      summary: meta.summary,
      impact: meta.impact,
      date: meta.date,
      featured: meta.featured === "true",
      why: sections["Why this mattered"] ?? "",
      approach: sections.Approach ?? "",
      tradeoffs: sections["Trade-offs and reasoning"] ?? "",
      result: sections.Outcome ?? "",
    };
  })
  .filter((project) => project.id && project.title)
  .sort((a, b) => projectOrder.indexOf(a.id) - projectOrder.indexOf(b.id));

const blogOrder = [
  "single-source-of-truth",
  "dashboards-next-question",
  "first-platform-migration",
];

export const blogPostsFromMarkdown: EditableBlogPost[] = Object.values(
  blogFiles,
)
  .map((raw) => {
    const { meta, sections } = parseDocument(raw);
    const body = (sections.Post ?? "")
      .split(/\r?\n\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const status: EditableBlogPost["status"] =
      meta.status === "Published" ? "Published" : "Coming soon";
    return {
      id: meta.id,
      status,
      category: meta.category,
      date: meta.date,
      title: meta.title,
      excerpt: meta.excerpt,
      body,
    };
  })
  .filter((post) => post.id && post.title)
  .sort((a, b) => blogOrder.indexOf(a.id) - blogOrder.indexOf(b.id));
