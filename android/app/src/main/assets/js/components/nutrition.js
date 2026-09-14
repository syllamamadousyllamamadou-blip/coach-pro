/**
 * nutrition.js - Plan Alimentaire & Suivi Nutritionnel Personnalisé
 * Gère : Cible calorique, Macros (P/G/L), Repas (Petit-déj, Déjeuner, Collation, Dîner), Aliments à privilégier/limiter.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const Nutrition = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Créez ou sélectionnez un client pour configurer son plan alimentaire personnalisé.</p>
          <button id="btn-create-client-nutri" class="btn btn-primary btn-sm">+ Créer un client</button>
        </div>
      `;
      container.querySelector('#btn-create-client-nutri')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    const lastAssessment = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const weight = lastAssessment ? lastAssessment.weight : 75;
    const height = lastAssessment ? lastAssessment.height : 175;
    const age = client.age || 30;
    const gender = client.gender || 'H';

    const mb = Calculations.calculateMB(weight, height, age, gender);
    const det = Calculations.calculateDET(mb, client.lifestyle?.activityLevel || 1.375);
    const defaultNutri = Calculations.calculateNutritionPlan(det, client.mainGoal === 'Prise de masse musculaire' ? 'bulk' : 'cut');

    const plan = client.nutritionPlan || {
      targetKcal: defaultNutri.targetKcal,
      proteinGrams: defaultNutri.grams.proteinGrams,
      carbGrams: defaultNutri.grams.carbGrams,
      fatGrams: defaultNutri.grams.fatGrams,
      waterLiters: (weight * 0.035).toFixed(1),
      meals: [
        { name: 'Petit-déjeuner (07h30)', items: '3 œufs bio ou omelette, 50g flocons d\'avoine, 1 fruit de saison, thé vert ou café sans sucre' },
        { name: 'Déjeuner (12h30)', items: '150g blanc de poulet ou poisson braisé, 120g riz complet ou patate douce, légumes sautés, 1 c.à.s huile d\'olive' },
        { name: 'Collation (16h30)', items: '1 poignée d\'amandes (30g), 1 pomme ou 1 shaker de whey isolate' },
        { name: 'Dîner (19h30)', items: '150g poisson blanc ou dinde, grande portion de légumes cuits / salade verte, avocat' }
      ],
      adviceGood: 'Poissons, volailles, œufs, légumes verts, tubercules locaux (patate douce, igname), fruits frais, eau minérale.',
      adviceBad: 'Sodas, jus industriels, fritures, alcool, sauces grasses, charcuterie, pain blanc raffiné.'
    };

    container.innerHTML = `
      <div class="nutrition-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Plan Nutritionnel Privé</span>
              <span class="text-xs text-slate-400">Prescription sur-mesure</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Nutrition de <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Dépense (DET) : ${det} kcal/j • Cible : <strong class="text-white">${plan.targetKcal} kcal/j</strong></p>
          </div>

          <div class="flex items-center gap-2">
            <select id="select-nutri-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName} (${c.mainGoal})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 4 Cartes Cibles Métaboliques -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Cible Calories</span>
            <span class="text-2xl font-bold text-emerald-400 font-mono mt-1 block">${plan.targetKcal}</span>
            <span class="text-[10px] text-slate-500">kcal / jour</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Protéines</span>
            <span class="text-2xl font-bold text-white font-mono mt-1 block">${plan.proteinGrams}g</span>
            <span class="text-[10px] text-slate-500">${(plan.proteinGrams / weight).toFixed(1)} g / kg</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Glucides</span>
            <span class="text-2xl font-bold text-white font-mono mt-1 block">${plan.carbGrams}g</span>
            <span class="text-[10px] text-slate-500">Énergie & glycogène</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Eau Conseillée</span>
            <span class="text-2xl font-bold text-sky-400 font-mono mt-1 block">${plan.waterLiters} L</span>
            <span class="text-[10px] text-slate-500">Hydratation / jour</span>
          </div>
        </div>

        <!-- Plan Alimentaire par Repas -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-base">🥗</span>
              <h3 class="text-sm font-bold text-white">Menu & Structure des Repas</h3>
            </div>
          </div>

          <form id="form-edit-nutrition" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${plan.meals.map((m, idx) => `
                <div class="sub-card p-3.5 space-y-1.5">
                  <label class="font-bold text-xs text-emerald-400 block">${m.name}</label>
                  <textarea name="meal_${idx}" rows="3" class="input text-xs w-full resize-none">${m.items}</textarea>
                </div>
              `).join('')}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div class="sub-card p-3.5 space-y-1.5">
                <label class="font-bold text-xs text-emerald-400 block">✅ Aliments à Privilégier</label>
                <textarea name="adviceGood" rows="2" class="input text-xs w-full resize-none">${plan.adviceGood || ''}</textarea>
              </div>
              <div class="sub-card p-3.5 space-y-1.5">
                <label class="font-bold text-xs text-rose-400 block">❌ Aliments à Limiter</label>
                <textarea name="adviceBad" rows="2" class="input text-xs w-full resize-none">${plan.adviceBad || ''}</textarea>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-primary">
                💾 Enregistrer le Plan Nutritionnel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client, plan);
  },

  bindEvents(container, client, plan) {
    container.querySelector('#select-nutri-client')?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    container.querySelector('#form-edit-nutrition')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const updatedMeals = plan.meals.map((m, idx) => ({
        name: m.name,
        items: formData.get(`meal_${idx}`) || m.items
      }));

      const updatedPlan = {
        ...plan,
        meals: updatedMeals,
        adviceGood: formData.get('adviceGood'),
        adviceBad: formData.get('adviceBad')
      };

      stateManager.saveClientNutrition(client.id, updatedPlan);
      window.App.showToast('Plan nutritionnel enregistré !', 'success');
    });
  }
};
