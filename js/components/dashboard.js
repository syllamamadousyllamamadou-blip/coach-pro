/**
 * dashboard.js - Tableau de Bord Intelligent COACH PRO
 * Alertes d'abonnements expirés & à renouveler, statistiques en FCFA et gestion rapide des athlètes.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';
import { LicenseManager } from '../security/license.js';

export const Dashboard = {
  render(container) {
    const clients = stateManager.getClients();
    const coach = stateManager.getCoachProfile();
    const licenseInfo = LicenseManager.getLicenseInfo();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalClients = clients.length;
    let totalSessionsDone = 0;
    let totalBalanceDue = 0;

    // Analyse des abonnements & alertes de renouvellement
    const expiredClients = [];
    const expiringSoonClients = [];

    clients.forEach(c => {
      const pkg = c.package || {};
      if (pkg.price || pkg.totalSessions || pkg.durationMonths) {
        totalSessionsDone += (pkg.sessionsUsed || 0);
        totalBalanceDue += (pkg.balanceDue || 0);

        const isDuration = pkg.packageType === 'duration';
        const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
        
        let isExpired = false;
        let isExpiringSoon = false;
        let expireReason = '';

        if (!isDuration) {
          if (sessionsLeft === 0) {
            isExpired = true;
            expireReason = '0 séance restante (Forfait terminé)';
          } else if (sessionsLeft <= 2) {
            isExpiringSoon = true;
            expireReason = `Plus que ${sessionsLeft} séance(s) restante(s)`;
          }
        }

        if (pkg.endDate) {
          const diffDays = Math.ceil((new Date(pkg.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            isExpired = true;
            expireReason = `Échéance dépassée le ${new Date(pkg.endDate).toLocaleDateString('fr-FR')}`;
          } else if (diffDays <= 4 && !isExpired) {
            isExpiringSoon = true;
            expireReason = `Expire dans ${diffDays} jour(s) (${new Date(pkg.endDate).toLocaleDateString('fr-FR')})`;
          }
        }

        if (isExpired) {
          expiredClients.push({ client: c, reason: expireReason });
        } else if (isExpiringSoon) {
          expiringSoonClients.push({ client: c, reason: expireReason });
        }
      }
    });

    const displayName = coach?.name ? coach.name : 'Coach';

    container.innerHTML = `
      <div class="dashboard-view space-y-6">
        
        <!-- BANNIÈRE ESSAI OU EXPIRATION DE LICENCE -->
        ${licenseInfo.isTrial ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⚡</span>
              <div>
                <p class="text-xs sm:text-sm font-bold text-amber-300">
                  Mode Essai Gratuit Actif : Il vous reste <strong class="text-white">${licenseInfo.daysRemaining} jour(s)</strong> d'évaluation.
                </p>
                <p class="text-[11px] text-amber-400/80">
                  Profitez de toutes les fonctionnalités. Activez votre licence pour déverrouiller définitivement votre accès.
                </p>
              </div>
            </div>
            <button onclick="window.App.openSettingsModal()" class="btn btn-secondary btn-xs shrink-0 font-bold">
              🔑 Activer ma Licence
            </button>
          </div>
        ` : (!licenseInfo.isLifetime && licenseInfo.daysRemaining <= 3) ? `
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-500/5">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⏳</span>
              <div>
                <p class="text-xs sm:text-sm font-bold text-rose-300">
                  Votre abonnement expire bientôt : <strong class="text-white">${licenseInfo.daysRemaining} jour(s) restant(s)</strong> (${licenseInfo.expiryFormatted}).
                </p>
                <p class="text-[11px] text-rose-400/80">
                  Pensez à renouveler votre clé auprès de l'administrateur pour éviter toute interruption.
                </p>
              </div>
            </div>
            <button onclick="window.App.openSettingsModal()" class="btn btn-primary btn-xs shrink-0 font-bold">
              🔄 Renouveler ma Clé
            </button>
          </div>
        ` : ''}

        <!-- En-tête Coach Lumineux avec Photo & Badge -->
        <div class="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500 shadow-xl">
          <div class="flex items-center gap-4">
            <!-- Avatar / Photo du Coach -->
            <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/50 shrink-0 shadow-lg shadow-emerald-500/10 cursor-pointer" onclick="window.App.openSettingsModal()">
              ${coach.photo ? `
                <img src="${coach.photo}" alt="${displayName}" class="w-full h-full object-cover" />
              ` : `
                <div class="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-emerald-400">
                  <span class="text-2xl sm:text-3xl">🏋️‍♂️</span>
                </div>
              `}
              <span class="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-emerald text-xs font-bold">Espace Coach Privé</span>
                <span class="text-xs text-slate-300 font-semibold">• ${licenseInfo.isLifetime ? '👑 Licence à Vie' : (licenseInfo.isTrial ? `⚡ Essai (${licenseInfo.daysRemaining}j)` : `📅 ${licenseInfo.typeName}`)}</span>
                ${coach.city ? `<span class="text-xs text-slate-400 font-semibold">• 📍 ${coach.city}</span>` : ''}
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-white mt-1">
                Bonjour, <span class="text-emerald-400">${displayName}</span>
              </h1>
              <p class="text-xs text-slate-300 mt-0.5">
                ${coach.brand ? `<strong class="text-white">${coach.brand}</strong> • ` : ''}<span class="text-slate-300">${coach.motto ? `"${coach.motto}"` : 'Prêt pour les séances du jour'}</span>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-dash-new-client" class="btn btn-primary btn-sm shadow-lg shadow-emerald-500/20 font-bold">
              <span>+</span> Nouveau Client
            </button>
            <button id="btn-dash-quick-calc" class="btn btn-secondary btn-sm font-semibold">
              <span>⚡</span> Calculateur
            </button>
            <button id="btn-dash-settings" class="btn btn-outline btn-sm font-semibold">
              <span>⚙️</span> Profil &amp; Photo
            </button>
          </div>
        </div>

        <!-- BANNIÈRE D'ALERTES ABONNEMENTS (EXPIRÉS & PROCHES) -->
        ${(expiredClients.length > 0 || expiringSoonClients.length > 0) ? `
          <div class="glass-card p-5 space-y-3 border-t-4 border-amber-500 shadow-xl bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/90">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔔</span>
                <h3 class="text-sm font-bold text-white">Alertes Renouvellement Forfaits (${expiredClients.length + expiringSoonClients.length})</h3>
              </div>
              <span class="badge ${expiredClients.length > 0 ? 'badge-rose' : 'badge-amber'} text-xs font-bold font-mono">
                ${expiredClients.length} expiré(s) • ${expiringSoonClients.length} à relancer
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              ${expiredClients.map(({ client: c, reason }) => `
                <div class="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between gap-3 shadow-sm">
                  <div class="min-w-0">
                    <strong class="text-xs text-white block font-bold truncate">${c.firstName} ${c.lastName}</strong>
                    <span class="text-[11px] text-rose-300 font-semibold block">${reason}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${c.phone || 'Pas de numéro'}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button class="btn btn-whatsapp btn-xs py-1 px-2.5 btn-alert-whatsapp" data-client-id="${c.id}" title="Relancer sur WhatsApp">
                      💬
                    </button>
                    <button class="btn btn-primary btn-xs py-1 px-2.5 font-bold btn-alert-renew" data-client-id="${c.id}">
                      Renouveler
                    </button>
                  </div>
                </div>
              `).join('')}

              ${expiringSoonClients.map(({ client: c, reason }) => `
                <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3 shadow-sm">
                  <div class="min-w-0">
                    <strong class="text-xs text-white block font-bold truncate">${c.firstName} ${c.lastName}</strong>
                    <span class="text-[11px] text-amber-300 font-semibold block">${reason}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${c.phone || 'Pas de numéro'}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button class="btn btn-whatsapp btn-xs py-1 px-2.5 btn-alert-whatsapp" data-client-id="${c.id}" title="Rappeler sur WhatsApp">
                      💬
                    </button>
                    <button class="btn btn-secondary btn-xs py-1 px-2.5 font-bold btn-alert-renew" data-client-id="${c.id}">
                      Voir Forfait
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 3 Cartes Métriques Clés en FCFA (Hautement Contrastées) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Clients en Suivi</span>
            <span class="text-3xl font-extrabold text-white block">${totalClients}</span>
            <span class="text-[11px] text-slate-400">Athlètes enregistrés</span>
          </div>

          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Séances Effectuées</span>
            <span class="text-3xl font-extrabold text-emerald-400 block">${totalSessionsDone}</span>
            <span class="text-[11px] text-slate-400">Total séances pointées</span>
          </div>

          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Soldes à Encaisser</span>
            <span class="text-2xl font-extrabold text-white font-mono block">${Calculations.formatFCFA(totalBalanceDue)}</span>
            <span class="text-[11px] ${totalBalanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">
              ${totalBalanceDue > 0 ? 'Règlements restants' : 'Tous forfaits soldés ✓'}
            </span>
          </div>
        </div>

        <!-- SECTION ATHLÈTES PRÉVUS AUJOURD'HUI (PLANNING & POINTAGE RAPIDE) -->
        ${(() => {
          const todayClients = stateManager.getClientsForToday();
          return `
            <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500 shadow-xl">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🎯</span>
                  <div>
                    <h3 class="text-sm font-bold text-white">Athlètes Prévus Aujourd'hui (${todayClients.length})</h3>
                    <p class="text-[11px] text-slate-400">Pointage rapide de présence en 1 clic pour vos séances du jour</p>
                  </div>
                </div>
                <span class="badge badge-emerald text-xs font-bold font-mono">
                  ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>

              ${todayClients.length === 0 ? `
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  Aucun athlète programmé spécifiquement pour aujourd'hui. Retrouvez vos clients ci-dessous.
                </div>
              ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  ${todayClients.map(c => {
                    const pkg = c.package || {};
                    const isDuration = pkg.packageType === 'duration';
                    const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                    const clientCode = `CP-${c.id.slice(-6).toUpperCase()}`;
                    const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase() || 'CP';

                    return `
                      <div class="p-3.5 rounded-2xl bg-[#090d18] border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 shadow-lg">
                        <div class="flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                              ${initials}
                            </div>
                            <div class="min-w-0">
                              <strong class="text-white text-xs font-bold block truncate">${c.firstName} ${c.lastName}</strong>
                              <span class="text-[10px] text-slate-400 font-mono block truncate">${clientCode} • ${c.residence || 'Abidjan'}</span>
                            </div>
                          </div>
                          <span class="badge ${isDuration ? 'badge-emerald' : (sessionsLeft <= 2 ? 'badge-amber' : 'badge-neutral')} text-[10px] font-mono shrink-0">
                            ${isDuration ? 'Actif' : `${sessionsLeft} rest.`}
                          </span>
                        </div>

                        <div class="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button class="btn btn-emerald btn-xs flex-1 py-1.5 font-bold shadow-md btn-today-point" data-client-id="${c.id}" title="Pointer la présence du jour">
                            ⚡ Pointer
                          </button>
                          <button class="btn btn-secondary btn-xs flex-1 py-1.5 font-semibold" data-action="open-client" data-client-id="${c.id}">
                            📂 Dossier
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          `;
        })()}

        <!-- Tableau & Liste des Clients -->
        ${totalClients === 0 ? `
          <div class="glass-card p-10 text-center space-y-4">
            <div class="text-4xl">👥</div>
            <div>
              <h3 class="text-base font-bold text-white">Aucun client pour le moment</h3>
              <p class="text-xs text-slate-300 max-w-md mx-auto mt-1">
                Créez votre première fiche client pour calculer automatiquement ses indicateurs corporels, enregistrer ses paiements et imprimer ses reçus.
              </p>
            </div>
            <button id="btn-empty-create-client" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
              + Créer mon premier client
            </button>
          </div>
        ` : `
          <div class="glass-card p-4 sm:p-5 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white">Tous les Clients en Suivi (${totalClients})</h3>
              <button id="btn-see-all-clients" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline">Gérer tous les clients →</button>
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
                  <div class="sub-card p-4 space-y-3 border border-slate-800 shadow-md">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <strong class="text-white text-sm font-bold block">${c.firstName} ${c.lastName}</strong>
                        <span class="text-[11px] text-slate-300 font-semibold">${c.residence ? `${c.residence}` : (c.phone || '')}</span>
                      </div>
                      <span class="badge badge-emerald text-[10px]">${c.mainGoal}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-[#0c1220] p-2.5 rounded-xl text-center text-xs border border-slate-800">
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Poids</span>
                        <span class="font-bold text-white font-mono">${last ? `${last.weight} kg` : '--'}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Forfait</span>
                        <span class="font-bold ${isDuration ? 'text-emerald-400' : (sessionsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400')} font-mono">
                          ${isDuration ? `${pkg.durationMonths || 1}M` : `${sessionsLeft} rest.`}
                        </span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Solde</span>
                        <span class="font-bold ${balanceDue > 0 ? 'text-amber-400' : 'text-slate-300'} font-mono text-[11px]">
                          ${balanceDue > 0 ? Calculations.formatFCFA(balanceDue) : 'Réglé ✓'}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <button class="btn btn-primary btn-xs flex-1 py-2 font-bold" data-action="open-client" data-client-id="${c.id}">
                        Dossier
                      </button>
                      <button class="btn btn-secondary btn-xs flex-1 py-2 font-semibold" data-action="print-bilan" data-client-id="${c.id}">
                        Ticket Bilan
                      </button>
                      <button class="btn btn-outline btn-xs px-3 py-2 font-semibold" data-action="print-sub" data-client-id="${c.id}">
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
                <thead class="bg-[#0c1220] text-slate-400 uppercase font-bold border-b border-slate-800">
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
                          <strong class="text-white block font-bold text-sm">${c.firstName} ${c.lastName}</strong>
                          <span class="text-[11px] text-slate-400 font-semibold">${c.residence ? `${c.residence} • ` : ''}${c.phone || ''}</span>
                        </td>
                        <td class="p-3">
                          <span class="badge badge-emerald">${c.mainGoal}</span>
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
                        <td class="p-3 font-mono ${balanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}">
                          ${Calculations.formatFCFA(balanceDue)}
                        </td>
                        <td class="p-3 text-right space-x-1.5">
                          <button class="btn btn-secondary btn-xs font-bold" data-action="open-client" data-client-id="${c.id}">
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

    container.querySelectorAll('.btn-today-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;
        stateManager.logSessionAttendance(clientId, {
          date: new Date().toISOString().split('T')[0],
          sessionType: 'Séance Coaching Privé',
          notes: 'Pointage direct depuis tableau de bord'
        });
        window.App.showToast(`Séance pointée pour ${client.firstName} !`, 'success');
        this.render(container);
      });
    });

    container.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId);
      });
    });

    container.querySelectorAll('.btn-alert-renew').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId, 'billing');
      });
    });

    container.querySelectorAll('.btn-alert-whatsapp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;

        const coach = stateManager.getCoachProfile();
        let msg = `Bonjour ${client.firstName},\n`;
        msg += `C'est ${coach.name || 'votre Coach'}. Je vous contacte concernant votre forfait d'entraînement chez COACH PRO qui arrive à échéance.\n`;
        msg += `Souhaitez-vous que l'on prépare le renouvellement de vos prochaines séances ?\n\n`;
        msg += `Sportivement,\n${coach.name || 'Votre Coach'}`;

        const phone = (client.phone || '').replace(/[^0-9]/g, '');
        const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
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
