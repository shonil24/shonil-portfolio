# Project Setup, Operations, and Disaster Recovery Manual

This document provides clean, step-by-step instructions for operating your static React/Vite portfolio application.

---

## 📁 System Architecture

```text
├── .github/workflows/   # Automated deployment scripts (static.yml)
├── .gitignore           # Safeguard file preventing system trash from pushing
├── content/
│   ├── projects/        # Editable Markdown content for case studies (*.md)
│   └── blog/            # Editable Markdown content for field notes (*.md)
├── editable-source/     # Core local development environment (React/TypeScript)
└── publish/             # Compiled production bundle served directly to GitHub Pages
```

---

## 💻 Standard Local Operations

Always run these commands inside your **Git Bash** terminal while inside the `editable-source/` directory.

### 1. Daily Development Workflow
To add content or alter project styles locally on your machine:
```bash
# Start your local preview engine
pnpm run dev
```
*Open `http://localhost:5173/` in your browser. Saving code edits will refresh your screen instantly.*

### 2. Publishing Your Changes Live
When you finish editing your Markdown files or changing code, deploy your updates to the live site via this 3-step sequence:
```bash
# Step A: Compile your raw code changes directly into the /publish directory
pnpm run build

# Step B: Stage and lock down your changes
git add .
git commit -m "feat: content refresh"

# Step C: Upload securely to your live branch
git push origin master
```

---

## 🔄 Machine Migration & Disaster Recovery

### Scenario A: Setting Up on a Brand New Laptop
If you buy a new computer, you must initialize your developer environment from scratch:
1. Download and install **Node.js (LTS version)** from [nodejs.org](https://nodejs.org).
2. Install **Git** on your machine.
3. Open a fresh terminal and clone your code down to your computer:
   ```bash
   git clone https://github.com
   ```
4. Open the cloned folder inside **VS Code** and launch a **Git Bash** terminal.
5. Move into your workspace directory:
   ```bash
   cd editable-source
   ```
6. Grant permission for your builder scripts and download your clean engine dependencies:
   ```bash
   npm install -g pnpm
   pnpm approve-builds
   pnpm install
   ```
7. Start your local server (`pnpm run dev`) to confirm everything works natively.

### Scenario B: Recovering From a Local Code Crash (Wipe and Reset)
If your local files become completely corrupted or messed up, you can wipe out your local folders and pull a pristine copy straight down from GitHub:
```bash
# DANGER: This discards all unsaved local work and matches your online repository perfectly
git reset --hard origin/master
git clean -fd
```

---

## 🧯 Common Troubleshooting Errors

### 1. Massive File Tracking Spew (Git tracking package nodes)
* **The Problem:** Your Git status shows thousands of files tracking inside `node_modules`.
* **The Fix:** Run `git reset` immediately. Ensure your root directory contains a file named `.gitignore` containing exactly one line: `node_modules/`.

### 2. Line Ending Warnings (`LF will be replaced by CRLF`)
* **The Problem:** Git flags warning codes regarding your line format when staging files on Windows.
* **The Fix:** This is a safe notice, not an error. Git is automatically ensuring your text files remain readable across different operating systems. You can safely ignore it.

### 3. Blank Screen on Live Website
* **The Problem:** GitHub Actions completes with a green checkmark, but your URL shows a completely blank page.
* **The Fix:** Ensure your repository name configuration inside `editable-source/vite.config.ts` matches your exact GitHub subfolder URL string. Always run `pnpm run build` locally before pushing to update the static mapping keys.
