# Setup guide

## What this project is

This is a static React/Vite portfolio. It has no database, server-side API, login, paid service, or required API key. The browser renders the site and Vite bundles it into uploadable files.

## Important folders

```text
src/
  App.tsx              Layout, routes and interactive components
  content-loader.ts    Markdown loader and frontmatter parser
  index.css            Shared visual system and responsive rules
content/
  projects/*.md       Project cards and detail stories
  blog/*.md           Published and upcoming field notes
public/assets/
  projects/           Project screenshots
```

## Edit a project

Open `content/projects/`. Each file contains:

- Frontmatter for the card: title, category, image, tags, impact and date
- `Why this mattered`
- `Approach`
- `Trade-offs and reasoning`
- `Outcome`

The project detail page turns those four sections into clickable tabs. Copy an existing file to add a new project, give it a unique lowercase `id`, and add `featured: true` if it should appear on the home page.

## Edit or publish a field note

Open `content/blog/` and copy an existing Markdown file. Set:

```yaml
status: Published
```

Then write paragraphs under `## Post`. Published notes appear on `/notes` and at `/notes/<id>`. Keep future ideas as `status: Coming soon`.

## Track portfolio website views

GitHub Pages is free static hosting, but it does not include website analytics. This project includes an optional GoatCounter integration, which is lightweight, privacy-friendly and suitable for a static site.

1. Create a free site at [GoatCounter](https://www.goatcounter.com/).
2. Copy the site's count endpoint. It looks like `https://your-code.goatcounter.com/count`.
3. Open `src/analytics.ts` and replace the empty `GOATCOUNTER_ENDPOINT` value with that endpoint.
4. Build the project again and upload the new `dist/public/` contents to GitHub Pages.
5. View page visits, referrers, devices and routes in your GoatCounter dashboard.

The integration tracks the initial page load automatically and also records route changes inside the React site. It does nothing while the endpoint is empty, so development and the current build send no analytics data.

The GitHub profile-view badge in `README.md` is separate: it measures visits to the GitHub profile through Komarev, not visits to the deployed website.

## Run locally

From the full workspace:

```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/shonil-portfolio run dev
```

Open the preview URL provided by the dev server. The Replit artifact uses its managed workflow and base path automatically.

## Check and build

```bash
pnpm --filter @workspace/shonil-portfolio run typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/shonil-portfolio run build
```

The generated static files are written to `dist/public/`. Upload that folder's contents to GitHub Pages, Netlify or Vercel.

## Hosting guidance

- **GitHub Pages:** use a repository named `yourusername.github.io` for the simplest free URL.
- **Netlify:** drag the built static folder into the deploy area or connect a GitHub repository for automatic rebuilds.
- **Vercel:** connect the repository and deploy the static output.

For automatic content updates, keep the editable source in GitHub and configure the host to run the build command after each commit. The public directory is `dist/public/`.

## Domain guidance

Free provider URLs are easiest. A shorter custom domain requires registering a domain and pointing its DNS records at the host. The domain cannot be changed only by editing React or CSS.
