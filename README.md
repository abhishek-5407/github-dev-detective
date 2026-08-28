# 🔍 Dev-Detective — GitHub Profile Search & Battle App

> **Prodesk IT | Sprint 3: The API Hunter**
> A production-grade, client-side GitHub profile search tool with async JavaScript and Battle Mode.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-7c3aed?style=for-the-badge)](https://your-live-link-here.netlify.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Public%20Repo-171515?style=for-the-badge&logo=github)](https://github.com/abhishek-5407/github-dev-detective)

---

## 📸 Screenshots

> *(Add screenshots after deployment)*

---

## 🚀 Features

### Phase 1 — Base MVP ✅
- 🔎 **Search GitHub users** by username using the GitHub REST API
- 🖼️ **Profile Card** — Avatar, Name, Bio, Location, Company, Twitter, Portfolio URL, Join Date
- ⏳ **Loading State** — Animated spinner while the API promise resolves
- 🚫 **404 Error Handling** — Clean "User Not Found" UI when the user doesn't exist
- 📊 **Stats Bar** — Public Repos, Followers, Following

### Phase 2 — Data Expansion ✅
- 📁 **Top 5 Latest Repositories** — Fetched via endpoint chaining (`repos_url`)
- 🔗 **Clickable repo links** — Opens in a new tab
- 🗓️ **Date Formatter Utility** — Converts ISO 8601 timestamps (e.g. `2023-01-25T12:00:00Z`) to `25 Jan 2023`
- 🌟 **Star counts, forks, language badges** per repo

### Phase 3 — Battle Mode ✅
- ⚔️ **Battle Mode Toggle** — Dual-input UI for comparing two GitHub users
- ⚡ **Promise.all()** — Both users fetched simultaneously for speed
- ⭐ **Total Stars Calculation** — `Array.reduce()` over `stargazers_count` for all repos
- 🏆 **Conditional Winner/Loser UI** — Green border + trophy for winner, red for loser

---

## 🛠️ Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Structure   | HTML5 (Semantic, ARIA)         |
| Styling     | Vanilla CSS (Custom Properties, Glassmorphism) |
| Logic       | Vanilla JavaScript ES2022      |
| API         | GitHub REST API v3             |
| Async       | `fetch()`, `async/await`, `Promise.all()` |
| Deployment  | Netlify / Vercel               |

---

## 📂 Folder Structure

```
github-dev-detective/
├── index.html          ← Main HTML, semantic structure, ARIA roles
├── css/
│   └── style.css       ← Premium dark theme, animations, responsive
├── js/
│   └── app.js          ← All async logic, API calls, DOM rendering
├── README.md           ← Project documentation
└── Prompts.md          ← AI pair-programming prompts log
```

---

## ⚙️ How It Works

### Async Flow (Single Search)
```
User submits username
    │
    ▼
fetchUser(username)          ← GET /users/{username}
    │ .then
    ▼
renderProfile(user)          ← Map JSON → DOM
    │
    ▼
fetchRepos(username, 5)      ← GET /users/{username}/repos?sort=updated&per_page=5
    │ .then
    ▼
renderRepos(repos)           ← Build <li> cards → DOM
```

### Battle Mode Flow
```
User submits username1 + username2
    │
    ▼
Promise.all([
  fetchUser(u1), fetchUser(u2),
  fetchAllRepos(u1), fetchAllRepos(u2)
])
    │
    ▼
calculateTotalStars(repos)   ← repos.reduce((acc, r) => acc + r.stargazers_count, 0)
    │
    ▼
Compare stars → Render Winner (green) + Loser (red)
```

### Date Formatting Utility
```javascript
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}
// "2011-01-25T18:44:36Z" → "25 Jan 2011"
```

---

## 🚦 Error States Handled

| HTTP Status | Error                    | UI Response                             |
|-------------|--------------------------|------------------------------------------|
| 404         | User not found           | "User Not Found" card with message       |
| 403         | Rate limit exceeded       | "Rate limit exceeded. Wait a minute."   |
| Network     | No internet              | "Check your connection" message         |

---

## 📦 Local Setup

```bash
# No build tools required — pure HTML/CSS/JS
# Just open index.html in your browser, or use Live Server:

# VS Code: Right-click index.html → "Open with Live Server"
# OR:
npx serve .
```

---

## 🌐 Deployment

### Netlify (Recommended)
1. Drag and drop project folder at [netlify.com/drop](https://app.netlify.com/drop)
2. Get your live URL instantly

### Vercel
```bash
npx vercel --prod
```

---

## 📋 API Reference

| Endpoint                                  | Description                    |
|-------------------------------------------|--------------------------------|
| `GET /users/{username}`                   | Fetch user profile             |
| `GET /users/{username}/repos?sort=updated&per_page=5` | Fetch top 5 repos |
| `GET /users/{username}/repos?per_page=100`| Fetch all repos (Battle Mode)  |

> **Rate Limit:** 60 requests/hour (unauthenticated). Pass a PAT token in headers to increase to 5,000/hour.

---

## 🎓 Concepts Demonstrated

- `fetch()` API for HTTP requests
- `async` / `await` for readable async code
- `Promise.all()` for parallel execution
- `Array.reduce()` for data aggregation
- `Array.map()` for list rendering
- Error-first architecture with try/catch
- DOM manipulation without frameworks
- ARIA roles & keyboard navigation (Accessibility)
- CSS Custom Properties & Design Tokens
- CSS Grid & Flexbox responsive layouts
- CSS animations & micro-interactions

---

*Prodesk IT — Sprint 3 | Built with ❤️ using the GitHub REST API*
