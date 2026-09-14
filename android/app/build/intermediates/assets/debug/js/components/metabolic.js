/**
 * metabolic.js - Calculateur Métabolique & Nutritionnel Épuré (PDF 6)
 * MB Mifflin-St Jeor, coefficient NAP, DET et répartition des macros.
 */

import { Calculations } from '../calculations.js';
import { stateManager } from '../state.js';

export const Metabolic = {
  render(container, client) {
    const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const currentWeight = last ? last.weight : 75;
    const currentHeight = last ? last.height : 175;
    const age = client.age || 30;
    const gender = client.gender || 'H';

    const mb = Calculations.calculateMB(currentWeight, currentHeight, age, gender);
    const nap = client.lifestyle?.activityLevel || 1.375;
    const det = Calculations.calculateDET(mb, nap);
    const currentStrategy = last?.goalStrategy || (client.mainGoal === 'Prise de masse musculaire' ? 'bulk' : 'cut');
    const nutrition = Calculations.calculateNutritionPlan(det, currentStrategy);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- 3 Cartes Métaboliques Principales -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Métabolisme de Base (MB)</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block">${mb} kcal/j</span>
            <span class="text-[11px] text-slate-500">Mifflin-St Jeor (${gender === 'H' ? 'Homme' : 'Femme'}, ${currentWeight}kg, ${age} ans)</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Dépense Totale (DET)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">${det} kcal/j</span>
            <span class="text-[11px] text-slate-500">Avec coefficient d'activité × ${nap}</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Cible Calorique Recommandée</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block" id="disp-target-kcal">${nutrition.targetKcal} kcal/j</span>
            <span class="text-[11px] text-slate-500">${currentStrategy === 'cut' ? 'Déficit pour perte de gras' : currentStrategy === 'bulk' ? 'Surplus pour prise de masse' : 'Maintien du poids'}</span>
          </div>
        </div>

        <!-- Réglages & Répartition Macronutriments -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Paramètres -->
          <div class="glass-card p-5 space-y-4">
            <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Ajustements du Coach</h3>
            
            <div>
              <label class="label">Niveau d'Activité Physique (NAP)</label>
              <select id="select-nap-metabolic" class="input font-mono text-xs">
                ${Object.entries(Calculations.NAP_LEVELS).map(([val, info]) => `
                  <option value="${val}" ${parseFloat(val) === parseFloat(nap) ? 'selected' : ''}>
                    ${info.label} (× ${val})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="label">Stratégie Calorique</label>
              <div class="grid grid-cols-3 gap-2" id="group-strategy">
                <button class="btn btn-sm ${currentStrategy === 'cut' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="cut">
                  Sèche (-400)
                </button>
                <button class="btn btn-sm ${currentStrategy === 'maintain' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="maintain">
                  Maintien (0)
                </button>
                <button class="btn btn-sm ${currentStrategy === 'bulk' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="bulk">
                  Masse (+350)
                </button>
              </div>
            </div>
          </div>

          <!-- Répartition des Macros -->
          <div class="glass-card p-5 space-y-4">
            <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Répartition des Macronutriments</h3>
            
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Protéines</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-protein">${nutrition.grams.proteinGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-protein-pct">${nutrition.macros.proteinPct}%</span>
              </div>

              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Glucides</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-carbs">${nutrition.grams.carbGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-carbs-pct">${nutrition.macros.carbPct}%</span>
              </div>

              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Lipides</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-fats">${nutrition.grams.fatGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-fats-pct">${nutrition.macros.fatPct}%</span>
              </div>
            </div>

            <div class="text-xs text-slate-400 space-y-1 pt-1">
              <div>💧 Hydratation minimum recommandée : <strong class="text-white">${(currentWeight * 0.035).toFixed(1)} L / jour</strong></div>
              <div>🥩 Apport protéique : <strong class="text-white">${(nutrition.grams.proteinGrams / currentWeight).toFixed(1)} g / kg</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client, currentWeight, currentHeight, age, gender);
  },

  bindEvents(container, client, weight, height, age, gender) {
    let selectedNap = client.lifestyle?.activityLevel || 1.375;
    let selectedStrat = 'cut';

    const recalc = () => {
      const mb = Calculations.calculateMB(weight, height, age, gender);
      const det = Calculations.calculateDET(mb, selectedNap);
      const nut = Calculations.calculateNutritionPlan(det, selectedStrat);

      container.querySelector('#disp-target-kcal').textContent = `${nut.targetKcal} kcal/j`;
      container.querySelector('#disp-protein').textContent = `${nut.grams.proteinGrams}g`;
      container.querySelector('#disp-carbs').textContent = `${nut.grams.carbGrams}g`;
      container.querySelector('#disp-fats').textContent = `${nut.grams.fatGrams}g`;
      container.querySelector('#disp-protein-pct').textContent = `${nut.macros.proteinPct}%`;
      container.querySelector('#disp-carbs-pct').textContent = `${nut.macros.carbPct}%`;
      container.querySelector('#disp-fats-pct').textContent = `${nut.macros.fatPct}%`;
    };

    container.querySelector('#select-nap-metabolic')?.addEventListener('change', (e) => {
      selectedNap = parseFloat(e.target.value);
      recalc();
    });

    container.querySelectorAll('#group-strategy button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('#group-strategy button').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        e.currentTarget.classList.remove('btn-secondary');
        e.currentTarget.classList.add('btn-primary');
        selectedStrat = e.currentTarget.getAttribute('data-strat');
        recalc();
      });
    });
  }
};
