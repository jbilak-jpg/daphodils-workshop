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

// ── Touch detection ──
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// ── DOM References ──
const themeScreen       = document.getElementById('theme-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const app               = document.getElementById('app');
const modeLabel         = document.getElementById('mode-label');
const modeSwitch        = document.getElementById('mode-switch');
const scoreEl           = document.getElementById('session-score');
const productDisplay    = document.getElementById('product-display');
const problemHint       = document.getElementById('problem-hint');
const progressLabel     = document.getElementById('progress-label');
const graphPaper        = document.getElementById('graph-paper');
const hintBtn           = document.getElementById('hint-btn');
const checkGridBtn      = document.getElementById('check-grid-btn');
const freebieBtn        = document.getElementById('freebie-btn');
const factText          = document.getElementById('fact-text');
const discoveredList    = document.getElementById('discovered-list');
const nextProblemBtn    = document.getElementById('next-problem-btn');
const celebrationTitle  = document.getElementById('celebration-title');
const celebrationMsg    = document.getElementById('celebration-message');
const celebrationIcons  = document.getElementById('celebration-icons');
const celebrationExtra  = document.getElementById('celebration-extra');

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

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function isPerfectSquare(n) {
  const s = Math.sqrt(n);
  return Number.isInteger(s);
}

function pickProduct() {
  return Math.floor(Math.random() * 99) + 2;
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

function updateProgress() {
  const found = confirmedGrids.length;
  const total = allFactorPairs.length;
  progressLabel.textContent = `${found} of ${total} rectangle${total !== 1 ? 's' : ''} found`;
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

  productDisplay.textContent = currentProduct;
  problemHint.textContent    = '';
  discoveredList.innerHTML   = '';

  updateProgress();

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

// ── Click/tap a cell ──
function onCellClick(col, row) {
  const key = cellKey(col, row);
  const existing = placedIcons[key];

  if (existing && existing.confirmed) return;

  if (existing) {
    existing.element.remove();
    delete placedIcons[key];
    addOneIconToHolding();
  } else {
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
  icon.textContent         = emoji;
  icon.style.left          = `${col * CELL_SIZE}px`;
  icon.style.top           = `${row * CELL_SIZE}px`;
  icon.style.position      = 'absolute';
  icon.style.zIndex        = '3';
  icon.style.pointerEvents = 'none';

  placedIcons[key] = { element: icon, confirmed: false };
  graphPaper.appendChild(icon);

  if (!isTouch) {
    icon.style.pointerEvents = 'auto';
    icon.style.cursor = 'grab';
    addDragToPlacedIcon(icon, emoji, key);
  }
}

// ── Drag placed icon (desktop) ──
function addDragToPlacedIcon(icon, emoji, key) {
  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const entry = placedIcons[key];
    if (!entry || entry.confirmed) return;

    delete placedIcons[key];
    icon.remove();

    const floater = createFloater(emoji, e.clientX, e.clientY);

    function onMove(e) {
      floater.style.left = `${e.clientX - CELL_SIZE / 2}px`;
      floater.style.top  = `${e.clientY - CELL_SIZE / 2}px`;
    }

    function onUp(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      floater.remove();
      dropAtClientXY(emoji, e.clientX, e.clientY);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Build Holding Area ──
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
}

// ── Create one holding icon ──
function createHoldingIcon(emoji) {
  const icon = document.createElement('div');
  icon.classList.add('holding-icon');
  icon.textContent         = emoji;
  icon.style.left          = `${8 + Math.random() * 55}%`;
  icon.style.top           = `${5 + Math.random() * 80}%`;
  icon.style.transform     = `rotate(${Math.random() * 20 - 10}deg)`;
  icon.style.pointerEvents = 'auto';
  icon.style.cursor        = isTouch ? 'pointer' : 'grab';

  if (!isTouch) {
    icon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const emoji = icon.textContent;
      icon.remove();

      const floater = createFloater(emoji, e.clientX, e.clientY);

      function onMove(e) {
        floater.style.left = `${e.clientX - CELL_SIZE / 2}px`;
        floater.style.top  = `${e.clientY - CELL_SIZE / 2}px`;
      }

      function onUp(e) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        floater.remove();
        dropAtClientXY(emoji, e.clientX, e.clientY);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  return icon;
}

// ── Add one icon back to holding ──
function addOneIconToHolding() {
  const holding = document.getElementById('holding-area');
  if (!holding) return;
  holding.appendChild(createHoldingIcon(randomEmoji()));
}

// ── Drop at screen coordinates ──
function dropAtClientXY(emoji, clientX, clientY) {
  const gpRect = graphPaper.getBoundingClientRect();
  const x = clientX - gpRect.left;
  const y = clientY - gpRect.top;

  if (x >= 0 && y >= 0 && x < gpRect.width && y < gpRect.height) {
    const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / CELL_SIZE)));
    const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / CELL_SIZE)));
    if (placedIcons[cellKey(col, row)]) {
      addOneIconToHolding();
    } else {
      placeIconOnGrid(emoji, col, row);
    }
  } else {
    addOneIconToHolding();
  }
}

