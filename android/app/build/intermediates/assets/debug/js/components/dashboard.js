/**
 * dashboard.js - Tableau de Bord COACH PRO
 * Sobre, sans fausses données pré-remplies, et adapté aux informations réelles du coach.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const Dashboard = {
  render(container) {
    const clients = stateManager.getClients();
    const coach = stateManager.getCoachProfile();

    const totalClients = clients.length;
    let totalSessionsDone = 0;
    let totalBalanceDue = 0;
    
    clients.forEach(c => {
      if (c.package) {
        totalSessionsDone += (c.package.sessionsUsed || 0);
        totalBalanceDue += (c.package.balanceDue || 0);
      }
    });

    const displayName = coach?.name ? coach.name : 'Coach';

    container.innerHTML = `
      <div class="dashboard-view space-y-6">
        
        <!-- En-tête Coach Sobre -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Espace Coach Privé ${coach.city ? `• ${coach.city}` : ''}
            </span>
            <h1 class="text-2xl font-bold text-white mt-0.5">
              Bonjour, <span class="text-emerald-400">${displayName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">
              ${coach.brand ? `${coach.brand} • ` : ''}<span class="text-slate-300">${coach.motto ? `"${coach.motto}"` : 'Prêt pour les séances du jour'}</span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-dash-new-client" class="btn btn-primary btn-sm">
              + Nouveau Client
            </button>
            <button id="btn-dash-quick-calc" class="btn btn-secondary btn-sm">
              Calculateur Flash
            </button>
            <button id="btn-dash-settings" class="btn btn-outline btn-sm">
              Profil & Reçus
            </button>
          </div>
        </div>

        <!-- 3 Cartes Métriques Clés en FCFA -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Clients Suivis</span>
            <span class="text-3xl font-bold text-white mt-1 block">${totalClients}</span>
            <span class="text-[11px] text-slate-500">Athlètes actifs</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Séances Effectuées</span>
            <span class="text-3xl font-bold text-emerald-400 mt-1 block">${totalSessionsDone}</span>
            <span class="text-[11px] text-slate-500">Total séances pointées</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Soldes à Encaisser</span>
            <span class="text-2xl font-bold text-white font-mono mt-1 block">${Calculations.formatFCFA(totalBalanceDue)}</span>
            <span class="text-[11px] ${totalBalanceDue > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500'}">
              ${totalBalanceDue > 0 ? 'Règlements restants' : 'Tous forfaits soldés'}
            </span>
          </div>
        </div>

        <!-- Tableau des Clients -->
        ${totalClients === 0 ? `
          <div class="glass-card p-10 text-center space-y-4">
            <div>
              <h3 class="text-base font-bold text-white">Aucun client pour le moment</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Créez votre première fiche client pour calculer automatiquement ses indicateurs corporels, enregistrer ses paiements et imprimer ses reçus.
              </p>
            </div>
            <button id="btn-empty-create-client" class="btn btn-primary btn-sm">
              + Créer mon premier client
            </button>
          </div>
        ` : `
          <div class="glass-card p-4 sm:p-5 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white">Clients en Suivi (${totalClients})</h3>
              <button id="btn-see-all-clients" class="text-xs text-emerald-400 hover:underline">Gérer tous les clients →</button>
            </div>

            <!-- VUE MOBILE (Cartes Tactiles Fluides) -->
            <div class="block md:hidden space-y-3">
              ${clients.map(c => {
                const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
                const pkg = c.package || {};
                const isDuration = pkg.packageType === 'duration';
                const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                const balanceDue = pkg.balanceDue || 0;

                return `
                  <div class="sub-card p-3.5 space-y-3 border border-slate-800">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <strong class="text-white text-sm font-bold block">${c.firstName} ${c.lastName}</strong>
                        <span class="text-[11px] text-slate-400">${c.residence ? `${c.residence}` : (c.phone || '')}</span>
                      </div>
                      <span class="badge badge-neutral text-[10px]">${c.mainGoal}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-[#0c1220] p-2 rounded-lg text-center text-xs">
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
                      <div>
                        <span class="text-[10px] text-slate-500 block">Solde</span>
                        <span class="font-bold ${balanceDue > 0 ? 'text-amber-400' : 'text-slate-400'} font-mono text-[11px]">
                          ${balanceDue > 0 ? Calculations.formatFCFA(balanceDue) : 'Réglé'}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <button class="btn btn-primary btn-xs flex-1 py-2 font-bold" data-action="open-client" data-client-id="${c.id}">
                        Dossier
                      </button>
                      <button class="btn btn-secondary btn-xs flex-1 py-2" data-action="print-bilan" data-client-id="${c.id}">
                        Ticket Bilan
                      </button>
                      <button class="btn btn-outline btn-xs px-2.5 py-2" data-action="print-sub" data-client-id="${c.id}">
                        Reçu
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- VUE DESKTOP (Tableau classique) -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th class="p-3">Client</th>
                    <th class="p-3">Objectif</th>
                    <th class="p-3">Poids Actuel</th>
                    <th class="p-3">Forfait en Cours</th>
                    <th class="p-3">Solde Dû</th>
                    <th class="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${clients.map(c => {
                    const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
                    const pkg = c.package || {};
                    const isDuration = pkg.packageType === 'duration';
                    const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                    const balanceDue = pkg.balanceDue || 0;

                    return `
                      <tr class="hover:bg-slate-800/40 transition-colors">
                        <td class="p-3">
                          <strong class="text-white block font-semibold">${c.firstName} ${c.lastName}</strong>
                          <span class="text-[11px] text-slate-400">${c.residence ? `${c.residence} • ` : ''}${c.phone || ''}</span>
                        </td>
                        <td class="p-3">
                          <span class="badge badge-neutral">${c.mainGoal}</span>
                        </td>
                        <td class="p-3 font-mono font-bold text-white">
                          ${last ? `${last.weight} kg` : '--'}
                        </td>
                        <td class="p-3">
                          ${isDuration ? `
                            <span class="font-bold text-emerald-400 font-mono">
                              ${pkg.durationMonths || 1} Mois (${pkg.sessionsUsed || 0} séances)
                            </span>
                          ` : `
                            <span class="font-bold ${sessionsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono">
                              ${sessionsLeft} / ${pkg.totalSessions || 0} séances
                            </span>
                          `}
                        </td>
                        <td class="p-3 font-mono ${balanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">
                          ${Calculations.formatFCFA(balanceDue)}
                        </td>
                        <td class="p-3 text-right space-x-1">
                          <button class="btn btn-secondary btn-xs" data-action="open-client" data-client-id="${c.id}">
                            Dossier
                          </button>
                          <button class="btn btn-outline btn-xs" data-action="print-bilan" data-client-id="${c.id}">
                            Bilan
                          </button>
                          <button class="btn btn-outline btn-xs" data-action="print-sub" data-client-id="${c.id}">
                            Reçu
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    container.querySelector('#btn-dash-new-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    container.querySelector('#btn-empty-create-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    container.querySelector('#btn-dash-quick-calc')?.addEventListener('click', () => {
      window.App.openQuickToolsModal();
    });

    container.querySelector('#btn-dash-settings')?.addEventListener('click', () => {
      window.App.openSettingsModal();
    });

    container.querySelector('#btn-see-all-clients')?.addEventListener('click', () => {
      window.App.navigateTo('clients');
    });

    container.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId);
      });
    });

    container.querySelectorAll('[data-action="print-bilan"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'assessment');
      });
    });

    container.querySelectorAll('[data-action="print-sub"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'subscription');
      });
    });
  }
};
