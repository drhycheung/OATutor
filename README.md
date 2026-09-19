# EdUHK Adaptive Tutor

A dark-themed adaptive tutoring platform for EdUHK courses, built on the OATutor open-source framework. Currently piloting **PSY2032 Statistical Methods in Psychology I** with 39 lessons of curated statistics content.

> **Live demo:** https://drhycheung.github.io/OATutor/

---

## Status

**Work in progress.** This project is an ongoing exploration of how adaptive learning technology can be integrated into courses at The Education University of Hong Kong (EdUHK). The current deployment is a pilot for PSY2032 and is not yet feature-complete.

### Background: why a non-AI approach

A separate project by the same author experimented with using large language models for real-time generation of practice questions. While pedagogically promising, the token cost proved unsustainable for classroom-scale use. **This project** therefore uses a **non-AI, pre-authored approach**: all problems, hints, and scaffolds are curated ahead of time, following the OATutor content model.

---

## Features

| Feature | Description |
|---|---|
| **Adaptive item selection** | Bayesian Knowledge Tracing (BKT) estimates per-skill mastery and serves problems targeting the weakest skills first |
| **Hint & scaffold system** | Multi-level hints and interactive scaffolds per problem step; bottom-out hints available when configured |
| **Progress tracking** | Per-lesson and per-skill mastery visualisation; progress persisted in `localStorage` |
| **Dark glassmorphism UI** | Custom dark theme with glass-effect surfaces, replacing the original light interface |
| **EdUHK branding** | White EdUHK signature logo, course-specific landing page, favicon |
| **Accessibility** | Section 508 / WCAG compliance inherited from upstream OATutor |
| **No backend required** | Deployable to GitHub Pages as a fully static site; Firebase logging optional |
| **LMS integration (optional)** | LTI middleware for Canvas integration available via the upstream OATutor backend |

---

## Run locally

```sh
git clone https://github.com/drhycheung/OATutor.git
cd OATutor
npm install
npm run start
```

The dev server runs at `http://localhost:3000`.

### Build for production

```sh
npm run build
npx serve -s build
```

---

## Deployment (GitHub Pages)

The `deploy-production.yml` GitHub Action builds and deploys on every push to `main`. The static bundle is served from the `gh-pages` branch.

1. Set `homepage` in `package.json` to your Pages URL, e.g. `https://<your-username>.github.io/<repo-name>`.
2. Push to `main` — the action builds and pushes to `gh-pages` automatically.
3. In **Settings → Pages**, set source to the `gh-pages` branch, root directory.

---

## Technology

| Technology | Role |
|---|---|
| [React](https://react.dev/) | UI framework |
| [Material-UI (MUI)](https://mui.com/) | Component library |
| [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_Knowledge_Tracing) | Adaptive mastery estimation |
| [KaTeX](https://katex.org/) | Mathematics rendering |
| [Firebase](https://firebase.google.com/) | Optional event logging |
| [OpenStax](https://openstax.org/) | Content source (Introductory Statistics 2e) |

---

## Attribution & Licence

This project is a **fork and adaptation** of [CAHLR/OATutor](https://github.com/CAHLR/OATutor), developed by Zachary A. Pardos and the CAHL Research Lab at UC Berkeley.

### Code

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE).

> Copyright (c) 2023 Zachary A. Pardos (@zpardos) – CAHL Research Lab

### Content

All problems, hints, and scaffolds are licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Content is curated from [OpenStax](https://openstax.org/) and the [OATutor-Content repository](https://github.com/CAHLR/OATutor-Content). Attribution is provided within each JSON content file.

### Paper

If you use or reference this system, please cite the original OATutor paper:

> Zachary A. Pardos, Matthew Tang, Ioannis Anastasopoulos, Shreya K. Sheel, and Ethan Zhang. 2023. _OATutor: An Open-source Adaptive Tutoring System and Curated Content Library for Learning Sciences Research._ In _Proceedings of the 2023 CHI Conference on Human Factors in Computing Systems (CHI '23)_. ACM. [https://doi.org/10.1145/3544548.3581574](https://doi.org/10.1145/3544548.3581574)

The full original README, including content documentation, BKT parameter details, and meta-tag reference, is available at the [upstream repository](https://github.com/CAHLR/OATutor/blob/main/README.md).

---

## Changes from upstream

This fork introduces the following modifications:

- **Dark glassmorphism theme** across all components (custom `theme.js`, dark `index.css`, per-component style overrides)
- **EdUHK branding**: site name, white EdUHK signature logo, favicon
- **PSY2032 course content**: 39 lessons aligned to the EdUHK Statistical Methods in Psychology I syllabus, drawing on OpenStax Introductory Statistics. Content lives in `src/content-sources/oatutor/` as regular tracked files — additional courses can be added by dropping in new `coursePlans.json` entries and content-pool directories.
- **"Not logged in" indicator** styled for dark backgrounds (slate-300 text)
- No changes to the BKT engine or content JSON schema

---

## Roadmap

- [ ] **Adjust questions and verify answers** based on PSY2032 course materials — review and align all problem sets with the EdUHK syllabus and textbook readings
- [ ] **Fine-tune the interface** — polish responsive layout, spacing, and interaction details across desktop and mobile
- [ ] **Build login system** for EdUHK account authentication (SSO / OAuth) and persist student progress in a database instead of `localStorage`
- [ ] **Incorporate AI chatbot** for Socratic dialogue and discussion (contingent on availability of AI tokens)
