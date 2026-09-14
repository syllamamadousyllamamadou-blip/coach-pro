/**
 * accounting.js - Module de Comptabilité & Livre de Caisse du Coach pour COACH PRO
 * Suivi précis des recettes (versements clients), des charges & dépenses,
 * calcul du bénéfice net en FCFA et filtres multicritères avancés (Wave, Orange Money, Périodes, Clients).
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const Accounting = {
  currentFilters: {
    period: 'month', // 'today', 'week', 'month', 'year', 'all', 'custom'
    paymentMethod: 'all',
    clientId: 'all',
    startDate: '',
    endDate: ''
  },

  render(container) {
    const clients = stateManager.getClients();
    const summary = stateManager.getFinancialSummary(this.currentFilters);

    container.innerHTML = `
      <div class="accounting-view space-y-6">
        
        <!-- En-tête Comptabilité -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Gestion Financière</span>
              <span class="text-xs text-slate-400">Livre de Caisse & Règlements en FCFA</span>
            </div>
            <h1 class="text-2xl font-bold text-white">Comptabilité du Coach</h1>
            <p class="text-xs text-slate-400 mt-0.5">Suivez vos encaissements, vos dépenses et votre rentabilité nette en temps réel</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-open-add-expense" class="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-500/20">
              <span>+</span>
              <span>Ajouter une Dépense</span>
            </button>
            <button id="btn-print-accounting-ticket" class="btn btn-secondary btn-sm flex items-center gap-1" title="Imprimer le Bilan Financier sur Ticket Thermique">
              <span>🧾</span>
              <span>Ticket Bilan</span>
            </button>
          </div>
        </div>

        <!-- 4 Cartes Métriques Clés Financières en FCFA -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <!-- Carte 1 : Recettes Brutes -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Recettes (Encaissements)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalIncome)}
            </span>
            <span class="text-[11px] text-slate-500">${summary.incomes.length} transaction(s)</span>
          </div>

          <!-- Carte 2 : Total Dépenses -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Dépenses & Charges</span>
            <span class="text-2xl font-bold font-mono text-rose-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalExpenses)}
            </span>
            <span class="text-[11px] text-slate-500">${summary.expenses.length} dépense(s) saisie(s)</span>
          </div>

          <!-- Carte 3 : Bénéfice Net -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Bénéfice Net Réel</span>
            <span class="text-2xl font-bold font-mono ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1 block">
              ${Calculations.formatFCFA(summary.netProfit)}
            </span>
            <span class="text-[11px] ${summary.netProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-400'}">
              ${summary.netProfit >= 0 ? 'Bilan positif ✓' : 'Déficit sur la période'}
            </span>
          </div>

          <!-- Carte 4 : Créances Restantes (Soldes à percevoir) -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Créances à Encaisser</span>
            <span class="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalReceivables)}
            </span>
            <span class="text-[11px] text-slate-500">Soldes forfaits en attente</span>
          </div>
        </div>

        <!-- Formulaire d'Ajout de Dépense (Masqué par défaut) -->
        <div id="add-expense-panel" class="glass-card p-5 hidden space-y-4 border border-rose-500/30">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>💳</span> Enregistrer une Charge / Dépense
            </h3>
            <button id="btn-close-expense-panel" class="text-xs text-slate-400 hover:text-white">✕ Fermer</button>
          </div>

          <form id="form-create-expense" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Date de la dépense *</label>
              <input type="date" id="exp-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Montant Dépensé (FCFA) *</label>
              <input type="number" inputmode="numeric" step="500" id="exp-amount" placeholder="ex: 15000" class="input text-xs font-bold text-rose-400" required />
            </div>
            <div>
              <label class="label">Catégorie *</label>
              <select id="exp-category" class="input text-xs">
                <option value="Matériel & Équipement">Matériel & Équipement</option>
                <option value="Location Salle / Espace">Location Salle / Espace</option>
                <option value="Carburant / Déplacement">Carburant / Déplacement</option>
                <option value="Nutrition / Compléments">Nutrition / Compléments</option>
                <option value="Marketing / Publicité">Marketing / Publicité</option>
                <option value="Divers / Autre">Divers / Autre</option>
              </select>
            </div>
            <div>
              <label class="label">Mode de Paiement</label>
              <select id="exp-method" class="input text-xs">
                <option value="Espèces">Espèces</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="label">Description / Justificatif</label>
              <input type="text" id="exp-description" placeholder="ex: Achat élastiques de résistance, péage Cocody, whey protein" class="input text-xs" />
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-danger btn-sm w-full font-bold">
                Valider la Dépense
              </button>
            </div>
          </form>
        </div>

        <!-- BARRE DE FILTRES AVANCÉS -->
        <div class="glass-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔍</span> Filtres du Livre de Caisse
            </span>
            <button id="btn-reset-filters" class="text-[11px] text-emerald-400 hover:underline">Réinitialiser les filtres</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <!-- Filtre Période -->
            <div>
              <label class="label">Période</label>
              <select id="filter-period" class="input text-xs">
                <option value="all" ${this.currentFilters.period === 'all' ? 'selected' : ''}>Toutes les dates</option>
                <option value="today" ${this.currentFilters.period === 'today' ? 'selected' : ''}>Aujourd'hui</option>
                <option value="week" ${this.currentFilters.period === 'week' ? 'selected' : ''}>Cette semaine (7 derniers jours)</option>
                <option value="month" ${this.currentFilters.period === 'month' ? 'selected' : ''}>Ce mois-ci</option>
                <option value="year" ${this.currentFilters.period === 'year' ? 'selected' : ''}>Année en cours</option>
              </select>
            </div>

            <!-- Filtre Mode de Paiement -->
            <div>
              <label class="label">Mode de Règlement</label>
              <select id="filter-method" class="input text-xs">
                <option value="all" ${this.currentFilters.paymentMethod === 'all' ? 'selected' : ''}>Tous les modes de paiement</option>
                <option value="Wave" ${this.currentFilters.paymentMethod === 'Wave' ? 'selected' : ''}>Wave</option>
                <option value="Orange" ${this.currentFilters.paymentMethod === 'Orange' ? 'selected' : ''}>Orange Money</option>
                <option value="Moov" ${this.currentFilters.paymentMethod === 'Moov' ? 'selected' : ''}>Moov Money</option>
                <option value="Espèces" ${this.currentFilters.paymentMethod === 'Espèces' ? 'selected' : ''}>Espèces</option>
                <option value="Virement" ${this.currentFilters.paymentMethod === 'Virement' ? 'selected' : ''}>Virement Bancaire</option>
              </select>
            </div>

            <!-- Filtre Client -->
            <div>
              <label class="label">Athlète Spécifique</label>
              <select id="filter-client" class="input text-xs">
                <option value="all" ${this.currentFilters.clientId === 'all' ? 'selected' : ''}>Tous les clients</option>
                ${clients.map(c => `
                  <option value="${c.id}" ${this.currentFilters.clientId === c.id ? 'selected' : ''}>
                    ${c.firstName} ${c.lastName}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- TABLEAUX DES MOUVEMENTS FINANCIERS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Tableau 1 : Recettes (Encaissements) -->
          <div class="glass-card p-5 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="text-emerald-400">🟢</span> Recettes & Versements (${summary.incomes.length})
              </h3>
              <span class="text-xs font-mono font-bold text-emerald-400">${Calculations.formatFCFA(summary.totalIncome)}</span>
            </div>

            ${summary.incomes.length === 0 ? `
              <p class="text-xs text-slate-500 text-center py-6">Aucun encaissement sur cette sélection.</p>
            ` : `
              <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
                ${summary.incomes.map(inc => `
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-white truncate">${inc.clientName}</span>
                        <span class="badge badge-emerald text-[10px]">${inc.method}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 truncate mt-0.5">${inc.notes || 'Règlement forfait'}</p>
                      <span class="text-[10px] text-slate-500">${new Date(inc.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="text-xs font-bold font-mono text-emerald-400">+${Calculations.formatFCFA(inc.amount)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Tableau 2 : Dépenses & Charges -->
          <div class="glass-card p-5 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="text-rose-400">🔴</span> Dépenses & Achats (${summary.expenses.length})
              </h3>
              <span class="text-xs font-mono font-bold text-rose-400">-${Calculations.formatFCFA(summary.totalExpenses)}</span>
            </div>

            ${summary.expenses.length === 0 ? `
              <p class="text-xs text-slate-500 text-center py-6">Aucune dépense enregistrée sur cette sélection.</p>
            ` : `
              <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
                ${summary.expenses.map(exp => `
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-white truncate">${exp.category}</span>
                        <span class="badge badge-amber text-[10px]">${exp.paymentMethod}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 truncate mt-0.5">${exp.description || 'Dépense coach'}</p>
                      <span class="text-[10px] text-slate-500">${new Date(exp.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs font-bold font-mono text-rose-400">-${Calculations.formatFCFA(exp.amount)}</span>
                      <button class="btn-delete-expense text-slate-500 hover:text-rose-400 text-xs p-1" data-expense-id="${exp.id}" title="Supprimer la dépense">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const expensePanel = container.querySelector('#add-expense-panel');
    container.querySelector('#btn-open-add-expense')?.addEventListener('click', () => {
      expensePanel?.classList.toggle('hidden');
    });
    container.querySelector('#btn-close-expense-panel')?.addEventListener('click', () => {
      expensePanel?.classList.add('hidden');
    });

    // Formulaire de dépense
    const formExpense = container.querySelector('#form-create-expense');
    formExpense?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(container.querySelector('#exp-amount')?.value) || 0;
      if (amount <= 0) return;

      stateManager.addExpense({
        date: container.querySelector('#exp-date')?.value,
        amount: amount,
        category: container.querySelector('#exp-category')?.value,
        paymentMethod: container.querySelector('#exp-method')?.value,
        description: container.querySelector('#exp-description')?.value
      });

      this.render(container);
    });

    // Suppression de dépense
    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.expenseId;
        if (confirm('Voulez-vous supprimer cette dépense ?')) {
          stateManager.deleteExpense(id);
          this.render(container);
        }
      });
    });

    // Filtres
    const periodSelect = container.querySelector('#filter-period');
    const methodSelect = container.querySelector('#filter-method');
    const clientSelect = container.querySelector('#filter-client');

    periodSelect?.addEventListener('change', () => {
      this.currentFilters.period = periodSelect.value;
      this.render(container);
    });
    methodSelect?.addEventListener('change', () => {
      this.currentFilters.paymentMethod = methodSelect.value;
      this.render(container);
    });
    clientSelect?.addEventListener('change', () => {
      this.currentFilters.clientId = clientSelect.value;
      this.render(container);
    });

    container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      this.currentFilters = { period: 'all', paymentMethod: 'all', clientId: 'all', startDate: '', endDate: '' };
      this.render(container);
    });

    // Impression Thermique du Bilan
    container.querySelector('#btn-print-accounting-ticket')?.addEventListener('click', () => {
      if (window.ThermalModal) {
        window.ThermalModal.open(null, 'accounting');
      } else {
        alert('Module thermique prêt pour la comptabilité.');
      }
    });
  }
};
