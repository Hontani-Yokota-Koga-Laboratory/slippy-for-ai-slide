# AI Slide Project Agent Guide

You are an expert developer specializing in React, TypeScript, and data visualization (D3.js). This project is a React-based slide deck system where slides are defined in JSON and rendered using React components.

## System Architecture

- **Frontend**: React 19 (Vite), TypeScript, Tailwind CSS 4.
- **Backend (Dev Server Plugin)**: A Vite plugin (`server/plugin.ts`) provides an API for:
  - Listing projects (`GET /api/projects`)
  - Reading/Writing slide data (`GET/PUT /api/projects/:name/slides`)
  - Generating PDF via Puppeteer (`POST /api/projects/:name/pdf`)
- **Slide Data**: Stored in `projects/<project-name>/slides.json`.
- **Charts**: Custom D3.js charts are located in `src/charts/` and registered in `src/charts/registry.ts`.

## Core Workflows

### 1. Creating a New Project
1. Create a new directory in `projects/<project-name>/`.
2. Create a `slides.json` file in that directory. You can copy `projects/example/slides.json` as a template.
3. Access it at `http://localhost:5173/?project=<project-name>`.

### 2. Developing Slides
- The editor interface allows modifying slide props and components.
- Changes are saved via `PUT /api/projects/:name/slides`.
- Use KaTeX for math: `$e^{i\pi} + 1 = 0$`.

### 3. Adding a New Chart
1. Create a new React component in `src/charts/<ChartName>.tsx`.
2. Use the provided D3 patterns or standard React+SVG.
3. Register the component in `src/charts/registry.ts`.
4. Use it in a slide by adding a `figure` component with `chartId: "<ChartName>"`.

### 4. Generating PDF
- Use the "Download PDF" feature in the editor UI, which calls the backend PDF generation.
- The backend uses Puppeteer to navigate to `?project=<name>&print=1` and captures the page.

## File Structure & Responsibilities

- `src/types.ts`: Core type definitions for Slides and Components.
- `src/components/slides/`: Layout components (Title, Section, Content, etc.).
- `src/components/blocks/`: Content blocks (Box, Figure, Table, etc.).
- `src/editor/`: Editor UI components.
- `src/utils/sections.ts`: Logic for automatic section numbering and TOC generation.
- `server/plugin.ts`: Vite dev server extension for file I/O and PDF generation.

## Coding Standards

- **React**: Use functional components and hooks.
- **Tailwind**: Use Tailwind 4 utility classes.
- **TypeScript**: Ensure strict typing for all props and data structures.
- **Purity**: Keep slide rendering logic decoupled from editor state where possible.
- **D3**: Prefer React-centric D3 (let React manage the DOM, use D3 for scales/math) or use `useEffect` for D3-managed DOM if necessary.

## Slide Data Schema (`slides.json`)

Each slide is an object:
- `id`: Unique string.
- `layout`: `title` | `toc` | `section` | `subsection` | `subsubsection` | `content` | `statement`.
- `props`: Object containing layout-specific properties (e.g., `heading`, `author`).
- `children` (for `content` layout): Array of `SlideComponent` objects.

`SlideComponent` types:
- `text`, `h3`, `ul`, `box`, `cols`, `figure`, `table`, `divider`.
