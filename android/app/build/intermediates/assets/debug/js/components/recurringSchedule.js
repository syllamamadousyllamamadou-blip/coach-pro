/**
 * recurringSchedule.js - Créneaux d'Entraînement Récurrents & Rappels WhatsApp pour COACH PRO
 * Configure les jours et heures habituels d'entraînement de chaque athlète,
 * génère des rappels WhatsApp en 1 clic et permet le pointage direct de présence.
 */

import { stateManager } from '../state.js';

export const RecurringScheduleComponent = {
  DAYS: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],

  render(container, client) {
    const sched = client.trainingSchedule || {
      days: ['Lundi', 'Mercredi', 'Vendredi'],
      times: { 'Lundi': '07:00', 'Mercredi': '07:00', 'Vendredi': '07:00' },
      location: client.residence || 'Salle de sport / Domicile',
      notes: ''
    };

    const pkg = client.package || {};
    const remaining = Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0));

    container.innerHTML = `
      <div class="recurring-schedule-view space-y-6">
        
        <!-- En-tête Créneaux -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Organisation Hebdomadaire</span>
              <span class="text-xs text-slate-400">Jours & Heures d'Entraînement</span>
            </div>
            <h3 class="text-xl font-bold text-white">Créneaux Fixes de l'Athlète</h3>
            <p class="text-xs text-slate-400 mt-0.5">Définissez les rendez-vous réguliers de ${client.firstName} pour automatiser les rappels</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-quick-log-session" class="btn btn-primary btn-sm flex items-center gap-1 font-bold shadow-lg shadow-emerald-500/20">
              <span>✓</span>
              <span>Pointer Séance (-1)</span>
            </button>
            <button id="btn-whatsapp-reminder" class="btn btn-whatsapp btn-sm flex items-center gap-1 font-bold">
              <span>💬</span>
              <span>Rappel WhatsApp</span>
            </button>
          </div>
        </div>

        <!-- Récapitulatif des Créneaux Actifs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Jours d'Entraînement</span>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${(sched.days || []).map(day => `
                <span class="badge badge-emerald text-xs font-bold">${day} (${sched.times?.[day] || '08:00'})</span>
              `).join('')}
            </div>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Lieu Habituel</span>
            <span class="text-base font-bold text-white mt-1 block">${sched.location || 'Domicile / Salle'}</span>
            <span class="text-[11px] text-slate-500">Lieu d'intervention du coach</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Forfait Restant</span>
            <span class="text-2xl font-bold font-mono ${remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'} mt-1 block">
              ${remaining} <span class="text-xs text-slate-400 font-normal">/ ${pkg.totalSessions || 10} séances</span>
            </span>
            <span class="text-[11px] text-slate-500">${pkg.sessionsUsed || 0} séances déjà effectuées</span>
          </div>
        </div>

        <!-- Formulaire de Configuration des Créneaux -->
        <div class="glass-card p-5 space-y-4">
          <h4 class="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>⚙️</span> Modifier les Jours et Heures de Séance
          </h4>

          <form id="form-recurring-schedule" class="space-y-5">
            <div>
              <label class="label mb-2">Sélectionnez les jours d'entraînement habituels :</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                ${this.DAYS.map(day => {
                  const isChecked = (sched.days || []).includes(day);
                  const timeVal = sched.times?.[day] || '07:00';
                  return `
                    <div class="p-3 rounded-xl border ${isChecked ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/50'} space-y-2 text-center">
                      <label class="flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs ${isChecked ? 'text-emerald-400' : 'text-slate-300'}">
                        <input type="checkbox" name="sched_days" value="${day}" ${isChecked ? 'checked' : ''} class="accent-emerald-500 rounded" />
                        <span>${day.slice(0, 3)}</span>
                      </label>
                      <input type="time" name="time_${day}" value="${timeVal}" class="input input-sm text-xs font-mono font-bold text-center px-1" />
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Lieu Habituel des Séances</label>
                <input type="text" id="sched-location" value="${sched.location || ''}" placeholder="ex: Domicile athlète / Salle de sport / Parc Cocody" class="input text-xs" />
              </div>
              <div>
                <label class="label">Consignes Spécifiques / Notes du Coach</label>
                <input type="text" id="sched-notes" value="${sched.notes || ''}" placeholder="ex: Prévoir serviette et bouteille d'eau fraîche" class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
                Enregistrer les Créneaux
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const coach = stateManager.getCoachProfile();

    // Formulaire d'enregistrement
    const form = container.querySelector('#form-recurring-schedule');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedDays = Array.from(container.querySelectorAll('input[name="sched_days"]:checked')).map(cb => cb.value);
      const times = {};
      selectedDays.forEach(day => {
        const timeInput = container.querySelector(`input[name="time_${day}"]`);
        times[day] = timeInput ? timeInput.value : '07:00';
      });

      const location = container.querySelector('#sched-location')?.value || '';
      const notes = container.querySelector('#sched-notes')?.value || '';

      stateManager.saveClientSchedule(client.id, {
        days: selectedDays,
        times,
        location,
        notes
      });

      alert('Créneaux d\'entraînement enregistrés avec succès !');
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
    });

    // Pointage rapide
    container.querySelector('#btn-quick-log-session')?.addEventListener('click', () => {
      stateManager.logSessionAttendance(client.id, { notes: 'Séance pointée depuis les créneaux' });
      alert(`Séance validée pour ${client.firstName} !`);
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    // Rappel WhatsApp
    container.querySelector('#btn-whatsapp-reminder')?.addEventListener('click', () => {
      const sched = client.trainingSchedule || {};
      const daysStr = (sched.days || []).join(', ');
      const coachName = coach.name || 'Votre Coach';

      const phone = (client.phone || '').replace(/[^0-9]/g, '');
      if (!phone) {
        alert('Numéro de téléphone du client manquant.');
        return;
      }

      const msg = `Bonjour ${client.firstName} ! C'est ${coachName}.\nRappel pour notre prochaine séance d'entraînement prévue sur votre créneau (${daysStr || 'cette semaine'}).\nPensez à votre tenue, votre serviette et une bonne hydratation ! 💪🔥`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    });
  }
};
