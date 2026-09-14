/**
 * messages.js - Communication, Journal de Bord & Passerelle WhatsApp
 */

import { stateManager } from '../state.js';
import { ThermalPrinter } from '../printer.js';

export const Messages = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const coach = stateManager.getCoachProfile();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Sélectionnez un athlète pour consulter le journal de bord ou lui envoyer un message WhatsApp.</p>
        </div>
      `;
      return;
    }

    const messages = client.messages || [];

    container.innerHTML = `
      <div class="messages-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Journal & WhatsApp</span>
              <span class="text-xs text-slate-400">Suivi relationnel</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Échanges avec <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">📞 WhatsApp : ${client.phone || 'Non renseigné'}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select id="select-msg-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName}
                </option>
              `).join('')}
            </select>
            <button id="btn-open-wa-direct" class="btn btn-whatsapp btn-sm">
              💬 Ouvrir WhatsApp
            </button>
          </div>
        </div>

        <!-- 3 Raccourcis de Messages Types WhatsApp -->
        <div class="glass-card p-5 space-y-3">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Modèles Rapides d'Envoi WhatsApp</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">📊 Synthèse de Bilan</span>
              <p class="text-[11px] text-slate-400">Envoie les mesures clés, IMC, % gras/muscle et cible calorique.</p>
              <button id="btn-send-wa-assessment" class="btn btn-secondary btn-xs w-full">Envoyer Bilan</button>
            </div>

            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">🏋️ Rappel de Séance</span>
              <p class="text-[11px] text-slate-400">Rappelle le créneau d'entraînement et le lieu prévu.</p>
              <button id="btn-send-wa-reminder" class="btn btn-secondary btn-xs w-full">Envoyer Rappel</button>
            </div>

            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">📝 Lien de Check-in Hebdo</span>
              <p class="text-[11px] text-slate-400">Demande à l'athlète ses notes d'énergie, sommeil et poids.</p>
              <button id="btn-send-wa-checkin" class="btn btn-secondary btn-xs w-full">Demander Check-in</button>
            </div>
          </div>
        </div>

        <!-- Journal de Bord Interne du Coach -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">Journal des Notes & Échanges (${messages.length})</h3>
          </div>

          <div class="space-y-3 max-h-72 overflow-y-auto p-1">
            ${messages.map(m => `
              <div class="p-3 rounded-lg bg-[#0c1220] border border-slate-800 space-y-1">
                <div class="flex items-center justify-between text-[11px]">
                  <strong class="text-emerald-400">${m.sender === 'coach' ? coach.name : client.firstName}</strong>
                  <span class="text-slate-500">${new Date(m.date).toLocaleDateString('fr-FR')} à ${new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="text-xs text-slate-300">${m.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- Ajout d'une Note / Message interne -->
          <form id="form-add-internal-note" class="flex gap-2 pt-2 border-t border-slate-800">
            <input type="text" name="noteText" placeholder="Ajouter une note de suivi (ex: Bonne énergie aujourd'hui, squat à 60kg réussi)..." class="input text-xs flex-1" required />
            <button type="submit" class="btn btn-primary btn-sm">Ajouter Note</button>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client, coach);
  },

  bindEvents(container, client, coach) {
    const selectClient = container.querySelector('#select-msg-client');
    selectClient?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    const openWhatsApp = (msg) => {
      let phone = client.phone ? client.phone.replace(/[^0-9+]/g, '') : '';
      if (phone.startsWith('0') && phone.length === 10) phone = '33' + phone.substring(1);
      const url = phone
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    };

    container.querySelector('#btn-open-wa-direct')?.addEventListener('click', () => {
      openWhatsApp(`Bonjour ${client.firstName} ! C'est ${coach.name}, ton coach. Comment s'est passée ta journée ?`);
    });

    container.querySelector('#btn-send-wa-assessment')?.addEventListener('click', () => {
      const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
      const url = ThermalPrinter.generateWhatsAppLink(client, last, coach);
      window.open(url, '_blank');
    });

    container.querySelector('#btn-send-wa-reminder')?.addEventListener('click', () => {
      openWhatsApp(`Bonjour ${client.firstName} ! Petit rappel pour notre prochaine séance d'entraînement. Sois bien hydraté(e) et prêt(e) ! 💪 - ${coach.name}`);
    });

    container.querySelector('#btn-send-wa-checkin')?.addEventListener('click', () => {
      openWhatsApp(`Salut ${client.firstName} ! C'est l'heure de ton check-in hebdomadaire : merci de me transmettre ton poids du matin, ainsi que tes niveaux de forme et sommeil sur 10. À très vite ! - ${coach.name}`);
    });

    // Formulaire d'ajout de note interne
    container.querySelector('#form-add-internal-note')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input[name="noteText"]');
      if (input && input.value) {
        stateManager.addMessage(client.id, input.value, 'coach');
        window.App.showToast('Note ajoutée au journal', 'success');
        this.render(container, client.id);
      }
    });
  }
};
