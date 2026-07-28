'use strict';

// ── Card generation ──
var MODE_COLORS = {
  addition:       '#4e9a66',
  subtraction:    '#4e7a9a',
  multiplication: '#9a4e9a',
  division:       '#9a6e4e'
};

function makeCards(modes) {
  var cards = [];
  modes.forEach(function(mode) {
    if (mode === 'addition') {
      // a + b, a and b 1–12
      for (var a = 1; a <= 12; a++) {
        for (var b = a; b <= 12; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a + b });
          if (cards.length >= 52) return;
        }
      }
    } else if (mode === 'subtraction') {
      for (var a = 2; a <= 13; a++) {
        for (var b = 1; b < a; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a - b });
          if (cards.length >= 52) return;
        }
      }
    } else if (mode === 'multiplication') {
      for (var a = 2; a <= 12; a++) {
        for (var b = 2; b <= 12; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a * b });
          if (cards.length >= 52) return;
        }
      }
    } else if (mode === 'division') {
      for (var a = 2; a <= 12; a++) {
        for (var b = 2; b <= 12; b++) {
          cards.push({ mode: mode, a: a * b, b: a, answer: b });
          if (cards.length >= 52) return;
        }
      }
    }
  });
  return cards;
}

function buildDeck(modes) {
  var pool = [];
  // If multiple modes, interleave
  var perMode = Math.ceil(52 / modes.length);
  modes.forEach(function(mode) {
    var sub = makeCards([mode]);
    shuffle(sub);
    pool = pool.concat(sub.slice(0, perMode));
  });
  shuffle(pool);
  return pool.slice(0, 52);
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
}

function symFor(mode) {
  if (mode === 'addition')       return '+';
  if (mode === 'subtraction')    return '−';
  if (mode === 'multiplication') return '×';
  if (mode === 'division')       return '÷';
  return '?';
}

function problemText(card) {
  return card.a + ' ' + symFor(card.mode) + ' ' + card.b;
}

// ── Duck SVG ──
function duckSVG(size, seed) {
  size = size || 32;
  // Vary body/beak color slightly by seed
  var bodies = ['#f5c842','#f0b830','#f7d050','#e8b820'];
  var body = bodies[(seed || 0) % bodies.length];
  var s = size;
  var bh = Math.round(s * 0.62);
  var hx = Math.round(s * 0.52);
  var hy = Math.round(s * 0.28);
  var hr = Math.round(s * 0.2);
  return [
    '<svg width="' + s + '" height="' + s + '" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">',
    // body
    '<ellipse cx="16" cy="22" rx="12" ry="8" fill="' + body + '"/>',
    // wing
    '<ellipse cx="10" cy="22" rx="5" ry="3.5" fill="rgba(0,0,0,0.10)" transform="rotate(-12 10 22)"/>',
    // head
    '<circle cx="' + hx + '" cy="' + hy + '" r="' + hr + '" fill="' + body + '"/>',
    // eye
    '<circle cx="' + (hx+4) + '" cy="' + (hy-2) + '" r="2.2" fill="#1a1a1a"/>',
    '<circle cx="' + (hx+5) + '" cy="' + (hy-3) + '" r="0.75" fill="#fff"/>',
    // beak
    '<polygon points="' + (hx+hr-1) + ',' + hy + ' ' + (hx+hr+7) + ',' + (hy+1) + ' ' + (hx+hr-1) + ',' + (hy+4) + '" fill="#e8840a"/>',
    // feet
    '<line x1="13" y1="30" x2="10" y2="32" stroke="#e8840a" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="18" y1="30" x2="21" y2="32" stroke="#e8840a" stroke-width="1.5" stroke-linecap="round"/>',
    '</svg>'
  ].join('');
}

