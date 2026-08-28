/**
 * clientList.js - Répertoire des Clients COACH PRO
 * Liste sobre et épurée sans pictogrammes superflus.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ClientList = {
  searchQuery: '',

  render(container) {
    const clients = stateManager.getClients();

    container.innerHTML = `
      <div class="client-list-view space-y-6">
        
        <!-- Header & Recherche -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 class="text-2xl font-bold text-white">Mes Clients (${clients.length})</h1>
            <p class="text-xs text-slate-400">Gérez l'ensemble de vos dossiers athlètes</p>
          </div>
          <button id="btn-list-add-client" class="btn btn-primary btn-sm">
            + Nouveau Client
          </button>
        </div>

        <!-- Barre de Recherche -->
        <div class="glass-card p-3">
          <input type="text" id="input-client-search" value="${this.searchQuery}" placeholder="Rechercher par prénom, nom, quartier, profession, téléphone..." class="input" />
        </div>

        <!-- Liste des Clients -->
        <div id="clients-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    this.renderClientsList(container);
    this.bindEvents(container);
  },

  renderClientsList(container) {
    const clients = stateManager.getClients();
    const listContainer = container.querySelector('#clients-container');
    if (!listContainer) return;

    const q = this.searchQuery.toLowerCase().trim();
    const filtered = clients.filter(c => {
      if (!q) return true;
      return (
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.residence && c.residence.toLowerCase().includes(q)) ||
        (c.profession && c.profession.toLowerCase().includes(q)) ||
        (c.mainGoal && c.mainGoal.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <p class="text-sm text-slate-400">
            ${clients.length === 0 ? 'Vous n\'avez pas encore enregistré de client.' : 'Aucun client ne correspond à votre recherche.'}
          </p>
          ${clients.length === 0 ? `
            <button id="btn-empty-list-add" class="btn btn-primary btn-sm">+ Enregistrer mon premier client</button>
          ` : ''}
        </div>
      `;
      listContainer.querySelector('#btn-empty-list-add')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    listContainer.innerHTML = `
      <div class="space-y-3">
        
        <!-- VUE MOBILE (Cartes Tactiles) -->
        <div class="block md:hidden space-y-3">
          ${filtered.map(c => {
            const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
            const pkg = c.package || {};
            const isDuration = pkg.packageType === 'duration';
            const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;

            return `
              <div class="sub-card p-3.5 space-y-3 border border-slate-800">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <strong class="text-white text-sm font-bold block">${c.firstName} ${c.lastName}</strong>
                    <span class="text-[11px] text-slate-400">${c.residence || ''}${c.residence && c.profession ? ' • ' : ''}${c.profession || ''}</span>
                  </div>
                  <span class="badge badge-neutral text-[10px]">${c.mainGoal}</span>
                </div>

                <div class="grid grid-cols-3 gap-2 bg-[#0c1220] p-2 rounded-lg text-center text-xs">
                  <div>
                    <span class="text-[10px] text-slate-500 block">Contact</span>
                    <span class="font-bold text-white font-mono text-[11px] truncate block">${c.phone || '--'}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 block">Poids</span>
                    <span class="font-bold text-white font-mono">${last ? `${last.weight} kg` : '--'}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 block">Forfait</span>
                    <span class="font-bold ${isDuration ? 'text-emerald-400' : (sessionsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400')} font-mono">
                      ${isDuration ? `${pkg.durationMonths || 1}M` : `${sessionsLeft} rest.`}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <button class="btn btn-primary btn-xs flex-1 py-2 font-bold" data-action="open-client" data-client-id="${c.id}">
                    Ouvrir Dossier
                  </button>
                  <button class="btn btn-secondary btn-xs flex-1 py-2" data-action="print-ticket" data-client-id="${c.id}">
                    Ticket Bilan
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- VUE DESKTOP (Tableau classique) -->
        <div class="hidden md:block glass-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Athlète</th>
                  <th class="p-3">Habitation / Profession</th>
                  <th class="p-3">Objectif</th>
                  <th class="p-3">Dernière Pesée</th>
                  <th class="p-3">Forfait en Cours</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${filtered.map(c => {
                  const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
                  const pkg = c.package || {};
                  const isDuration = pkg.packageType === 'duration';
                  const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                  
                  return `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="p-3">
                        <div class="font-bold text-white text-sm">${c.firstName} ${c.lastName}</div>
                        <div class="text-[11px] text-slate-400">${c.phone || 'Pas de numéro'}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-white">${c.residence || '<span class="text-slate-500">Non renseigné</span>'}</div>
                        <div class="text-[11px] text-slate-400">${c.profession || ''}</div>
                      </td>
                      <td class="p-3">
                        <span class="badge badge-neutral">${c.mainGoal}</span>
                      </td>
                      <td class="p-3 font-mono">
                        ${last ? `<span class="font-bold text-white">${last.weight} kg</span>` : '<span class="text-slate-500 italic">--</span>'}
                      </td>
                      <td class="p-3">
                        ${isDuration ? `
                          <span class="badge badge-emerald font-mono">
                            ${pkg.durationMonths || 1} Mois (${pkg.sessionsUsed || 0} séances)
                          </span>
                        ` : `
                          <span class="badge ${sessionsLeft <= 2 ? 'badge-amber' : 'badge-neutral'} font-mono">
                            ${sessionsLeft} / ${pkg.totalSessions || 0} séances
                          </span>
                        `}
                      </td>
                      <td class="p-3 text-right space-x-1">
                        <button class="btn btn-secondary btn-xs" data-action="print-ticket" data-client-id="${c.id}" title="Imprimer Ticket Bilan">
                          Bilan
                        </button>
                        <button class="btn btn-primary btn-xs" data-action="open-client" data-client-id="${c.id}">
                          Dossier
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindRowActions(listContainer);
  },

  bindEvents(container) {
    container.querySelector('#btn-list-add-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    const searchInput = container.querySelector('#input-client-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderClientsList(container);
    });
  },

  bindRowActions(listContainer) {
    listContainer.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId);
      });
    });

    listContainer.querySelectorAll('[data-action="print-ticket"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'assessment');
      });
    });
  }
};