// ── Create floating drag element ──
function createFloater(emoji, clientX, clientY) {
  const floater = document.createElement('div');
  floater.classList.add('grid-icon', 'dragging');
  floater.textContent          = emoji;
  floater.style.position       = 'fixed';
  floater.style.left           = `${clientX - CELL_SIZE / 2}px`;
  floater.style.top            = `${clientY - CELL_SIZE / 2}px`;
  floater.style.pointerEvents  = 'none';
  floater.style.zIndex         = '999';
  floater.style.fontSize       = '1.6rem';
  floater.style.width          = `${CELL_SIZE}px`;
  floater.style.height         = `${CELL_SIZE}px`;
  floater.style.display        = 'flex';
  floater.style.alignItems     = 'center';
  floater.style.justifyContent = 'center';
  document.body.appendChild(floater);
  return floater;
}

// ── Freebie Button ──
freebieBtn.addEventListener('click', () => {
  autoConfirmRect(1, currentProduct);
  autoConfirmRect(currentProduct, 1);
  updateProgress();
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) setTimeout(triggerCelebration, 800);
});

// ── Auto-confirm a rectangle ──
function autoConfirmRect(rows, cols) {
  if (alreadyConfirmed(rows, cols)) return;

  const emoji    = randomEmoji();
  const startCol = findFreeStartCol(rows, cols);
  if (startCol === null) return;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = startCol + c;
      const key = cellKey(col, r);
      if (placedIcons[key]) continue;

      const icon = document.createElement('div');
      icon.classList.add('grid-icon', 'confirmed');
      icon.textContent         = emoji;
      icon.style.left          = `${col * CELL_SIZE}px`;
      icon.style.top           = `${r * CELL_SIZE}px`;
      icon.style.position      = 'absolute';
      icon.style.zIndex        = '3';
      icon.style.pointerEvents = 'none';
      graphPaper.appendChild(icon);
      placedIcons[key] = { element: icon, confirmed: true };
    }
  }

  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  border.style.left     = `${startCol * CELL_SIZE}px`;
  border.style.top      = '0px';
  border.style.width    = `${cols * CELL_SIZE}px`;
  border.style.height   = `${rows * CELL_SIZE}px`;
  border.style.position = 'absolute';
  border.style.zIndex   = '5';
  graphPaper.appendChild(border);

  confirmedGrids.push({ rows, cols });
  addSidebarItem(rows, cols, false);
  buildHoldingArea(currentProduct);
}

// ── Find a free starting column for auto-rect ──
function findFreeStartCol(rows, cols) {
  for (let startCol = 0; startCol + cols <= GRID_COLS; startCol++) {
    let free = true;
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placedIcons[cellKey(startCol + c, r)]) {
          free = false;
          break outer;
        }
      }
    }
    if (free) return startCol;
  }
  return null;
}

// ── Add item to sidebar ──
function addSidebarItem(rows, cols, allowFlip) {
  const isSquare = rows === cols;
  const wrapper  = document.createElement('div');
  wrapper.classList.add('discovered-item-wrapper');
  wrapper.dataset.rows = rows;
  wrapper.dataset.cols = cols;

  const item = document.createElement('div');
  item.classList.add('discovered-item');
  if (isSquare) item.classList.add('square-item');
  item.textContent = isSquare ? `${rows} × ${cols} ⬛` : `${rows} × ${cols}`;

  wrapper.appendChild(item);

  // Add flip button if the pair is different and not already confirmed
  if (allowFlip && rows !== cols && !alreadyConfirmed(cols, rows)) {
    const flipBtn = document.createElement('button');
    flipBtn.classList.add('flip-btn');
    flipBtn.textContent = `↔ Flip to ${cols} × ${rows}`;
    flipBtn.addEventListener('click', () => {
      confirmedGrids.push({ rows: cols, cols: rows });
      flipBtn.remove();

      const flippedItem = document.createElement('div');
      flippedItem.classList.add('discovered-item', 'flipped-item');
      flippedItem.textContent = `${cols} × ${rows} ↔`;
      wrapper.appendChild(flippedItem);

      updateProgress();
      flashHint(`Nice! ${cols} × ${rows} is the flip of ${rows} × ${cols} ↔`);

      const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
      if (stillRemaining.length === 0) setTimeout(triggerCelebration, 800);
    });
    wrapper.appendChild(flipBtn);
  }

  discoveredList.appendChild(wrapper);
}