// Card back — large duck art
function cardBackSVG() {
  return [
    '<svg width="100%" height="100%" viewBox="0 0 155 217" xmlns="http://www.w3.org/2000/svg">',
    // Background pattern dots
    '<pattern id="dots" patternUnits="userSpaceOnUse" width="14" height="14">',
    '<circle cx="7" cy="7" r="1.4" fill="rgba(201,168,76,0.18)"/>',
    '</pattern>',
    '<rect width="155" height="217" fill="url(#dots)"/>',
    // Stars
    '<text x="18" y="30" font-size="13" opacity="0.35">✦</text>',
    '<text x="128" y="42" font-size="9" opacity="0.28">✦</text>',
    '<text x="8" y="180" font-size="8" opacity="0.22">✦</text>',
    '<text x="138" y="195" font-size="12" opacity="0.3">✦</text>',
    // Gold border frame
    '<rect x="8" y="8" width="139" height="201" rx="7" ry="7" fill="none" stroke="rgba(201,168,76,0.55)" stroke-width="1.5"/>',
    '<rect x="12" y="12" width="131" height="193" rx="5" ry="5" fill="none" stroke="rgba(201,168,76,0.25)" stroke-width="0.8"/>',
    // Main duck body
    '<ellipse cx="78" cy="135" rx="52" ry="36" fill="#f5c842"/>',
    // Wing detail
    '<ellipse cx="52" cy="138" rx="22" ry="14" fill="rgba(0,0,0,0.1)" transform="rotate(-10 52 138)"/>',
    // Head
    '<circle cx="105" cy="90" r="30" fill="#f5c842"/>',
    // Eye
    '<circle cx="116" cy="82" r="8" fill="#1a1a1a"/>',
    '<circle cx="119" cy="79" r="3" fill="#fff"/>',
    '<circle cx="120" cy="78" r="1.2" fill="#aaa"/>',
    // Cheek blush
    '<ellipse cx="112" cy="91" rx="7" ry="4.5" fill="rgba(230,100,80,0.22)"/>',
    // Beak
    '<polygon points="132,90 150,95 132,104" fill="#e8840a"/>',
    '<line x1="132" y1="97" x2="150" y2="97" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>',
    // Feet
    '<line x1="65" y1="171" x2="52" y2="185" stroke="#e8840a" stroke-width="3.5" stroke-linecap="round"/>',
    '<line x1="65" y1="185" x2="52" y2="185" stroke="#e8840a" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="52" y1="185" x2="46" y2="185" stroke="#e8840a" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="90" y1="171" x2="103" y2="185" stroke="#e8840a" stroke-width="3.5" stroke-linecap="round"/>',
    '<line x1="103" y1="185" x2="110" y2="185" stroke="#e8840a" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="110" y1="185" x2="116" y2="185" stroke="#e8840a" stroke-width="2" stroke-linecap="round"/>',
    // Hat
    '<ellipse cx="105" cy="64" rx="33" ry="7" fill="#2d1b4e"/>',
    '<rect x="88" y="22" width="34" height="44" rx="5" fill="#2d1b4e"/>',
    '<rect x="90" y="28" width="10" height="24" rx="3" fill="rgba(201,168,76,0.3)"/>',
    // Label at bottom
    '<text x="78" y="208" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" font-weight="800" fill="rgba(201,168,76,0.6)">Daphodil\'s Workshop</text>',
    '</svg>'
  ].join('');
}

// ── State ──
var selectedModes = [];
var deck          = [];
var deckIndex     = 0;
var score         = 0;
var streak        = 0;
var bestStreak    = 0;
var cardRevealed  = false;
var submitted     = false;
var wasCorrect    = false;

// ── Elements ──
var modeScreen   = document.getElementById('mode-screen');
var gameScreen   = document.getElementById('game-screen');
var doneScreen   = document.getElementById('done-screen');
var dealBtn      = document.getElementById('deal-btn');
var modeBtns     = document.querySelectorAll('.mode-btn');
var navBack      = document.getElementById('nav-back');
var progNum      = document.getElementById('prog-num');
var scoreNum     = document.getElementById('score-num');
var deckStack    = document.getElementById('deck-stack');
var deckSvgWrap  = document.getElementById('deck-svg-wrap');
var deckCountEl  = document.getElementById('deck-count');
var deckLabel    = document.getElementById('deck-label');
var cardScene    = document.getElementById('card-scene');
var flashCard    = document.getElementById('flash-card');
var cardBack     = document.getElementById('card-back');
var cardFront    = document.getElementById('card-front');
var typeBar      = document.getElementById('type-bar');
var typeBarB     = document.getElementById('type-bar-b');
var problemTxt   = document.getElementById('problem-text');
var answerInput  = document.getElementById('answer-input');
var micBtn       = document.getElementById('mic-btn');
var submitBtn    = document.getElementById('submit-btn');
var actionRow    = document.getElementById('action-row');
var retryBtn     = document.getElementById('retry-btn');
var nextBtn      = document.getElementById('next-btn');
var paradeRow    = document.getElementById('parade-row');
var streakTxt    = document.getElementById('streak-txt');
var doneCorrect  = document.getElementById('done-correct');
var doneStreak   = document.getElementById('done-streak');
var doneParade   = document.getElementById('done-parade');
var playAgainBtn = document.getElementById('play-again-btn');

