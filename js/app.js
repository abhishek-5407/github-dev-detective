/**
 * Dev-Detective — app.js
 * GitHub Profile Search & Battle Mode
 *
 * Architecture:
 *  - Pure Vanilla JS (ES2022), no dependencies
 *  - Fetch API + async/await for all HTTP calls
 *  - Promise.all() for Battle Mode parallelism
 *  - DOM manipulation via helper utilities
 *  - Error-first design: all states explicitly managed
 *
 * Prodesk IT — Sprint 3
 */

'use strict';

/* CONSTANTS */
const API_BASE = 'https://api.github.com';

/** Language color map (subset, mirrors GitHub linguist) */
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  Java:       '#b07219',
  'C++':      '#f34b7d',
  C:          '#555555',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Ruby:       '#701516',
  Go:         '#00ADD8',
  Rust:       '#dea584',
  Swift:      '#F05138',
  Kotlin:     '#A97BFF',
  PHP:        '#4F5D95',
  Shell:      '#89e051',
  Vue:        '#41b883',
  Dart:       '#00B4AB',
};

/* UTILITY FUNCTIONS */

/**
 * formatDate — Converts ISO 8601 timestamp to human-readable string
 * Phase 2 requirement: utility function for date formatting
 * @param {string} isoString — e.g. "2011-01-25T18:44:36Z"
 * @returns {string}          — e.g. "25 Jan 2011"
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

/**
 * formatNumber — Compact notation for large numbers (e.g. 12500 → "12.5K")
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

/**
 * sanitize — Escapes text for safe DOM injection
 * @param {string|null} str
 * @returns {string}
 */
function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * getLangColor — Returns hex color for a programming language
 * @param {string|null} lang
 * @returns {string}
 */
function getLangColor(lang) {
  return LANG_COLORS[lang] ?? '#8b949e';
}

/* API LAYER */

/**
 * fetchJSON — Generic JSON fetcher with HTTP error handling
 * Throws a structured error object for non-2xx responses.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const err = new Error(errorBody.message ?? `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * fetchUser — Fetches GitHub user profile
 * @param {string} username
 * @returns {Promise<Object>}
 */
function fetchUser(username) {
  return fetchJSON(`${API_BASE}/users/${encodeURIComponent(username)}`);
}

/**
 * fetchRepos — Fetches user repositories sorted by last update
 * @param {string} username
 * @param {number} [perPage=5]
 * @returns {Promise<Array>}
 */
function fetchRepos(username, perPage = 5) {
  return fetchJSON(
    `${API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${perPage}&type=owner`
  );
}

/**
 * fetchAllRepos — Fetches up to 100 repos for star calculation (Battle Mode)
 * @param {string} username
 * @returns {Promise<Array>}
 */
function fetchAllRepos(username) {
  return fetchJSON(
    `${API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=owner`
  );
}

/**
 * calculateTotalStars — Reduces repo array to total stargazers_count
 * Phase 3 requirement: accumulator pattern
 * @param {Array} repos
 * @returns {number}
 */
function calculateTotalStars(repos) {
  return repos.reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0);
}

/* DOM HELPERS */

/** Safely get element or throw */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Element #${id} not found`);
  return node;
}

/** Show an element (removes .hidden) */
function show(node) { node.classList.remove('hidden'); }

/** Hide an element (adds .hidden) */
function hide(node) { node.classList.add('hidden'); }

/** Set text content safely */
function setText(node, value) { node.textContent = value ?? ''; }

/* SINGLE SEARCH — DOM NODES */
const searchForm    = el('search-form');
const searchInput   = el('search-input');
const stateLoading  = el('state-loading');
const stateError    = el('state-error');
const errorMessage  = el('error-message');
const profileCard   = el('profile-card');
const reposList     = el('repos-list');
const reposLoading  = el('repos-loading');

/* SINGLE SEARCH — STATE MANAGEMENT */

/** Reset UI to idle state */
function resetSingleUI() {
  hide(stateLoading);
  hide(stateError);
  hide(profileCard);
}

