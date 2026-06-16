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
const GRID_COLS = 25;
const GRID_ROWS = 15;

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

// ── Count icons currently locked in confirmed grids ──
function countConfirmedIcons() {
  return confirmedGrids.reduce((sum, g) => sum + (g.rows * g.cols), 0);
}

// ── Count icons currently placed on grid (not confirmed) ──
function countPlacedIcons() {
  return Object.keys(placedIcons).length;
}

// ── How many icons should be in holding area ──
function holdingCount() {
  return currentProduct - countConfirmedIcons() - countPlacedIcons();
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
  if (currentMode === 'multiplication') {
    currentMode = 'division';
    modeLabel.textContent = 'Division';
    modeSwitch.textContent = 'Multiplication';
  } else {
    currentMode = 'multiplication';
    modeLabel.textContent = 'Multiplication';
    modeSwitch.textContent = 'Division';
  }
  startNewProblem();
});

// ── Start a New Problem ──
function startNewProblem() {
  currentProduct = pickProduct();
  confirmedGrids = [];
  placedIcons    = {};
  allFactorPairs = getFactorPairs(currentProduct);

  if (currentMode === 'multiplication') {
    problemText.textContent = `Find all the ways to arrange ${currentProduct} icons into a rectangle`;
  } else {
    problemText.textContent = `${currentProduct} ÷ ? — how many equal groups can you make?`;
  }

  problemHint.textContent  = '';
  discoveredList.innerHTML = '';

  const fact = (window.FACTS && window.FACTS[currentProduct])
    ? window.FACTS[currentProduct]
    : `${currentProduct} is a wonderful number!`;
  factText.textContent = fact;

  graphPaper.innerHTML = '';
  buildGraphPaperCells();
  buildHoldingArea();
}

// ── Build clickable graph paper cells ──
function buildGraphPaperCells() {
  graphPaper.style.width  = `${GRID_COLS * CELL_SIZE}px`;
  graphPaper.style.height = `${GRID_ROWS * CELL_SIZE}px`;
  graphPaper.style.position = 'relative';

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.classList.add('graph-cell');
      cell.style.left   = `${c * CELL_SIZE}px`;
      cell.style.top    = `${r * CELL_SIZE}px`;
      cell.style.width  = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      cell.dataset.col  = c;
      cell.dataset.row  = r;

      cell.addEventListener('click', () => onCellClick(c, r, cell));
      graphPaper.appendChild(cell);
    }
  }
}

// ── Click a cell to place or remove an icon ──
function onCellClick(col, row, cell) {
  const key = cellKey(col, row);
  const existing = placedIcons[key];

  if (existing && existing.confirmed) return; // locked, ignore

  if (existing) {
    // Return icon to holding area
    existing.element.remove();
    delete placedIcons[key];
    addIconToHolding(getThemeEmoji());
  } else {
    // Place icon from holding area if available
    const holding = document.getElementById('holding-area');
    if (!holding) return;
    const availableIcon = holding.querySelector('.holding-icon');
    if (!availableIcon) return;

    const emoji = availableIcon.textContent;
    availableIcon.remove();
    placeIconOnGrid(emoji, col, row);
  }
}

// ── Get a theme emoji ──
function getThemeEmoji() {
  const icons = THEMES[currentTheme];
  return icons[Math.floor(Math.random() * icons.length)];
}

// ── Place Icon on Grid ──
function placeIconOnGrid(emoji, col, row) {
  const key = cellKey(col, row);
  if (placedIcons[key]) return;

  const icon = document.createElement('div');
  icon.classList.add('grid-icon', 'placed');
  icon.textContent = emoji;
  icon.style.left = `${col * CELL_SIZE}px`;
  icon.style.top  = `${row * CELL_SIZE}px`;
  icon.style.position = 'absolute';
  icon.style.pointerEvents = 'none';

  placedIcons[key] = { element: icon, confirmed: false };
  graphPaper.appendChild(icon);
}

// ── Build Holding Area ──
function buildHoldingArea() {
  const old = document.getElementById('holding-area');
  if (old) old.remove();

  const holding = document.createElement('div');
  holding.id = 'holding-area';

  const icons = THEMES[currentTheme];
  for (let i = 0; i < currentProduct; i++) {
    const icon = document.createElement('div');
    icon.classList.add('holding-icon');
    icon.textContent = icons[i % icons.length];
    const angle = Math.random() * 20 - 10;
    icon.style.transform = `rotate(${angle}deg)`;
    icon.style.left = `${8 + Math.random() * 60}%`;
    icon.style.top  = `${5 + Math.random() * 80}%`;
    holding.appendChild(icon);
  }

  const canvasRow = document.querySelector('.canvas-row');
  canvasRow.insertBefore(holding, canvasRow.firstChild);
}

// ── Add one icon back to holding area ──
function addIconToHolding(emoji) {
  const holding = document.getElementById('holding-area');
  if (!holding) return;
  const icon = document.createElement('div');
  icon.classList.add('holding-icon');
  icon.textContent = emoji;
  const angle = Math.random() * 20 - 10;
  icon.style.transform = `rotate(${angle}deg)`;
  icon.style.left = `${8 + Math.random() * 60}%`;
  icon.style.top  = `${5 + Math.random() * 80}%`;
  holding.appendChild(icon);
}

