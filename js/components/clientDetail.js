/**
 * clientDetail.js - Fiche Centrale COACH PRO de l'Athlète
 * Intègre :
 * - Jauge IMC Visuelle 5 zones (Sous-poids, Normal, Surpoids, Obésité, Obésité Sévère)
 * - Diagnostic précis du statut pondéral (Surpoids / Normal / Obésité)
 * - Programme d'entraînement dynamique et organisé (Nom, Séries, Reps, Charge, Repos)
 * - Journal de Pointage / Présence précis (décompte réel des séances restantes & historique)
 * - Bilan Check-out Santé (Contre-indications médicales, Urgence, Objectifs 4D)
 */

import { stateManager } from '../state.js';
import { Assessment21 } from './assessment21.js';
import { BodyComp } from './bodyComp.js';
import { Metabolic } from './metabolic.js';
import { Comparator } from './comparator.js';
import { Billing } from './billing.js';
import { Calculations } from '../calculations.js';

export const ClientDetail = {
  currentTab: 'overview',
  activeClientId: null,

  render(container, clientId, initialTab = 'overview') {
    this.activeClientId = clientId;
    this.currentTab = initialTab;
    const client = stateManager.getClientById(clientId);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Client introuvable</h3>
          <p class="text-xs text-slate-400">Ce dossier client n'existe pas ou a été supprimé.</p>
          <button id="btn-back-to-hub" class="btn btn-secondary btn-sm">Retour aux clients</button>
        </div>
      `;
      container.querySelector('#btn-back-to-hub')?.addEventListener('click', () => {
        window.App.navigateTo('clients');
      });
      return;
    }

    container.innerHTML = `
      <div class="client-detail-view space-y-6">
        
        <!-- Header Fiche Client -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div>
              <button id="btn-back-list" class="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-1">
                ← Retour à la liste
              </button>
              
              <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                <span>${client.firstName} ${client.lastName}</span>
                <span class="badge badge-emerald text-xs">${client.mainGoal}</span>
              </h1>
              
              <!-- Habitation, Profession, Contact -->
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                ${client.age ? `<span>${client.age} ans</span> • ` : ''}
                ${client.residence ? `<span>${client.residence}</span> • ` : ''}
                ${client.profession ? `<span>${client.profession}</span> • ` : ''}
                <span>Tél: ${client.phone || 'Non renseigné'}</span>
                ${client.email ? `• <span>${client.email}</span>` : ''}
              </div>
            </div>

            <!-- Boutons d'Action & 3 Reçus Thermiques -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-print-bilan-action" class="btn btn-secondary btn-sm" title="Imprimer le Bilan Corporel">
                Bilan
              </button>
              <button id="btn-print-prog-action" class="btn btn-secondary btn-sm" title="Imprimer le Programme">
                Programme
              </button>
              <button id="btn-print-abonnement-action" class="btn btn-secondary btn-sm" title="Imprimer le Reçu Forfait">
                Reçu Forfait
              </button>
              <button id="btn-whatsapp-action" class="btn btn-whatsapp btn-sm">
                WhatsApp
              </button>
              <button id="btn-edit-client-action" class="btn btn-secondary btn-sm">
                Modifier
              </button>
              <button id="btn-delete-client-action" class="btn btn-danger btn-sm" title="Supprimer">
                Supprimer
              </button>
            </div>
          </div>

          <!-- Onglets Sobres -->
          <div class="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800">
            <button class="tab-sub-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
              Bilan & Mesures
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'program' ? 'active' : ''}" data-tab="program">
              Programme d'Entraînement
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
              Pointage & Séances
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'comparator' ? 'active' : ''}" data-tab="comparator">
              Comparateur Avant / Après
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'bodyComp' ? 'active' : ''}" data-tab="bodyComp">
              Pesées (${client.history?.length || 0})
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'assessment21' ? 'active' : ''}" data-tab="assessment21">
              Santé 21 Facteurs
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'billing' ? 'active' : ''}" data-tab="billing">
              Forfait & Paiements
            </button>
          </div>
        </div>

        <!-- Contenu de l'Onglet -->
        <div id="sub-tab-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    this.renderActiveTab(container, client);
    this.bindEvents(container, client);
  },

  renderActiveTab(container, client) {
    const subContainer = container.querySelector('#sub-tab-container');
    if (!subContainer) return;

    switch (this.currentTab) {
      case 'program':
        this.renderProgramTab(subContainer, client);
        break;
      case 'attendance':
        this.renderAttendanceTab(subContainer, client);
        break;
      case 'comparator':
        Comparator.render(subContainer, client);
        break;
      case 'bodyComp':
        BodyComp.render(subContainer, client);
        break;
      case 'assessment21':
        Assessment21.render(subContainer, client);
        break;
      case 'billing':
        Billing.render(subContainer, client);
        break;
      case 'overview':
      default:
        this.renderOverview(subContainer, client);
        break;
    }
  },

  /**
   * 1. Onglet Bilan & Mesures (avec Jauge IMC Les Mills & Diagnostic Précis)
   */
  renderOverview(container, client) {
    const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const pkg = client.package || {};
    const interpretation = last ? Calculations.generateCoachInterpretation(client, last) : null;
    const imcInfo = last ? Calculations.calculateIMC(last.weight, last.height || 175) : { imc: 0, code: 'normal', category: 'Normal' };

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- JAUGE VISUELLE IMC (5 ZONES INSPIRÉE DU BILAN CHECK-OUT SANTÉ) -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Indice de Masse Corporelle (IMC = Poids / Taille²)</span>
              <h3 class="text-base font-bold text-white mt-0.5">
                IMC Actuel : <span class="font-mono text-emerald-400">${last ? last.imc : '--'}</span> 
                ${last ? `<span class="text-xs font-normal text-slate-300">(${imcInfo.category})</span>` : ''}
              </h3>
            </div>
            ${interpretation ? `
              <div class="text-right text-xs text-slate-400">
                Poids santé recommandé : <strong class="text-white font-mono">${interpretation.healthyRange.min} à ${interpretation.healthyRange.max} kg</strong>
              </div>
            ` : ''}
          </div>

          <!-- Barème Graphique 5 Silhouettes -->
          <div class="grid grid-cols-5 gap-1 text-center text-[10px] font-semibold font-mono">
            <div class="p-2 rounded-l bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 ${imcInfo.code === 'underweight' ? 'ring-2 ring-cyan-400 font-bold bg-cyan-900/60' : ''}">
              <span class="block">&lt; 18.5</span>
              <span class="text-[9px] uppercase block">Sous-Poids</span>
            </div>
            <div class="p-2 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 ${imcInfo.code === 'normal' ? 'ring-2 ring-emerald-400 font-bold bg-emerald-900/60' : ''}">
              <span class="block">18.5 - 24.9</span>
              <span class="text-[9px] uppercase block">Normal</span>
            </div>
            <div class="p-2 bg-amber-950/60 border border-amber-800/40 text-amber-400 ${imcInfo.code === 'overweight' ? 'ring-2 ring-amber-400 font-bold bg-amber-900/60' : ''}">
              <span class="block">25.0 - 29.9</span>
              <span class="text-[9px] uppercase block">Surpoids</span>
            </div>
            <div class="p-2 bg-orange-950/60 border border-orange-800/40 text-orange-400 ${imcInfo.code === 'obesity_1' ? 'ring-2 ring-orange-400 font-bold bg-orange-900/60' : ''}">
              <span class="block">30.0 - 34.9</span>
              <span class="text-[9px] uppercase block">Obésité</span>
            </div>
            <div class="p-2 rounded-r bg-rose-950/60 border border-rose-800/40 text-rose-400 ${imcInfo.code === 'obesity_2' ? 'ring-2 ring-rose-400 font-bold bg-rose-900/60' : ''}">
              <span class="block">35.0+</span>
              <span class="text-[9px] uppercase block">Obésité Sév.</span>
            </div>
          </div>
        </div>

        <!-- 3 Cartes Métriques Clés -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- 1. Composition Corporelle -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Composition Corporelle</span>
            ${last ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-white font-mono">${last.weight} kg</span>
                <span class="text-xs text-slate-400 font-mono">Taille : ${last.height || 175} cm</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Masse Grasse : <strong class="text-amber-400">${last.fatPct}%</strong> (${last.fatKg || '--'} kg)</div>
                <div>Masse Musculaire : <strong class="text-emerald-400">${last.musclePct}%</strong> (${last.muscleKg || '--'} kg)</div>
                <div>Tour de Taille : <strong class="text-white">${last.waist ? `${last.waist} cm` : 'Non renseigné'}</strong></div>
              </div>
            ` : `<p class="text-xs text-slate-400 italic">Aucune pesée enregistrée.</p>`}
          </div>

          <!-- 2. Forfait & Séances Restantes -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Forfait en Cours</span>
            
            ${pkg.packageType === 'duration' ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-emerald-400 font-mono">${pkg.durationMonths || 1} Mois</span>
                <span class="text-xs text-slate-400 font-mono">${pkg.sessionsUsed || 0} séances faites</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Échéance : <strong class="text-white">${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</strong></div>
                <div>Solde Dû : <strong class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}">${Calculations.formatFCFA(pkg.balanceDue || 0)}</strong></div>
              </div>
            ` : `
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-emerald-400 font-mono">${Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0))}</span>
                <span class="text-xs text-slate-400">séances rest. / ${pkg.totalSessions || 0}</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Formule : <strong class="text-white">${pkg.packageName || 'Pack séances'}</strong></div>
                <div>Solde Dû : <strong class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}">${Calculations.formatFCFA(pkg.balanceDue || 0)}</strong></div>
              </div>
            `}
          </div>

          <!-- 3. Métabolisme & Calories -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Nutrition & Métabolisme</span>
            ${last ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-white font-mono">${last.targetKcal || 2000}</span>
                <span class="text-xs text-slate-400 font-mono">kcal / jour</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Métabolisme Base (MB) : <strong class="text-white font-mono">${last.mb || '--'} kcal</strong></div>
                <div>Dépense Totale (DET) : <strong class="text-white font-mono">${last.det || '--'} kcal</strong></div>
                <div>Hydratation requise : <strong class="text-emerald-400 font-mono">${(last.weight * 0.035).toFixed(1)} L/j</strong></div>
              </div>
            ` : '<p class="text-xs text-slate-400 italic">--</p>'}
          </div>
        </div>

        <!-- DIAGNOSTIC PRÉCIS DU COACH (SURPOIDS / POIDS NORMAL / OBÉSITÉ) -->
        ${interpretation ? `
          <div class="glass-card p-5 space-y-3 border-l-4 border-emerald-500">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Diagnostic & Prescription du Coach</h3>
              <span class="badge badge-emerald text-xs">Diagnostic Validé</span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">1. Statut Pondéral & Diagnostic Tissu Adipeux :</span>
                <p class="text-slate-200 leading-relaxed font-medium">${interpretation.bodyDiagnosis}</p>
              </div>

              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">2. Prescription Eau & Protéines :</span>
                <p class="text-slate-300 leading-relaxed">${interpretation.metabolicDiagnosis}</p>
              </div>

              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">3. Freins Santé & Hygiène de vie :</span>
                <p class="text-slate-300 leading-relaxed">${interpretation.healthDiagnosis}</p>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- BILAN CHECK-OUT SANTÉ (CONTRE-INDICATIONS & OBJECTIFS 4D) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Contre-indications & Interdictions -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contre-indications & Sécurité Médicale</span>
            <div class="text-xs text-slate-300 space-y-1.5">
              <div>• Interdictions médecin : <strong class="text-white">${client.medicalNotes?.doctorRestrictions || 'Aucune interdiction signalée'}</strong></div>
              <div>• Prothèses / Handicaps : <strong class="text-white">${client.medicalNotes?.jointDetails || 'Aucun'}</strong></div>
              <div>• Contact Urgence : <strong class="text-white">${client.emergencyContact?.name || 'Non renseigné'}</strong> ${client.emergencyContact?.phone ? `(${client.emergencyContact.phone})` : ''}</div>
            </div>
          </div>

          <!-- Objectifs 4D Améliorations -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Objectifs 4D (Améliorations Souhaitées)</span>
            <div class="text-xs text-slate-300 space-y-1.5">
              <div>• Santé : <strong class="text-white">${client.goals4D?.health || 'Améliorer santé & énergie'}</strong></div>
              <div>• Look & Silhouette : <strong class="text-white">${client.goals4D?.look || 'Affiner la silhouette'}</strong></div>
              <div>• Physique & Force : <strong class="text-white">${client.goals4D?.fitness || 'Augmenter la force'}</strong></div>
              <div>• Bien-être : <strong class="text-white">${client.goals4D?.wellness || 'Vitalité & anti-stress'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 2. Onglet Dédié : Programme d'Entraînement Structuré & Organisé
   */
  renderProgramTab(container, client) {
    const prog = client.program || {
      title: `Programme ${client.mainGoal}`,
      frequency: '3 séances / semaine',
      recommendations: 'Boire 2.5L d\'eau par jour, respecter les temps de repos et privilégier la régularité.',
      exercises: []
    };

    let exercises = Array.isArray(prog.exercises) ? [...prog.exercises] : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Programme -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-white">Programme d'Entraînement de ${client.firstName}</h3>
            <p class="text-xs text-slate-400">Organisez les exercices, séries, répétitions et charges à remettre au client</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-print-prog-direct" class="btn btn-primary btn-sm">
              Imprimer le Programme
            </button>
          </div>
        </div>

        <!-- Formulaire Structuré du Programme -->
        <div class="glass-card p-5 space-y-5">
          <form id="form-client-program-structured" class="space-y-5">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Titre du Programme *</label>
                <input type="text" id="prog-title" value="${prog.title || ''}" placeholder="ex: Programme Perte de Gras & Tonification" class="input font-bold" required />
              </div>
              <div>
                <label class="label">Fréquence d'Entraînement *</label>
                <input type="text" id="prog-frequency" value="${prog.frequency || '3 séances / semaine'}" placeholder="ex: 3 séances / semaine (Lundi / Mercredi / Vendredi)" class="input font-semibold" required />
              </div>
            </div>

            <!-- Liste Dynamique des Exercices Organisés -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <label class="label font-bold text-emerald-400 uppercase tracking-wider">
                  Exercices Prescrits (${exercises.length})
                </label>
                <button type="button" id="btn-add-exercise-row" class="btn btn-secondary btn-xs">
                  + Ajouter un Exercice
                </button>
              </div>

              <div class="space-y-2" id="exercises-list-wrapper">
                ${exercises.map((ex, idx) => `
                  <div class="p-3 bg-[#0c1220] rounded-lg border border-slate-800 exercise-item-row space-y-2" data-idx="${idx}">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-400">Exercice #${idx + 1}</span>
                      <button type="button" class="text-slate-500 hover:text-red-400 text-xs btn-remove-ex" data-idx="${idx}">
                        Supprimer ✕
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div class="sm:col-span-2">
                        <input type="text" class="input text-xs font-bold text-white ex-name" placeholder="Nom (ex: Squat, Développé couché)" value="${ex.name || ''}" required />
                      </div>
                      <div>
                        <input type="number" class="input text-xs font-mono ex-sets" placeholder="Séries (ex: 4)" value="${ex.sets || 4}" required />
                      </div>
                      <div>
                        <input type="text" class="input text-xs font-mono ex-reps" placeholder="Répétitions (ex: 10-12)" value="${ex.reps || '10'}" required />
                      </div>
                      <div>
                        <input type="text" class="input text-xs font-mono text-emerald-400 ex-weight" placeholder="Charge (ex: 12 kg)" value="${ex.weight || ''}" />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input type="text" class="input text-xs text-slate-400 ex-rest" placeholder="Temps de repos (ex: 60s)" value="${ex.rest || '60s'}" />
                      <input type="text" class="input text-xs text-slate-400 italic ex-notes" placeholder="Consigne du coach (ex: Dos droit, amplitude complète)" value="${ex.notes || ''}" />
                    </div>
                  </div>
                `).join('')}
              </div>

              ${exercises.length === 0 ? `
                <div id="no-exercises-placeholder" class="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
                  Aucun exercice prescrit. Cliquez sur "+ Ajouter un Exercice" ci-dessus pour commencer.
                </div>
              ` : ''}
            </div>

            <!-- Recommandations & Consignes Générales -->
            <div class="pt-2">
              <label class="label font-bold text-emerald-400 uppercase tracking-wider">Recommandations & Consignes Générales du Coach :</label>
              <textarea id="prog-recommendations" rows="3" class="input text-xs w-full resize-y" placeholder="ex: Boire 2.5L d'eau par jour, respecter le sommeil de 7-8h, régularité sur chaque séance...">${prog.recommendations || ''}</textarea>
            </div>

            <!-- Action Sauvegarder -->
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="submit" id="btn-save-program-submit" class="btn btn-primary btn-sm">
                Enregistrer le Programme
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Événements Programme
    const wrapper = container.querySelector('#exercises-list-wrapper');

    container.querySelector('#btn-print-prog-direct')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'program');
    });

    container.querySelector('#btn-add-exercise-row')?.addEventListener('click', () => {
      const idx = wrapper.querySelectorAll('.exercise-item-row').length;
      const placeholder = container.querySelector('#no-exercises-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      const row = document.createElement('div');
      row.className = 'p-3 bg-[#0c1220] rounded-lg border border-slate-800 exercise-item-row space-y-2';
      row.setAttribute('data-idx', idx);
      row.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400">Exercice #${idx + 1}</span>
          <button type="button" class="text-slate-500 hover:text-red-400 text-xs btn-remove-ex">
            Supprimer ✕
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <div class="sm:col-span-2">
            <input type="text" class="input text-xs font-bold text-white ex-name" placeholder="Nom (ex: Squat, Fentes)" required />
          </div>
          <div>
            <input type="number" class="input text-xs font-mono ex-sets" placeholder="Séries" value="4" required />
          </div>
          <div>
            <input type="text" class="input text-xs font-mono ex-reps" placeholder="Répétitions" value="10-12" required />
          </div>
          <div>
            <input type="text" class="input text-xs font-mono text-emerald-400 ex-weight" placeholder="Charge (ex: 10 kg)" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" class="input text-xs text-slate-400 ex-rest" placeholder="Repos (ex: 60s)" value="60s" />
          <input type="text" class="input text-xs text-slate-400 italic ex-notes" placeholder="Consigne (ex: Dos droit)" />
        </div>
      `;

      row.querySelector('.btn-remove-ex')?.addEventListener('click', () => row.remove());
      wrapper.appendChild(row);
    });

    container.querySelectorAll('.btn-remove-ex').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.closest('.exercise-item-row')?.remove();
      });
    });

    container.querySelector('#form-client-program-structured')?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newExercises = [];
      wrapper.querySelectorAll('.exercise-item-row').forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        const sets = parseInt(row.querySelector('.ex-sets')?.value, 10) || 4;
        const reps = row.querySelector('.ex-reps')?.value.trim() || '10';
        const weight = row.querySelector('.ex-weight')?.value.trim() || '';
        const rest = row.querySelector('.ex-rest')?.value.trim() || '60s';
        const notes = row.querySelector('.ex-notes')?.value.trim() || '';

        if (name) {
          newExercises.push({ name, sets, reps, weight, rest, notes });
        }
      });

      const updated = {
        title: container.querySelector('#prog-title')?.value || 'Programme d\'Entraînement',
        frequency: container.querySelector('#prog-frequency')?.value || '3 séances / semaine',
        recommendations: container.querySelector('#prog-recommendations')?.value || '',
        exercises: newExercises
      };

      stateManager.saveClientProgram(client.id, updated);
      window.App.showToast('Programme enregistré avec succès !', 'success');
      this.renderProgramTab(container, stateManager.getClientById(client.id));
    });
  },

  /**
   * 3. Onglet Dédié : Pointage & Suivi des Séances (Attendance Log)
   */
  renderAttendanceTab(container, client) {
    const pkg = client.package || {};
    const isDuration = pkg.packageType === 'duration';
    const total = pkg.totalSessions || 10;
    const used = pkg.sessionsUsed || 0;
    const remaining = !isDuration ? Math.max(0, total - used) : null;
    const logs = Array.isArray(client.attendanceLog) ? client.attendanceLog : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Cartes Résumé Séances & Pointage Direct -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Carte 1 : Séances Restantes / Échéance -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">État du Forfait</span>
            ${isDuration ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-emerald-400 font-mono">${pkg.durationMonths || 1} Mois</span>
                <span class="text-xs text-slate-400">(${used} séances faites)</span>
              </div>
              <span class="text-[11px] text-slate-300 block">Échéance : ${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</span>
            ` : `
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold ${remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono">${remaining}</span>
                <span class="text-xs text-slate-400 font-normal">séances restantes sur ${total}</span>
              </div>
              <span class="text-[11px] text-slate-400 block">${used} séances déjà effectuées</span>
            `}
          </div>

          <!-- Carte 2 : Statut Validité -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Statut Coaching</span>
            <span class="text-xl font-bold block ${remaining === 0 ? 'text-rose-400' : remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'}">
              ${!isDuration && remaining === 0 ? 'Forfait Épuisé' : !isDuration && remaining <= 2 ? 'Renouvellement Proche' : 'Actif & En Cours'}
            </span>
            <span class="text-[11px] text-slate-400 block">Formule : ${pkg.packageName || 'Coaching'}</span>
          </div>

          <!-- Carte 3 : Règlement FCFA -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Paiement Forfait</span>
            <span class="text-2xl font-bold font-mono text-white block">${Calculations.formatFCFA(pkg.totalAmount || 0)}</span>
            <span class="text-[11px] ${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'} block">
              ${(pkg.balanceDue || 0) > 0 ? `Solde restant : ${Calculations.formatFCFA(pkg.balanceDue)}` : 'Entièrement Réglé'}
            </span>
          </div>
        </div>

        <!-- Boîte de Pointage Rapide -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Valider la Présence / Pointer une Séance</h3>
              <p class="text-xs text-slate-400">Chaque pointage décompte automatiquement 1 séance et l'ajoute à l'historique daté</p>
            </div>
          </div>

          <form id="form-log-attendance" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Date de la séance</label>
              <input type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Type de Séance</label>
              <input type="text" id="att-type" value="Séance Coaching Privé" placeholder="ex: Renforcement & Cardio" class="input text-xs" required />
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-primary btn-sm w-full">
                Pointer la Séance (Présence)
              </button>
            </div>
          </form>
        </div>

        <!-- Historique Daté des Séances Effectuées -->
        <div class="glass-card overflow-hidden">
          <div class="p-4 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Historique des Séances Effectuées (${logs.length})
            </h4>
            <span class="text-[11px] text-slate-400">Total : ${used} séance(s)</span>
          </div>

          ${logs.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400">
              Aucune séance pointée dans l'historique pour le moment.
            </div>
          ` : `
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3"># Séance</th>
                  <th class="p-3">Date & Heure</th>
                  <th class="p-3">Type de Séance</th>
                  <th class="p-3">Statut</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${logs.map((log) => `
                  <tr class="hover:bg-slate-800/40">
                    <td class="p-3 font-bold text-white font-mono">Séance #${log.sessionNumber || '--'}</td>
                    <td class="p-3 font-mono">${new Date(log.date).toLocaleDateString('fr-FR')} ${log.time ? `à ${log.time}` : ''}</td>
                    <td class="p-3 text-slate-200">${log.sessionType}</td>
                    <td class="p-3"><span class="badge badge-emerald">Présent</span></td>
                    <td class="p-3 text-right">
                      <button class="text-slate-500 hover:text-red-400 text-xs btn-undo-attendance" data-log-id="${log.id}">
                        Annuler
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;

    // Événements Pointage
    container.querySelector('#form-log-attendance')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = container.querySelector('#att-date')?.value;
      const type = container.querySelector('#att-type')?.value;

      stateManager.logSessionAttendance(client.id, { date, sessionType: type });
      window.App.showToast('Séance pointée avec succès !', 'success');
      this.renderAttendanceTab(container, stateManager.getClientById(client.id));
    });

    container.querySelectorAll('.btn-undo-attendance').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const logId = e.currentTarget.getAttribute('data-log-id');
        if (confirm('Annuler ce pointage de séance et réajuster le compteur ?')) {
          stateManager.removeSessionAttendance(client.id, logId);
          window.App.showToast('Pointage annulé', 'info');
          this.renderAttendanceTab(container, stateManager.getClientById(client.id));
        }
      });
    });
  },

  bindEvents(container, client) {
    container.querySelector('#btn-back-list')?.addEventListener('click', () => {
      window.App.navigateTo('clients');
    });

    container.querySelector('#btn-print-bilan-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'assessment');
    });

    container.querySelector('#btn-print-prog-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'program');
    });

    container.querySelector('#btn-print-abonnement-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'subscription');
    });

    container.querySelector('#btn-whatsapp-action')?.addEventListener('click', () => {
      window.App.sendWhatsAppToClient(client.id);
    });

    container.querySelector('#btn-edit-client-action')?.addEventListener('click', () => {
      window.App.openEditClientModal(client.id);
    });

    container.querySelector('#btn-delete-client-action')?.addEventListener('click', () => {
      if (confirm(`Supprimer définitivement le dossier de ${client.firstName} ${client.lastName} ?`)) {
        stateManager.deleteClient(client.id);
        window.App.showToast('Client supprimé', 'info');
        window.App.navigateTo('clients');
      }
    });

    container.querySelectorAll('.tab-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.tab-sub-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTab = e.currentTarget.getAttribute('data-tab');
        this.renderActiveTab(container, client);
      });
    });
  }
};