/** Enter loading state */
function enterLoadingState() {
  hide(stateError);
  hide(profileCard);
  show(stateLoading);
}

/** Enter error state */
function enterErrorState(message) {
  hide(stateLoading);
  hide(profileCard);
  setText(errorMessage, message);
  show(stateError);
}

/** Enter success state with user data */
function enterSuccessState(user) {
  hide(stateLoading);
  hide(stateError);
  renderProfile(user);
  show(profileCard);
}

/* PROFILE RENDERING */

/**
 * renderProfile — Maps GitHub user object to DOM
 * Phase 1 requirement: Avatar, Name, Bio, Join Date, Portfolio URL
 * @param {Object} user — GitHub user API response
 */
function renderProfile(user) {
  // Avatar
  const avatar = el('profile-avatar');
  avatar.src = user.avatar_url ?? '';
  avatar.alt = `${user.login} avatar`;

  // Name & Login
  setText(el('profile-name'), user.name || user.login);
  const loginEl = el('profile-login');
  loginEl.textContent = user.login;
  loginEl.href = user.html_url;
  loginEl.setAttribute('aria-label', `View ${user.login} on GitHub`);

  // Bio
  setText(el('profile-bio'), user.bio || 'This user has not set a bio.');

  // Stats
  setText(el('stat-repos'),     formatNumber(user.public_repos));
  setText(el('stat-followers'), formatNumber(user.followers));
  setText(el('stat-following'), formatNumber(user.following));

  // Join Date (Phase 2: formatDate utility)
  setText(el('profile-joined'), formatDate(user.created_at));

  // Location
  setText(el('profile-location'), user.location || 'Not Available');

  // Blog / Portfolio
  const blogEl  = el('profile-blog');
  const blogUrl = user.blog?.startsWith('http') ? user.blog : user.blog ? `https://${user.blog}` : null;
  if (blogUrl) {
    blogEl.href        = blogUrl;
    blogEl.textContent = user.blog;
  } else {
    blogEl.href        = '#';
    blogEl.textContent = 'Not Available';
  }

  // Company
  setText(el('profile-company'), user.company ? user.company.replace(/^@/, '') : 'Not Available');

  // Twitter
  setText(el('profile-twitter'), user.twitter_username ? `@${user.twitter_username}` : 'Not Available');

  // Reset repos
  reposList.innerHTML = '';
  show(reposLoading);
}

/* REPOSITORY RENDERING */

/**
 * renderRepos — Maps repos array to DOM list
 * Phase 2 requirement: Top 5 repos, clickable links, language, stars
 * @param {Array} repos
 */
function renderRepos(repos) {
  hide(reposLoading);
  reposList.innerHTML = '';

  if (!repos || repos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'error-message';
    empty.style.textAlign = 'center';
    empty.style.padding = '1.5rem';
    empty.textContent = 'No public repositories found.';
    reposList.appendChild(empty);
    return;
  }

  repos.forEach((repo) => {
    const li = document.createElement('li');
    li.className = 'repo-item';

    const langColor = getLangColor(repo.language);
    const description = repo.description
      ? `<p class="repo-description">${sanitize(repo.description)}</p>`
      : '';

    li.innerHTML = `
      <div class="repo-header">
        <a
          href="${repo.html_url}"
          target="_blank"
          rel="noopener noreferrer"
          class="repo-name"
          aria-label="Open ${sanitize(repo.name)} repository on GitHub"
        >${sanitize(repo.name)}</a>
        <span class="repo-stars" aria-label="${repo.stargazers_count} stars">
          ⭐ ${formatNumber(repo.stargazers_count)}
        </span>
      </div>
      ${description}
      <div class="repo-meta">
        ${repo.language ? `
          <span class="repo-tag" aria-label="Language: ${sanitize(repo.language)}">
            <span class="repo-lang-dot" style="background:${langColor}" aria-hidden="true"></span>
            ${sanitize(repo.language)}
          </span>
        ` : ''}
        <span class="repo-tag" aria-label="${repo.forks_count} forks">
          🍴 ${formatNumber(repo.forks_count)}
        </span>
        <span class="repo-tag" aria-label="Updated ${formatDate(repo.updated_at)}">
          🕒 ${formatDate(repo.updated_at)}
        </span>
      </div>
    `;

    reposList.appendChild(li);
  });
}

