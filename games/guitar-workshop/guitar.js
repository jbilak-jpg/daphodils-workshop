'use strict';

// ── Constants ──
const BEATS  = 8;
const LABELS = ['1', '+', '2', '+', '3', '+', '4', '+'];
const CYCLE  = ['empty', 'down', 'up', 'ghost-down', 'ghost-up'];

// ── Measure factory ──
function newMeasure() {
  return { beats: Array(BEATS).fill('empty'), chords: Array(BEATS).fill('') };
}

// ── Arrow SVG — single path for clean black outline on solid arrows ──
function arrowSVG(dir, ghost, w, h) {
  w = w || 36; h = h || 72;
  var color   = dir === 'down' ? '#c9a84c' : '#9b7fd4';
  var opacity = ghost ? 0.22 : 1;
  var cx  = w / 2;
  var sw  = Math.round(w * 0.25);  // stem width
  var hw  = Math.round(w * 0.45);  // head half-width
  var d;

  if (dir === 'down') {
    var sEnd = h - hw - 3;
    d = 'M' + (cx-sw/2) + ',2'
      + ' L' + (cx+sw/2) + ',2'
      + ' L' + (cx+sw/2) + ',' + sEnd
      + ' L' + (cx+hw)   + ',' + sEnd
      + ' L' + cx         + ',' + (h-1)
      + ' L' + (cx-hw)   + ',' + sEnd
      + ' L' + (cx-sw/2) + ',' + sEnd
      + ' Z';
  } else {
    var sStart = hw + 3;
    d = 'M' + cx             + ',1'
      + ' L' + (cx+hw)       + ',' + sStart
      + ' L' + (cx+sw/2)     + ',' + sStart
      + ' L' + (cx+sw/2)     + ',' + (h-2)
      + ' L' + (cx-sw/2)     + ',' + (h-2)
      + ' L' + (cx-sw/2)     + ',' + sStart
      + ' L' + (cx-hw)       + ',' + sStart
      + ' Z';
  }

  var stroke    = ghost ? 'none' : '#1a1a1a';
  var strokeW   = ghost ? 0 : 1.5;
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h
    + '" opacity="' + opacity + '" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="' + d + '" fill="' + color + '" stroke="' + stroke
    + '" stroke-width="' + strokeW + '" stroke-linejoin="round"/>'
    + '</svg>';
}

function arrowContent(state) {
  if (state === 'down')       return arrowSVG('down', false);
  if (state === 'up')         return arrowSVG('up',   false);
  if (state === 'ghost-down') return arrowSVG('down', true);
  if (state === 'ghost-up')   return arrowSVG('up',   true);
  return '<div class="empty-dot"></div>';
}

// ── App state ──
var bpm      = 80;
var measures = [newMeasure(), newMeasure()];
var playing  = false;

// Audio
var audioCtx   = null;
var masterGain = null;
var downBuf    = null;
var upBuf      = null;
var schedTimer = null;
var nextTime   = 0;
var schedBeat  = 0;
var playStart  = 0;
var rafId      = null;

var downArr = null;
var upArr   = null;

// ── Sound prefetch ──
async function prefetch() {
  try {
    var dr = await fetch('sounds/g-down.m4a');
    var ur = await fetch('sounds/g-up.m4a');
    downArr = await dr.arrayBuffer();
    upArr   = await ur.arrayBuffer();
    var btn = document.getElementById('play-btn');
    btn.disabled = false;
    btn.textContent = '▶  Play';
  } catch (e) {
    var btn = document.getElementById('play-btn');
    btn.disabled = false;
    btn.textContent = '▶  Play';
    console.warn('Sound load error', e);
  }
}

// ── Legend ──
function renderLegend() {
  var configs = [
    ['leg-down',       'down', false],
    ['leg-up',         'up',   false],
    ['leg-ghost-down', 'down', true ],
    ['leg-ghost-up',   'up',   true ]
  ];
  configs.forEach(function(c) {
    var el = document.getElementById(c[0]);
    if (el) el.innerHTML = arrowSVG(c[1], c[2], 20, 36);
  });
}

// ── Sheet rendering ──
function renderSheet() {
  var sheet = document.getElementById('sheet');
  sheet.innerHTML = '';

  measures.forEach(function(m, mi) {
    var mEl = document.createElement('div');
    mEl.className = 'measure' + (mi === 0 ? ' row-start' : '');

    // ── Measure header: number + copy button ──
    var hdr = document.createElement('div');
    hdr.className = 'm-header';

    var numEl = document.createElement('span');
    numEl.className = 'm-num';
    numEl.textContent = mi + 1;
    hdr.appendChild(numEl);

    var copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '⧉';
    copyBtn.title = 'Duplicate measure';
    copyBtn.addEventListener('click', function(e) { e.stopPropagation(); copyMeasure(mi); });
    hdr.appendChild(copyBtn);

    mEl.appendChild(hdr);

    // ── Beats row ──
    var row = document.createElement('div');
    row.className = 'beats-row';

    m.beats.forEach(function(state, bi) {
      var slot = document.createElement('div');
      slot.className = 'beat-slot ' + (bi % 2 === 0 ? 'main-beat' : 'and-beat');
      slot.dataset.mi = mi;
      slot.dataset.bi = bi;

      // Chord label input (above arrow)
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'chord-input';
      inp.value = m.chords[bi];
      inp.maxLength = 5;
      inp.autocomplete = 'off';
      inp.setAttribute('autocorrect', 'off');
      inp.setAttribute('spellcheck', 'false');
      inp.addEventListener('input', function() { measures[mi].chords[bi] = inp.value; });
      inp.addEventListener('click',    function(e) { e.stopPropagation(); });
      inp.addEventListener('touchend', function(e) { e.stopPropagation(); }, { passive: true });
      slot.appendChild(inp);

      // Arrow area
      var area = document.createElement('div');
      area.className = 'arrow-area';
      area.innerHTML = arrowContent(state);
      slot.appendChild(area);

      // Beat label
      var lbl = document.createElement('div');
      lbl.className = 'beat-lbl' + (bi % 2 === 0 ? ' lbl-main' : '');
      lbl.textContent = LABELS[bi];
      slot.appendChild(lbl);

      slot.addEventListener('click',    function() { cycleState(mi, bi); });
      slot.addEventListener('touchend', function(e) { e.preventDefault(); cycleState(mi, bi); }, { passive: false });

      row.appendChild(slot);
    });

    mEl.appendChild(row);
    sheet.appendChild(mEl);
  });
}

