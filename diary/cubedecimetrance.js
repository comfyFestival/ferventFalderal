// ─── CUBEDECIMETRANCE CALCULATOR ────────────────────────────────────

const CUBE_LIFESPAN_DAYS        = 32872;
const BABY_CUBEDECIMETRANCE     = 4.109;
const CUBE_ML_PER_LIFE_DAY      = (BABY_CUBEDECIMETRANCE * 1000) / CUBE_LIFESPAN_DAYS;
const CUBE_FREEDOM_DAYS         = 25 * 365.25;
const CUBE_ML_PER_FREEDOM_DAY   = (BABY_CUBEDECIMETRANCE * 1000) / CUBE_FREEDOM_DAYS;
const CUBE_FAINT_PER_HOUR       = BABY_CUBEDECIMETRANCE;
const CUBE_MJ_PER_LITRE         = 83.68127281577026;

let happyEvents      = [];
let wellEvents       = [];
let additionalGains  = [];
let freedomGains     = [];
let lifeGains        = [];
let enthalpicGains   = [];
let spreadEvents     = [];

let happyCounter    = 0;
let wellCounter     = 0;
let addGainCounter  = 0;
let freedomGainCtr  = 0;
let lifeGainCtr     = 0;
let enthalpicGainCtr = 0;
let eventCounter    = 0;

// ─── SLIDER / INPUT SYNC ─────────────────────────────────────────────

function cubeSliderToNum(numId, sliderId) {
  document.getElementById(numId).value = document.getElementById(sliderId).value;
}

function cubeClampAndSync(numId, min, max, sliderId) {
  const el = document.getElementById(numId);
  let val = parseFloat(el.value);
  if (isNaN(val)) return;
  if (val < min) { val = min; el.value = min; }
  if (val > max) { val = max; el.value = max; }
  if (sliderId) document.getElementById(sliderId).value = val;
}

// ─── HAPPINESS ────────────────────────────────────────────────────────
// Formula: hours × rank × people  (rank 0→4109, direct cubedecimetrance per hour)

function calcHappy() {
  let total = 0;
  for (const ev of happyEvents) {
    const hours  = parseFloat(ev.hours)  || 0;
    const rank   = parseFloat(ev.rank)   || 0;
    const people = parseFloat(ev.people) || 1;
    total += hours * Math.pow(rank, 2) * CUBE_FAINT_PER_HOUR * people;
  }
  return total;
}

// ─── GAIN ─────────────────────────────────────────────────────────────

function calcGain() {
  const freedomGain = freedomGains.reduce((sum, ev) => {
    const days = parseFloat(ev.days) || 0;
    return sum + (days * CUBE_ML_PER_FREEDOM_DAY) / 1000;
  }, 0);

  const lifeGain = lifeGains.reduce((sum, ev) => {
    const lives = parseFloat(ev.lives) || 0;
    return sum + lives * BABY_CUBEDECIMETRANCE;
  }, 0);

  const enthalpicGain = enthalpicGains.reduce((sum, ev) => {
    const mj = parseFloat(ev.mj) || 0;
    return sum + mj / CUBE_MJ_PER_LITRE;
  }, 0);

  const additionalGain = additionalGains.reduce((sum, ev) => {
    const rank   = parseFloat(ev.rank)   || 0;
    const amount = parseFloat(ev.amount) || 0;
    return sum + (rank * BABY_CUBEDECIMETRANCE * amount);
  }, 0);

  return freedomGain + lifeGain + enthalpicGain + additionalGain;
}

// ─── WELLBEING ────────────────────────────────────────────────────────
// Mirrors psychological formula exactly

function wellFormula(i, q, t) {
  if (i === 0) return 0;
  const tYears = t / 365.25;
  let result;
  if (q >= 0) result = -Math.pow((q / i) + 1, tYears) + i + 1;
  else        result =  Math.pow((-q * i) / (tYears) + 1, tYears) + i - 1;
  return Math.max(result, 0);
}

