// ── Theme Definitions ──
const THEMES = {
  forest: ['🦊', '🍄', '🌰', '🦔', '🍃', '🐿️'],
  ocean:  ['🐬', '🪼', '🐚', '🦀', '🐠', '⭐'],
  garden: ['🦋', '🐝', '🌸', '🐛', '🌼', '🐞'],
  night:  ['🦉', '🌙', '✨', '🦇', '🌟', '🔮']
};

// ── State ──
let currentTheme   = null;
let currentMode    = 'multiplication';
let currentProduct = null;
let correctScore   = 0;
let confirmedGrids = [];
let allFactorPairs = [];
let placedIcons    = {};

// ── DOM References ──
const themeScreen       = document.getElementById('theme-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const app               = document.getElementById('app');
const modeLabel         = document.getElementById('mode-label');
const modeSwitch        = document.getElementById('mode-switch');
const scoreEl           = document.getElementById('session-score');
const problemText       = document.getElementById('problem-text');
const problemHint       = document.getElementById('problem-hint');
const graphPaper        = document.getElementById('graph-paper');
const hintBtn           = document.getElementById('hint-btn');
const checkGridBtn      = document.getElementById('check-grid-btn');
const submitBtn         = document.getElementById('submit-btn');
const factText          = document.getElementById('fact-text');
const discoveredList    = document.getElementById('discovered-list');
const nextProblemBtn    = document.getElementById('next-problem-btn');
const celebrationTitle  = document.getElementById('celebration-title');
const celebrationMsg    = document.getElementById('celebration-message');
const celebrationIcons  = document.getElementById('celebration-icons');

// ── Grid Config ──
const CELL_SIZE = 48;
const GRID_COLS = 12;
const GRID_ROWS = 10;

// ── Get all factor pairs for a number ──
function getFactorPairs(n) {
  const pairs = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) {
      pairs.push({ rows: i, cols: n / i });
    }
  }
  return pairs;
}

// ── Pick a random product ──
function pickProduct() {
  const pool = [6, 8, 9, 10, 12, 15, 16, 18, 20, 24];
  if (correctScore >= 3)  pool.push(25, 27, 28, 30, 32, 36);
  if (correctScore >= 6)  pool.push(40, 42, 45, 48, 49, 50);
  if (correctScore >= 10) pool.push(54, 56, 60, 63, 64, 72, 81, 100);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Snap pixel position to nearest grid cell ──
function snapToCell(x, y) {
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / CELL_SIZE))),
    row: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / CELL_SIZE)))
  };
}

// ── Cell key ──
function cellKey(col, row) {
  return `${col},${row}`;
}

// ── Already confirmed this pair? ──
function alreadyConfirmed(rows, cols) {
  return confirmedGrids.some(g => g.rows === rows && g.cols === cols);
}

// ── Theme Selection ──
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTheme = btn.dataset.theme;
    themeScreen.classList.add('hidden');
    app.classList.remove('hidden');
    startNewProblem();
  });
});

// ── Mode Switch ──
modeSwitch.addEventListener('click', () => {
  if (currentMode