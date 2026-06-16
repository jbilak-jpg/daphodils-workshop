// ── Theme Definitions ──
const THEMES = {
  forest: ['🦊', '🍄', '🌰', '🦔', '🍃', '🐿️'],
  ocean:  ['🐬', '🪼', '🐚', '🦀', '🐠', '⭐'],
  garden: ['🦋', '🐝', '🌸', '🐛', '🌼', '🐞'],
  night:  ['🦉', '🌙', '✨', '🦇', '🌟', '🔮']
};

// ── Facts Bank ──
// facts.js is loaded before this file and exposes window.FACTS
// Format: FACTS[number] = "fact string"

// ── State ──
let currentTheme   = null;
let currentMode    = 'multiplication'; // 'multiplication' | 'division'
let currentProduct = null;
let correctScore   = 0;
let confirmedGrids = []; // array of { rows, cols } found so far
let allFactorPairs = []; // all valid factor pairs for currentProduct
let placedIcons    = {}; // key: "col,row" → icon element
let holdingIcons   = []; // array of icon elements in holding area

// ── DOM References ──
const themeScreen      = document.getElementById('theme-screen');
const celebrationScreen= document.getElementById('celebration-screen');
const app              = document.getElementById('app');
const modeLabel        = document.getElementById('mode-label');
const modeSwitch       = document.getElementById('mode-switch');
const scoreEl          = document.getElementById('session-score');
const problemText      = document.getElementById('problem-text');
const problemHint      = document.getElementById('problem-hint');
const graphPaper       = document.getElementById('graph-paper');
const hintBtn          = document.getElementById('hint-btn');
const checkGridBtn     = document.getElementById('check-grid-btn');
const submitBtn        = document.getElementById('submit-btn');
const factText         = document.getElementById('fact-text');
const discoveredList   = document.getElementById('discovered-list');
const nextProblemBtn   = document.getElementById('next-problem-btn');
const celebrationTitle = document.getElementById('celebration-title');
const celebrationMsg   = document.getElementById('celebration-message');
const celebrationIcons = document.getElementById('celebration-icons');

// ── Grid Config ──
const CELL_SIZE = 48;
const GRID_COLS = 12;
const GRID_ROWS = 10;

// ── Utility: Get all factor pairs for a number ──
function getFactorPairs(n) {
  const pairs = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) {
      pairs.push({ rows: i, cols: n / i });
    }
  }
  return pairs;
}

// ── Utility: Pick a random product appropriate to the session ──
function pickProduct() {
  // Start with small numbers, pool grows over time
  const pool = [6, 8, 9, 10, 12, 15, 16, 18, 20, 24];
  if (correctScore >= 3)  pool.push(25, 27, 28, 30, 32, 36);
  if (correctScore >= 6)  pool.push(40, 42, 45, 48, 49, 50);
  if (correctScore >= 10) pool.push(54, 56, 60, 63, 64, 72, 81, 100);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Utility: Snap pixel position to nearest grid cell ──
function snapToCell(x, y) {
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / CELL_SIZE))),
    row: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / CELL_SIZE)))
  };
}

// ── Utility: Cell key ──
function cellKey(col, row) {
  return `${col},${row}`;
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

  // Update problem text
  if (currentMode === 'multiplication') {
    problemText.textContent = `Find all the ways to arrange ${currentProduct} icons into a rectangle`;
  } else {
    problemText.textContent = `You have ${currentProduct} icons — how many equal groups can you make?`;
  }

  problemHint.textContent = '';
  discoveredList.innerHTML = '';

  // Update fact
  const fact = (window.FACTS && window.FACTS[currentProduct])
    ? window.FACTS[currentProduct]
    : `${currentProduct} is a wonderful number!`;
  factText.textContent = fact;

  // Clear and rebuild canvas
  graphPaper.innerHTML = '';
  buildHoldingArea();
}

// ── Build Holding Area ──
function buildHoldingArea() {
  // Remove old holding area if present
  const old = document.getElementById('holding-area');
  if (old) old.remove();

  const icons = THEMES[currentTheme];
  holdingIcons = [];

  const holding = document.createElement('div');
  holding.id = 'holding-area';

  // Place icons randomly within holding area
  for (let i = 0; i < currentProduct; i++) {
    const icon = document.createElement('div');
    icon.classList.add('holding-icon');
    icon.textContent = icons[i % icons.length];

    // Random position within holding area (will be constrained by CSS)
    const angle = Math.random() * 20 - 10;
    icon.style.transform = `rotate(${angle}deg)`;
    icon.style.left = `${8 + Math.random() * 60}%`;
    icon.style.top  = `${5 + Math.random() * 80}%`;

    makeDraggableFromHolding(icon);
    holding.appendChild(icon);
    holdingIcons.push(icon);
  }

  // Insert holding area before graph paper container
  const container = document.querySelector('.canvas-container');
  container.parentNode.insertBefore(holding, container);
}

