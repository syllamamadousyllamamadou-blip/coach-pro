/**
 * comparator.js - Comparateur Avant / Après COACH PRO
 * Calcule automatiquement et instantanément tous les indicateurs (Poids, Gras, Muscle, IMC, Tour de taille).
 */

import { Calculations } from '../calculations.js';

export const Comparator = {
  render(container, client) {
    const history = client.history || [];

    if (history.length < 2) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Comparateur Avant / Après</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Il vous faut au moins 2 bilans/pesées enregistrées pour comparer les évolutions. Actuellement : ${history.length} pesée(s).
          </p>
          <button id="btn-comp-add-weighin" class="btn btn-primary btn-sm">+ Ajouter une 2ème pesée</button>
        </div>
      `;
      container.querySelector('#btn-comp-add-weighin')?.addEventListener('click', () => {
        window.App.openClientDetail(client.id, 'bodyComp');
      });
      return;
    }

    const firstAssessment = history[0];
    const lastAssessment = history[history.length - 1];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Sélecteurs de Dates -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white">Comparateur Évolution & Bilan Avant / Après</h3>
              <p class="text-xs text-slate-400">Tous les indicateurs sont calculés automatiquement entre les deux dates</p>
            </div>
            <button id="btn-print-comp-report" class="btn btn-secondary btn-sm">
              Imprimer le Bilan
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label font-bold text-slate-400">1. Bilan Initial (Avant) :</label>
              <select id="comp-select-initial" class="input font-semibold">
                ${history.map((h, idx) => `
                  <option value="${h.id}" ${idx === 0 ? 'selected' : ''}>
                    ${new Date(h.date).toLocaleDateString('fr-FR')} — ${h.weight} kg (IMC ${h.imc || '--'})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="label font-bold text-slate-400">2. Bilan de Suivi (Après / Actuel) :</label>
              <select id="comp-select-current" class="input font-semibold">
                ${history.map((h, idx) => `
                  <option value="${h.id}" ${idx === history.length - 1 ? 'selected' : ''}>
                    ${new Date(h.date).toLocaleDateString('fr-FR')} — ${h.weight} kg (IMC ${h.imc || '--'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Zone des Résultats Calculés Automatiquement -->
        <div id="comp-results-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    const renderResults = () => {
      const initialId = container.querySelector('#comp-select-initial')?.value;
      const currentId = container.querySelector('#comp-select-current')?.value;
      const initAss = history.find(h => h.id === initialId) || firstAssessment;
      const currAss = history.find(h => h.id === currentId) || lastAssessment;

      const deltas = Calculations.calculateComparisonDeltas(initAss, currAss);
      const resultsDiv = container.querySelector('#comp-results-container');
      if (!resultsDiv || !deltas) return;

      resultsDiv.innerHTML = `
        <div class="space-y-6">
          
          <!-- Verdict Automatique -->
          <div class="glass-card p-5 border-l-4 border-emerald-500 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Verdict Évolution</span>
              <h4 class="text-lg font-bold text-white mt-0.5 ${deltas.verdictColor}">${deltas.verdict}</h4>
            </div>
            <span class="badge badge-emerald text-xs">Calcul Automatique OK</span>
          </div>

          <!-- 4 Cartes de Comparaison Calculées -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <!-- 1. Poids -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Évolution Poids</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaWeight < 0 ? 'text-emerald-400' : deltas.deltaWeight > 0 ? 'text-amber-400' : 'text-slate-300'}">
                  ${deltas.deltaWeight > 0 ? '+' : ''}${deltas.deltaWeight} kg
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.weight} kg ➔ ${currAss.weight} kg</span>
            </div>

            <!-- 2. Masse Grasse -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Masse Grasse</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaFatPct < 0 ? 'text-emerald-400' : deltas.deltaFatPct > 0 ? 'text-rose-400' : 'text-slate-300'}">
                  ${deltas.deltaFatPct > 0 ? '+' : ''}${deltas.deltaFatPct}%
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${deltas.deltaFatKg > 0 ? '+' : ''}${deltas.deltaFatKg} kg de gras</span>
            </div>

            <!-- 3. Masse Musculaire -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Masse Musculaire</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaMusclePct > 0 ? 'text-emerald-400' : deltas.deltaMusclePct < 0 ? 'text-amber-400' : 'text-slate-300'}">
                  ${deltas.deltaMusclePct > 0 ? '+' : ''}${deltas.deltaMusclePct}%
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.musclePct || '--'}% ➔ ${currAss.musclePct || '--'}%</span>
            </div>

            <!-- 4. Indice IMC -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Indice IMC</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaImc < 0 ? 'text-emerald-400' : 'text-slate-200'}">
                  ${deltas.deltaImc > 0 ? '+' : ''}${deltas.deltaImc}
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.imc || '--'} ➔ ${currAss.imc || '--'} (${currAss.imcCategory || ''})</span>
            </div>
          </div>

          <!-- Tableau Comparatif Détaillé -->
          <div class="glass-card overflow-hidden">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Indicateur</th>
                  <th class="p-3">Avant (${new Date(initAss.date).toLocaleDateString('fr-FR')})</th>
                  <th class="p-3">Après (${new Date(currAss.date).toLocaleDateString('fr-FR')})</th>
                  <th class="p-3 text-right">Différence (Delta)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr>
                  <td class="p-3 font-semibold text-white">Poids Corporel</td>
                  <td class="p-3 font-mono">${initAss.weight} kg</td>
                  <td class="p-3 font-mono font-bold text-white">${currAss.weight} kg</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaWeight <= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaWeight > 0 ? '+' : ''}${deltas.deltaWeight} kg
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Masse Grasse (%)</td>
                  <td class="p-3 font-mono">${initAss.fatPct || '--'}%</td>
                  <td class="p-3 font-mono font-bold text-amber-400">${currAss.fatPct || '--'}%</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaFatPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                    ${deltas.deltaFatPct > 0 ? '+' : ''}${deltas.deltaFatPct}%
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Masse Musculaire (%)</td>
                  <td class="p-3 font-mono">${initAss.musclePct || '--'}%</td>
                  <td class="p-3 font-mono font-bold text-emerald-400">${currAss.musclePct || '--'}%</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaMusclePct >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaMusclePct > 0 ? '+' : ''}${deltas.deltaMusclePct}%
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Tour de Taille</td>
                  <td class="p-3 font-mono">${initAss.waist ? `${initAss.waist} cm` : '--'}</td>
                  <td class="p-3 font-mono font-bold text-white">${currAss.waist ? `${currAss.waist} cm` : '--'}</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaWaist <= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaWaist !== 0 ? `${deltas.deltaWaist > 0 ? '+' : ''}${deltas.deltaWaist} cm` : '--'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    container.querySelector('#comp-select-initial')?.addEventListener('change', renderResults);
    container.querySelector('#comp-select-current')?.addEventListener('change', renderResults);
    container.querySelector('#btn-print-comp-report')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'assessment');
    });

    renderResults();
  }
};
