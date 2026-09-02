# Shonil Dabreo Portfolio — edit and publish guide

## Edit the site

The easiest place to write is `content/blog/`. Copy a Markdown file, change its frontmatter, write the paragraphs under `## Post`, and set `status: Published`. The published note will appear on `/notes` and get its own `/notes/<id>` page.

Project cards and project detail pages are edited in `content/projects/`. Each project has frontmatter plus these sections:

- `## Why this mattered`
- `## Approach`
- `## Trade-offs and reasoning`
- `## Outcome`

You can also edit the existing image files in `public/assets/projects/` or replace an image path in the project frontmatter.

## Local preview

From the source project, run:

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm run dev
```

## Publish the static version

The `publish/` folder in the downloadable package is already-built HTML, CSS, JavaScript and assets. Upload the contents of `publish/` to:

- **GitHub Pages:** a repository such as `shonil24.github.io` or the `docs/` folder of a project repository.
- **Netlify:** drag the `publish/` folder into the Netlify deploy area, or connect the repository and use the built folder as the publish directory.
- **Vercel:** import the repository and deploy the static output, or use the `publish/` folder as the project root.

For future blog edits, use the editable source, rebuild it, and redeploy the resulting `publish/` folder. Static hosting does not include a browser-based admin panel; GitHub, Netlify, or Vercel becomes the permanent host while the repository is the content management workflow.

## Domain

The simplest permanent path is a free provider URL such as `shonil24.github.io`. A shorter custom domain such as `shonil.dev`, `shonildabreo.com`, or `shonil24.com` requires registering the domain and connecting its DNS records. Replit also supports custom domains for static deployments after DNS verification.