// ── Drag from Holding Area to Graph Paper ──
function makeDraggableFromHolding(icon) {
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const emoji = icon.textContent;

    // Remove from holding area
    icon.remove();
    holdingIcons = holdingIcons.filter(i => i !== icon);

    // Create a floating drag element
    const floater = document.createElement('div');
    floater.classList.add('grid-icon', 'dragging');
    floater.textContent = emoji;
    floater.style.position = 'fixed';
    floater.style.left = `${e.clientX - CELL_SIZE/2}px`;
    floater.style.top  = `${e.clientY - CELL_SIZE/2}px`;
    floater.style.pointerEvents = 'none';
    document.body.appendChild(floater);

    function onMove(e) {
      floater.style.left = `${e.clientX - CELL_SIZE/2}px`;
      floater.style.top  = `${e.clientY - CELL_SIZE/2}px`;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      floater.remove();

      const rect = graphPaper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && y >= 0 && x < rect.width && y < rect.height) {
        // Dropped on graph paper — snap to cell
        placeIconOnGrid(emoji, x, y);
      } else {
        // Dropped outside — return to holding area randomly
        returnToHolding(emoji);
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Place Icon on Grid ──
function placeIconOnGrid(emoji, x, y) {
  const { col, row } = snapToCell(x, y);
  const key = cellKey(col, row);

  // If cell is occupied, bounce back to holding
  if (placedIcons[key]) {
    returnToHolding(emoji);
    return;
  }

  const icon = document.createElement('div');
  icon.classList.add('grid-icon', 'placed');
  icon.textContent = emoji;
  icon.style.left = `${col * CELL_SIZE}px`;
  icon.style.top  = `${row * CELL_SIZE}px`;

  placedIcons[key] = icon;
  graphPaper.appendChild(icon);

  makeDraggableOnGrid(icon, col, row);
}

// ── Drag on Grid (reposition or return to holding) ──
function makeDraggableOnGrid(icon, startCol, startRow) {
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const emoji = icon.textContent;
    const key = cellKey(startCol, startRow);

    // Lift icon off grid
    delete placedIcons[key];
    icon.remove();

    const floater = document.createElement('div');
    floater.classList.add('grid-icon', 'dragging');
    floater.textContent = emoji;
    floater.style.position = 'fixed';
    floater.style.left = `${e.clientX - CELL_SIZE/2}px`;
    floater.style.top  = `${e.clientY - CELL_SIZE/2}px`;
    floater.style.pointerEvents = 'none';
    document.body.appendChild(floater);

    function onMove(e) {
      floater.style.left = `${e.clientX - CELL_SIZE/2}px`;
      floater.style.top  = `${e.clientY - CELL_SIZE/2}px`;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      floater.remove();

      const rect = graphPaper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && y >= 0 && x < rect.width && y < rect.height) {
        placeIconOnGrid(emoji, x, y);
      } else {
        returnToHolding(emoji);
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Return Icon to Holding Area ──
function returnToHolding(emoji) {
  const holding = document.getElementById('holding-area');
  if (!holding) return;

  const icon = document.createElement('div');
  icon.classList.add('holding-icon');
  icon.textContent = emoji;

  const angle = Math.random() * 20 - 10;
  icon.style.transform = `rotate(${angle}deg)`;
  icon.style.left = `${8 + Math.random() * 60}%`;
  icon.style.top  = `${5 + Math.random() * 80}%`;

  makeDraggableFromHolding(icon);
  holding.appendChild(icon);
  holdingIcons.push(icon);
}

// ── Check if placed icons form a valid rectangle ──
function getPlacedRectangle() {
  const keys = Object.keys(placedIcons);
  if (keys.length < 2) return null;

  const cols = keys.map(k => parseInt(k.split(',')[0]));
  const rows = keys.map(k => parseInt(k.split(',')[1]));

  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);

  const width  = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;

  // Check every cell in the bounding box is filled
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (!placedIcons[cellKey(c, r)]) return null;
    }
  }

  // Check no extra icons outside the rectangle
  if (keys.length !== width * height) return null;

  return { rows: height, cols: width, minCol, minRow, maxCol, maxRow };
}

// ── Check if this grid was already confirmed ──
function alreadyConfirmed(rows, cols) {
  return confirmedGrids.some(g => g.rows === rows && g.cols === cols);
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

  // Valid new grid!
  confirmGrid(rect);
});

