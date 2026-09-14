/**
 * clientList.js - Répertoire des Clients COACH PRO
 * Filtres intelligents (Aujourd'hui, À renouveler, Impayés),
 * Recherche par N° ID client (ex: CP-849201), initiales stylisées,
 * pointage direct et renouvellement d'abonnement en 1 clic.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ClientList = {
  searchQuery: '',
  activeFilter: 'all',

  getGoalTheme(goal = '') {
    const g = (goal || '').toLowerCase();
    if (g.includes('perte') || g.includes('seche') || g.includes('poids') || g.includes('minceur')) {
      return {
        border: 'border-l-4 border-emerald-500',
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/20',
        accent: 'text-emerald-400'
      };
    }
    if (g.includes('masse') || g.includes('muscle') || g.includes('volume') || g.includes('prise')) {
      return {
        border: 'border-l-4 border-cyan-500',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
        avatarBg: 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-cyan-500/20',
        accent: 'text-cyan-400'
      };
    }
    if (g.includes('force') || g.includes('perf') || g.includes('cardio') || g.includes('endurance')) {
      return {
        border: 'border-l-4 border-purple-500',
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        avatarBg: 'bg-gradient-to-br from-purple-500 to-indigo-700 text-white shadow-purple-500/20',
        accent: 'text-purple-400'
      };
    }
    return {
      border: 'border-l-4 border-amber-500',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-amber-500/20',
      accent: 'text-amber-400'
    };
  },

  render(container) {
    const clients = stateManager.getClients();
    const todayClients = stateManager.getClientsForToday();
    const renewCount = clients.filter(c => {
      const pkg = c.package || {};
      if (pkg.packageType === 'sessions') return (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0) <= 2;
      if (pkg.expiryDate) return Math.ceil((new Date(pkg.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 4;
      return false;
    }).length;
    const debtCount = clients.filter(c => (c.package?.balanceDue || 0) > 0).length;

    container.innerHTML = `
      <div class="client-list-view space-y-6">
        
        <!-- Header & Ajout -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
              <span>👥</span>
              <span>Mes Clients (${clients.length})</span>
            </h1>
            <p class="text-xs text-slate-400">Recherche par Nom, Quartier ou N° ID unique (ex: CP-849201)</p>
          </div>
          <button id="btn-list-add-client" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
            + Nouveau Client
          </button>
        </div>

        <!-- Barre de Recherche & Filtres Rapides -->
        <div class="glass-card p-4 space-y-3">
          <input type="text" id="input-client-search" value="${this.searchQuery}" placeholder="Rechercher par N° ID (CP-XXXX), prénom, nom, téléphone..." class="input" />
          
          <!-- Filtres Catégories -->
          <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-xs">
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'all' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="all">
              🌟 Tous (${clients.length})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'today' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="today">
              🎯 Aujourd'hui (${todayClients.length})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'renew' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="renew">
              ⚠️ À Renouveler (${renewCount})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'debt' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="debt">
              💳 Reste Dû (${debtCount})
            </button>
          </div>
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
      const clientCode = `cp-${c.id.slice(-6)}`.toLowerCase();
      const numOnly = c.id.slice(-6).toLowerCase();

      let textMatch = true;
      if (q) {
        textMatch = (
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.residence && c.residence.toLowerCase().includes(q)) ||
          (c.profession && c.profession.toLowerCase().includes(q)) ||
          (c.mainGoal && c.mainGoal.toLowerCase().includes(q)) ||
          clientCode.includes(q) ||
          numOnly.includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      if (!textMatch) return false;

      if (this.activeFilter === 'today') {
        const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const todayDay = daysMap[new Date().getDay()];
        return c.trainingSchedule?.days?.includes(todayDay);
      }
      if (this.activeFilter === 'renew') {
        const pkg = c.package || {};
        if (pkg.packageType === 'sessions') {
          return (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0) <= 2;
        }
        if (pkg.expiryDate) {
          const diff = Math.ceil((new Date(pkg.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return diff <= 4;
        }
        return false;
      }
      if (this.activeFilter === 'debt') {
        const pkg = c.package || {};
        return (pkg.balanceDue || 0) > 0;
      }
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <p class="text-sm text-slate-400">
            ${clients.length === 0 ? 'Vous n\'avez pas encore enregistré de client.' : 'Aucun client ne correspond à ce filtre ou à votre recherche.'}
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        ${filtered.map(c => {
          const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
          const pkg = c.package || {};
          const isDuration = pkg.packageType === 'duration';
          const totalSessions = pkg.totalSessions || 10;
          const usedSessions = pkg.sessionsUsed || 0;
          const sessionsLeft = !isDuration ? Math.max(0, totalSessions - usedSessions) : null;
          const balanceDue = pkg.balanceDue !== undefined ? pkg.balanceDue : Math.max(0, (pkg.totalAmount || pkg.price || 0) - (pkg.amountPaid || pkg.advancePayment || 0));

          const theme = this.getGoalTheme(c.mainGoal);
          const clientCode = `CP-${c.id.slice(-6).toUpperCase()}`;
          const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase() || 'CP';
          const progressPct = !isDuration ? Math.min(100, Math.round((usedSessions / totalSessions) * 100)) : 100;

          return `
            <div class="glass-card p-4 space-y-3.5 ${theme.border} hover:border-slate-600 transition-all shadow-xl bg-slate-900/90">
              
              <!-- En-tête Client avec Avatar & Numéro ID -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-11 h-11 rounded-2xl ${theme.avatarBg} flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    ${initials}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <strong class="text-white text-sm font-bold block truncate">${c.firstName} ${c.lastName}</strong>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">${clientCode}</span>
                    </div>
                    <span class="text-[11px] text-slate-400 block truncate">
                      ${c.residence || 'Abidjan'}${c.profession ? ` • ${c.profession}` : ''}
                    </span>
                  </div>
                </div>

                <!-- Badge Objectif -->
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge} shrink-0">
                  ${c.mainGoal || 'Objectif'}
                </span>
              </div>

              <!-- Métriques Clés : Contact, Poids, Solde -->
              <div class="grid grid-cols-3 gap-2 bg-[#070b16] p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Contact</span>
                  <span class="font-bold text-slate-200 font-mono text-[11px] truncate block">${c.phone || '--'}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Poids</span>
                  <span class="font-bold text-white font-mono">${last ? `${last.weight} kg` : '--'}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Solde</span>
                  <span class="font-bold ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'} font-mono text-[11px] truncate block">
                    ${balanceDue > 0 ? `${Calculations.formatFCFA(balanceDue)}` : '✓ Réglé'}
                  </span>
                </div>
              </div>

              <!-- Jauge de Séances & Progression -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>${isDuration ? `Forfait ${pkg.durationMonths || 1} Mois` : `Séances : ${usedSessions}/${totalSessions}`}</span>
                  <span class="${isDuration ? 'text-emerald-400' : (sessionsLeft <= 2 ? 'text-amber-400' : 'text-slate-300')} font-mono font-bold">
                    ${isDuration ? (pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : 'Actif') : `${sessionsLeft} restante(s)`}
                  </span>
                </div>
                ${!isDuration ? `
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${progressPct}%"></div>
                  </div>
                ` : ''}
              </div>

              <!-- Actions Rapides : Pointage 1-Clic, Dossier, Bilan -->
              <div class="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button class="btn btn-emerald btn-xs flex-1 py-2 font-bold shadow-md btn-card-point" data-client-id="${c.id}" title="Pointer la présence">
                  ⚡ Pointer
                </button>
                <button class="btn btn-primary btn-xs flex-1 py-2 font-bold shadow-md" data-action="open-client" data-client-id="${c.id}">
                  📂 Dossier
                </button>
                <button class="btn btn-secondary btn-xs py-2 px-2.5" data-action="print-ticket" data-client-id="${c.id}" title="Imprimer Ticket Bilan">
                  🖨️
                </button>
              </div>
            </div>
          `;
        }).join('')}
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

    container.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        container.querySelectorAll('.filter-tab-btn').forEach(b => {
          b.className = 'filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all bg-slate-800 text-slate-300 hover:text-white';
        });
        e.currentTarget.className = 'filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20';
        this.renderClientsList(container);
      });
    });
  },

  bindRowActions(listContainer) {
    listContainer.querySelectorAll('.btn-card-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;
        stateManager.logSessionAttendance(clientId, {
          date: new Date().toISOString().split('T')[0],
          sessionType: 'Séance Coaching Privé',
          notes: 'Pointage rapide depuis la liste'
        });
        window.App.showToast(`Séance pointée pour ${client.firstName} !`, 'success');
        const parent = listContainer.closest('.client-list-view')?.parentElement;
        if (parent) this.render(parent);
      });
    });

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
