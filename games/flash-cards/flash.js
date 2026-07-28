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
      for (var a = 0; a <= 12; a++) {
        for (var b = 0; b <= 12; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a + b });
        }
      }
    } else if (mode === 'subtraction') {
      for (var a = 1; a <= 20; a++) {
        for (var b = 0; b <= a; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a - b });
        }
      }
    } else if (mode === 'multiplication') {
      for (var a = 2; a <= 12; a++) {
        for (var b = 2; b <= 12; b++) {
          cards.push({ mode: mode, a: a, b: b, answer: a * b });
        }
      }
    } else if (mode === 'division') {
      for (var a = 2; a <= 12; a++) {
        for (var b = 2; b <= 12; b++) {
          cards.push({ mode: mode, a: a * b, b: a, answer: b });
        }
      }
    }
  });
  return cards;
}

function buildDeck(modes) {
  var pool = [];
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

// ── Mallard duck SVG ──
function duckSVG(size, seed) {
  size = size || 32;
  var greens = ['#2d6e2d','#1e6b2e','#2a7a30','#1a5e28'];
  var headGreen = greens[(seed || 0) % greens.length];
  return [
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">',
    '<ellipse cx="17" cy="24" rx="13" ry="9" fill="#8b7355"/>',
    '<ellipse cx="13" cy="24" rx="7" ry="5" fill="#7a6348" transform="rotate(-8 13 24)"/>',
    '<ellipse cx="17" cy="27" rx="10" ry="3.5" fill="#9e8766"/>',
    '<ellipse cx="24" cy="22" rx="6" ry="7" fill="#8b3a1a"/>',
    '<ellipse cx="23" cy="15" rx="4.5" ry="2.5" fill="#fff" opacity="0.9"/>',
    '<circle cx="25" cy="11" r="7" fill="' + headGreen + '"/>',
    '<ellipse cx="23" cy="9" rx="3" ry="1.8" fill="rgba(100,220,120,0.3)" transform="rotate(-20 23 9)"/>',
    '<circle cx="28" cy="10" r="2.2" fill="#111"/>',
    '<circle cx="28.8" cy="9.2" r="0.8" fill="#fff"/>',
    '<rect x="31" y="9.5" width="5" height="3" rx="1.5" fill="#e8a020"/>',
    '<line x1="31" y1="11" x2="36" y2="11" stroke="rgba(0,0,0,0.2)" stroke-width="0.7"/>',
    '<path d="M6,20 Q2,16 4,12 Q6,14 5,18Z" fill="#8b7355"/>',
    '<line x1="13" y1="33" x2="10" y2="35" stroke="#e87010" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="10" y1="35" x2="7"  y2="35" stroke="#e87010" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="10" y1="35" x2="10" y2="37" stroke="#e87010" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="20" y1="33" x2="23" y2="35" stroke="#e87010" stroke-width="2" stroke-linecap="round"/>',
    '<line x1="23" y1="35" x2="26" y2="35" stroke="#e87010" stroke-width="1.5" stroke-linecap="round"/>',
    '<line x1="23" y1="35" x2="23" y2="37" stroke="#e87010" stroke-width="1.5" stroke-linecap="round"/>',
    '</svg>'
  ].join('');
}

// ── Card back SVG (deep teal background) ──
function cardBackSVG() {
  return [
    '<svg width="100%" height="100%" viewBox="0 0 155 217" xmlns="http://www.w3.org/2000/svg">',
    '<rect width="155" height="217" fill="#0e4a4a"/>',
    '<pattern id="dots" patternUnits="userSpaceOnUse" width="14" height="14">',
    '<circle cx="7" cy="7" r="1.4" fill="rgba(201,168,76,0.18)"/>',
    '</pattern>',
    '<rect width="155" height="217" fill="url(#dots)"/>',
    '<text x="18"  y="30"  font-size="13" opacity="0.35" fill="#fff">✦</text>',
    '<text x="128" y="42"  font-size="9"  opacity="0.25" fill="#fff">✦</text>',
    '<text x="8"   y="180" font-size="8"  opacity="0.2"  fill="#fff">✦</text>',
    '<text x="138" y="195" font-size="12" opacity="0.28" fill="#fff">✦</text>',
    '<rect x="8"  y="8"  width="139" height="201" rx="7" fill="none" stroke="rgba(201,168,76,0.6)"  stroke-width="1.5"/>',
    '<rect x="12" y="12" width="131" height="193" rx="5" fill="none" stroke="rgba(201,168,76,0.22)" stroke-width="0.8"/>',
    '<ellipse cx="75" cy="148" rx="52" ry="34" fill="#8b7355"/>',
    '<ellipse cx="52" cy="148" rx="28" ry="17" fill="#7a6348" transform="rotate(-8 52 148)"/>',
    '<ellipse cx="75" cy="158" rx="42" ry="12" fill="#9e8766"/>',
    '<ellipse cx="108" cy="138" rx="22" ry="28" fill="#8b3a1a"/>',
    '<ellipse cx="105" cy="105" rx="16" ry="8" fill="#fff" opacity="0.92"/>',
    '<circle cx="105" cy="88" r="26" fill="#2d6e2d"/>',
    '<ellipse cx="98" cy="80" rx="11" ry="6" fill="rgba(100,220,120,0.25)" transform="rotate(-20 98 80)"/>',
    '<circle cx="116" cy="83" r="8"   fill="#111"/>',
    '<circle cx="118" cy="81" r="3"   fill="#fff"/>',
    '<circle cx="119" cy="80" r="1.2" fill="#aaa"/>',
    '<rect x="128" y="85" width="22" height="9" rx="4" fill="#e8a020"/>',
    '<line x1="128" y1="89.5" x2="150" y2="89.5" stroke="rgba(0,0,0,0.2)" stroke-width="1.2"/>',
    '<path d="M28,138 Q16,122 20,108 Q26,114 23,128Z" fill="#8b7355"/>',
    '<line x1="62"  y1="182" x2="50"  y2="194" stroke="#e87010" stroke-width="4"   stroke-linecap="round"/>',
    '<line x1="50"  y1="194" x2="38"  y2="194" stroke="#e87010" stroke-width="2.5" stroke-linecap="round"/>',
    '<line x1="50"  y1="194" x2="50"  y2="200" stroke="#e87010" stroke-width="2.5" stroke-linecap="round"/>',
    '<line x1="88"  y1="182" x2="100" y2="194" stroke="#e87010" stroke-width="4"   stroke-linecap="round"/>',
    '<line x1="100" y1="194" x2="112" y2="194" stroke="#e87010" stroke-width="2.5" stroke-linecap="round"/>',
    '<line x1="100" y1="194" x2="100" y2="200" stroke="#e87010" stroke-width="2.5" stroke-linecap="round"/>',
    '<text x="78" y="210" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" font-weight="800" fill="rgba(201,168,76,0.65)">Daphodil\'s Workshop</text>',
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
  deck       = buildDeck(selectedModes);
  deckIndex  = 0;
  score      = 0;
  streak     = 0;
  bestStreak = 0;

  scoreNum.textContent  = 0;
  progNum.textContent   = 0;
  paradeRow.innerHTML   = '';
  streakTxt.textContent = '';
  answerInput.value     = '';
  answerInput.disabled  = false;
  submitBtn.disabled    = true;
  actionRow.classList.add('hidden');

  cardFront.classList.remove('glow-correct', 'glow-wrong');
  flashCard.classList.remove('face-up');

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
  if (cardRevealed) return;

  var card  = deck[deckIndex];
  var color = MODE_COLORS[card.mode] || '#888';

  typeBar.style.background  = color;
  typeBarB.style.background = color;
  problemTxt.textContent    = problemText(card);

  cardFront.classList.remove('glow-correct', 'glow-wrong');
  submitted    = false;
  wasCorrect   = false;
  cardRevealed = true;
  answerInput.value    = '';
  answerInput.disabled = false;
  submitBtn.disabled   = true;
  actionRow.classList.add('hidden');

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
  submitted   = true;
  wasCorrect  = correct;

  submitBtn.disabled   = true;
  answerInput.disabled = true;
  stopListening();

  if (correct) {
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    scoreNum.textContent = score;
    cardFront.classList.add('glow-correct');
    addParadeDuck();
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
  submitted            = false;
  wasCorrect           = false;
  answerInput.value    = '';
  answerInput.disabled = false;
  submitBtn.disabled   = true;
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

  flashCard.classList.remove('face-up');
  cardFront.classList.remove('glow-correct', 'glow-wrong');

  if (deckIndex >= deck.length) {
    setTimeout(showDone, 600);
  } else {
    deckLabel.textContent = 'Tap to flip!';
  }
}

function showDone() {
  doneCorrect.textContent = score;
  doneStreak.textContent  = bestStreak;

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

  if (streak > 1) {
    streakTxt.textContent = streak + ' in a row! 🔥';
  } else {
    streakTxt.textContent = '';
  }

  var total = paradeRow.children.length;
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
  try {
    recognition = new SpeechRecog();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onresult = function(e) {
      try {
        var results = e.results[0];
        var raw = null;
        for (var i = 0; i < results.length; i++) {
          var t = results[i].transcript.trim();
          var n = parseSpokenNumber(t);
          if (n !== null) { raw = n; break; }
        }
        if (raw !== null) {
          answerInput.value  = raw;
          submitBtn.disabled = false;
        }
      } catch(err) {}
      stopListening();
    };

    recognition.onerror = function() { stopListening(); };
    recognition.onend   = function() {
      listening = false;
      micBtn.classList.remove('listening');
      recognition = null;
    };

    recognition.start();
    listening = true;
    micBtn.classList.add('listening');

    // Auto-stop after 6 seconds if nothing heard
    setTimeout(function() { if (listening) stopListening(); }, 6000);
  } catch(err) {
    stopListening();
  }
}

function stopListening() {
  if (recognition) {
    try { recognition.stop(); } catch(e) {}
    recognition = null;
  }
  listening = false;
  micBtn.classList.remove('listening');
}

function parseSpokenNumber(text) {
  var map = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
    seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,
    fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100
  };
  text = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  var direct = parseInt(text, 10);
  if (!isNaN(direct)) return direct;
  var words = text.split(/\s+/);
  var total = 0;
  words.forEach(function(w) { if (map[w] !== undefined) total += map[w]; });
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
deckSvgWrap.innerHTML = cardBackSVG();
cardBack.innerHTML    = cardBackSVG();

var modeDuck = document.getElementById('mode-duck');
if (modeDuck) modeDuck.innerHTML = duckSVG(56, 0);
var doneDuck = document.getElementById('done-duck');
if (doneDuck) doneDuck.innerHTML = duckSVG(64, 1);