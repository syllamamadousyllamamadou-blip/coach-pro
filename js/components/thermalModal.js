/**
 * thermalModal.js - Modal d'Impression Thermique COACH PRO
 * Rendu 100% pur texte avec mention "Client", statut pondéral précis et 0 caractère chinois.
 */

import { ThermalPrinter } from '../printer.js';
import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ThermalModal = {
  currentWidth: '58mm',
  currentReceiptType: 'assessment', // 'assessment', 'subscription', 'program'
  activeClient: null,
  activeAssessment: null,

  open(clientId, customAssessment = null, receiptType = 'assessment') {
    const client = stateManager.getClientById(clientId);
    if (!client) return;

    this.activeClient = client;
    this.currentReceiptType = receiptType;
    this.activeAssessment = customAssessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {
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
    if (!container || !this.activeClient) return;

    const coach = stateManager.getCoachProfile();
    const client = this.activeClient;
    const assessment = this.activeAssessment;
    const pkg = client.package || {};
    const prog = client.program || {};
    const imcInfo = Calculations.calculateIMC(assessment.weight, assessment.height || 175);
    const range = Calculations.calculateHealthyWeightRange(assessment.height || 175, assessment.weight);

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- En-tête & Choix des 3 Types de Reçus -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Impression de Ticket</h3>
            <p class="text-xs text-slate-400">Pour ${client.firstName} ${client.lastName}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-[#0c1220] p-1 rounded-lg border border-slate-800">
              <button id="btn-type-assessment" class="tab-sub-btn ${this.currentReceiptType === 'assessment' ? 'active' : ''}">
                Bilan
              </button>
              <button id="btn-type-subscription" class="tab-sub-btn ${this.currentReceiptType === 'subscription' ? 'active' : ''}">
                Forfait
              </button>
              <button id="btn-type-program" class="tab-sub-btn ${this.currentReceiptType === 'program' ? 'active' : ''}">
                Programme
              </button>
            </div>
            <button id="btn-close-thermal-x" class="btn-icon">✕</button>
          </div>
        </div>

        <!-- Sélecteur de format 58mm / 80mm -->
        <div class="flex items-center justify-center gap-2">
          <span class="text-xs text-slate-400 font-semibold">Format :</span>
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
                  <h4 class="font-bold text-sm uppercase">${coach.name || 'COACH SPORTIF'}</h4>
                  ${coach.phone ? `<p class="text-[10px] text-slate-600">Tel: ${coach.phone}</p>` : ''}
                  ${coach.city ? `<p class="text-[10px] text-slate-600">${coach.city}</p>` : ''}
                  <div class="my-1 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                    BILAN DU CLIENT
                  </div>
                </div>

                <div class="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                  <div class="flex justify-between"><span>Client:</span><strong>${client.firstName} ${client.lastName}</strong></div>
                  ${client.residence ? `<div class="flex justify-between"><span>Habitation:</span><span>${client.residence}</span></div>` : ''}
                  <div class="flex justify-between"><span>Date:</span><span>${assessment.date ? new Date(assessment.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Objectif:</span><span>${client.mainGoal || 'Remise en forme'}</span></div>
                </div>

                <div class="text-[10px] space-y-1 pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-center underline">COMPOSITION CORPORELLE</div>
                  <div class="flex justify-between font-bold bg-slate-100 p-0.5">
                    <span>Poids actuel:</span>
                    <span>${assessment.weight} kg</span>
                  </div>
                  ${assessment.height ? `<div class="flex justify-between"><span>Taille:</span><span>${assessment.height} cm</span></div>` : ''}
                  <div class="flex justify-between font-bold"><span>Statut IMC:</span><span>${imcInfo.imc} (${imcInfo.category})</span></div>
                  <div class="flex justify-between text-slate-700"><span>Poids sante:</span><span>${range.min} a ${range.max} kg</span></div>
                  ${assessment.fatPct ? `<div class="flex justify-between"><span>Masse grasse:</span><span>${assessment.fatPct}% (${assessment.fatKg || '--'}kg)</span></div>` : ''}
                  ${assessment.musclePct ? `<div class="flex justify-between"><span>Masse muscle:</span><span>${assessment.musclePct}% (${assessment.muscleKg || '--'}kg)</span></div>` : ''}
                  ${assessment.waist ? `<div class="flex justify-between"><span>Tour taille:</span><span>${assessment.waist} cm</span></div>` : ''}
                </div>

                <div class="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold text-center underline">METABOLISME & NUTRITION</div>
                  ${assessment.mb ? `<div class="flex justify-between"><span>Metabolisme base:</span><span>${assessment.mb} kcal/j</span></div>` : ''}
                  ${assessment.det ? `<div class="flex justify-between font-bold"><span>Depense totale:</span><span>${assessment.det} kcal/j</span></div>` : ''}
                  ${assessment.targetKcal ? `<div class="flex justify-between font-bold bg-slate-100 p-0.5"><span>Cible calories:</span><span>${assessment.targetKcal} kcal/j</span></div>` : ''}
                  <div class="flex justify-between"><span>Eau requise:</span><span>${(assessment.weight * 0.035).toFixed(1)} L/j</span></div>
                </div>

                <div class="text-center text-[9px] pt-1 italic">
                  "${coach.motto || 'Votre transformation, votre mission !'}"
                </div>
              </div>
            ` : this.currentReceiptType === 'subscription' ? `
              <!-- TICKET 2 : REÇU D'ABONNEMENT EN FCFA -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <h4 class="font-bold text-sm uppercase">${coach.name || 'COACH SPORTIF'}</h4>
                  ${coach.phone ? `<p class="text-[10px] text-slate-600">Tel: ${coach.phone}</p>` : ''}
                  <div class="my-1 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                    RECU D'ABONNEMENT
                  </div>
                </div>

                <div class="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                  <div class="flex justify-between"><span>Client:</span><strong>${client.firstName} ${client.lastName}</strong></div>
                  ${client.profession ? `<div class="flex justify-between"><span>Profession:</span><span>${client.profession}</span></div>` : ''}
                  <div class="flex justify-between"><span>Date debut:</span><span>${pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span></div>
                  ${pkg.expiryDate ? `<div class="flex justify-between font-bold"><span>Echeance:</span><span>${new Date(pkg.expiryDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
                </div>

                <div class="text-[10px] space-y-1 pb-2 border-b border-dashed border-slate-400">
                  <div class="flex justify-between"><span>Formule:</span><strong>${pkg.packageName || 'Forfait Coaching'}</strong></div>
                  ${pkg.packageType === 'duration' ? `
                    <div class="flex justify-between"><span>Duree:</span><span>${pkg.durationMonths || 1} mois</span></div>
                    <div class="flex justify-between"><span>Seances faites:</span><span>${pkg.sessionsUsed || 0} seances</span></div>
                  ` : `
                    <div class="flex justify-between"><span>Total seances:</span><span>${pkg.totalSessions || 0} seances</span></div>
                    <div class="flex justify-between"><span>Effectuees:</span><span>${pkg.sessionsUsed || 0}</span></div>
                    <div class="flex justify-between font-bold"><span>Restantes:</span><span>${Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0))}</span></div>
                  `}
                </div>

                <div class="text-[10px] space-y-1 pb-2 border-b border-dashed border-slate-400">
                  <div class="flex justify-between font-bold"><span>Tarif total:</span><span>${Calculations.formatFCFA(pkg.totalAmount || 0)}</span></div>
                  <div class="flex justify-between text-emerald-800"><span>Acompte verse:</span><span>${Calculations.formatFCFA(pkg.amountPaid || 0)}</span></div>
                  <div class="flex justify-between font-black bg-slate-100 p-0.5"><span>Reste a payer:</span><span>${Calculations.formatFCFA(pkg.balanceDue || 0)}</span></div>
                </div>

                <div class="text-[9px] pt-2 space-y-4">
                  <div class="flex justify-between text-slate-500">
                    <span>Signature Coach</span>
                    <span>Signature Client</span>
                  </div>
                  <div class="text-center font-bold text-[9px] text-slate-700">
                    Merci pour votre confiance !
                  </div>
                </div>
              </div>
            ` : `
              <!-- TICKET 3 : PROGRAMME DU CLIENT -->
              <div class="text-slate-900 leading-tight space-y-2 font-mono">
                <div class="text-center pb-2 border-b border-dashed border-slate-400">
                  <h4 class="font-bold text-sm uppercase">${coach.name || 'COACH SPORTIF'}</h4>
                  ${coach.phone ? `<p class="text-[10px] text-slate-600">Tel: ${coach.phone}</p>` : ''}
                  <div class="my-1 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase">
                    PROGRAMME DU CLIENT
                  </div>
                </div>

                <div class="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                  <div class="flex justify-between"><span>Client:</span><strong>${client.firstName} ${client.lastName}</strong></div>
                  <div class="flex justify-between"><span>Objectif:</span><span>${client.mainGoal || 'Transformation'}</span></div>
                  <div class="flex justify-between"><span>Frequence:</span><span>${prog.frequency || '3 seances / sem'}</span></div>
                </div>

                <div class="text-[10px] space-y-1.5 pb-2 border-b border-dashed border-slate-400">
                  <div class="font-bold underline">EXERCICES PRESCRITS :</div>
                  ${(prog.exercises || []).map((ex, idx) => `
                    <div class="p-1 bg-slate-100 rounded text-[9px]">
                      <div class="font-bold">${idx + 1}. ${ex.name.toUpperCase()}</div>
                      <div class="flex justify-between text-slate-700">
                        <span>${ex.sets} series x ${ex.reps}</span>
                        <span>${ex.weight || ''}</span>
                      </div>
                      ${ex.notes ? `<div class="text-[8px] italic text-slate-600">> ${ex.notes}</div>` : ''}
                    </div>
                  `).join('')}
                </div>

                ${prog.recommendations ? `
                  <div class="text-[10px] pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                    <div class="font-bold underline">CONSIGNES DU COACH :</div>
                    <p class="whitespace-pre-line text-[9px] text-slate-700 italic">${prog.recommendations}</p>
                  </div>
                ` : ''}

                <div class="text-center text-[9px] pt-1 font-bold">
                  "Discipline & Regularite !"
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Actions d'Impression Bluetooth, AirPrint & Partage -->
        <div class="space-y-2 pt-3 border-t border-slate-800">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button id="btn-print-thermal-bt" class="btn btn-primary btn-sm flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm py-2.5">
              <span>📶</span>
              <span>Bluetooth</span>
            </button>

            <button id="btn-print-thermal-airprint" class="btn btn-secondary btn-sm flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2.5">
              <span>📄</span>
              <span>Imprimer (AirPrint)</span>
            </button>

            <button id="btn-share-thermal-wa" class="btn btn-whatsapp btn-sm flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2.5">
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modalBackdrop = document.getElementById('thermal-print-modal');
    const closeBtnX = document.getElementById('btn-close-thermal-x');
    const btnAssessment = document.getElementById('btn-type-assessment');
    const btnSubscription = document.getElementById('btn-type-subscription');
    const btnProgram = document.getElementById('btn-type-program');
    const btn58 = document.getElementById('btn-toggle-58mm');
    const btn80 = document.getElementById('btn-toggle-80mm');
    const btnPrintBt = document.getElementById('btn-print-thermal-bt');
    const btnAirPrint = document.getElementById('btn-print-thermal-airprint');
    const btnWa = document.getElementById('btn-share-thermal-wa');

    const hide = () => this.close();
    closeBtnX?.addEventListener('click', hide);
    modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) hide();
    });

    btnAssessment?.addEventListener('click', () => {
      this.currentReceiptType = 'assessment';
      this.renderModal();
      this.bindEvents();
    });

    btnSubscription?.addEventListener('click', () => {
      this.currentReceiptType = 'subscription';
      this.renderModal();
      this.bindEvents();
    });

    btnProgram?.addEventListener('click', () => {
      this.currentReceiptType = 'program';
      this.renderModal();
      this.bindEvents();
    });

    btn58?.addEventListener('click', () => {
      this.currentWidth = '58mm';
      this.renderModal();
      this.bindEvents();
    });

    btn80?.addEventListener('click', () => {
      this.currentWidth = '80mm';
      this.renderModal();
      this.bindEvents();
    });

    const getTicketText = () => {
      const coach = stateManager.getCoachProfile();
      if (this.currentReceiptType === 'assessment') {
        return ThermalPrinter.generateAssessmentReceipt(this.activeClient, this.activeAssessment, coach, this.currentWidth);
      } else if (this.currentReceiptType === 'subscription') {
        return ThermalPrinter.generateSubscriptionReceipt(this.activeClient, coach, this.currentWidth);
      } else {
        return ThermalPrinter.generateProgramReceipt(this.activeClient, coach, this.currentWidth);
      }
    };

    btnPrintBt?.addEventListener('click', async () => {
      const plainText = getTicketText();

      if (ThermalPrinter.isBluetoothSupported()) {
        try {
          window.App.showToast('Connexion à l\'imprimante Bluetooth...', 'info');
          const res = await ThermalPrinter.printViaBluetooth(plainText);
          if (res.success) {
            window.App.showToast('Ticket imprimé avec succès !', 'success');
            return;
          }
        } catch (err) {
          console.warn('Bluetooth direct terminé:', err);
          if (/Android/i.test(navigator.userAgent)) {
            window.App.showToast('Envoi vers l\'imprimante Bluetooth Android...', 'info');
            ThermalPrinter.printViaAndroidBluetooth(plainText);
            return;
          }
          window.App.showToast(err.message || 'Erreur Bluetooth', 'error');
        }
      } else {
        // Sur iPhone Safari
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.App.showToast('Sur iPhone : ouvrez le site dans l\'app gratuite Bluefy pour le Bluetooth direct, ou utilisez le bouton Imprimer (AirPrint).', 'info');
        } else if (/Android/i.test(navigator.userAgent)) {
          window.App.showToast('Envoi vers l\'imprimante Bluetooth...', 'info');
          ThermalPrinter.printViaAndroidBluetooth(plainText);
        } else {
          window.App.showToast('Bluetooth non disponible sur ce navigateur.', 'error');
        }
      }
    });

    btnAirPrint?.addEventListener('click', () => {
      window.print();
    });

    btnWa?.addEventListener('click', () => {
      const coach = stateManager.getCoachProfile();
      const url = ThermalPrinter.generateWhatsAppLink(this.activeClient, this.activeAssessment, coach);
      window.open(url, '_blank');
    });
  }
};
