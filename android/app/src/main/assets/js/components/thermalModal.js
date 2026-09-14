/**
 * thermalModal.js - Modal d'Impression Thermique COACH PRO
 * Rendu avec QR Code vectoriel intégré, Bilan, Forfait, Programme, Contrat et Comptabilité.
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

  open(clientId = null, receiptType = 'assessment') {
    const client = clientId ? stateManager.getClientById(clientId) : null;
    this.activeClient = client;
    this.currentReceiptType = receiptType;

    if (client) {
      this.activeAssessment = (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {
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
      firstName: 'Bilan',
      lastName: 'Général',
      mainGoal: 'Comptabilité'
    };
    const assessment = this.activeAssessment || {};
    const pkg = client.package || {};
    const prog = client.program || {};
    const contract = client.contract || {};
    const summary = stateManager.getFinancialSummary({ period: 'month' });

    const qrPayload = client.id !== 'general' ? client.id : 'COACH_PRO_APP';
    const qrSvg = QRGenerator.generateSVG(qrPayload, 120);

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- En-tête & Choix des Types de Reçus -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Impression de Ticket Thermique</h3>
            <p class="text-xs text-slate-400">${client.firstName} ${client.lastName}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-[#0c1220] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-[280px]">
              <button id="btn-type-assessment" class="tab-sub-btn text-xs ${this.currentReceiptType === 'assessment' ? 'active' : ''}">Bilan</button>
              <button id="btn-type-subscription" class="tab-sub-btn text-xs ${this.currentReceiptType === 'subscription' ? 'active' : ''}">Forfait</button>
              <button id="btn-type-program" class="tab-sub-btn text-xs ${this.currentReceiptType === 'program' ? 'active' : ''}">Programme</button>
              <button id="btn-type-contract" class="tab-sub-btn text-xs ${this.currentReceiptType === 'contract' ? 'active' : ''}">Contrat</button>
              <button id="btn-type-accounting" class="tab-sub-btn text-xs ${this.currentReceiptType === 'accounting' ? 'active' : ''}">Compta</button>
            </div>
            <button id="btn-close-thermal-x" class="btn-icon">✕</button>
          </div>
        </div>

        <!-- Sélecteur de format 58mm / 80mm -->
        <div class="flex items-center justify-center gap-2">
          <span class="text-xs text-slate-400 font-semibold">Format Papier :</span>
          <button id="btn-toggle-58mm" class="format-toggle-btn ${this.currentWidth === '58mm' ? 'active' : ''}">58 mm</button>
          <button id="btn-toggle-80mm" class="format-toggle-btn ${this.currentWidth === '80mm' ? 'active' : ''}">80 mm</button>
        </div>

        <!-- Rendu Visuel du Ticket -->
        <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-center overflow-x-auto max-h-[50vh]">
          <div id="thermal-ticket-render-target" class="thermal-paper ${this.currentWidth === '80mm' ? 'thermal-paper-80' : 'thermal-paper-58'}">
            
            ${this.currentReceiptType === 'assessment' ? `
              <!-- TICKET 1 : BILAN DU CLIENT -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-base uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  ${coach.phone ? `<div class="text-xs">Tel: ${coach.phone}</div>` : ''}
                  ${coach.city ? `<div class="text-xs">${coach.city}</div>` : ''}
                </div>

                <div class="text-center font-bold text-sm py-1 border-b border-dashed border-slate-400">
                  BILAN DU CLIENT
                </div>

                <div class="text-xs space-y-1">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Date:</span><span>${new Date(assessment.date || Date.now()).toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Objectif:</span><span class="truncate">${client.mainGoal || 'Remise en forme'}</span></div>
                </div>

                <div class="border-t border-b border-dashed border-slate-400 py-1 text-xs space-y-1">
                  <div class="text-center font-bold uppercase">Mesures & Santé</div>
                  <div class="flex justify-between"><span>Poids:</span><span class="font-bold">${assessment.weight || '--'} kg</span></div>
                  ${assessment.height ? `<div class="flex justify-between"><span>Taille:</span><span>${assessment.height} cm</span></div>` : ''}
                  <div class="flex justify-between"><span>IMC:</span><span>${assessment.imc || '--'} (${assessment.imcCategory || 'Normal'})</span></div>
                  ${assessment.fatPct ? `<div class="flex justify-between"><span>Gras:</span><span>${assessment.fatPct}% (${assessment.fatKg || '--'}kg)</span></div>` : ''}
                  ${assessment.musclePct ? `<div class="flex justify-between"><span>Muscle:</span><span>${assessment.musclePct}% (${assessment.muscleKg || '--'}kg)</span></div>` : ''}
                  ${assessment.systolic && assessment.diastolic ? `<div class="flex justify-between"><span>Tension:</span><span class="font-bold">${assessment.systolic}/${assessment.diastolic} mmHg</span></div>` : ''}
                </div>

                <!-- Code QR sur Ticket -->
                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-24 h-24 p-1 bg-white rounded border border-slate-300 flex items-center justify-center">
                    ${qrSvg}
                  </div>
                  <span class="text-[9px] text-slate-600 font-mono mt-0.5">SCAN AUTHENTICITÉ</span>
                </div>

                <div class="text-center text-[10px] italic pt-1 border-t border-dashed border-slate-400">
                  "${coach.motto || 'Votre transformation, votre mission !'}"
                </div>
              </div>
            ` : this.currentReceiptType === 'subscription' ? `
              <!-- TICKET 2 : REÇU DE FORFAIT / FACTURETTE -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-base uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  ${coach.phone ? `<div class="text-xs">Tel: ${coach.phone}</div>` : ''}
                </div>

                <div class="text-center font-bold text-sm py-1 border-b border-dashed border-slate-400">
                  REÇU D'ABONNEMENT
                </div>

                <div class="text-xs space-y-1">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Formule:</span><span class="font-bold truncate">${pkg.packageName || 'Forfait'}</span></div>
                  <div class="flex justify-between"><span>Séances:</span><span>${pkg.sessionsUsed || 0} / ${pkg.totalSessions || 10}</span></div>
                </div>

                <div class="border-t border-b border-dashed border-slate-400 py-1 text-xs space-y-1">
                  <div class="flex justify-between font-bold"><span>Tarif Total:</span><span>${Calculations.formatFCFA(pkg.totalAmount || 0)}</span></div>
                  <div class="flex justify-between text-emerald-800"><span>Acompte:</span><span>${Calculations.formatFCFA(pkg.amountPaid || 0)}</span></div>
                  <div class="flex justify-between font-bold"><span>Reste dû:</span><span>${Calculations.formatFCFA(pkg.balanceDue || 0)}</span></div>
                  <div class="flex justify-between font-bold uppercase pt-1"><span>Statut:</span><span>${(pkg.balanceDue || 0) <= 0 ? 'SOLDE REGLÉ' : 'ACOMPTE'}</span></div>
                </div>

                <!-- Code QR sur Ticket -->
                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-24 h-24 p-1 bg-white rounded border border-slate-300 flex items-center justify-center">
                    ${qrSvg}
                  </div>
                  <span class="text-[9px] text-slate-600 font-mono mt-0.5">SCANNER POUR POINTER</span>
                </div>

                <div class="text-center text-[10px] pt-1 border-t border-dashed border-slate-400">
                  Signatures : Coach & Client<br>
                  Merci pour votre confiance !
                </div>
              </div>
            ` : this.currentReceiptType === 'contract' ? `
              <!-- TICKET 4 : ENGAGEMENT & DÉCHARGE -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-sm uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-[10px] uppercase font-bold">Fiche d'Engagement & Décharge</div>
                </div>

                <div class="text-xs space-y-1">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Ref:</span><span>${contract.contractNumber || 'CTR-' + client.id.slice(-6)}</span></div>
                </div>

                <div class="text-[10px] text-justify py-1 border-t border-b border-dashed border-slate-400">
                  Le client certifie être apte à la pratique sportive et décharge le coach de toute responsabilité en cas de problème médical non déclaré.
                </div>

                <div class="flex justify-between text-[10px] font-bold">
                  <span>Coach: ${contract.coachSignature ? 'SIGNE [OK]' : 'EN ATTENTE'}</span>
                  <span>Client: ${contract.clientSignature ? 'SIGNE [OK]' : 'EN ATTENTE'}</span>
                </div>

                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-20 h-20 p-1 bg-white rounded border border-slate-300 flex items-center justify-center">
                    ${qrSvg}
                  </div>
                </div>
              </div>
            ` : this.currentReceiptType === 'accounting' ? `
              <!-- TICKET 5 : COMPTABILITÉ COACH -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-base uppercase">${coach.name || 'COACH PRO'}</div>
                  <div class="text-xs font-bold uppercase">Bilan Comptable du Mois</div>
                  <div class="text-[10px]">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>

                <div class="text-xs space-y-1 py-1 border-b border-dashed border-slate-400">
                  <div class="flex justify-between"><span>Recettes:</span><span class="font-bold text-emerald-800">${Calculations.formatFCFA(summary.totalIncome)}</span></div>
                  <div class="flex justify-between"><span>Dépenses:</span><span class="font-bold text-rose-800">-${Calculations.formatFCFA(summary.totalExpenses)}</span></div>
                  <div class="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                    <span>BÉNÉFICE:</span><span>${Calculations.formatFCFA(summary.netProfit)}</span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-600"><span>Créances:</span><span>${Calculations.formatFCFA(summary.totalReceivables)}</span></div>
                </div>
              </div>
            ` : `
              <!-- TICKET 3 : PROGRAMME D'ENTRAÎNEMENT -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-base uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-xs font-bold uppercase">Programme Sportif</div>
                </div>
                <div class="text-xs space-y-1">
                  <div><strong>Client :</strong> ${client.firstName} ${client.lastName}</div>
                  <div><strong>Objectif :</strong> ${client.mainGoal || 'Transformation'}</div>
                </div>
                <div class="text-[11px] border-t border-b border-dashed border-slate-400 py-1">
                  ${prog.exercises && prog.exercises.length > 0 ? prog.exercises.map((ex, i) => `
                    <div>${i + 1}. ${ex.name} (${ex.sets}x${ex.reps})</div>
                  `).join('') : 'Programme personnalisé défini en séance.'}
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
            <button id="btn-print-browser" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <span>🖨️</span>
              <span>Imprimerie Standard</span>
            </button>
          </div>

          <button id="btn-close-thermal" class="btn btn-outline btn-sm w-full sm:w-auto">Fermer</button>
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

    // Impression Bluetooth
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

        await ThermalPrinter.printViaBluetooth(plainText);
        alert('Ticket envoyé à l\'imprimante thermique avec succès !');
      } catch (err) {
        alert(`Erreur Bluetooth : ${err.message}`);
      }
    });

    // Impression Navigateur / Système
    document.getElementById('btn-print-browser')?.addEventListener('click', () => {
      window.print();
    });
  }
};