// ── Check rectangle ──
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

// ── "That's a Rectangle!" Button ──
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
    flashHint(`You already found a ${rows} × ${cols} rectangle! Try a different shape. ✨`);
    shakeCanvas();
    return;
  }

  confirmGrid(rect);
});

// ── Confirm a Valid Grid ──
function confirmGrid(rect) {
  const { rows, cols, minCol, minRow, maxCol, maxRow } = rect;
  const isSquare = rows === cols;

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const entry = placedIcons[cellKey(c, r)];
      if (entry) {
        entry.confirmed = true;
        entry.element.classList.remove('placed');
        entry.element.classList.add('confirmed');
        entry.element.style.pointerEvents = 'none';
        entry.element.style.cursor = 'default';
      }
    }
  }

  const border = document.createElement('div');
  border.classList.add('confirmed-border');
  if (isSquare) border.classList.add('square-border');
  border.style.left     = `${minCol * CELL_SIZE}px`;
  border.style.top      = `${minRow * CELL_SIZE}px`;
  border.style.width    = `${(maxCol - minCol + 1) * CELL_SIZE}px`;
  border.style.height   = `${(maxRow - minRow + 1) * CELL_SIZE}px`;
  border.style.position = 'absolute';
  border.style.zIndex   = '5';
  graphPaper.appendChild(border);

  confirmedGrids.push({ rows, cols });
  addSidebarItem(rows, cols, true);
  updateProgress();

  // Show rotation label briefly
  showRotationLabel(rows, cols, minCol, minRow);

  const hintMsg = isSquare
    ? `✨ A perfect square! ${rows} × ${cols} = ${currentProduct}`
    : `Nice! ${rows} rows × ${cols} columns = ${currentProduct} ✓`;
  flashHint(hintMsg);

  if (isSquare) triggerSquareCelebration(rows);

  buildHoldingArea(currentProduct);

  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    setTimeout(triggerCelebration, isSquare ? 2000 : 800);
  }
}

// ── Show rotation label briefly on canvas ──
function showRotationLabel(rows, cols, minCol, minRow) {
  const label = document.createElement('div');
  label.classList.add('rotation-label');
  label.textContent = `${rows} rows × ${cols} columns`;
  label.style.left = `${minCol * CELL_SIZE}px`;
  label.style.top  = `${Math.max(0, minRow * CELL_SIZE - 28)}px`;
  graphPaper.appendChild(label);
  setTimeout(() => label.remove(), 2500);
}

// ── Square celebration popup ──
function triggerSquareCelebration(size) {
  const popup = document.createElement('div');
  popup.classList.add('square-popup');
  popup.innerHTML = `<span class="square-pop-icon">⬛</span><span class="square-pop-text">Perfect Square!<br>${size} × ${size}</span>`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2200);
}

// ── Hint Button ──
hintBtn.addEventListener('click', () => {
  const stillRemaining = allFactorPairs.filter(p => !alreadyConfirmed(p.rows, p.cols));
  if (stillRemaining.length === 0) {
    flashHint('You found them all! 🎉');
  } else {
    const next = stillRemaining.find(p => p.rows !== 1 && p.cols !== 1) || stillRemaining[0];
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

  const prime  = isPrime(currentProduct);
  const square = isPerfectSquare(currentProduct);

  const titles = ['Amazing!', 'Brilliant!', 'You did it!', 'Spectacular!'];
  celebrationTitle.textContent = titles[Math.floor(Math.random() * titles.length)];

  if (prime) {
    celebrationMsg.textContent   = `${currentProduct} is a prime number — its only rectangles are 1 × ${currentProduct} and ${currentProduct} × 1!`;
    celebrationExtra.textContent = '🔢 A prime number can only be divided evenly by 1 and itself. They\'re special!';
    celebrationExtra.classList.remove('hidden');
  } else if (square) {
    celebrationMsg.textContent   = `You found all the rectangles for ${currentProduct} — including a perfect square!`;
    celebrationExtra.textContent = `⬛ ${Math.sqrt(currentProduct)} × ${Math.sqrt(currentProduct)} = ${currentProduct} is a perfect square!`;
    celebrationExtra.classList.remove('hidden');
  } else {
    celebrationMsg.textContent = `You found all ${allFactorPairs.length} rectangles for ${currentProduct}!`;
    celebrationExtra.classList.add('hidden');
  }

  celebrationScreen.classList.remove('hidden');
}

// ── Next Problem ──
nextProblemBtn.addEventListener('click', () => {
  celebrationScreen.classList.add('hidden');
  startNewProblem();
});