function calcWell() {
  let total = 0;
  for (const ev of wellEvents) {
    const rank   = parseFloat(ev.rank)   || 0;
    const people = parseFloat(ev.people) || 1;
    let cur = 1 * Math.pow(rank, 2) * BABY_CUBEDECIMETRANCE;
    let change = 0;
    for (const p of ev.phases) {
      const q = parseFloat(p.q) || 0;
      const t = parseFloat(p.t) || 0;
      if (t <= 0) continue;
      change = cur;
      change = wellFormula(change, q, t);
      change = change - cur;
    }
    const perPerson = Math.min((cur / 2) + change, 12.327);
    total += perPerson * people;
  }
  return Math.max(total, 0);
}

// ─── SPREAD ───────────────────────────────────────────────────────────

function calcSpread() {
  let totalMax = 0, totalMin = 0;

  for (const ev of spreadEvents) {
    const sp        = parseFloat(ev.spread)       || 0;
    const cube      = parseFloat(ev.cubedecimetrance) || 0;
    const initMax   = parseFloat(ev.initRepMax)   || 0;
    const initMin   = parseFloat(ev.initRepMin)   || 0;
    const changeMax = parseFloat(ev.repChangeMax) || 0;
    const changeMin = parseFloat(ev.repChangeMin) || 0;

    const maxBase = cube * sp * (initMax + changeMax);
    const minBase = cube * sp * (initMin + changeMin);
    const finalMax = maxBase / 100;
    const finalMin = minBase / 100;

    const row = document.getElementById(`spread-event-${ev.id}`);
    if (row) {
      const maxEl = row.querySelector('.event-max-val');
      const minEl = row.querySelector('.event-min-val');
      if (maxEl) maxEl.textContent = finalMax.toFixed(3) + ' L';
      if (minEl) minEl.textContent = finalMin.toFixed(3) + ' L';
    }

    totalMax += finalMax;
    totalMin += finalMin;
  }

  return { max: totalMax, min: totalMin, avg: (totalMax + totalMin) / 2 };
}

// ─── MAIN CALCULATE ───────────────────────────────────────────────────