/* SINGLE SEARCH — MAIN HANDLER */

/**
 * handleSearch — Orchestrates the async fetch + render pipeline
 * Phase 1 & 2 requirement: fetch user → render profile → fetch & render repos
 * @param {string} username
 */
async function handleSearch(username) {
  const cleaned = username.trim().replace(/^@/, '');

  if (!cleaned) {
    searchInput.focus();
    return;
  }

  enterLoadingState();

  try {
    // Phase 1: Fetch user profile
    const user = await fetchUser(cleaned);
    enterSuccessState(user);

    // Phase 2: Chain-fetch top 5 repos
    const repos = await fetchRepos(cleaned, 5);
    renderRepos(repos);

  } catch (err) {
    if (err.status === 404) {
      enterErrorState(`No GitHub user found with username "${cleaned}".`);
    } else if (err.status === 403) {
      enterErrorState('GitHub API rate limit exceeded. Please wait a minute and try again.');
    } else {
      enterErrorState('Something went wrong. Please check your connection and try again.');
    }
  }
}

/* SINGLE SEARCH — EVENT LISTENERS */

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSearch(searchInput.value);
});

// Quick-fill example links
document.querySelectorAll('.example-link').forEach((btn) => {
  btn.addEventListener('click', () => {
    const username = btn.dataset.username;
    searchInput.value = username;
    handleSearch(username);
  });
});

/* MODE TABS */
const tabSingle  = el('tab-single');
const tabBattle  = el('tab-battle');
const panelSingle = el('panel-single');
const panelBattle = el('panel-battle');

function activateTab(tab) {
  const isSingle = tab === 'single';

  tabSingle.classList.toggle('active', isSingle);
  tabSingle.setAttribute('aria-selected', String(isSingle));

  tabBattle.classList.toggle('active', !isSingle);
  tabBattle.setAttribute('aria-selected', String(!isSingle));

  if (isSingle) {
    show(panelSingle);
    hide(panelBattle);
  } else {
    hide(panelSingle);
    show(panelBattle);
  }
}

tabSingle.addEventListener('click', () => activateTab('single'));
tabBattle.addEventListener('click', () => activateTab('battle'));

// Keyboard navigation for tabs
[tabSingle, tabBattle].forEach((tab) => {
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      activateTab(tab === tabSingle ? 'battle' : 'single');
      (tab === tabSingle ? tabBattle : tabSingle).focus();
    }
  });
});

/* BATTLE MODE — DOM NODES */
const battleForm    = el('battle-form');
const battleUser1   = el('battle-user1');
const battleUser2   = el('battle-user2');
const battleLoading = el('battle-loading');
const battleError   = el('battle-error');
const battleErrorMsg = el('battle-error-message');
const battleResults  = el('battle-results');

/* BATTLE MODE — STATE HELPERS */

function battleEnterLoading() {
  hide(battleError);
  hide(battleResults);
  show(battleLoading);
}

function battleEnterError(message) {
  hide(battleLoading);
  hide(battleResults);
  setText(battleErrorMsg, message);
  show(battleError);
}

function battleEnterSuccess(cards) {
  hide(battleLoading);
  hide(battleError);
  battleResults.innerHTML = '';
  cards.forEach((c) => battleResults.appendChild(c));
  show(battleResults);
}

/* BATTLE MODE — CARD BUILDER */

/**
 * buildBattleCard — Constructs a battle result card DOM element
 * Phase 3 requirement: Conditional winner/loser styling
 * @param {Object} user       — GitHub user API response
 * @param {number} totalStars — Calculated from repos
 * @param {boolean} isWinner
 * @returns {HTMLElement}
 */
