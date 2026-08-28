Prompts.md — AI Pair-Programming Log
Project: Dev-Detective (Sprint 3 — Prodesk IT)
---

Prompt 1 — Understanding async/await and Promises

Me: Explain how async/await works in JavaScript. Why do we use it instead of `.then()` chains?

AI (Concept Explanation):
`async/await` is syntactic sugar over Promises. When you mark a function `async`, it always returns a Promise. Inside it, `await` pauses execution until a Promise resolves — making async code *read* like synchronous code, but it never blocks the thread.

```javascript
// Old way (Promise chain)
fetch('/api/user')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Modern way (async/await)
async function getUser() {
  try {
    const res  = await fetch('/api/user');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```
The `await` keyword makes the function wait for the fetch to complete before moving to `res.json()`. Error handling uses familiar `try/catch`.

---

Prompt 2 — Fetch API with Error Handling

Me: How do I use the Fetch API to call `https://api.github.com/users/octocat` and handle errors properly?

AI:
```javascript
async function fetchUser(username) {
  const response = await fetch(`https://api.github.com/users/${username}`);

  // IMPORTANT: fetch() only rejects on network errors, NOT HTTP errors!
  // We must manually check response.ok for 404, 403, etc.
  if (!response.ok) {
    const err = new Error(`HTTP Error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json(); // Parse JSON body
}
```
Key insight: `fetch()` does NOT throw on 404. You must check `response.ok` yourself.

---

Prompt 3 — DOM Manipulation (Rendering Profile Data)

Me: How do I take the JSON data from GitHub API and show it in my HTML?

AI:
```javascript
const data = await fetchUser('octocat');

// Method 1: textContent (safe, prevents XSS)
document.getElementById('profile-name').textContent = data.name;

// Method 2: src for images
document.getElementById('profile-avatar').src = data.avatar_url;

// Method 3: href for links
const loginEl = document.getElementById('profile-login');
loginEl.href = data.html_url;
loginEl.textContent = data.login;
```
Always use `textContent` (not `innerHTML`) when injecting user data to prevent XSS attacks.

---

Prompt 4 — Date Formatting Utility Function

Me: The API returns `"2011-01-25T18:44:36Z"`. How do I convert it to `"25 Jan 2011"`?

AI:
```javascript
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);                  // Parse ISO string
  return date.toLocaleDateString('en-GB', {           // Use locale format
    day:   'numeric',   // → 25
    month: 'short',     // → Jan
    year:  'numeric',   // → 2011
  });
}

// Usage
formatDate('2011-01-25T18:44:36Z'); // → "25 Jan 2011"
```
`new Date()` parses ISO 8601 strings natively. `toLocaleDateString()` formats the output.

---

Prompt 5 — Loading State Implementation

Me: How do I show a loading spinner while data is being fetched?

AI:
```javascript
// 1. In HTML, create a spinner div (initially hidden)
// <div id="state-loading" class="hidden">Loading...</div>

// 2. In JavaScript:
async function handleSearch(username) {
  // Show spinner before fetch
  document.getElementById('state-loading').classList.remove('hidden');
  document.getElementById('profile-card').classList.add('hidden');

  try {
    const user = await fetchUser(username);
    // Hide spinner, show profile
    document.getElementById('state-loading').classList.add('hidden');
    renderProfile(user);
    document.getElementById('profile-card').classList.remove('hidden');
  } catch (err) {
    document.getElementById('state-loading').classList.add('hidden');
    // Show error state
  }
}
```
Pattern: show loading → await → hide loading → show result OR error.

---

Prompt 6 — Endpoint Chaining (Phase 2)

Me: How do I fetch repositories after fetching the user profile?

AI:
Endpoint chaining means: use data from the first API call to make a second call.
```javascript
async function handleSearch(username) {
  // Step 1: Fetch user
  const user = await fetchUser(username);
  renderProfile(user);

  // Step 2: Use repos_url from step 1 to fetch repos
  // OR hardcode the endpoint pattern:
  const repos = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`
  ).then(r => r.json());

  renderRepos(repos);
}
```
Both requests use `await` sequentially. The repos fetch only starts after the profile is rendered.

---

Prompt 7 — Promise.all() for Battle Mode (Phase 3)

Me: How do I fetch two users at the same time to make it faster?

AI:
```javascript
// Sequential (SLOW — 2 requests, one after the other):
const user1 = await fetchUser('torvalds');    // Wait...
const user2 = await fetchUser('gaearon');     // Then wait again

// Parallel with Promise.all() (FAST — both fire simultaneously):
const [user1, user2] = await Promise.all([
  fetchUser('torvalds'),
  fetchUser('gaearon'),
]);
```
`Promise.all()` fires all promises simultaneously and resolves when ALL complete. If any one fails, the entire Promise.all() rejects — so wrap in try/catch.

---

Prompt 8 — Total Stars Calculation with reduce()

Me: How do I calculate the total stars across all repositories?

AI:
```javascript
// repos is an array of repo objects, each has stargazers_count
const repos = [
  { name: 'linux', stargazers_count: 170000 },
  { name: 'subsurface', stargazers_count: 2100 },
];

// Array.reduce() accumulates a running total:
const totalStars = repos.reduce((accumulator, repo) => {
  return accumulator + repo.stargazers_count;
}, 0); // 0 is the initial value

// Short form:
const totalStars = repos.reduce((total, repo) => total + repo.stargazers_count, 0);

console.log(totalStars); // 172100
```
`reduce()` iterates through every repo, adding `stargazers_count` to a running total that starts at `0`.

---

Prompt 9 — Conditional Winner/Loser UI

Me: How do I conditionally apply CSS classes based on who has more stars?

AI:
```javascript
const stars1 = calculateTotalStars(repos1); // e.g. 172100
const stars2 = calculateTotalStars(repos2); // e.g. 85000

const user1Wins = stars1 > stars2;

// Build card elements
const card1 = document.createElement('div');
card1.className = `battle-card ${user1Wins ? 'winner' : 'loser'}`;

const card2 = document.createElement('div');
card2.className = `battle-card ${user1Wins ? 'loser' : 'winner'}`;
```
In CSS:
```css
.battle-card.winner { border: 2px solid #10b981; }  /* green */
.battle-card.loser  { border: 2px solid #ef4444; }  /* red  */
```

---

*All concepts were researched, understood, and implemented manually.*
*No code was copied without full comprehension.*
*— Prodesk IT Sprint 3 Dev-Detective*
