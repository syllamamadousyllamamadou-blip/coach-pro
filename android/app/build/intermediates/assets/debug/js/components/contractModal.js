/**
 * contractModal.js - Fiche d'Engagement, Décharge de Responsabilité & Double Signature
 * Protège juridiquement le coach sportif privé en cas d'accident ou de problème de santé.
 * Comprend un double pad tactile de signature électronique (Client & Coach),
 * l'enregistrement horodaté et l'impression en format A4 et ticket thermique.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ContractModal = {
  activeClientId: null,
  clientPad: null,
  coachPad: null,

  open(clientId) {
    this.activeClientId = clientId;
    const client = stateManager.getClientById(clientId);
    const coach = stateManager.getCoachProfile();

    if (!client) return;

    let modal = document.getElementById('contract-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'contract-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-3 sm:p-5 z-50';
      document.body.appendChild(modal);
    }

    const contract = client.contract || {};
    const hasExistingSignatures = !!(contract.clientSignature && contract.coachSignature);
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const contractNum = contract.contractNumber || `CTR-${client.id.replace('client_', '')}`;

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-3xl w-full p-5 sm:p-7 space-y-6 border-t-4 border-emerald-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <!-- Header Contrat -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge badge-emerald text-xs">Protection Juridique</span>
              <span class="text-xs text-slate-400 font-mono">N° ${contractNum}</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">Fiche d'Engagement & Décharge de Responsabilité</h2>
          </div>
          <button id="btn-close-contract-modal" class="text-slate-400 hover:text-white text-lg p-1">✕</button>
        </div>

        <!-- Informations Parties -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
          <div>
            <span class="font-bold text-emerald-400 block uppercase mb-1">Le Coach Sportif</span>
            <p><strong>Nom :</strong> ${coach.name || 'COACH PRIVÉ'}</p>
            <p><strong>Structure :</strong> ${coach.brand || 'Coach Pro'}</p>
            <p><strong>Contact :</strong> ${coach.phone || 'Non renseigné'}</p>
          </div>
          <div>
            <span class="font-bold text-emerald-400 block uppercase mb-1">L'Athlète / Le Client</span>
            <p><strong>Nom :</strong> ${client.firstName} ${client.lastName}</p>
            <p><strong>Habitation :</strong> ${client.residence || 'Non renseignée'}</p>
            <p><strong>Téléphone :</strong> ${client.phone || 'Non renseigné'}</p>
          </div>
        </div>

        <!-- Clauses Juridiques Protectrices -->
        <div class="space-y-3 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 max-h-52 overflow-y-auto">
          <h4 class="font-bold text-white uppercase text-[11px] tracking-wider text-emerald-400">Clauses & Conditions Générales de Sécurité :</h4>
          
          <p><strong>1. Aptitude Physique & Santé :</strong> Le client certifie sur l'honneur avoir consulté un médecin ou être en pleine capacité physique pour pratiquer des activités physiques et sportives. Il s'engage à signaler immédiatement toute douleur, malaise, pathologie ou prescription médicale nouvelle au coach avant le début de chaque séance.</p>
          
          <p><strong>2. Décharge de Responsabilité :</strong> Le client décharge expressément le coach de toute responsabilité civile ou pénale en cas de malaise, accident musculaire, problème cardiovasculaire ou blessure survenant lors ou consécutivement aux séances, notamment en cas de dissimulation d'antécédents médicaux ou de non-respect des consignes de sécurité édictées par le coach.</p>

          <p><strong>3. Assiduité & Politique d'Annulation :</strong> Toute séance annulée ou reportée par le client moins de 24 heures avant l'horaire fixé sera considérée comme due et décomptée du forfait actif.</p>

          <p><strong>4. Forfaits & Règlements :</strong> Les forfaits et packs de séances souscrits sont strictement personnels, valables pour la durée convenue, et ne font l'objet d'aucun remboursement après démarrage du programme.</p>
        </div>

        <!-- Double Zone de Signature Tactile -->
        <div class="space-y-4 pt-2">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider">Signatures Électroniques Manuscrites :</h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Signature Client -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200">Signature du Client *</span>
                <button type="button" id="btn-clear-client-pad" class="text-[11px] text-slate-400 hover:text-rose-400">Effacer</button>
              </div>
              <div class="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-slate-900 h-32 relative">
                <canvas id="client-signature-pad" class="w-full h-full cursor-crosshair touch-none"></canvas>
                ${contract.clientSignature ? `
                  <img id="client-saved-img" src="${contract.clientSignature}" class="absolute inset-0 w-full h-full object-contain pointer-events-none p-2" />
                ` : ''}
              </div>
              <span class="text-[10px] text-slate-500 block">Signez au doigt ou au stylet dans le cadre.</span>
            </div>

            <!-- Signature Coach -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200">Signature du Coach *</span>
                <button type="button" id="btn-clear-coach-pad" class="text-[11px] text-slate-400 hover:text-rose-400">Effacer</button>
              </div>
              <div class="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-slate-900 h-32 relative">
                <canvas id="coach-signature-pad" class="w-full h-full cursor-crosshair touch-none"></canvas>
                ${contract.coachSignature ? `
                  <img id="coach-saved-img" src="${contract.coachSignature}" class="absolute inset-0 w-full h-full object-contain pointer-events-none p-2" />
                ` : ''}
              </div>
              <span class="text-[10px] text-slate-500 block">Signez au doigt ou au stylet dans le cadre.</span>
            </div>
          </div>
        </div>

        <!-- Boutons d'Action -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div class="flex items-center gap-2">
            <button id="btn-print-contract-a4" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <span>🖨️</span>
              <span>Imprimer Contrat (A4 / PDF)</span>
            </button>
            <button id="btn-print-contract-thermal" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <span>🧾</span>
              <span>Ticket Thermique</span>
            </button>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button type="button" id="btn-cancel-contract" class="btn btn-secondary btn-sm">Fermer</button>
            <button type="button" id="btn-save-contract" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
              Enregistrer l'Engagement
            </button>
          </div>
        </div>
      </div>
    `;

    this.initSignaturePads(modal, client);
    this.bindEvents(modal, client, coach);
  },

  initSignaturePads(modal, client) {
    const setupCanvas = (canvasId, savedImgId) => {
      const canvas = modal.querySelector(canvasId);
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2 || 600;
      canvas.height = rect.height * 2 || 260;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#10b981';

      let isDrawing = false;
      let hasDrawn = false;

      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - r.left,
          y: clientY - r.top
        };
      };

      const start = (e) => {
        isDrawing = true;
        hasDrawn = true;
        const savedImg = modal.querySelector(savedImgId);
        if (savedImg) savedImg.classList.add('hidden');
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const stop = () => { isDrawing = false; };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);

      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
      window.addEventListener('touchend', stop);

      return {
        canvas,
        ctx,
        clear: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const savedImg = modal.querySelector(savedImgId);
          if (savedImg) savedImg.classList.add('hidden');
          hasDrawn = false;
        },
        hasDrawn: () => hasDrawn,
        toDataURL: () => canvas.toDataURL('image/png')
      };
    };

    setTimeout(() => {
      this.clientPad = setupCanvas('#client-signature-pad', '#client-saved-img');
      this.coachPad = setupCanvas('#coach-signature-pad', '#coach-saved-img');
    }, 50);
  },

  bindEvents(modal, client, coach) {
    modal.querySelector('#btn-close-contract-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    modal.querySelector('#btn-cancel-contract')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.querySelector('#btn-clear-client-pad')?.addEventListener('click', () => {
      this.clientPad?.clear();
    });
    modal.querySelector('#btn-clear-coach-pad')?.addEventListener('click', () => {
      this.coachPad?.clear();
    });

    // Enregistrer le contrat
    modal.querySelector('#btn-save-contract')?.addEventListener('click', () => {
      const clientSig = this.clientPad?.hasDrawn() ? this.clientPad.toDataURL() : (client.contract?.clientSignature || null);
      const coachSig = this.coachPad?.hasDrawn() ? this.coachPad.toDataURL() : (client.contract?.coachSignature || null);

      if (!clientSig && !coachSig) {
        alert('Veuillez au moins apposer la signature du client ou du coach.');
        return;
      }

      stateManager.saveClientContract(client.id, {
        contractNumber: client.contract?.contractNumber || `CTR-${Date.now().toString().slice(-6)}`,
        signedAt: new Date().toISOString(),
        clientSignature: clientSig,
        coachSignature: coachSig
      });

      alert('Fiche d\'engagement et décharge de responsabilité enregistrées avec succès !');
      modal.classList.add('hidden');
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    // Impression A4 / PDF
    modal.querySelector('#btn-print-contract-a4')?.addEventListener('click', () => {
      this.printContractA4(client, coach);
    });

    // Impression Thermique
    modal.querySelector('#btn-print-contract-thermal')?.addEventListener('click', () => {
      if (window.ThermalModal) {
        window.ThermalModal.open(client, 'contract');
      } else {
        alert('Module d\'impression thermique prêt.');
      }
    });
  },

  printContractA4(client, coach) {
    const contract = client.contract || {};
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const contractNum = contract.contractNumber || `CTR-${client.id.replace('client_', '')}`;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Veuillez autoriser les fenêtres pop-up pour imprimer.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrat d'Engagement — ${client.firstName} ${client.lastName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 13px; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
          .meta-box { display: flex; gap: 20px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
          .meta-col { flex: 1; }
          .clause-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 20px; background: #ffffff; }
          .clause-title { font-weight: bold; margin-bottom: 6px; text-transform: uppercase; font-size: 12px; color: #0f172a; }
          .signatures { display: flex; justify-content: space-between; gap: 30px; margin-top: 30px; }
          .sig-col { flex: 1; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px; height: 120px; position: relative; }
          .sig-img { max-height: 80px; max-width: 100%; object-fit: contain; margin-top: 10px; }
          .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${coach.brand || 'COACH PRO'}</div>
            <div>${coach.name || 'Coach Sportif Privé'} • ${coach.phone || ''}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>CONTRAT D'ENGAGEMENT</strong></div>
            <div>N° ${contractNum} • Date : ${dateStr}</div>
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-col">
            <strong>LE COACH SPORTIF :</strong><br>
            Nom : ${coach.name || 'Coach Privé'}<br>
            Ville : ${coach.city || 'Abidjan'}<br>
            Téléphone : ${coach.phone || '--'}
          </div>
          <div class="meta-col">
            <strong>L'ATHLÈTE / LE CLIENT :</strong><br>
            Nom complet : ${client.firstName} ${client.lastName}<br>
            Habitation : ${client.residence || '--'}<br>
            Téléphone : ${client.phone || '--'}
          </div>
        </div>

        <div class="clause-box">
          <div class="clause-title">Clauses & Conditions de Pratique Sportive et Décharge :</div>
          <p><strong>1. Aptitude Médicale :</strong> Le client atteste être en condition physique satisfaisante pour la pratique sportive encadrée et n'avoir aucune contre-indication médicale connue. Le client s'engage à informer le coach de tout symptôme ou malaise.</p>
          <p><strong>2. Décharge de Responsabilité :</strong> Le client pratique sous sa propre responsabilité et décharge le coach de toute poursuite en cas d'accident ou de malaise lié à une condition médicale non signalée ou au non-respect des instructions.</p>
          <p><strong>3. Assiduité & Règles de Séance :</strong> Toute annulation doit intervenir au moins 24 heures à l'avance, faute de quoi la séance est comptabilisée.</p>
          <p><strong>4. Validité :</strong> Le présent engagement formalise l'accord mutuel entre le client et son coach sportif pour l'ensemble du cycle de suivi.</p>
        </div>

        <div class="signatures">
          <div class="sig-col">
            <strong>Signature du Coach :</strong><br>
            ${contract.coachSignature ? `<img src="${contract.coachSignature}" class="sig-img" />` : '<div style="margin-top:30px;color:#94a3b8;">[Signé électroniquement]</div>'}
          </div>
          <div class="sig-col">
            <strong>Signature du Client (Lu et approuvé) :</strong><br>
            ${contract.clientSignature ? `<img src="${contract.clientSignature}" class="sig-img" />` : '<div style="margin-top:30px;color:#94a3b8;">[Signé électroniquement]</div>'}
          </div>
        </div>

        <div class="footer">
          Document généré électroniquement par l'application COACH PRO • Fait foi d'accord entre les parties.
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};