function buildBattleCard(user, totalStars, isWinner) {
  const div = document.createElement('div');
  const resultClass = isWinner ? 'winner' : 'loser';
  const badgeText   = isWinner ? '🏆 Winner' : '💀 Loser';
  const badgeClass  = isWinner ? 'badge-winner' : 'badge-loser';

  div.className = `battle-card ${resultClass}`;
  div.setAttribute('aria-label', `${user.login} - ${isWinner ? 'Winner' : 'Loser'} with ${totalStars} total stars`);

  div.innerHTML = `
    <span class="battle-badge ${badgeClass}" aria-hidden="true">${badgeText}</span>
    <img
      class="battle-avatar"
      src="${user.avatar_url}"
      alt="${sanitize(user.login)} avatar"
      width="88"
      height="88"
      loading="lazy"
    />
    <h3 class="battle-username">${sanitize(user.name || user.login)}</h3>
    <p class="battle-handle">@${sanitize(user.login)}</p>

    <div class="battle-stars" aria-label="${totalStars} total stars">
      ${formatNumber(totalStars)}
    </div>
    <div class="battle-stars-label">
      <span aria-hidden="true">⭐</span> Total Stars
    </div>

    <div class="battle-stat-row">
      <div class="battle-mini-stat">
        <span class="battle-mini-value">${formatNumber(user.public_repos)}</span>
        <span class="battle-mini-label">Repos</span>
      </div>
      <div class="battle-mini-stat">
        <span class="battle-mini-value">${formatNumber(user.followers)}</span>
        <span class="battle-mini-label">Followers</span>
      </div>
      <div class="battle-mini-stat">
        <span class="battle-mini-value">${formatDate(user.created_at)}</span>
        <span class="battle-mini-label">Joined</span>
      </div>
    </div>
  `;

  return div;
}

/* BATTLE MODE — MAIN HANDLER */

/**
 * handleBattle — Runs two fetches simultaneously via Promise.all()
 * Phase 3 requirement: Promise.all, reduce for stars, conditional winner/loser UI
 * @param {string} u1 — First username
 * @param {string} u2 — Second username
 */
async function handleBattle(u1, u2) {
  battleEnterLoading();

  try {
    // Fetch both user profiles and all repos simultaneously
    const [user1, user2, repos1, repos2] = await Promise.all([
      fetchUser(u1),
      fetchUser(u2),
      fetchAllRepos(u1),
      fetchAllRepos(u2),
    ]);

    // Phase 3: Calculate total stars via reduce accumulator
    const stars1 = calculateTotalStars(repos1);
    const stars2 = calculateTotalStars(repos2);

    // Determine winner (tie goes to more repos as tiebreaker)
    const user1Wins = stars1 > stars2 || (stars1 === stars2 && user1.public_repos >= user2.public_repos);

    const card1 = buildBattleCard(user1, stars1, user1Wins);
    const card2 = buildBattleCard(user2, stars2, !user1Wins);

    // Winner card first on mobile (visual priority)
    battleEnterSuccess(user1Wins ? [card1, card2] : [card2, card1]);

  } catch (err) {
    if (err.status === 404) {
      battleEnterError('One or both GitHub usernames were not found. Please check and try again.');
    } else if (err.status === 403) {
      battleEnterError('GitHub API rate limit exceeded. Please wait a minute and try again.');
    } else {
      battleEnterError('Battle failed. Please check your connection and try again.');
    }
  }
}

/* BATTLE MODE — EVENT LISTENER */

battleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const u1 = battleUser1.value.trim().replace(/^@/, '');
  const u2 = battleUser2.value.trim().replace(/^@/, '');

  if (!u1 || !u2) {
    battleEnterError('Please enter both GitHub usernames to start the battle.');
    return;
  }

  if (u1.toLowerCase() === u2.toLowerCase()) {
    battleEnterError('Please enter two different GitHub usernames.');
    return;
  }

  handleBattle(u1, u2);
});
