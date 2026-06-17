# BigQuery Release Notes Viewer

A sleek, dark-mode web application built with **Python Flask** that fetches the latest [Google BigQuery release notes](https://cloud.google.com/bigquery/docs/release-notes) from the official Google Cloud Atom feed and presents them in a clean, searchable card interface — with one-click Twitter/X sharing.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- 🔄 **Live feed** — fetches directly from Google's official Atom XML feed
- 🃏 **Card layout** — each release note shown as a card with date badge, preview text, and a link to the full docs
- 🔍 **Instant search** — filter cards by title, content, or date (client-side, no extra network calls)
- 🐦 **Tweet any update** — click **Tweet** on any card to open a pre-filled Twitter/X composer with the title, link, and hashtags
- ⚡ **Refresh button** — re-fetch the feed on demand with an animated spinner
- 🌑 **Dark mode** — glassmorphism design with animated background
- 📱 **Responsive** — works on desktop and mobile

---

## Project Structure

```
bigquery-release-notes/
├── app.py                  # Flask app — routes, XML fetching, Atom/RSS parsing
├── templates/
│   └── index.html          # HTML shell (structure + semantic markup)
├── static/
│   ├── style.css           # All visual design (dark theme, animations, layout)
│   └── app.js              # All interactivity (fetch, render, search, tweet modal)
└── .gitignore
```

---

## Requirements

- Python 3.10 or higher
- Flask

---

## Setup & Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/lambertgarrido/roberto-event-talks-app.git
cd roberto-event-talks-app
```

### 2. Create a virtual environment (recommended)

```bash
# Create
python -m venv .venv

# Activate — macOS/Linux
source .venv/bin/activate

# Activate — Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install flask
```

> Or, if a `requirements.txt` is present:
> ```bash
> pip install -r requirements.txt
> ```

### 4. Run the app

```bash
python app.py
```

The app will start on **http://127.0.0.1:5000** in debug mode.

---

## How It Works

```
Browser  ──GET /──►  Flask  ──HTTPS──►  Google Cloud Atom Feed
                       │                        │
                       │◄──── raw XML ──────────┘
                       │
                       │  parse_feed()
                       │   • Atom or RSS 2.0 detection
                       │   • Date formatting
                       │   • HTML → plain text (preview)
                       │
Browser  ◄──JSON───────┘
  │
  └── Renders cards, enables search + tweet modal
```

1. The browser requests `/` — Flask serves the HTML shell.
2. JavaScript calls `GET /api/release-notes`.
3. Flask fetches Google's XML feed, parses each entry, and returns structured JSON.
4. JavaScript renders a card for every entry with a staggered fade-in animation.
5. Clicking **Tweet** on a card opens a pre-filled Twitter/X intent URL in a new tab.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Python · Flask |
| Templating | Jinja2 (single shell template) |
| Styling | Vanilla CSS (custom properties, animations) |
| Scripting | Vanilla JavaScript (ES2022, no frameworks) |
| Fonts | Google Fonts — Inter |
| Feed | Google Cloud Atom XML |

---

## Data Source

Feed URL:
```
https://docs.cloud.google.com/feeds/bigquery-release-notes.xml
```

The parser handles both **Atom** (current Google format) and **RSS 2.0** as a fallback.

---

## License

MIT — free to use, modify, and distribute.
