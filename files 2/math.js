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
let placedIcons    = {}; // key: "col,row" → { element, confirmed }

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
const GRID_COLS = 110;
const GRID_ROWS = 110;

// ── Utility ──
function getFactorPairs(n) {
  const pairs = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) pairs.push({ rows: i, cols: n / i });
  }
  return pairs;
}

function pickProduct() {
  const pool = [6, 8, 9, 10, 12, 15, 16, 18, 20, 24];
  if (correctScore >= 3)  pool.push(25, 27, 28, 30, 32, 36);
  if (correctScore >= 6)  pool.push(40, 42, 45, 48, 49, 50);
  if (correctScore >= 10) pool.push(54, 56, 60, 63, 64, 72, 81, 100);
  return pool[Math.floor(Math.random() * pool.length)];
}

function cellKey(col, row) { return `${col},${row}`; }

function alreadyConfirmed(rows, cols) {
  return confirmedGrids.some(g => g.rows === rows && g.cols === cols);
}

function getThemeEmojis() { return THEMES[currentTheme]; }

function randomEmoji() {
  const icons = getThemeEmojis();
  return icons[Math.floor(Math.random() * icons.length)];
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
  allFactorPairs = getFactorPairs(currentProduct);

  // Clear only unconfirmed icons from placedIcons
  placedIcons = {};

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
  buildHoldingArea(currentProduct);
}

// ── Build Graph Paper Cells ──
function buildGraphPaperCells() {
  graphPaper.style.width    = `${GRID_COLS * CELL_SIZE}px`;
  graphPaper.style.height   = `${GRID_ROWS * CELL_SIZE}px`;
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
      cell.addEventListener('click', () => onCellClick(c, r));
      graphPaper.appendChild(cell);
    }
  }
}

// ── Click a cell to place or remove an icon ──
function onCellClick(col, row) {
  const key = cellKey(col, row);
  const existing = placedIcons[key];

  if (existing && existing.confirmed) return; // locked, ignore

  if (existing) {
    // Return to holding
    existing.element.remove();
    delete placedIcons[key];
    addOneIconToHolding();
  } else {
    // Place from holding if available
    const holding = document.getElementById('holding-area');
    if (!holding) return;
    const available = holding.querySelector('.holding-icon');
    if (!available) return;
    const emoji = available.textContent;
    available.remove();
    placeIconOnGrid(emoji, col, row);
  }
}

