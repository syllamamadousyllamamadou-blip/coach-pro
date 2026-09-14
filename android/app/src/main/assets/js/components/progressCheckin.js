/**
 * progressCheckin.js - Check-ins Hebdomadaires, Suivi Transformation & Mesures
 * Gère le scoring d'adhérence (/10), alertes (🟢/🟠/🔴), mensurations et comparateur Avant / Aujourd'hui.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ProgressCheckin = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Sélectionnez un athlète pour enregistrer ses check-ins hebdomadaires et voir sa progression.</p>
          <button id="btn-create-client-chk" class="btn btn-primary btn-sm">+ Créer un client</button>
        </div>
      `;
      container.querySelector('#btn-create-client-chk')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    const checkins = client.checkins || [];
    const history = client.history || [];
    const firstAssessment = history.length > 0 ? history[0] : null;
    const lastAssessment = history.length > 0 ? history[history.length - 1] : null;

    // Calcul du statut de forme actuel
    const lastCheckin = checkins.length > 0 ? checkins[0] : null;
    const statusPill = client.checkinStatus === 'struggling'
      ? { text: '🔴 Client en difficulté', class: 'border-rose-500/50 bg-rose-500/10 text-rose-300' }
      : client.checkinStatus === 'medium'
      ? { text: '🟠 Adhérence moyenne', class: 'border-amber-500/50 bg-amber-500/10 text-amber-300' }
      : { text: '🟢 Tout va bien (Adhérence optimale)', class: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' };

    // Comparateur Avant / Aujourd'hui
    const comparison = (firstAssessment && lastAssessment && history.length > 1)
      ? Calculations.compareEntries(firstAssessment, lastAssessment, client.mainGoal)
      : null;

    container.innerHTML = `
      <div class="checkin-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Suivi & Transformation</span>
              <span class="text-xs ${statusPill.class} px-2 py-0.5 rounded-full font-bold border">${statusPill.text}</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Progression de <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Objectif : ${client.mainGoal} • Poids de départ : ${firstAssessment?.weight || '--'} kg</p>
          </div>

          <div class="flex items-center gap-2">
            <select id="select-chk-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName}
                </option>
              `).join('')}
            </select>
            <button id="btn-open-add-checkin" class="btn btn-primary btn-sm">
              + Nouveau Check-in Hebdo
            </button>
          </div>
        </div>

        <!-- Comparateur Transformation Avant / Aujourd'hui -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">📸 Bilan de Transformation (Avant → Aujourd'hui)</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Poids</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.weight || '--'}kg →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.weight || '--'}kg</span>
              </div>
              <span class="text-xs font-bold ${comparison?.deltas.weight < 0 ? 'text-emerald-400' : 'text-amber-400'}">
                ${comparison ? `${comparison.deltas.weight > 0 ? '+' : ''}${comparison.deltas.weight} kg` : 'Bilan initial'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Masse Grasse</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.fatPct || '--'}% →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.fatPct || '--'}%</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.fatPct !== null && comparison?.deltas.fatPct !== undefined ? `${comparison.deltas.fatPct > 0 ? '+' : ''}${comparison.deltas.fatPct}%` : '--'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Masse Musculaire</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.musclePct || '--'}% →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.musclePct || '--'}%</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.musclePct !== null && comparison?.deltas.musclePct !== undefined ? `${comparison.deltas.musclePct > 0 ? '+' : ''}${comparison.deltas.musclePct}%` : '--'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Tour de Taille</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.waist || '--'}cm →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.waist || '--'}cm</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.waist !== null && comparison?.deltas.waist !== undefined ? `${comparison.deltas.waist > 0 ? '+' : ''}${comparison.deltas.waist} cm` : '--'}
              </span>
            </div>
          </div>
        </div>

        <!-- Formulaire d'Ajout Check-in (Masquable) -->
        <div id="add-checkin-panel" class="glass-card p-5 hidden space-y-4 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">📝 Enregistrer un Check-in Hebdomadaire</h3>
            <button id="btn-close-chk-panel" class="text-xs text-slate-400 hover:text-white">✕</button>
          </div>

          <form id="form-create-checkin" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Date du Check-in</label>
                <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Poids Actuel (kg)</label>
                <input type="number" step="0.1" name="weight" value="${lastAssessment?.weight || 75}" class="input text-xs font-bold text-emerald-400" required />
              </div>
              <div>
                <label class="label">Adhérence Globale (%)</label>
                <input type="number" name="adherencePct" value="85" placeholder="ex: 80" class="input text-xs font-bold" required />
              </div>
            </div>

            <!-- Notes sur 10 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0c1220] p-3 rounded-lg border border-slate-800">
              <div>
                <label class="label">Énergie ( / 10)</label>
                <input type="number" min="1" max="10" name="energy" value="8" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Sommeil ( / 10)</label>
                <input type="number" min="1" max="10" name="sleep" value="7" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Niveau de Stress ( / 10)</label>
                <input type="number" min="1" max="10" name="stress" value="4" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Contrôle Faim ( / 10)</label>
                <input type="number" min="1" max="10" name="hunger" value="7" class="input text-xs font-bold" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Difficultés rencontrées cette semaine</label>
                <input type="text" name="difficulties" placeholder="ex: Déjeuner pris sur le pouce mercredi, courbatures..." class="input text-xs" />
              </div>
              <div>
                <label class="label">Commentaire & Conseils du Coach</label>
                <input type="text" name="coachFeedback" placeholder="ex: Excellent engagement ! Continuer l'hydratation." class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="btn-cancel-chk" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer le Check-in</button>
            </div>
          </form>
        </div>

        <!-- Historique des Check-ins Hebdomadaires -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Historique des Check-ins (${checkins.length})</h3>

          ${checkins.length === 0 ? `
            <div class="p-6 text-center text-slate-400 space-y-2">
              <p class="text-xs">Aucun check-in enregistré pour le moment.</p>
              <button id="btn-first-checkin-start" class="btn btn-secondary btn-xs">+ Réaliser le premier check-in</button>
            </div>
          ` : `
            <div class="space-y-3">
              ${checkins.map(chk => {
                const badge = chk.status === 'struggling' ? 'badge-rose' : chk.status === 'medium' ? 'badge-amber' : 'badge-emerald';
                const label = chk.status === 'struggling' ? '🔴 En difficulté' : chk.status === 'medium' ? '🟠 Moyen' : '🟢 Optimal';

                return `
                  <div class="p-4 rounded-lg bg-[#0c1220] border border-slate-800 space-y-2.5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-xs">${new Date(chk.date).toLocaleDateString('fr-FR')}</span>
                        <span class="badge ${badge} text-[10px]">${label}</span>
                        <span class="text-xs font-mono font-bold text-white">• Poids : ${chk.weight} kg</span>
                      </div>
                      <span class="text-xs font-bold text-emerald-400 font-mono">Adhérence : ${chk.adherencePct}%</span>
                    </div>

                    <div class="grid grid-cols-4 gap-2 text-center text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div>⚡ Énergie : <strong>${chk.energy}/10</strong></div>
                      <div>😴 Sommeil : <strong>${chk.sleep}/10</strong></div>
                      <div>🧘 Stress : <strong>${chk.stress}/10</strong></div>
                      <div>🥗 Faim : <strong>${chk.hunger}/10</strong></div>
                    </div>

                    ${chk.difficulties ? `<p class="text-xs text-slate-400">⚠️ <em>Difficultés :</em> ${chk.difficulties}</p>` : ''}
                    ${chk.coachFeedback ? `<p class="text-xs text-emerald-300">💬 <em>Feedback coach :</em> ${chk.coachFeedback}</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const selectClient = container.querySelector('#select-chk-client');
    selectClient?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    const panel = container.querySelector('#add-checkin-panel');
    const openBtn = container.querySelector('#btn-open-add-checkin');
    const firstBtn = container.querySelector('#btn-first-checkin-start');
    const closeBtn = container.querySelector('#btn-close-chk-panel');
    const cancelBtn = container.querySelector('#btn-cancel-chk');

    const toggle = (show) => {
      if (panel) {
        if (show) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
    };

    openBtn?.addEventListener('click', () => toggle(true));
    firstBtn?.addEventListener('click', () => toggle(true));
    closeBtn?.addEventListener('click', () => toggle(false));
    cancelBtn?.addEventListener('click', () => toggle(false));

    // Soumission du check-in
    container.querySelector('#form-create-checkin')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const checkinData = {
        date: formData.get('date'),
        weight: formData.get('weight'),
        adherencePct: formData.get('adherencePct'),
        energy: formData.get('energy'),
        sleep: formData.get('sleep'),
        stress: formData.get('stress'),
        hunger: formData.get('hunger'),
        difficulties: formData.get('difficulties'),
        coachFeedback: formData.get('coachFeedback')
      };

      stateManager.addCheckin(client.id, checkinData);
      window.App.showToast('Check-in hebdomadaire enregistré !', 'success');
      this.render(container, client.id);
    });
  }
};
