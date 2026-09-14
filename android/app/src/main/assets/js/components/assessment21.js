/**
 * assessment21.js - Bilan Santé des 21 Facteurs Épuré (PDF LMC Afrique)
 * Diagnostic santé simple et lisible avec calcul instantané du score de risque.
 */

import { Calculations } from '../calculations.js';
import { stateManager } from '../state.js';

export const Assessment21 = {
  render(container, client) {
    const answers = { ...(client.riskAssessment?.answers || {}) };
    const scoreInfo = Calculations.calculateRiskScore(answers);

    const nutritionQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Nutritionnel');
    const physicalQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Physique');
    const stressQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Stress & Hygiène');

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Score & Niveau de Risque Simple -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge ${scoreInfo.badgeClass} text-xs font-bold">
                Score : ${scoreInfo.score} / 21
              </span>
              <span class="text-xs text-slate-400">Niveau de risque : <strong class="text-white">${scoreInfo.riskLevel} (${scoreInfo.percentage}%)</strong></span>
            </div>
            <p class="text-xs text-slate-300 max-w-xl">
              ${scoreInfo.advice}
            </p>
          </div>

          <div class="text-right">
            <button id="btn-save-21-factors" class="btn btn-primary btn-sm">
              Enregistrer les Réponses
            </button>
          </div>
        </div>

        <!-- 3 Colonnes Claires -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- 1. Nutrition -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">1. Facteurs Nutritionnels</h4>
              <span class="text-xs text-slate-400 font-mono">${nutritionQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${nutritionQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 2. Physique -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">2. Facteurs Physiques</h4>
              <span class="text-xs text-slate-400 font-mono">${physicalQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${physicalQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 3. Stress & Hygiène -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">3. Stress & Mode de Vie</h4>
              <span class="text-xs text-slate-400 font-mono">${stressQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${stressQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const checkboxes = container.querySelectorAll('.cb-risk');
    const saveBtn = container.querySelector('#btn-save-21-factors');

    const saveAnswers = () => {
      const currentAnswers = {};
      checkboxes.forEach(input => {
        if (input.checked) currentAnswers[input.getAttribute('data-id')] = true;
      });
      stateManager.updateRiskAssessment(client.id, currentAnswers);
    };

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        saveAnswers();
      });
    });

    saveBtn?.addEventListener('click', () => {
      saveAnswers();
      window.App.showToast('Bilan santé 21F sauvegardé', 'success');
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
    });
  }
};
