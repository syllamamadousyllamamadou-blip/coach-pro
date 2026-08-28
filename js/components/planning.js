/**
 * planning.js - Calendrier & Planning des Séances Privées
 * Gère les créneaux (08h00 Aïcha, 10h00 Karim...), la validation directe (-1 séance) et la planification.
 */

import { stateManager } from '../state.js';

export const Planning = {
  render(container) {
    const appointments = stateManager.getAppointments();
    const clients = stateManager.getClients();
    const todayStr = new Date().toISOString().split('T')[0];

    // Regrouper par date
    const grouped = {};
    appointments.forEach(a => {
      if (!grouped[a.date]) grouped[a.date] = [];
      grouped[a.date].push(a);
    });

    const sortedDates = Object.keys(grouped).sort();

    container.innerHTML = `
      <div class="planning-view space-y-6">
        
        <!-- Header Planning -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Agenda Coach</span>
              <span class="text-xs text-slate-400">Gestion des séances individuelles</span>
            </div>
            <h1 class="text-xl font-bold text-white">Planning & Rendez-vous</h1>
            <p class="text-xs text-slate-400 mt-0.5">Validez les séances effectuées pour décompter automatiquement le forfait</p>
          </div>

          <button id="btn-open-new-apt-modal" class="btn btn-primary btn-sm">
            + Planifier une Séance
          </button>
        </div>

        <!-- Formulaire Rapide d'Ajout (Masquable) -->
        <div id="quick-add-apt-panel" class="glass-card p-5 hidden space-y-4 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">Nouvelle Séance Privée</h3>
            <button id="btn-close-apt-panel" class="text-xs text-slate-400 hover:text-white">✕</button>
          </div>

          <form id="form-create-apt" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Athlète Concerné *</label>
                <select name="clientId" id="apt-client-select" class="input text-xs font-semibold" required>
                  <option value="">-- Sélectionner un client --</option>
                  ${clients.map(c => `
                    <option value="${c.id}" data-name="${c.firstName} ${c.lastName}">
                      ${c.firstName} ${c.lastName} (${c.package ? `${(c.package.totalSessions || 0) - (c.package.sessionsUsed || 0)} rest.` : '0 rest.'})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="label">Date *</label>
                <input type="date" name="date" value="${todayStr}" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Heure *</label>
                <input type="time" name="time" value="08:00" class="input text-xs font-bold" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Lieu</label>
                <input type="text" name="location" placeholder="ex: Domicile client / Salle Cocody" class="input text-xs" />
              </div>
              <div>
                <label class="label">Durée</label>
                <select name="duration" class="input text-xs">
                  <option value="45 min">45 min</option>
                  <option value="60 min" selected>60 min</option>
                  <option value="75 min">75 min</option>
                  <option value="90 min">90 min</option>
                </select>
              </div>
              <div>
                <label class="label">Type de séance</label>
                <input type="text" name="type" placeholder="ex: Renforcement / Cardio / Bilan" class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="btn-cancel-create-apt" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer au Planning</button>
            </div>
          </form>
        </div>

        <!-- Liste Chronologique des Séances -->
        <div class="space-y-4">
          ${sortedDates.length === 0 ? `
            <div class="glass-card p-10 text-center space-y-3">
              <p class="text-xs text-slate-400">Aucune séance planifiée dans votre calendrier.</p>
              <button id="btn-start-planning-first" class="btn btn-primary btn-sm">+ Planifier ma première séance</button>
            </div>
          ` : sortedDates.map(date => {
            const dateObj = new Date(date);
            const isToday = date === todayStr;
            const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            return `
              <div class="glass-card p-5 space-y-3 ${isToday ? 'border-emerald-500/40 bg-emerald-950/10' : ''}">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold capitalize ${isToday ? 'text-emerald-400 font-black' : 'text-white'}">${formattedDate}</span>
                    ${isToday ? '<span class="badge badge-emerald text-[10px]">Aujourd\'hui</span>' : ''}
                  </div>
                  <span class="text-xs text-slate-400">${grouped[date].length} séance(s)</span>
                </div>

                <div class="space-y-2">
                  ${grouped[date].map(apt => `
                    <div class="p-3.5 rounded-lg bg-[#0c1220] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      <div class="flex items-center gap-4">
                        <div class="text-center font-mono py-1 px-2.5 rounded bg-slate-900 border border-slate-700">
                          <span class="text-sm font-bold text-white block leading-tight">${apt.time}</span>
                          <span class="text-[9px] text-slate-400">${apt.duration}</span>
                        </div>

                        <div>
                          <h4 class="text-sm font-bold text-white">${apt.clientName}</h4>
                          <p class="text-xs text-slate-400">${apt.location || 'Lieu habituel'} • <span class="text-slate-300">${apt.type || 'Séance coaching'}</span></p>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        ${apt.status === 'completed' ? `
                          <span class="badge badge-emerald text-xs">✓ Effectuée</span>
                        ` : `
                          <button class="btn btn-primary btn-xs" data-action="complete-apt" data-apt-id="${apt.id}">
                            ✓ Valider Séance (-1)
                          </button>
                        `}
                        <button class="btn btn-outline btn-xs text-red-400" data-action="delete-apt" data-apt-id="${apt.id}">
                          ✕
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const panel = container.querySelector('#quick-add-apt-panel');
    const openBtn = container.querySelector('#btn-open-new-apt-modal');
    const closeBtn = container.querySelector('#btn-close-apt-panel');
    const cancelBtn = container.querySelector('#btn-cancel-create-apt');
    const startFirstBtn = container.querySelector('#btn-start-planning-first');

    const togglePanel = (show) => {
      if (panel) {
        if (show) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
    };

    openBtn?.addEventListener('click', () => togglePanel(true));
    startFirstBtn?.addEventListener('click', () => togglePanel(true));
    closeBtn?.addEventListener('click', () => togglePanel(false));
    cancelBtn?.addEventListener('click', () => togglePanel(false));

    // Soumission du formulaire de séance
    container.querySelector('#form-create-apt')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const select = container.querySelector('#apt-client-select');
      const clientName = select.options[select.selectedIndex]?.getAttribute('data-name') || 'Athlète';

      const newApt = {
        clientId: formData.get('clientId'),
        clientName,
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration'),
        location: formData.get('location') || 'Domicile / Salle',
        type: formData.get('type') || 'Séance Privée'
      };

      stateManager.addAppointment(newApt);
      window.App.showToast('Séance planifiée avec succès !', 'success');
      this.render(container);
    });

    // Validation séance (décompte forfait)
    container.querySelectorAll('[data-action="complete-apt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const aptId = e.currentTarget.getAttribute('data-apt-id');
        stateManager.updateAppointmentStatus(aptId, 'completed');
        window.App.showToast('Séance validée et décomptée du forfait !', 'success');
        this.render(container);
      });
    });

    // Suppression séance
    container.querySelectorAll('[data-action="delete-apt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const aptId = e.currentTarget.getAttribute('data-apt-id');
        if (confirm('Supprimer ce rendez-vous ?')) {
          stateManager.deleteAppointment(aptId);
          window.App.showToast('Séance supprimée', 'info');
          this.render(container);
        }
      });
    });
  }
};