// ── Place Icon on Grid ──
function placeIconOnGrid(emoji, col, row) {
  const key = cellKey(col, row);
  if (placedIcons[key]) return;

  const icon = document.createElement('div');
  icon.classList.add('grid-icon', 'placed');
  icon.textContent     = emoji;
  icon.style.left      = `${col * CELL_SIZE}px`;
  icon.style.top       = `${row * CELL_SIZE}px`;
  icon.style.position  = 'absolute';
  icon.style.zIndex    = '3';
  icon.style.pointerEvents = 'auto';
  icon.style.cursor    = 'grab';

  placedIcons[key] = { element: icon, confirmed: false };
  graphPaper.appendChild(icon);

  // Allow dragging placed icons to new cells or back to holding
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const entry = placedIcons[key];
    if (entry && entry.confirmed) return;

    // Lift icon off grid
    delete placedIcons[key];
    icon.remove();

    const floater = createFloater(emoji, e);

    function onMove(e) {
      floater.style.left = `${e.clientX - CELL_SIZE / 2}px`;
      floater.style.top  = `${e.clientY - CELL_SIZE / 2}px`;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      floater.remove();

      const gpRect = graphPaper.getBoundingClientRect();
      const x = e.clientX - gpRect.left;
      const y = e.clientY - gpRect.top;

      if (x >= 0 && y >= 0 && x < gpRect.width && y < gpRect.height) {
        const newCol = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / CELL_SIZE)));
        const newRow = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / CELL_SIZE)));
        const newKey = cellKey(newCol, newRow);
        if (placedIcons[newKey]) {
          addOneIconToHolding();
        } else {
          placeIconOnGrid(emoji, newCol, newRow);
        }
      } else {
        addOneIconToHolding();
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Build Holding Area with n icons ──
function buildHoldingArea(count) {
  const old = document.getElementById('holding-area');
  if (old) old.remove();

  const holding = document.createElement('div');
  holding.id = 'holding-area';

  const icons = getThemeEmojis();
  for (let i = 0; i < count; i++) {
    holding.appendChild(createHoldingIcon(icons[i % icons.length]));
  }

  const canvasRow = document.querySelector('.canvas-row');
  canvasRow.insertBefore(holding, canvasRow.firstChild);

  // Make holding area a drop target for dragging icons back
  holding.addEventListener('mouseup', () => {});
}

// ── Create one holding icon element ──
function createHoldingIcon(emoji) {
  const icon = document.createElement('div');
  icon.classList.add('holding-icon');
  icon.textContent = emoji;
  icon.style.left  = `${8 + Math.random() * 55}%`;
  icon.style.top   = `${5 + Math.random() * 80}%`;
  icon.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
  makeDraggable(icon);
  return icon;
}

// ── Add one icon back to holding area ──
function addOneIconToHolding() {
  const holding = document.getElementById('holding-area');
  if (!holding) return;
  holding.appendChild(createHoldingIcon(randomEmoji()));
}

// ── Make a holding icon draggable ──
function makeDraggable(icon) {
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const emoji = icon.textContent;
    icon.remove();

    const floater = createFloater(emoji, e);

    function onMove(e) {
      floater.style.left = `${e.clientX - CELL_SIZE / 2}px`;
      floater.style.top  = `${e.clientY - CELL_SIZE / 2}px`;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      floater.remove();

      const gpRect = graphPaper.getBoundingClientRect();
      const x = e.clientX - gpRect.left;
      const y = e.clientY - gpRect.top;

      if (x >= 0 && y >= 0 && x < gpRect.width && y < gpRect.height) {
        const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / CELL_SIZE)));
        const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / CELL_SIZE)));
        const key = cellKey(col, row);
        if (placedIcons[key]) {
          addOneIconToHolding(); // cell occupied, return
        } else {
          placeIconOnGrid(emoji, col, row);
        }
      } else {
        addOneIconToHolding(); // dropped outside, return
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Create floating drag element ──
function createFloater(emoji, e) {
  const floater = document.createElement('div');
  floater.classList.add('grid-icon', 'dragging');
  floater.textContent      = emoji;
  floater.style.position   = 'fixed';
  floater.style.left       = `${e.clientX - CELL_SIZE / 2}px`;
  floater.style.top        = `${e.clientY - CELL_SIZE / 2}px`;
  floater.style.pointerEvents = 'none';
  floater.style.zIndex     = '999';
  floater.style.fontSize   = '1.6rem';
  floater.style.width      = `${CELL_SIZE}px`;
  floater.style.height     = `${CELL_SIZE}px`;
  floater.style.display    = 'flex';
  floater.style.alignItems = 'center';
  floater.style.justifyContent = 'center';
  document.body.appendChild(floater);
  return floater;
}

// ── Check if unconfirmed placed icons form a valid rectangle ──
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

  // Lock icons in place
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

  // Draw border around confirmed grid
  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  border.style.left     = `${minCol * CELL_SIZE}px`;
  border.style.top      = `${minRow * CELL_SIZE}px`;
  border.style.width    = `${(maxCol - minCol + 1) * CELL_SIZE}px`;
  border.style.height   = `${(maxRow - minRow + 1) * CELL_SIZE}px`;
  border.style.position = 'absolute';
  border.style.zIndex   = '5';
  graphPaper.appendChild(border);

  // Record confirmed grid
  confirmedGrids.push({ rows, cols });

  // Add to sidebar
  const item = document.createElement('div');
  item.classList.add('discovered-item');
  item.textContent = `${rows} × ${cols}`;
  discoveredList.appendChild(item);

  flashHint(`Nice! ${rows} × ${cols} = ${currentProduct} ✓`);

  // Always give a full fresh set of icons for the next attempt
  buildHoldingArea(currentProduct);

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

  const icons = getThemeEmojis();
  celebrationIcons.textContent = icons.slice(0, 4).join(' ');

  const titles   = ['Amazing!', 'Brilliant!', 'You did it!', 'Spectacular!'];
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
