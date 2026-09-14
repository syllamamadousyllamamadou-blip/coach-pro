/**
 * quickTools.js - Calculateur Flash Corporel & Métabolique COACH PRO
 * Champs vides sans chiffres imposés par défaut, calculs physiologiques directs et clairs.
 */

import { Calculations } from '../calculations.js';

export const QuickTools = {
  open() {
    const modal = document.getElementById('quick-tools-modal');
    if (!modal) return;

    this.render();
    modal.classList.remove('hidden');
    this.bindEvents();
  },

  close() {
    const modal = document.getElementById('quick-tools-modal');
    if (modal) modal.classList.add('hidden');
  },

  render() {
    const container = document.getElementById('quick-tools-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Calculateur Flash (Physiologie & Indicateurs)</h3>
            <p class="text-xs text-slate-400">Entrez les valeurs du client pour obtenir instantanément son diagnostic corporel</p>
          </div>
          <button id="btn-close-quick-tools-x" class="btn-icon">✕</button>
        </div>

        <!-- Saisie sans chiffres imposés par défaut -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="label">Poids (kg) *</label>
            <input type="number" inputmode="decimal" step="0.1" id="qt-weight" placeholder="ex: 78.5" class="input font-bold text-emerald-400" />
          </div>
          <div>
            <label class="label">Taille (cm) *</label>
            <input type="number" inputmode="numeric" id="qt-height" placeholder="ex: 175" class="input font-bold" />
          </div>
          <div>
            <label class="label">Âge (ans) *</label>
            <input type="number" inputmode="numeric" id="qt-age" placeholder="ex: 32" class="input font-bold" />
          </div>
          <div>
            <label class="label">Genre *</label>
            <select id="qt-gender" class="input">
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
        </div>

        <!-- Résultats Calculés Immédiats -->
        <div class="sub-card p-4 space-y-3 bg-[#0c1220] border border-slate-800">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Indicateurs Estimés</h4>
            <span id="qt-healthy-range" class="text-xs text-slate-300 font-mono">Poids santé : --</span>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">IMC & Statut</span>
              <span id="qt-res-imc" class="text-lg font-bold text-white font-mono">--</span>
              <span id="qt-res-imc-cat" class="text-[10px] text-slate-400 block font-semibold">En attente de saisie</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Masse Grasse</span>
              <span id="qt-res-fat" class="text-lg font-bold text-amber-400 font-mono">--</span>
              <span id="qt-res-fat-kg" class="text-[10px] text-slate-400 block">-- kg</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Masse Muscle</span>
              <span id="qt-res-muscle" class="text-lg font-bold text-emerald-400 font-mono">--</span>
              <span id="qt-res-muscle-kg" class="text-[10px] text-slate-400 block">-- kg</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Métabolisme Base (MB)</span>
              <span id="qt-res-mb" class="text-lg font-bold text-emerald-400 font-mono">--</span>
              <span class="text-[10px] text-slate-400 block">kcal / jour</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-800">
          <button id="btn-close-quick-tools" class="btn btn-secondary btn-sm">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('quick-tools-modal');
    const closeBtnX = document.getElementById('btn-close-quick-tools-x');
    const closeBtn = document.getElementById('btn-close-quick-tools');

    const hide = () => this.close();
    closeBtnX?.addEventListener('click', hide);
    closeBtn?.addEventListener('click', hide);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) hide();
    });

    const wInput = document.getElementById('qt-weight');
    const hInput = document.getElementById('qt-height');
    const ageInput = document.getElementById('qt-age');
    const gSelect = document.getElementById('qt-gender');

    const updateCalc = () => {
      const w = parseFloat(wInput?.value);
      const h = parseFloat(hInput?.value);
      const age = parseInt(ageInput?.value, 10);
      const gender = gSelect?.value || 'H';

      const imcEl = document.getElementById('qt-res-imc');
      const imcCatEl = document.getElementById('qt-res-imc-cat');
      const fatEl = document.getElementById('qt-res-fat');
      const fatKgEl = document.getElementById('qt-res-fat-kg');
      const muscleEl = document.getElementById('qt-res-muscle');
      const muscleKgEl = document.getElementById('qt-res-muscle-kg');
      const mbEl = document.getElementById('qt-res-mb');
      const rangeEl = document.getElementById('qt-healthy-range');

      if (w && h && h > 0) {
        const comp = Calculations.calculateBodyComposition(w, h, age || 30, gender);
        const mb = Calculations.calculateMB(w, h, age || 30, gender);
        const range = Calculations.calculateHealthyWeightRange(h, w);

        if (imcEl) imcEl.textContent = comp.imc;
        if (imcCatEl) {
          imcCatEl.textContent = comp.imcCategory;
          imcCatEl.className = `text-[10px] font-bold ${comp.imcCode === 'normal' ? 'text-emerald-400' : 'text-amber-400'} block`;
        }
        if (fatEl) fatEl.textContent = `${comp.fatPct}%`;
        if (fatKgEl) fatKgEl.textContent = `${comp.fatKg} kg`;
        if (muscleEl) muscleEl.textContent = `${comp.musclePct}%`;
        if (muscleKgEl) muscleKgEl.textContent = `${comp.muscleKg} kg`;
        if (mbEl) mbEl.textContent = mb > 0 ? `${mb}` : '--';
        if (rangeEl) rangeEl.textContent = `Poids santé : ${range.min} à ${range.max} kg`;
      } else {
        if (imcEl) imcEl.textContent = '--';
        if (imcCatEl) imcCatEl.textContent = 'En attente de saisie';
        if (fatEl) fatEl.textContent = '--';
        if (fatKgEl) fatKgEl.textContent = '-- kg';
        if (muscleEl) muscleEl.textContent = '--';
        if (muscleKgEl) muscleKgEl.textContent = '-- kg';
        if (mbEl) mbEl.textContent = '--';
        if (rangeEl) rangeEl.textContent = 'Poids santé : --';
      }
    };

    wInput?.addEventListener('input', updateCalc);
    hInput?.addEventListener('input', updateCalc);
    ageInput?.addEventListener('input', updateCalc);
    gSelect?.addEventListener('change', updateCalc);
  }
};