// ── Mode selection ──
modeBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var mode = btn.dataset.mode;
    var idx  = selectedModes.indexOf(mode);
    if (idx === -1) {
      selectedModes.push(mode);
      btn.classList.add('selected');
    } else {
      selectedModes.splice(idx, 1);
      btn.classList.remove('selected');
    }
    dealBtn.disabled = selectedModes.length === 0;
  });
});

dealBtn.addEventListener('click', startGame);
navBack.addEventListener('click', goToMode);
playAgainBtn.addEventListener('click', goToMode);

function goToMode() {
  showScreen(modeScreen);
  stopListening();
}

function startGame() {
  deck      = buildDeck(selectedModes);
  deckIndex = 0;
  score     = 0;
  streak    = 0;
  bestStreak = 0;

  scoreNum.textContent = 0;
  progNum.textContent  = 0;
  paradeRow.innerHTML  = '';
  streakTxt.textContent = '';
  answerInput.value    = '';
  submitBtn.disabled   = true;
  actionRow.classList.add('hidden');

  cardFront.classList.remove('glow-correct', 'glow-wrong');
  flashCard.classList.remove('face-up');

  // Fill deck with back art
  deckSvgWrap.innerHTML = cardBackSVG();
  updateDeckCount();
  deckStack.classList.remove('empty');
  deckLabel.textContent = 'Tap to flip!';

  showScreen(gameScreen);
  setTimeout(function() { answerInput.focus(); }, 300);
}

function updateDeckCount() {
  var remaining = deck.length - deckIndex;
  deckCountEl.textContent = remaining;
  if (remaining === 0) {
    deckStack.classList.add('empty');
    deckLabel.textContent = 'All done!';
  }
}

// ── Flip a card ──
deckStack.addEventListener('click', flipCard);
deckStack.addEventListener('touchend', function(e) {
  e.preventDefault();
  flipCard();
}, { passive: false });

function flipCard() {
  if (deckIndex >= deck.length) return;
  if (cardRevealed) return; // card already out, wait for next

  var card = deck[deckIndex];
  var color = MODE_COLORS[card.mode] || '#888';

  // Set front face content
  typeBar.style.background  = color;
  typeBarB.style.background = color;
  problemTxt.textContent    = problemText(card);

  // Reset glow and state
  cardFront.classList.remove('glow-correct', 'glow-wrong');
  submitted    = false;
  wasCorrect   = false;
  cardRevealed = true;
  answerInput.value = '';
  submitBtn.disabled = true;
  actionRow.classList.add('hidden');

  // Flip animation
  flashCard.classList.add('face-up');

  deckIndex++;
  progNum.textContent = deckIndex;
  updateDeckCount();

  answerInput.focus();
}

// ── Answer input ──
answerInput.addEventListener('input', function() {
  submitBtn.disabled = answerInput.value.trim() === '' || !cardRevealed || submitted;
});

answerInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !submitBtn.disabled) submitAnswer();
});

submitBtn.addEventListener('click', submitAnswer);

function submitAnswer() {
  if (!cardRevealed || submitted) return;
  var val = parseInt(answerInput.value.trim(), 10);
  if (isNaN(val)) return;

  var card    = deck[deckIndex - 1];
  var correct = (val === card.answer);
  submitted  = true;
  wasCorrect = correct;

  submitBtn.disabled = true;
  answerInput.disabled = true;
  stopListening();

  if (correct) {
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreNum.textContent = score;

    cardFront.classList.add('glow-correct');
    addParadeDuck();

    // Auto-advance after 1.2 s if correct
    setTimeout(advanceCard, 1200);
  } else {
    streak = 0;
    scoreNum.textContent = score;
    cardFront.classList.add('glow-wrong');
    clearParade();
    actionRow.classList.remove('hidden');
  }
}

retryBtn.addEventListener('click', function() {
  cardFront.classList.remove('glow-correct', 'glow-wrong');
  actionRow.classList.add('hidden');
  submitted = false;
  wasCorrect = false;
  answerInput.value = '';
  answerInput.disabled = false;
  submitBtn.disabled = true;
  answerInput.focus();
});