function updateSlot(mi, bi) {
  var slot = document.querySelector('.beat-slot[data-mi="' + mi + '"][data-bi="' + bi + '"]');
  if (!slot) return;
  slot.querySelector('.arrow-area').innerHTML = arrowContent(measures[mi].beats[bi]);
}

function cycleState(mi, bi) {
  var i = CYCLE.indexOf(measures[mi].beats[bi]);
  measures[mi].beats[bi] = CYCLE[(i + 1) % CYCLE.length];
  updateSlot(mi, bi);
}

// ── Measure controls ──
function copyMeasure(mi) {
  var src = measures[mi];
  measures.splice(mi + 1, 0, {
    beats:  src.beats.slice(),
    chords: src.chords.slice()
  });
  var was = playing;
  if (was) stopPlay();
  renderSheet();
  if (was) startPlay();
}

function addMeasure() {
  measures.push(newMeasure());
  var was = playing;
  if (was) stopPlay();
  renderSheet();
  if (was) startPlay();
}

function removeMeasure() {
  if (measures.length <= 1) return;
  measures.pop();
  var was = playing;
  if (was) stopPlay();
  renderSheet();
  if (was) startPlay();
}

// ── Audio ──
async function initAudio() {
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioCtx.destination);
  if (downArr) downBuf = await audioCtx.decodeAudioData(downArr.slice(0));
  if (upArr)   upBuf   = await audioCtx.decodeAudioData(upArr.slice(0));
}

function playNote(buf, time) {
  if (!buf || !audioCtx) return;
  var src = audioCtx.createBufferSource();
  src.buffer = buf;
  var g = audioCtx.createGain();
  g.gain.value = 0.88;
  src.connect(g);
  g.connect(masterGain);
  src.start(time);
  src.stop(time + 2.5);
}

function scheduler() {
  var spe   = (60 / bpm) / 2;
  var total = measures.length * BEATS;
  while (nextTime < audioCtx.currentTime + 0.12) {
    var slot = schedBeat % total;
    var mi   = Math.floor(slot / BEATS);
    var bi   = slot % BEATS;
    var s    = measures[mi] && measures[mi].beats[bi];
    if      (s === 'down') playNote(downBuf, nextTime);
    else if (s === 'up')   playNote(upBuf,   nextTime);
    nextTime += spe;
    schedBeat++;
  }
  schedTimer = setTimeout(scheduler, 20);
}

function playhead() {
  if (!playing) return;
  var spe     = (60 / bpm) / 2;
  var total   = measures.length * BEATS;
  var elapsed = Math.max(0, audioCtx.currentTime - playStart);
  var slot    = Math.floor(elapsed / spe) % total;
  var mi      = Math.floor(slot / BEATS);
  var bi      = slot % BEATS;

  document.querySelectorAll('.beat-slot.playing').forEach(function(el) {
    el.classList.remove('playing');
  });
  var el = document.querySelector('.beat-slot[data-mi="' + mi + '"][data-bi="' + bi + '"]');
  if (el) el.classList.add('playing');

  rafId = requestAnimationFrame(playhead);
}

async function startPlay() {
  if (!audioCtx) await initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.setValueAtTime(1, audioCtx.currentTime);

  playing   = true;
  schedBeat = 0;
  // Small look-ahead so audio is never late; visual anchors to the same moment
  var startAt = audioCtx.currentTime + 0.02;
  nextTime  = startAt;
  playStart = startAt;

  document.getElementById('play-btn').textContent = '■  Stop';
  document.getElementById('play-btn').classList.add('is-playing');

  scheduler();
  playhead();
}

function stopPlay() {
  playing = false;
  clearTimeout(schedTimer);
  cancelAnimationFrame(rafId);
  if (masterGain) masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.07);
  document.querySelectorAll('.beat-slot.playing').forEach(function(el) {
    el.classList.remove('playing');
  });
  document.getElementById('play-btn').textContent = '▶  Play';
  document.getElementById('play-btn').classList.remove('is-playing');
}

// ── BPM — stop/restart on change so audio & visual stay in sync ──
function setBPM(v) {
  var was = playing;
  if (was) stopPlay();
  bpm = Math.max(20, Math.min(200, v));
  document.getElementById('bpm-val').textContent = bpm;
  if (was) startPlay();
}

// ── Event listeners ──
document.getElementById('play-btn').addEventListener('click', function() {
  if (playing) stopPlay(); else startPlay();
});
document.getElementById('bpm-up').addEventListener('click', function() { setBPM(bpm + 5); });
document.getElementById('bpm-dn').addEventListener('click', function() { setBPM(bpm - 5); });
document.getElementById('add-btn').addEventListener('click', addMeasure);
document.getElementById('rem-btn').addEventListener('click', removeMeasure);

// ── Init ──
renderLegend();
renderSheet();
prefetch();
