/**
 * billing.js - Suivi des Forfaits & Historique des Règlements en FCFA COACH PRO
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const Billing = {
  render(container, client) {
    const pkg = client.package || {
      packageName: 'Pack 10 Séances',
      packageType: 'sessions',
      durationMonths: 1,
      totalSessions: 10,
      sessionsUsed: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      startDate: new Date().toISOString().split('T')[0]
    };

    const isDuration = pkg.packageType === 'duration';
    const remainingSessions = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
    const payments = Array.isArray(client.paymentHistory) ? client.paymentHistory : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Cartes Résumé Forfait & Finances (FCFA) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Carte 1 : Type & Validité -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Formule Active</span>
            ${isDuration ? `
              <span class="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
                ${pkg.durationMonths || 1} Mois <span class="text-xs text-slate-400 font-normal">(${pkg.sessionsUsed || 0} séances faites)</span>
              </span>
              <span class="text-[11px] text-slate-400">Échéance : ${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</span>
            ` : `
              <span class="text-3xl font-bold ${remainingSessions <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono mt-1 block">
                ${remainingSessions} <span class="text-xs text-slate-400 font-normal">/ ${pkg.totalSessions} séances</span>
              </span>
              <span class="text-[11px] text-slate-500">${pkg.sessionsUsed} séances consommées</span>
            `}
          </div>

          <!-- Carte 2 : Total Payé -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Total Réglé (Versements)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">${Calculations.formatFCFA(pkg.amountPaid || 0)}</span>
            <span class="text-[11px] text-slate-500">Sur un tarif total de ${Calculations.formatFCFA(pkg.totalAmount || 0)}</span>
          </div>

          <!-- Carte 3 : Solde Restant Dû -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Solde Restant Dû</span>
            <span class="text-2xl font-bold font-mono ${(pkg.balanceDue || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'} mt-1 block">
              ${Calculations.formatFCFA(pkg.balanceDue || 0)}
            </span>
            <span class="text-[11px] text-slate-500">${(pkg.balanceDue || 0) > 0 ? 'Règlement en attente' : 'Entièrement soldé'}</span>
          </div>
        </div>

        <!-- Enregistrement d'un Versement / Acompte -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Enregistrer un Versement / Acompte</h3>
              <p class="text-xs text-slate-400">Ajoutez un paiement qui recalculera automatiquement le solde restant</p>
            </div>
            <button id="btn-print-sub-receipt" class="btn btn-secondary btn-sm">
              Imprimer Reçu Forfait
            </button>
          </div>

          <form id="form-add-payment" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Date du versement *</label>
              <input type="date" id="pay-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Montant Versé (FCFA) *</label>
              <input type="number" step="1000" id="pay-amount" placeholder="ex: 50000" class="input text-xs font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Mode de Paiement</label>
              <select id="pay-method" class="input text-xs">
                <option value="Espèces">Espèces</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-primary btn-sm w-full">
                Valider le Versement
              </button>
            </div>
          </form>
        </div>

        <!-- Historique Daté des Versements -->
        <div class="glass-card overflow-hidden">
          <div class="p-4 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Historique des Paiements & Règlements (${payments.length})
            </h4>
            <span class="text-[11px] text-emerald-400 font-bold font-mono">Total perçu : ${Calculations.formatFCFA(pkg.amountPaid || 0)}</span>
          </div>

          ${payments.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400">
              Aucun versement enregistré dans l'historique. Utilisez le formulaire ci-dessus pour ajouter un règlement.
            </div>
          ` : `
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Date</th>
                  <th class="p-3">Montant</th>
                  <th class="p-3">Mode de Paiement</th>
                  <th class="p-3">Notes</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${payments.map((p) => `
                  <tr class="hover:bg-slate-800/40">
                    <td class="p-3 font-mono">${new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td class="p-3 font-mono font-bold text-emerald-400">${Calculations.formatFCFA(p.amount)}</td>
                    <td class="p-3 font-semibold text-white">${p.method}</td>
                    <td class="p-3 text-slate-400 text-[11px] italic">${p.notes || '--'}</td>
                    <td class="p-3 text-right">
                      <button class="text-slate-500 hover:text-red-400 text-xs btn-remove-payment" data-payment-id="${p.id}">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Modification du Tarif Total & Forfait -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Paramètres de la Formule</h3>
          
          <form id="form-edit-client-pkg" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Type de Forfait</label>
                <select name="packageType" id="edit-pkg-type" class="input font-bold text-emerald-400">
                  <option value="sessions" ${!isDuration ? 'selected' : ''}>Pack Séances</option>
                  <option value="duration" ${isDuration ? 'selected' : ''}>Abonnement Durée (Mois)</option>
                </select>
              </div>

              <div id="edit-wrapper-sessions" class="${isDuration ? 'hidden' : ''}">
                <label class="label">Total Séances</label>
                <input type="number" name="totalSessions" value="${pkg.totalSessions || 10}" class="input font-bold" />
              </div>

              <div id="edit-wrapper-duration" class="${!isDuration ? 'hidden' : ''}">
                <label class="label">Durée en Mois</label>
                <select name="durationMonths" class="input font-bold">
                  <option value="1" ${pkg.durationMonths === 1 ? 'selected' : ''}>1 Mois (30 jours)</option>
                  <option value="2" ${pkg.durationMonths === 2 ? 'selected' : ''}>2 Mois (60 jours)</option>
                  <option value="3" ${pkg.durationMonths === 3 ? 'selected' : ''}>3 Mois (Trimestre)</option>
                  <option value="6" ${pkg.durationMonths === 6 ? 'selected' : ''}>6 Mois (Semestre)</option>
                  <option value="12" ${pkg.durationMonths === 12 ? 'selected' : ''}>1 An (Annuel)</option>
                </select>
              </div>

              <div>
                <label class="label">Tarif Total Forfait (FCFA)</label>
                <input type="number" step="1000" name="totalAmount" value="${pkg.totalAmount || 0}" class="input font-mono font-bold text-emerald-400" required />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-secondary btn-sm">Mettre à jour la formule</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const pkgTypeSelect = container.querySelector('#edit-pkg-type');
    const wrapSessions = container.querySelector('#edit-wrapper-sessions');
    const wrapDuration = container.querySelector('#edit-wrapper-duration');

    pkgTypeSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'duration') {
        wrapSessions?.classList.add('hidden');
        wrapDuration?.classList.remove('hidden');
      } else {
        wrapSessions?.classList.remove('hidden');
        wrapDuration?.classList.add('hidden');
      }
    });

    container.querySelector('#btn-print-sub-receipt')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'subscription');
    });

    // Ajouter un versement
    container.querySelector('#form-add-payment')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = container.querySelector('#pay-date')?.value;
      const amount = parseFloat(container.querySelector('#pay-amount')?.value);
      const method = container.querySelector('#pay-method')?.value;

      if (!amount || amount <= 0) {
        window.App.showToast('Veuillez entrer un montant valide', 'error');
        return;
      }

      stateManager.addPayment(client.id, { date, amount, method });
      window.App.showToast('Versement enregistré !', 'success');
      this.render(container, stateManager.getClientById(client.id));
    });

    // Supprimer un versement
    container.querySelectorAll('.btn-remove-payment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const payId = e.currentTarget.getAttribute('data-payment-id');
        if (confirm('Supprimer cette ligne de versement ?')) {
          stateManager.removePayment(client.id, payId);
          window.App.showToast('Versement supprimé', 'info');
          this.render(container, stateManager.getClientById(client.id));
        }
      });
    });

    // Mettre à jour la formule
    container.querySelector('#form-edit-client-pkg')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedPackage = {
        packageType: formData.get('packageType'),
        durationMonths: parseInt(formData.get('durationMonths'), 10) || 1,
        totalSessions: parseInt(formData.get('totalSessions'), 10) || 10,
        totalAmount: parseFloat(formData.get('totalAmount')) || 0
      };

      stateManager.updateBilling(client.id, updatedPackage);
      window.App.showToast('Formule mise à jour !', 'success');
      this.render(container, stateManager.getClientById(client.id));
    });
  }
};
