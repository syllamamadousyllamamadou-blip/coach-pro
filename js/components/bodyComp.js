/**
 * bodyComp.js - Module de Composition Corporelle & Pesées Épuré
 * Enregistrement de pesées simples et visualisation claire de la progression.
 */

import { Calculations } from '../calculations.js';
import { stateManager } from '../state.js';

export const BodyComp = {
  render(container, client) {
    const history = [...(client.history || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = history.length > 0 ? history[history.length - 1] : null;

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Bouton Nouvelle Pesée -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 class="text-lg font-bold text-white">Historique des Pesées (${history.length})</h2>
            <p class="text-xs text-slate-400">Enregistrez et suivez l'évolution du poids et des mensurations</p>
          </div>
          <button id="btn-open-weighin-dialog" class="btn btn-primary btn-sm">
            + Nouvelle Pesée
          </button>
        </div>

        <!-- Tableau des Pesées -->
        ${history.length === 0 ? `
          <div class="glass-card p-8 text-center space-y-3">
            <p class="text-xs text-slate-400">Aucune pesée enregistrée pour cet athlète.</p>
            <button id="btn-first-weighin" class="btn btn-primary btn-sm">+ Enregistrer une première pesée</button>
          </div>
        ` : `
          <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th class="p-3">Date</th>
                    <th class="p-3">Poids</th>
                    <th class="p-3">IMC</th>
                    <th class="p-3">Masse Grasse</th>
                    <th class="p-3">Masse Muscle</th>
                    <th class="p-3">Tour Taille</th>
                    <th class="p-3 text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-mono">
                  ${[...history].reverse().map(h => `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="p-3 text-white font-bold">${new Date(h.date).toLocaleDateString('fr-FR')}</td>
                      <td class="p-3 text-emerald-400 font-bold text-sm">${h.weight} kg</td>
                      <td class="p-3 text-slate-300">${h.imc || '--'}</td>
                      <td class="p-3 text-slate-300">${h.fatPct ? `${h.fatPct}% (${h.fatKg || '--'}kg)` : '--'}</td>
                      <td class="p-3 text-slate-300">${h.musclePct ? `${h.musclePct}% (${h.muscleKg || '--'}kg)` : '--'}</td>
                      <td class="p-3 text-slate-300">${h.waist ? `${h.waist} cm` : '--'}</td>
                      <td class="p-3 text-right">
                        <button class="btn btn-secondary btn-xs" data-action="print-ticket-weighin" data-weighin-id="${h.id}">
                          🖨️ Imprimer
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

        <!-- Modal Saisie Nouvelle Pesée -->
        <div id="modal-weighin-entry" class="modal-backdrop hidden">
          <div class="modal-card max-w-lg">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 class="text-base font-bold text-white">Nouvelle Pesée & Mesures</h3>
              <button id="btn-close-weighin-modal" class="btn-icon">✕</button>
            </div>

            <form id="form-add-weighin" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Date *</label>
                  <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="input" required />
                </div>
                <div>
                  <label class="label">Poids (kg) *</label>
                  <input type="number" step="0.1" name="weight" id="input-new-weight" placeholder="ex: 81.5" class="input font-bold text-emerald-400" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Taille (cm)</label>
                  <input type="number" name="height" id="input-new-height" value="${client.history[0]?.height || 175}" class="input" required />
                </div>
                <div>
                  <label class="label">Masse Grasse (%)</label>
                  <input type="number" step="0.1" name="fatPct" placeholder="ex: 21.0" class="input" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Masse Musculaire (%)</label>
                  <input type="number" step="0.1" name="musclePct" placeholder="ex: 39.0" class="input" />
                </div>
                <div>
                  <label class="label">Tour de Taille (cm)</label>
                  <input type="number" step="0.5" name="waist" placeholder="ex: 86.5" class="input" />
                </div>
              </div>

              <div>
                <label class="label">Notes / Conseils du coach</label>
                <textarea name="coachNotes" rows="2" placeholder="Remarques sur la forme du jour..." class="textarea text-xs"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" id="btn-cancel-weighin-form" class="btn btn-secondary">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer la Pesée</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const modal = container.querySelector('#modal-weighin-entry');
    const openBtn = container.querySelector('#btn-open-weighin-dialog');
    const openBtnFirst = container.querySelector('#btn-first-weighin');
    const closeBtn = container.querySelector('#btn-close-weighin-modal');
    const cancelBtn = container.querySelector('#btn-cancel-weighin-form');
    const form = container.querySelector('#form-add-weighin');

    const showModal = () => modal?.classList.remove('hidden');
    const hideModal = () => modal?.classList.add('hidden');

    openBtn?.addEventListener('click', showModal);
    openBtnFirst?.addEventListener('click', showModal);
    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const w = parseFloat(formData.get('weight'));
      const fatPct = parseFloat(formData.get('fatPct')) || 0;
      const musclePct = parseFloat(formData.get('musclePct')) || 0;

      const comps = Calculations.calculateBodyComposition(w, fatPct, musclePct, 0);

      const assessmentData = {
        date: formData.get('date'),
        weight: w,
        height: parseFloat(formData.get('height')),
        fatPct,
        fatKg: comps.fatKg,
        musclePct,
        muscleKg: comps.muscleKg,
        waist: parseFloat(formData.get('waist')) || 0,
        coachNotes: formData.get('coachNotes') || ''
      };

      stateManager.addAssessmentToClient(client.id, assessmentData);
      hideModal();
      window.App.showToast('Pesée enregistrée avec succès !', 'success');

      const updatedClient = stateManager.getClientById(client.id);
      this.render(container, updatedClient);
    });

    container.querySelectorAll('[data-action="print-ticket-weighin"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const weighinId = e.currentTarget.getAttribute('data-weighin-id');
        const assessment = client.history.find(h => h.id === weighinId);
        window.App.openThermalModal(client.id, assessment);
      });
    });
  }
};