// ── Confirm a Valid Grid ──
function confirmGrid(rect) {
  const { rows, cols, minCol, minRow, maxCol, maxRow } = rect;

  // Highlight confirmed icons
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const icon = placedIcons[cellKey(c, r)];
      if (icon) {
        icon.classList.remove('placed');
        icon.classList.add('confirmed');
        icon.style.pointerEvents = 'none';
      }
    }
  }

  // Draw border around confirmed grid
  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  border.style.left   = `${minCol * CELL_SIZE}px`;
  border.style.top    = `${minRow * CELL_SIZE}px`;
  border.style.width  = `${(maxCol - minCol + 1) * CELL_SIZE}px`;
  border.style.height = `${(maxRow - minRow + 1) * CELL_SIZE}px`;
  graphPaper.appendChild(border);

  // Add to confirmed list
  confirmedGrids.push({ rows, cols });
  placedIcons = {};

  // Add to sidebar
  const item = document.createElement('div');
  item.classList.add('discovered-item');
  item.textContent = `${rows} × ${cols}`;
  discoveredList.appendChild(item);

  problemHint.textContent = `Nice! ${rows} × ${cols} = ${currentProduct} ✓`;

  // Figure out how many icons are still unaccounted for
  const totalConfirmed = confirmedGrids.reduce((sum, g) => sum + g.rows * g.cols, 0);
  const remaining = currentProduct - totalConfirmed;

  // Repopulate holding area with remaining icons
  const holding = document.getElementById('holding-area');
  if (holding && remaining > 0) {
    const icons = THEMES[currentTheme];
    for (let i = 0; i < remaining; i++) {
      const newIcon = document.createElement('div');
      newIcon.classList.add('holding-icon');
      newIcon.textContent = icons[i % icons.length];
      const angle = Math.random() * 20 - 10;
      newIcon.style.transform = `rotate(${angle}deg)`;
      newIcon.style.left = `${8 + Math.random() * 60}%`;
      newIcon.style.top  = `${5 + Math.random() * 80}%`;
      makeDraggableFromHolding(newIcon);
      holding.appendChild(newIcon);
    }
  }

  // Check if all factor pairs found
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    setTimeout(triggerCelebration, 600);
  }
} rect;

  // Highlight confirmed icons
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const icon = placedIcons[cellKey(c, r)];
      if (icon) {
        icon.classList.remove('placed');
        icon.classList.add('confirmed');
      }
    }
  }

  // Draw border around confirmed grid
  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  border.style.left   = `${minCol * CELL_SIZE}px`;
  border.style.top    = `${minRow * CELL_SIZE}px`;
  border.style.width  = `${(maxCol - minCol + 1) * CELL_SIZE}px`;
  border.style.height = `${(maxRow - minRow + 1) * CELL_SIZE}px`;
  graphPaper.appendChild(border);

  // Add to confirmed list
  confirmedGrids.push({ rows, cols });
  placedIcons = {};

  // Return remaining unplaced count to holding area
  const totalPlaced = confirmedGrids.reduce((sum, g) => sum + g.rows * g.cols, 0);
  const remaining = currentProduct - totalPlaced;
  const icons = THEMES[currentTheme];
  const holding = document.getElementById('holding-area');
  for (let i = 0; i < remaining; i++) {
    const icon = document.createElement('div');
    icon.classList.add('holding-icon');
    icon.textContent = icons[i % icons.length];
    const angle = Math.random() * 20 - 10;
    icon.style.transform = `rotate(${angle}deg)`;
    icon.style.left = `${8 + Math.random() * 60}%`;
    icon.style.top  = `${5 + Math.random() * 80}%`;
    makeDraggableFromHolding(icon);
    holding.appendChild(icon);
  }

  // Add to sidebar
  const item = document.createElement('div');
  item.classList.add('discovered-item');
  item.textContent = `${rows} × ${cols}`;
  discoveredList.appendChild(item);

  problemHint.textContent = `Nice! ${rows} × ${cols} = ${currentProduct} ✓`;

  // Check if all factor pairs found
  const remaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (remaining.length === 0) {
    setTimeout(triggerCelebration, 600);
  }
}

// ── "I Found Them All!" Button ──
submitBtn.addEventListener('click', () => {
  const remaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));

  if (remaining.length === 0) {
    triggerCelebration();
  } else {
    const hint = remaining.map(p => `${p.rows} × ${p.cols}`).join(', ');
    flashHint(`Not quite! You're still missing: ${hint} 🌿`);
  }
});

// ── Hint Button ──
hintBtn.addEventListener('click', () => {
  const remaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (remaining.length === 0) {
    flashHint('You found them all! Hit the submit button! 🎉');
  } else {
    const next = remaining[0];
    flashHint(`Try making a rectangle with ${next.rows} rows and ${next.cols} columns 🌿`);
  }
});

// ── Flash a hint message ──
function flashHint(msg) {
  problemHint.textContent = msg;
  setTimeout(() => {
    if (problemHint.textContent === msg) problemHint.textContent = '';
  }, 4000);
}

// ── Shake the canvas ──
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

  const messages = [
    `You found all ${allFactorPairs.length} ways to arrange ${currentProduct}!`,
    `Every single rectangle — you got them all!`,
    `${currentProduct} has never looked so good!`
  ];

  celebrationTitle.textContent = ['Amazing!', 'Brilliant!', 'You did it!', 'Spectacular!'][Math.floor(Math.random() * 4)];
  celebrationMsg.textContent = messages[Math.floor(Math.random() * messages.length)];

  celebrationScreen.classList.remove('hidden');
}

// ── Next Problem ──
nextProblemBtn.addEventListener('click', () => {
  celebrationScreen.classList.add('hidden');
  startNewProblem();
});