// ── Refill holding area after a confirmed grid ──
function refillHoldingArea() {
  const holding = document.getElementById('holding-area');
  if (!holding) return;

  // Clear current holding icons
  holding.innerHTML = '';

  // Correct count: total minus confirmed minus currently placed
const needed = currentProduct - countConfirmedIcons();  const icons = THEMES[currentTheme];

  for (let i = 0; i < needed; i++) {
    const icon = document.createElement('div');
    icon.classList.add('holding-icon');
    icon.textContent = icons[i % icons.length];
    const angle = Math.random() * 20 - 10;
    icon.style.transform = `rotate(${angle}deg)`;
    icon.style.left = `${8 + Math.random() * 60}%`;
    icon.style.top  = `${5 + Math.random() * 80}%`;
    holding.appendChild(icon);
  }
}

// ── Check if placed icons form a valid rectangle ──
function getPlacedRectangle() {
  const keys = Object.keys(placedIcons).filter(k => !placedIcons[k].confirmed);
  if (keys.length < 2) return null;

  const cols = keys.map(k => parseInt(k.split(',')[0]));
  const rows = keys.map(k => parseInt(k.split(',')[1]));

  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);

  const width  = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const entry = placedIcons[cellKey(c, r)];
      if (!entry || entry.confirmed) return null;
    }
  }

  if (keys.length !== width * height) return null;

  return { rows: height, cols: width, minCol, minRow, maxCol, maxRow };
}

// ── "That's a Grid!" Button ──
checkGridBtn.addEventListener('click', () => {
  const rect = getPlacedRectangle();

  if (!rect) {
    flashHint("That's not quite a rectangle yet — keep arranging! 🌿");
    shakeCanvas();
    return;
  }

  const { rows, cols } = rect;
  const product = rows * cols;

  if (product !== currentProduct) {
    flashHint(`That rectangle has ${product} icons — you need ${currentProduct}! 🌿`);
    shakeCanvas();
    return;
  }

  if (alreadyConfirmed(rows, cols)) {
    flashHint(`You already found a ${rows} × ${cols} grid! Try a different shape. ✨`);
    shakeCanvas();
    return;
  }

  confirmGrid(rect);
});

// ── Confirm a Valid Grid ──
function confirmGrid(rect) {
  const { rows, cols, minCol, minRow, maxCol, maxRow } = rect;

  // Lock icons
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const entry = placedIcons[cellKey(c, r)];
      if (entry) {
        entry.confirmed = true;
        entry.element.classList.remove('placed');
        entry.element.classList.add('confirmed');
      }
    }
  }

  // Draw border
  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  border.style.left   = `${minCol * CELL_SIZE}px`;
  border.style.top    = `${minRow * CELL_SIZE}px`;
  border.style.width  = `${(maxCol - minCol + 1) * CELL_SIZE}px`;
  border.style.height = `${(maxRow - minRow + 1) * CELL_SIZE}px`;
  border.style.position = 'absolute';
  border.style.pointerEvents = 'none';
  border.style.zIndex = '5';
  graphPaper.appendChild(border);

  // Record
  confirmedGrids.push({ rows, cols });

  // Add to sidebar
  const item = document.createElement('div');
  item.classList.add('discovered-item');
  item.textContent = `${rows} × ${cols}`;
  discoveredList.appendChild(item);

  flashHint(`Nice! ${rows} × ${cols} = ${currentProduct} ✓`);

  // Refill holding area with correct count
  refillHoldingArea();

  // Check if all factor pairs found
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    setTimeout(triggerCelebration, 800);
  }
}

// ── "I Found Them All!" Button ──
submitBtn.addEventListener('click', () => {
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    triggerCelebration();
  } else {
    const hint = stillRemaining.map(p => `${p.rows} × ${p.cols}`).join(', ');
    flashHint(`Not quite! You're still missing: ${hint} 🌿`);
  }
});

// ── Hint Button ──
hintBtn.addEventListener('click', () => {
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    flashHint('You found them all! Hit the submit button! 🎉');
  } else {
    const next = stillRemaining[0];
    flashHint(`Try making a rectangle with ${next.rows} rows and ${next.cols} columns 🌿`);
  }
});

// ── Flash hint ──
function flashHint(msg) {
  problemHint.textContent = msg;
  setTimeout(() => {
    if (problemHint.textContent === msg) problemHint.textContent = '';
  }, 4000);
}

// ── Shake canvas ──
function shakeCanvas() {
  graphPaper.classList.add('shake');
  setTimeout(() => graphPaper.classList.remove('shake'), 500);
}

// ── Celebration ──
function triggerCelebration() {
  correctScore++;
  scoreEl.textContent = `✦ ${correctScore} correct`;

  const icons = THEMES[currentTheme];
  celebrationIcons.textContent = icons.slice(0, 4).join(' ');

  const titles = ['Amazing!', 'Brilliant!', 'You did it!', 'Spectacular!'];
  const messages = [
    `You found all ${allFactorPairs.length} ways to arrange ${currentProduct}!`,
    `Every single rectangle — you got them all!`,
    `${currentProduct} has never looked so good!`
  ];

  celebrationTitle.textContent = titles[Math.floor(Math.random() * titles.length)];
  celebrationMsg.textContent   = messages[Math.floor(Math.random() * messages.length)];
  celebrationScreen.classList.remove('hidden');
}

// ── Next Problem ──
nextProblemBtn.addEventListener('click', () => {
  celebrationScreen.classList.add('hidden');
  startNewProblem();
});