nextBtn.addEventListener('click', function() {
  cardFront.classList.remove('glow-correct', 'glow-wrong');
  actionRow.classList.add('hidden');
  advanceCard();
});

function advanceCard() {
  answerInput.disabled = false;
  answerInput.value    = '';
  submitBtn.disabled   = true;
  submitted    = false;
  wasCorrect   = false;
  cardRevealed = false;

  // Flip back
  flashCard.classList.remove('face-up');
  cardFront.classList.remove('glow-correct', 'glow-wrong');

  if (deckIndex >= deck.length) {
    setTimeout(showDone, 500);
  } else {
    deckLabel.textContent = 'Tap to flip!';
  }
}

function showDone() {
  doneCorrect.textContent = score;
  doneStreak.textContent  = bestStreak;

  // Fill done parade with one duck per correct answer
  doneParade.innerHTML = '';
  for (var i = 0; i < score; i++) {
    var el = document.createElement('span');
    el.className = 'parade-duck';
    el.innerHTML = duckSVG(28, i);
    el.style.animationDelay = (i * 0.045) + 's';
    doneParade.appendChild(el);
  }

  showScreen(doneScreen);
}

// ── Duck parade ──
function addParadeDuck() {
  var el = document.createElement('span');
  el.className = 'parade-duck';
  el.innerHTML = duckSVG(30, streak);
  paradeRow.appendChild(el);

  var total = paradeRow.children.length;
  if (streak > 1) {
    streakTxt.textContent = streak + ' in a row! 🔥';
  } else {
    streakTxt.textContent = '';
  }

  // Cap parade at 20 ducks; remove oldest
  if (total > 20) {
    var first = paradeRow.children[0];
    first.classList.add('leaving');
    setTimeout(function() { if (first.parentNode) first.parentNode.removeChild(first); }, 350);
  }
}

function clearParade() {
  var ducks = paradeRow.querySelectorAll('.parade-duck:not(.leaving)');
  ducks.forEach(function(d) {
    d.classList.add('leaving');
    setTimeout(function() { if (d.parentNode) d.parentNode.removeChild(d); }, 350);
  });
  streakTxt.textContent = '';
}

// ── Speech recognition ──
var recognition = null;
var listening   = false;

var SpeechRecog = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecog) {
  micBtn.style.display = 'none';
}

micBtn.addEventListener('click', function() {
  if (listening) { stopListening(); return; }
  startListening();
});

function startListening() {
  if (!SpeechRecog || !cardRevealed || submitted) return;
  recognition = new SpeechRecog();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  recognition.onresult = function(e) {
    var results = e.results[0];
    var raw = null;
    for (var i = 0; i < results.length; i++) {
      var t = results[i].transcript.trim();
      var n = parseSpokenNumber(t);
      if (n !== null) { raw = n; break; }
    }
    if (raw !== null) {
      answerInput.value = raw;
      submitBtn.disabled = false;
    }
    stopListening();
  };

  recognition.onerror = function() { stopListening(); };
  recognition.onend   = function() { listening = false; micBtn.classList.remove('listening'); };

  recognition.start();
  listening = true;
  micBtn.classList.add('listening');
}

function stopListening() {
  if (recognition) { try { recognition.stop(); } catch(e){} recognition = null; }
  listening = false;
  micBtn.classList.remove('listening');
}

function parseSpokenNumber(text) {
  // Handle simple spoken numbers: "twelve", "forty two", "7", etc.
  var map = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
    seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,
    fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100
  };
  text = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  // Try direct integer first
  var direct = parseInt(text, 10);
  if (!isNaN(direct)) return direct;
  var words = text.split(/\s+/);
  var total = 0;
  words.forEach(function(w) {
    if (map[w] !== undefined) total += map[w];
  });
  return total > 0 ? total : null;
}

// ── Screen transitions ──
function showScreen(el) {
  [modeScreen, gameScreen, doneScreen].forEach(function(s) {
    s.classList.add('hidden');
  });
  el.classList.remove('hidden');
}

// ── Init ──
// Render card backs in deck on load
deckSvgWrap.innerHTML = cardBackSVG();
cardBack.innerHTML    = cardBackSVG();

// Also render mode duck
var modeDuck = document.getElementById('mode-duck');
if (modeDuck) modeDuck.innerHTML = duckSVG(56, 0);
var doneDuck = document.getElementById('done-duck');
if (doneDuck) doneDuck.innerHTML = duckSVG(64, 1);
