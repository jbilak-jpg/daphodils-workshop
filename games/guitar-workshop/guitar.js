'use strict';

// ── Constants ──
const BEATS  = 8;
const LABELS = ['1', '+', '2', '+', '3', '+', '4', '+'];
const CYCLE  = ['empty', 'down', 'up', 'ghost-down', 'ghost-up'];

// ── Arrow SVG factory ──
function arrowSVG(dir, ghost, w, h) {
  w = w || 36; h = h || 76;
  const color   = dir === 'down' ? '#c9a84c' : '#9b7fd4';
  const opacity = ghost ? 0.22 : 1;
  const cx  = w / 2;
  const sw  = Math.round(w * 0.25);   // stem width
  const hw  = Math.round(w * 0.44);   // head half-width
  const r   = sw / 2;

  if (dir === 'down') {
    const sEnd = h - hw - 5;
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" opacity="' + opacity + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="' + (cx - sw/2) + '" y="2" width="' + sw + '" height="' + (sEnd - 2) + '" rx="' + r + '" fill="' + color + '"/>' +
      '<polygon points="' + (cx-hw) + ',' + sEnd + ' ' + (cx+hw) + ',' + sEnd + ' ' + cx + ',' + (h-1) + '" fill="' + color + '"/>' +
      '</svg>';
  } else {
    const sStart = hw + 5;
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" opacity="' + opacity + '" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + (cx-hw) + ',' + sStart + ' ' + (cx+hw) + ',' + sStart + ' ' + cx + ',1" fill="' + color + '"/>' +
      '<rect x="' + (cx - sw/2) + '" y="' + sStart + '" width="' + sw + '" height="' + (h - sStart - 2) + '" rx="' + r + '" fill="' + color + '"/>' +
      '</svg>';
  }
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
var measures = [Array(BEATS).fill('empty'), Array(BEATS).fill('empty')];
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

// Pre-fetched raw array buffers
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
    console.warn('Sound load error — will retry on play', e);
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
    if (el) el.innerHTML = arrowSVG(c[1], c[2], 20, 38);
  });
}

// ── Sheet rendering ──
function renderSheet() {
  var sheet = document.getElementById('sheet');
  sheet.innerHTML = '';
  measures.forEach(function(m, mi) {
    var mEl = document.createElement('div');
    mEl.className = 'measure' + (mi === 0 ? ' row-start' : '');

    var numEl = document.createElement('div');
    numEl.className = 'm-num';
    numEl.textContent = mi + 1;
    mEl.appendChild(numEl);

    var row = document.createElement('div');
    row.className = 'beats-row';

    m.forEach(function(state, bi) {
      var slot = document.createElement('div');
      slot.className = 'beat-slot ' + (bi % 2 === 0 ? 'main-beat' : 'and-beat');
      slot.dataset.mi = mi;
      slot.dataset.bi = bi;

      var area = document.createElement('div');
      area.className = 'arrow-area';
      area.innerHTML = arrowContent(state);
      slot.appendChild(area);

      var lbl = document.createElement('div');
      lbl.className = 'beat-lbl' + (bi % 2 === 0 ? ' lbl-main' : '');
      lbl.textContent = LABELS[bi];
      slot.appendChild(lbl);

      slot.addEventListener('click', function() { cycleState(mi, bi); });
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
  slot.querySelector('.arrow-area').innerHTML = arrowContent(measures[mi][bi]);
}

function cycleState(mi, bi) {
  var i = CYCLE.indexOf(measures[mi][bi]);
  measures[mi][bi] = CYCLE[(i + 1) % CYCLE.length];
  updateSlot(mi, bi);
}

// ── Audio ──
async function initAudio() {
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioCtx.destination);

  // Clone before decode because decodeAudioData detaches the buffer
  var d = downArr ? downArr.slice(0) : null;
  var u = upArr   ? upArr.slice(0)   : null;

  if (d) downBuf = await audioCtx.decodeAudioData(d);
  if (u) upBuf   = await audioCtx.decodeAudioData(u);
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
  var spe   = (60 / bpm) / 2;   // seconds per 8th note
  var total = measures.length * BEATS;
  while (nextTime < audioCtx.currentTime + 0.12) {
    var slot = schedBeat % total;
    var mi   = Math.floor(slot / BEATS);
    var bi   = slot % BEATS;
    var s    = measures[mi] && measures[mi][bi];
    if      (s === 'down') playNote(downBuf, nextTime);
    else if (s === 'up')   playNote(upBuf,   nextTime);
    nextTime += spe;
    schedBeat++;
  }
  schedTimer = setTimeout(scheduler, 20);
}

function playhead() {
  if (!playing) return;
  var spe   = (60 / bpm) / 2;
  var total = measures.length * BEATS;
  var elapsed = audioCtx.currentTime - playStart;
  if (elapsed < 0) elapsed = 0;
  var slot = Math.floor(elapsed / spe) % total;
  var mi   = Math.floor(slot / BEATS);
  var bi   = slot % BEATS;

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

  // Reset master gain in case it was faded out
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.setValueAtTime(1, audioCtx.currentTime);

  playing   = true;
  schedBeat = 0;
  nextTime  = audioCtx.currentTime + 0.05;
  playStart = nextTime;

  document.getElementById('play-btn').textContent = '■  Stop';
  document.getElementById('play-btn').classList.add('is-playing');

  scheduler();
  playhead();
}

function stopPlay() {
  playing = false;
  clearTimeout(schedTimer);
  cancelAnimationFrame(rafId);

  if (masterGain) {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.07);
  }

  document.querySelectorAll('.beat-slot.playing').forEach(function(el) {
    el.classList.remove('playing');
  });
  document.getElementById('play-btn').textContent = '▶  Play';
  document.getElementById('play-btn').classList.remove('is-playing');
}

// ── Measure controls ──
function addMeasure() {
  measures.push(Array(BEATS).fill('empty'));
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

// ── BPM ──
function setBPM(v) {
  bpm = Math.max(40, Math.min(200, v));
  document.getElementById('bpm-val').textContent = bpm;
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
