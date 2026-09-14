/**
 * thermalModal.js - Modal d'Impression Thermique COACH PRO
 * Rendu papier thermique réaliste haute lisibilité (fond blanc, texte noir net, QR code vectoriel)
 * Gestion précise de tous les types de tickets : Bilan, Forfait/Reçu, Programme, Contrat et Comptabilité.
 */

import { ThermalPrinter } from '../printer.js';
import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';
import { QRGenerator } from '../qrGenerator.js';

export const ThermalModal = {
  currentWidth: '58mm',
  currentReceiptType: 'assessment', // 'assessment', 'subscription', 'program', 'contract', 'accounting'
  activeClient: null,
  activeAssessment: null,

  open(clientId = null, customAssessmentOrType = null, receiptType = 'assessment') {
    let targetType = 'assessment';
    let targetAssessment = null;

    if (typeof customAssessmentOrType === 'string' && customAssessmentOrType) {
      targetType = customAssessmentOrType;
    } else if (typeof receiptType === 'string' && receiptType) {
      targetType = receiptType;
      targetAssessment = customAssessmentOrType;
    }

    const client = clientId ? stateManager.getClientById(clientId) : null;
    this.activeClient = client;
    this.currentReceiptType = targetType;

    if (client) {
      this.activeAssessment = targetAssessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {
        weight: client.targetWeight || 75,
        height: 175,
        imc: 24.5,
        imcCategory: 'Normal',
        fatPct: 20,
        musclePct: 40,
        waist: 85,
        mb: 1750,
        det: 2400,
        targetKcal: 2000
      });
    }

    const modalBackdrop = document.getElementById('thermal-print-modal');
    if (!modalBackdrop) return;

    modalBackdrop.classList.remove('hidden');
    this.renderModal();
    this.bindEvents();
  },

  close() {
    const modalBackdrop = document.getElementById('thermal-print-modal');
    if (modalBackdrop) modalBackdrop.classList.add('hidden');
  },

  renderModal() {
    const container = document.getElementById('thermal-print-modal-container');
    if (!container) return;

    const coach = stateManager.getCoachProfile();
    const client = this.activeClient || {
      id: 'general',
      firstName: 'Athlète',
      lastName: 'COACH PRO',
      mainGoal: 'Suivi Sportif'
    };
    const assessment = this.activeAssessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {});
    const pkg = client.package || {};
    const prog = client.program || {};
    const contract = client.contract || {};
    const summary = stateManager.getFinancialSummary({ period: 'month' });

    const totalAmount = pkg.totalAmount || pkg.price || 0;
    const amountPaid = pkg.amountPaid || pkg.advancePayment || 0;
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    const isFullyPaid = balanceDue <= 0;

    const imcInfo = Calculations.calculateIMC(assessment.weight || 75, assessment.height || 175);
    const weightRange = Calculations.calculateHealthyWeightRange(assessment.height || 175, assessment.weight || 75);
    const goalsStr = Array.isArray(client.goals) && client.goals.length > 0 ? client.goals.join(', ') : (client.mainGoal || 'Transformation');

    const qrPayload = client.id !== 'general' ? client.id : 'COACH_PRO_APP';
    const qrSvg = QRGenerator.generateSVG(qrPayload, 110);

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- En-tête & Choix des Types de Reçus -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>🧾</span> Impression Ticket Thermique
            </h3>
            <p class="text-xs text-slate-300 font-semibold">${client.firstName} ${client.lastName} ${client.phone ? `(${client.phone})` : ''}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Onglets de Reçus -->
            <div class="flex items-center gap-1 bg-[#070b16] p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-[320px]">
              <button id="btn-type-assessment" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'assessment' ? 'active' : ''}">Bilan</button>
              <button id="btn-type-subscription" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'subscription' ? 'active' : ''}">Forfait</button>
              <button id="btn-type-program" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'program' ? 'active' : ''}">Programme</button>
              <button id="btn-type-contract" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'contract' ? 'active' : ''}">Contrat</button>
              <button id="btn-type-accounting" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'accounting' ? 'active' : ''}">Compta</button>
            </div>
            <button id="btn-close-thermal-x" class="text-slate-400 hover:text-white p-1.5 text-lg font-bold">✕</button>
          </div>
        </div>

        <!-- Sélecteur de format 58mm / 80mm -->
        <div class="flex items-center justify-center gap-3">
          <span class="text-xs text-slate-300 font-bold">Format Papier Thermique :</span>
          <button id="btn-toggle-58mm" class="format-toggle-btn ${this.currentWidth === '58mm' ? 'active' : ''}">58 mm (Standard)</button>
          <button id="btn-toggle-80mm" class="format-toggle-btn ${this.currentWidth === '80mm' ? 'active' : ''}">80 mm (Large)</button>
        </div>

        <!-- Rendu Visuel du Ticket (Fond Blanc Papier Réaliste & Texte Noir Net) -->
        <div class="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 flex justify-center overflow-y-auto max-h-[52vh] shadow-inner">
          <div id="thermal-ticket-render-target" class="thermal-paper ${this.currentWidth === '80mm' ? 'thermal-paper-80' : 'thermal-paper-58'}">
            
            ${this.currentReceiptType === 'assessment' ? `
              <!-- TICKET 1 : BILAN DU CLIENT (Exactement conforme aux photos de caisse) -->
              <div class="thermal-ticket-body space-y-1 text-black font-mono">
                <div class="text-center pb-1">
                  <div class="font-black text-sm uppercase tracking-wider">${coach.name || 'COACH KELLY'}</div>
                  <div class="text-[11px] font-semibold">Tel: ${coach.phone || '2250758245530'}</div>
                  <div class="text-[11px]">${coach.city || 'Abidjan'}</div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-xs uppercase tracking-wide">BILAN DU CLIENT</div>
                <div class="text-center text-xs font-bold">--------------------------------</div>

                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Habitation:</span><span>${client.residence || 'FAYA'}</span></div>
                  <div class="flex justify-between"><span>Date:</span><span>${new Date(assessment.date || Date.now()).toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Objectif:</span><span class="font-bold truncate">${goalsStr}</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-center font-black text-[11px] uppercase">COMPOSITION CORPORELLE</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Poids actuel:</span><span class="font-bold">${assessment.weight || 70} kg</span></div>
                  <div class="flex justify-between"><span>Taille:</span><span>${assessment.height || 165} cm</span></div>
                  <div class="flex justify-between"><span>IMC:</span><span>${imcInfo.imc} (${imcInfo.category})</span></div>
                  <div class="flex justify-between"><span>Poids sante:</span><span>${weightRange.min} a ${weightRange.max} kg</span></div>
                  <div class="flex justify-between"><span>Masse grasse:</span><span>${assessment.fatPct ? assessment.fatPct + '%' : '23.8%'} (${assessment.fatKg || (assessment.weight ? (assessment.weight * 0.238).toFixed(1) : '16.7')}kg)</span></div>
                  <div class="flex justify-between"><span>Masse muscle:</span><span>${assessment.musclePct ? assessment.musclePct + '%' : '60%'} (${assessment.muscleKg || (assessment.weight ? (assessment.weight * 0.60).toFixed(1) : '42')}kg)</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-center font-black text-[11px] uppercase">METABOLISME & NUTRITION</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Metabolisme base:</span><span>${assessment.mb || 1536} kcal/j</span></div>
                  <div class="flex justify-between"><span>Depense totale:</span><span>${assessment.det || 2112} kcal/j</span></div>
                  <div class="flex justify-between"><span>Eau requise:</span><span>${assessment.weight ? (assessment.weight * 0.035).toFixed(1) : '2.5'} L/jour</span></div>
                  <div class="flex justify-between"><span>Score sante (21F):</span><span>6/21</span></div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center text-[10px] pt-0.5">
                  Votre transformation, votre<br>mission !
                </div>
              </div>
            ` : this.currentReceiptType === 'subscription' ? `
              <!-- TICKET 2 : REÇU D'ABONNEMENT (Exactement conforme aux photos de caisse) -->
              <div class="thermal-ticket-body space-y-1 text-black font-mono">
                <div class="text-center pb-1">
                  <div class="font-black text-sm uppercase tracking-wider">${coach.name || 'COACH KELLY'}</div>
                  <div class="text-[11px] font-semibold">Tel: ${coach.phone || '2250758245530'}</div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-xs uppercase tracking-wide">RECU D'ABONNEMENT</div>
                <div class="text-center text-xs font-bold">--------------------------------</div>

                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Profession:</span><span>${client.profession || 'Entrepreneur'}</span></div>
                  <div class="flex justify-between"><span>Date debut:</span><span>${pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Echeance:</span><span>${pkg.endDate ? new Date(pkg.endDate).toLocaleDateString('fr-FR') : '28/10/2026'}</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Formule:</span><span class="font-bold">${pkg.packageName || 'Forfait 2 Mois'}</span></div>
                  <div class="flex justify-between"><span>Duree pack:</span><span>${pkg.durationMonths ? pkg.durationMonths + ' mois' : '2 mois'}</span></div>
                  <div class="flex justify-between"><span>Seances faites:</span><span>${pkg.sessionsUsed || 0} seances</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Tarif total:</span><span class="font-bold">${totalAmount || 150000} FCFA</span></div>
                  <div class="flex justify-between"><span>Acompte verse:</span><span class="font-bold">${amountPaid || 100000} FCFA</span></div>
                  <div class="flex justify-between"><span>Reste a payer:</span><span class="font-bold">${balanceDue || 50000} FCFA</span></div>
                  <div class="flex justify-between"><span class="font-bold">Statut:</span><span class="font-black">${isFullyPaid ? 'SOLDE REGLE' : 'PAIEMENT PARTIEL'}</span></div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-[11px] uppercase">SIGNATURES</div>
                <div class="flex justify-between text-[11px] font-bold pt-3 pb-8">
                  <span>Le Coach</span>
                  <span>Le Client</span>
                </div>

                <div class="text-center text-[10px] pt-1">
                  Merci pour votre confiance !
                </div>
              </div>
            ` : this.currentReceiptType === 'contract' ? `
              <!-- TICKET 4 : ENGAGEMENT & DÉCHARGE -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-sm uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-[11px] uppercase font-black">Engagement &amp; Décharge</div>
                </div>

                <div class="text-xs space-y-1">
                  <div class="flex justify-between"><span>Client :</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  ${client.phone ? `<div class="flex justify-between"><span>Contact :</span><span>${client.phone}</span></div>` : ''}
                  <div class="flex justify-between"><span>Réf :</span><span>${contract.contractNumber || 'CTR-' + (client.id ? client.id.slice(-6) : '001')}</span></div>
                  <div class="flex justify-between"><span>Date :</span><span>${new Date(contract.signedAt || Date.now()).toLocaleDateString('fr-FR')}</span></div>
                </div>

                <div class="text-[10px] text-justify py-1 border-t border-b border-dashed border-black leading-tight">
                  Le client certifie être apte à la pratique sportive et décharge le coach de toute responsabilité en cas de problème médical non déclaré.
                </div>

                <div class="flex justify-between text-[10px] font-bold">
                  <span>Coach : SIGNÉ [CERTIFIÉ] ✓</span>
                  <span>Client : LU ET APPROUVÉ ✓</span>
                </div>

                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-20 h-20 p-1 bg-white rounded border border-black flex items-center justify-center">
                    ${qrSvg}
                  </div>
                </div>
              </div>
            ` : this.currentReceiptType === 'accounting' ? `
              <!-- TICKET 5 : COMPTABILITÉ COACH -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-base uppercase">${coach.name || 'COACH PRO'}</div>
                  <div class="text-xs font-black uppercase">Bilan Comptable du Mois</div>
                  <div class="text-[10px]">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>

                <div class="text-xs space-y-1 py-1.5 border-b border-dashed border-black">
                  <div class="flex justify-between"><span>Recettes Totales :</span><span class="font-bold">${Calculations.formatFCFA(summary.totalIncome)}</span></div>
                  <div class="flex justify-between"><span>Dépenses :</span><span class="font-bold">-${Calculations.formatFCFA(summary.totalExpenses)}</span></div>
                  <div class="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black">
                    <span>BÉNÉFICE NET :</span><span>${Calculations.formatFCFA(summary.netProfit)}</span>
                  </div>
                  <div class="flex justify-between text-[10px] font-bold"><span>Soldes à Encaisser :</span><span>${Calculations.formatFCFA(summary.totalReceivables)}</span></div>
                </div>

                <div class="text-center text-[10px] pt-1">
                  COACH PRO • Comptabilité Privée
                </div>
              </div>
            ` : `
              <!-- TICKET 3 : PROGRAMME D'ENTRAÎNEMENT -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-base uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-xs font-black uppercase">Programme d'Entraînement</div>
                </div>
                <div class="text-xs space-y-1">
                  <div><strong>Client :</strong> ${client.firstName} ${client.lastName}</div>
                  <div><strong>Objectifs :</strong> ${goalsStr}</div>
                  <div><strong>Fréquence :</strong> ${prog.frequency || '3 à 4 séances / semaine'}</div>
                </div>
                <div class="text-[11px] border-t border-b border-dashed border-black py-1.5 space-y-1">
                  ${prog.exercises && prog.exercises.length > 0 ? prog.exercises.map((ex, i) => `
                    <div class="flex justify-between">
                      <span>${i + 1}. <strong>${ex.name}</strong></span>
                      <span>${ex.sets}x${ex.reps} ${ex.weight ? `(${ex.weight})` : ''}</span>
                    </div>
                  `).join('') : '<p>Programme personnalisé défini en séance.</p>'}
                </div>

                <div class="text-[10px] border-b border-dashed border-black pb-1 space-y-0.5">
                  <strong>Recommandations :</strong>
                  <p>${prog.recommendations || 'Échauffement 10 min, hydratation 500ml, sommeil réparateur.'}</p>
                </div>

                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-20 h-20 p-1 bg-white rounded border border-black flex items-center justify-center">
                    ${qrSvg}
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Boutons d'Action Impression -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="btn-print-bluetooth" class="btn btn-primary btn-sm flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-500/20">
              <span>📶</span>
              <span>Imprimer Bluetooth</span>
            </button>
            <button id="btn-print-browser" class="btn btn-secondary btn-sm flex items-center gap-1.5 font-bold">
              <span>🖨️</span>
              <span>Imprimerie Standard</span>
            </button>
          </div>

          <button id="btn-close-thermal" class="btn btn-outline btn-sm w-full sm:w-auto font-bold">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('thermal-print-modal');
    const closeX = document.getElementById('btn-close-thermal-x');
    const closeBtn = document.getElementById('btn-close-thermal');

    closeX?.addEventListener('click', () => this.close());
    closeBtn?.addEventListener('click', () => this.close());

    // Sélecteurs de format
    document.getElementById('btn-toggle-58mm')?.addEventListener('click', () => {
      this.currentWidth = '58mm';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-toggle-80mm')?.addEventListener('click', () => {
      this.currentWidth = '80mm';
      this.renderModal();
      this.bindEvents();
    });

    // Types de reçus
    document.getElementById('btn-type-assessment')?.addEventListener('click', () => {
      this.currentReceiptType = 'assessment';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-subscription')?.addEventListener('click', () => {
      this.currentReceiptType = 'subscription';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-program')?.addEventListener('click', () => {
      this.currentReceiptType = 'program';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-contract')?.addEventListener('click', () => {
      this.currentReceiptType = 'contract';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-accounting')?.addEventListener('click', () => {
      this.currentReceiptType = 'accounting';
      this.renderModal();
      this.bindEvents();
    });

    // Impression Bluetooth Directe
    document.getElementById('btn-print-bluetooth')?.addEventListener('click', async () => {
      try {
        const coach = stateManager.getCoachProfile();
        let plainText = '';

        if (this.currentReceiptType === 'assessment') {
          plainText = ThermalPrinter.generateAssessmentReceipt(this.activeClient, this.activeAssessment, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'subscription') {
          plainText = ThermalPrinter.generateSubscriptionReceipt(this.activeClient, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'contract') {
          plainText = ThermalPrinter.generateContractReceipt(this.activeClient, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'accounting') {
          plainText = ThermalPrinter.generateAccountingReceipt(coach, this.currentWidth);
        } else {
          plainText = ThermalPrinter.generateProgramReceipt(this.activeClient, coach, this.currentWidth);
        }

        await ThermalPrinter.printDirect(plainText);
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast('Ticket imprimé avec succès !', 'success');
        }
      } catch (err) {
        alert(err.message || 'Erreur lors de l\'impression.');
      }
    });

    // Impression Navigateur / Système
    document.getElementById('btn-print-browser')?.addEventListener('click', () => {
      window.print();
    });
  }
};