function calculate() {
  const happy  = calcHappy();
  const gain   = calcGain();
  const well   = calcWell();
  const spread = calcSpread();
  const total  = happy + gain + well + spread.avg;

  setText('happyResult',   happy.toFixed(6)       + ' dm^3');
  setText('gainResult',    gain.toFixed(6)        + ' dm^3');
  setText('wellResult',    well.toFixed(6)        + ' dm^3');
  setText('spreadMax',     spread.max.toFixed(6)  + ' dm^3');
  setText('spreadMin',     spread.min.toFixed(6)  + ' dm^3');
  setText('spreadAvg',     spread.avg.toFixed(6)  + ' dm^3');
  setText('subtotalResult',(happy + gain + well).toFixed(6) + ' dm^3');
  setText('finalHappy',    happy.toFixed(6)       + ' dm^3');
  setText('finalWell',     well.toFixed(6)        + ' dm^3');
  setText('finalGain',     gain.toFixed(6)        + ' dm^3');
  setText('finalSpread',   spread.avg.toFixed(6)  + ' dm^3');
  setText('finalTotal',    total.toFixed(6)       + ' dm^3');
  setText('vialTotal',     total.toFixed(3)       + ' dm^3');

  const fillPct = Math.min(Math.max((total / 1250000) * 100, 0), 100);
  document.getElementById('vialFill').style.width = fillPct + '%';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── HAPPINESS EVENT MANAGEMENT ──────────────────────────────────────

function addHappyEvent() {
  const id = ++happyCounter;
  happyEvents.push({ id, hours: 0, rank: 0, people: 1 });

  const container = document.getElementById('happyEvents');
  const row = document.createElement('div');
  row.className = 'happy-event-row';
  row.id = `happy-event-${id}`;

  row.innerHTML = `
    <div class="happy-event-label">Happiness Event ${happyEvents.length}</div>
    <div>
      <label>Hours of happiness</label>
      <input class="cube-input happy-input" type="number"
        min="0" step="0.01" placeholder="0"
        oninput="updateHappyEvent(${id},'hours',this.value)">
    </div>
    <div>
      <label>Happiness Rank (0 → 1)</label>
      <div class="slider-row">
        <input class="cube-slider happy-slider" type="range"
          id="hr-s-${id}" min="0" max="1" step="0.00001" value="0"
          oninput="cubeSliderToNum('hr-n-${id}','hr-s-${id}'); updateHappyEvent(${id},'rank',this.value)">
        <input class="cube-input happy-input" type="number"
          id="hr-n-${id}" min="0" max="1" step="0.00001" value="0"
          oninput="cubeClampAndSync('hr-n-${id}',0,1,'hr-s-${id}'); updateHappyEvent(${id},'rank',this.value)">
      </div>
    </div>
    <div>
      <label>People affected</label>
      <input class="cube-input happy-input" type="number"
        min="1" step="1" placeholder="1"
        oninput="updateHappyEvent(${id},'people',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeHappyEvent(${id})">✕</button>
  `;

  container.appendChild(row);
}

function updateHappyEvent(id, field, value) {
  const ev = happyEvents.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeHappyEvent(id) {
  happyEvents = happyEvents.filter(e => e.id !== id);
  document.getElementById(`happy-event-${id}`)?.remove();
  document.querySelectorAll('.happy-event-label').forEach((el, i) => {
    el.textContent = `Happiness Event ${i + 1}`;
  });
  calculate();
}

// ─── WELLBEING EVENT MANAGEMENT ──────────────────────────────────────

function addWellEvent() {
  const id = ++wellCounter;
  wellEvents.push({ id, rank: 0, people: 1, phases: [], phaseCounter: 0 });

  const container = document.getElementById('wellEvents');
  const block = document.createElement('div');
  block.className = 'well-event-block';
  block.id = `well-event-${id}`;

  block.innerHTML = `
    <div class="well-event-header">
      <span class="well-event-label">Wellbeing Event ${wellEvents.length}</span>
      <button class="cube-remove-btn" onclick="removeWellEvent(${id})">✕ Remove</button>
    </div>
    <div class="well-event-inputs">
      <div>
        <label>Wellbeing Rank (0 → 1)</label>
        <div class="slider-row">
          <input class="cube-slider well-slider" type="range"
            id="wr-s-${id}" min="0" max="1" step="0.01" value="0"
            oninput="cubeSliderToNum('wr-n-${id}','wr-s-${id}'); updateWellEvent(${id},'rank',this.value)">
          <input class="cube-input cube-input-sm well-input" type="number"
            id="wr-n-${id}" min="0" max="1" step="0.01" value="0"
            oninput="cubeClampAndSync('wr-n-${id}',0,1,'wr-s-${id}'); updateWellEvent(${id},'rank',this.value)">
        </div>
      </div>
      <div>
        <label>People affected</label>
        <input class="cube-input well-input" type="number"
          min="1" step="1" placeholder="1"
          oninput="updateWellEvent(${id},'people',this.value)">
      </div>
    </div>
    <div class="well-phases-container" id="well-phases-${id}"></div>
    <button class="cube-add-btn well-add-btn" onclick="addWellPhase(${id})" style="margin:8px 0 0;">+ Add Phase</button>
  `;

  container.appendChild(block);
}

function updateWellEvent(id, field, value) {
  const ev = wellEvents.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeWellEvent(id) {
  wellEvents = wellEvents.filter(e => e.id !== id);
  document.getElementById(`well-event-${id}`)?.remove();
  document.querySelectorAll('.well-event-label').forEach((el, i) => {
    el.textContent = `Wellbeing Event ${i + 1}`;
  });
  calculate();
}

function addWellPhase(evId) {
  const ev = wellEvents.find(e => e.id === evId);
  if (!ev) return;
  const phaseId = ++ev.phaseCounter;
  ev.phases.push({ id: phaseId, q: 0, t: 0 });

  const container = document.getElementById(`well-phases-${evId}`);
  const row = document.createElement('div');
  row.className = 'well-phase-row';
  row.id = `well-phase-${evId}-${phaseId}`;

  row.innerHTML = `
    <div class="well-phase-label">Phase ${ev.phases.length}</div>
    <div>
      <label>Quality of Life (q)</label>
      <div class="slider-row">
        <input class="cube-slider well-slider" type="range"
          id="q-s-${evId}-${phaseId}" min="-1.6" max="1.6" step="0.01" value="0"
          oninput="cubeSliderToNum('q-n-${evId}-${phaseId}','q-s-${evId}-${phaseId}'); updateWellPhase(${evId},${phaseId},'q',this.value)">
        <input class="cube-input cube-input-sm well-input" type="number"
          id="q-n-${evId}-${phaseId}" min="-1.6" max="1.6" step="0.01" value="0"
          oninput="cubeClampAndSync('q-n-${evId}-${phaseId}',-1.6,1.6,'q-s-${evId}-${phaseId}'); updateWellPhase(${evId},${phaseId},'q',this.value)">
      </div>
    </div>
    <div>
      <label>Duration (days)</label>
      <input class="cube-input well-input" type="number"
        min="0" step="1" placeholder="0"
        oninput="updateWellPhase(${evId},${phaseId},'t',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeWellPhase(${evId},${phaseId})">✕</button>
  `;

  container.appendChild(row);
}

function updateWellPhase(evId, phaseId, field, value) {
  const ev = wellEvents.find(e => e.id === evId);
  if (!ev) return;
  const phase = ev.phases.find(p => p.id === phaseId);
  if (phase) { phase[field] = parseFloat(value) || 0; calculate(); }
}

function removeWellPhase(evId, phaseId) {
  const ev = wellEvents.find(e => e.id === evId);
  if (!ev) return;
  ev.phases = ev.phases.filter(p => p.id !== phaseId);
  document.getElementById(`well-phase-${evId}-${phaseId}`)?.remove();
  document.getElementById(`well-phases-${evId}`)
    .querySelectorAll('.well-phase-label').forEach((el, i) => {
      el.textContent = `Phase ${i + 1}`;
    });
  calculate();
}

// ─── FREEDOM GAIN EVENT MANAGEMENT ───────────────────────────────────

function addFreedomGainEntry() {
  const id = ++freedomGainCtr;
  freedomGains.push({ id, days: 0 });

  const container = document.getElementById('freedomGainEvents');
  const row = document.createElement('div');
  row.className = 'addgain-event-row';
  row.id = `freedom-gain-event-${id}`;

  row.innerHTML = `
    <div class="addgain-event-label">Freedom Gain ${freedomGains.length}</div>
    <div>
      <label>Days of Freedom Gained <span class="cube-range">days</span></label>
      <input class="cube-input gain-input" type="number"
        min="0" step="1" placeholder="0"
        oninput="updateFreedomGain(${id},'days',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeFreedomGain(${id})">✕</button>
  `;
  container.appendChild(row);
  calculate();
}

function updateFreedomGain(id, field, value) {
  const ev = freedomGains.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeFreedomGain(id) {
  freedomGains = freedomGains.filter(e => e.id !== id);
  document.getElementById(`freedom-gain-event-${id}`)?.remove();
  document.querySelectorAll('#freedomGainEvents .addgain-event-label').forEach((el, i) => {
    el.textContent = `Freedom Gain ${i + 1}`;
  });
  calculate();
}

// ─── LIFE GAIN EVENT MANAGEMENT ──────────────────────────────────────

function addLifeGainEntry() {
  const id = ++lifeGainCtr;
  lifeGains.push({ id, lives: 0 });

  const container = document.getElementById('lifeGainEvents');
  const row = document.createElement('div');
  row.className = 'addgain-event-row';
  row.id = `life-gain-event-${id}`;

  row.innerHTML = `
    <div class="addgain-event-label">Life Gain ${lifeGains.length}</div>
    <div>
      <label>Lives Saved / Created</label>
      <input class="cube-input gain-input" type="number"
        min="0" step="1" placeholder="0"
        oninput="updateLifeGain(${id},'lives',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeLifeGain(${id})">✕</button>
  `;
  container.appendChild(row);
  calculate();
}

function updateLifeGain(id, field, value) {
  const ev = lifeGains.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeLifeGain(id) {
  lifeGains = lifeGains.filter(e => e.id !== id);
  document.getElementById(`life-gain-event-${id}`)?.remove();
  document.querySelectorAll('#lifeGainEvents .addgain-event-label').forEach((el, i) => {
    el.textContent = `Life Gain ${i + 1}`;
  });
  calculate();
}

// ─── ENTHALPIC GAIN EVENT MANAGEMENT ─────────────────────────────────

function addEnthalpicGainEntry() {
  const id = ++enthalpicGainCtr;
  enthalpicGains.push({ id, mj: 0 });

  const container = document.getElementById('enthalpicGainEvents');
  const row = document.createElement('div');
  row.className = 'addgain-event-row';
  row.id = `enthalpic-gain-event-${id}`;

  row.innerHTML = `
    <div class="addgain-event-label">Enthalpic Gain ${enthalpicGains.length}</div>
    <div>
      <label>Energy Gained <span class="cube-range">MJ</span></label>
      <input class="cube-input gain-input" type="number"
        min="0" step="0.01" placeholder="0"
        oninput="updateEnthalpicGain(${id},'mj',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeEnthalpicGain(${id})">✕</button>
  `;
  container.appendChild(row);
  calculate();
}

function updateEnthalpicGain(id, field, value) {
  const ev = enthalpicGains.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeEnthalpicGain(id) {
  enthalpicGains = enthalpicGains.filter(e => e.id !== id);
  document.getElementById(`enthalpic-gain-event-${id}`)?.remove();
  document.querySelectorAll('#enthalpicGainEvents .addgain-event-label').forEach((el, i) => {
    el.textContent = `Enthalpic Gain ${i + 1}`;
  });
  calculate();
}

// ─── ADDITIONAL GAIN EVENT MANAGEMENT ────────────────────────────────

function addAdditionalGain() {
  const id = ++addGainCounter;
  additionalGains.push({ id, rank: 0, amount: 0 });

  const container = document.getElementById('additionalGainEvents');
  const row = document.createElement('div');
  row.className = 'addgain-event-row';
  row.id = `addgain-event-${id}`;

  row.innerHTML = `
    <div class="addgain-event-label">Additional Gain ${additionalGains.length}</div>
    <div>
      <label>Value rank (0 → 1 = one life)</label>
      <div class="slider-row">
        <input class="cube-slider gain-slider" type="range"
          id="ag-s-${id}" min="0" max="1" step="0.00001" value="0"
          oninput="cubeSliderToNum('ag-n-${id}','ag-s-${id}'); updateAdditionalGain(${id},'rank',this.value)">
        <input class="cube-input gain-input" type="number"
          id="ag-n-${id}" min="0" max="1" step="0.00001" value="0"
          oninput="cubeClampAndSync('ag-n-${id}',0,1,'ag-s-${id}'); updateAdditionalGain(${id},'rank',this.value)">
      </div>
    </div>
    <div>
      <label>Amount gained</label>
      <input class="cube-input gain-input" type="number"
        min="0" step="1" placeholder="0"
        oninput="updateAdditionalGain(${id},'amount',this.value)">
    </div>
    <button class="cube-remove-btn" onclick="removeAdditionalGain(${id})">✕</button>
  `;
  container.appendChild(row);
  calculate();
}

function updateAdditionalGain(id, field, value) {
  const ev = additionalGains.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeAdditionalGain(id) {
  additionalGains = additionalGains.filter(e => e.id !== id);
  document.getElementById(`addgain-event-${id}`)?.remove();
  document.querySelectorAll('.addgain-event-label').forEach((el, i) => {
    el.textContent = `Additional Gain ${i + 1}`;
  });
  calculate();
}

// ─── SPREAD EVENT MANAGEMENT ──────────────────────────────────────────

function addSpreadEvent() {
  const id = ++eventCounter;
  spreadEvents.push({ id, spread: 0, cubedecimetrance: 0, initRepMax: 0, initRepMin: 0, repChangeMax: 0, repChangeMin: 0 });

  const container = document.getElementById('spreadEvents');
  const row = document.createElement('div');
  row.className = 'spread-event-row';
  row.id = `spread-event-${id}`;

  row.innerHTML = `
    <div class="spread-event-title">
      Event ${spreadEvents.length}
      <button class="cube-remove-btn" onclick="removeSpreadEvent(${id})">✕ Remove</button>
    </div>
    <div class="spread-event-grid">
      <div>
        <label>Spread (# people / occurrences)</label>
        <input class="cube-input spread-input" type="number"
          min="0" step="1" placeholder="0"
          oninput="updateSpreadEvent(${id},'spread',this.value)">
      </div>
      <div>
        <label>Cubedecimetrance of Event (L)</label>
        <input class="cube-input spread-input" type="number"
          min="0" step="0.001" placeholder="0"
          oninput="updateSpreadEvent(${id},'cubedecimetrance',this.value)">
      </div>
      <div>
        <label>Initial Repeatance Chance MAX (−1 → 1)</label>
        <div class="slider-row">
          <input class="cube-slider spread-slider" type="range"
            id="irmax-s-${id}" min="0" max="1" step="0.01" value="0"
            oninput="cubeSliderToNum('irmax-n-${id}','irmax-s-${id}'); updateSpreadEvent(${id},'initRepMax',this.value)">
          <input class="cube-input cube-input-sm spread-input" type="number"
            id="irmax-n-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeClampAndSync('irmax-n-${id}',-1,1,'irmax-s-${id}'); updateSpreadEvent(${id},'initRepMax',this.value)">
        </div>
      </div>
      <div>
        <label>Initial Repeatance Chance MIN (−1 → 1)</label>
        <div class="slider-row">
          <input class="cube-slider spread-slider" type="range"
            id="irmin-s-${id}" min="0" max="1" step="0.01" value="0"
            oninput="cubeSliderToNum('irmin-n-${id}','irmin-s-${id}'); updateSpreadEvent(${id},'initRepMin',this.value)">
          <input class="cube-input cube-input-sm spread-input" type="number"
            id="irmin-n-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeClampAndSync('irmin-n-${id}',-1,1,'irmin-s-${id}'); updateSpreadEvent(${id},'initRepMin',this.value)">
        </div>
      </div>
      <div>
        <label>Repeatance Chance Change MAX (−1 → 1)</label>
        <div class="slider-row">
          <input class="cube-slider spread-slider" type="range"
            id="rcmax-s-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeSliderToNum('rcmax-n-${id}','rcmax-s-${id}'); updateSpreadEvent(${id},'repChangeMax',this.value)">
          <input class="cube-input cube-input-sm spread-input" type="number"
            id="rcmax-n-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeClampAndSync('rcmax-n-${id}',-1,1,'rcmax-s-${id}'); updateSpreadEvent(${id},'repChangeMax',this.value)">
        </div>
      </div>
      <div>
        <label>Repeatance Chance Change MIN (−1 → 1)</label>
        <div class="slider-row">
          <input class="cube-slider spread-slider" type="range"
            id="rcmin-s-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeSliderToNum('rcmin-n-${id}','rcmin-s-${id}'); updateSpreadEvent(${id},'repChangeMin',this.value)">
          <input class="cube-input cube-input-sm spread-input" type="number"
            id="rcmin-n-${id}" min="-1" max="1" step="0.01" value="0"
            oninput="cubeClampAndSync('rcmin-n-${id}',-1,1,'rcmin-s-${id}'); updateSpreadEvent(${id},'repChangeMin',this.value)">
        </div>
      </div>
    </div>
    <div class="spread-event-results">
      <span>MAX: <b class="event-max-val">—</b></span>
      <span>MIN: <b class="event-min-val">—</b></span>
    </div>
  `;

  container.appendChild(row);
}

function updateSpreadEvent(id, field, value) {
  const ev = spreadEvents.find(e => e.id === id);
  if (ev) { ev[field] = parseFloat(value) || 0; calculate(); }
}

function removeSpreadEvent(id) {
  spreadEvents = spreadEvents.filter(e => e.id !== id);
  document.getElementById(`spread-event-${id}`)?.remove();
  document.querySelectorAll('.spread-event-title').forEach((el, i) => {
    const btn = el.querySelector('button');
    el.textContent = `Event ${i + 1}`;
    if (btn) el.appendChild(btn);
  });
  calculate();
}

// ─── INIT ─────────────────────────────────────────────────────────────
calculate();
