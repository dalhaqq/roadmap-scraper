# Roadmap Scraper

Scraper for [roadmap.sh](https://roadmap.sh) — extracts roadmap data (topics, skills, relationships) and serves it via a simple web interface.

Built as a data collection tool for [course-compass](https://github.com/dalhaqq/course-compass), a course recommender system that maps Udemy courses to learning roadmaps.

---

## What it does

- Scrapes roadmap topic trees from roadmap.sh
- Parses skill nodes and their relationships
- Serves scraped data through a local web interface
- Logs output for downstream use

---

## Tech stack

- **Runtime** — Node.js
- **HTTP** — Axios
- **Frontend** — HTML + Vanilla JS

---

## Running locally

```bash
npm install
node main.js
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port is configured).
