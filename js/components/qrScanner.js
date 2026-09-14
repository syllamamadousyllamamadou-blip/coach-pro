/**
 * qrScanner.js - Lecteur & Scanner Universel de Code QR par Caméra pour COACH PRO
 * Décodage 100% autonome et infaillible via Canvas + jsQR intégré.
 * Fonctionne parfaitement sur TOUTES les versions d'Android, tablettes et navigateurs.
 */

import { stateManager } from '../state.js';
import '../lib/jsqr.js';

export const QRScannerComponent = {
  videoStream: null,
  scanInterval: null,
  scanCanvas: null,

  openModal() {
    let modal = document.getElementById('qr-scanner-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'qr-scanner-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-4 z-50';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-5 space-y-4 border-t-4 border-emerald-500 shadow-2xl relative">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              🔲
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Scanner un Reçu / Athlète</h3>
              <p class="text-[11px] text-slate-400">Pointez la caméra vers le QR Code du ticket ou du client</p>
            </div>
          </div>
          <button id="btn-close-qr-scanner" class="text-slate-400 hover:text-white text-lg p-1 font-bold">✕</button>
        </div>

        <!-- Zone Vidéo Caméra avec Viseur & Détection Temps Réel -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
          <video id="qr-video-feed" playsinline autoplay muted class="w-full h-full object-cover"></video>
          
          <!-- Viseur Visuel -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-3/4 h-3/4 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
              <!-- Coins du viseur -->
              <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
              <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
              <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
              
              <!-- Ligne Laser Animée -->
              <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-laser shadow-[0_0_12px_#10b981]"></div>
            </div>
          </div>

          <!-- Message Statut Caméra -->
          <div id="qr-camera-status" class="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md rounded-xl p-2 text-center text-xs text-slate-200 border border-slate-800 font-medium">
            Initialisation de la caméra...
          </div>
        </div>

        <!-- Recherche Manuelle de Secours -->
        <div class="pt-2 border-t border-slate-800 space-y-2">
          <span class="text-[11px] text-slate-400 block font-semibold">Ou saisie manuelle de l'identifiant du reçu / client :</span>
          <div class="flex gap-2">
            <input type="text" id="manual-qr-input" placeholder="ex: client_1710000000 ou Nom" class="input text-xs font-mono" />
            <button id="btn-manual-qr-search" class="btn btn-secondary btn-sm shrink-0 font-bold">Rechercher</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(modal);
    this.startCamera(modal);
  },

  async startCamera(modal) {
    const video = modal.querySelector('#qr-video-feed');
    const status = modal.querySelector('#qr-camera-status');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (status) status.innerHTML = `<span class="text-slate-400">Caméra désactivée. Utilisez la saisie manuelle ci-dessous.</span>`;
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.videoStream = stream;
      if (video) {
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.srcObject = stream;
        try {
          await video.play();
        } catch (playErr) {
          console.log('Lecture vidéo démarrée:', playErr);
        }
        if (status) status.textContent = 'Pointez le code QR du reçu ou du client dans le viseur.';
        this.startDetection(video, modal);
      }
    } catch (err) {
      console.log('Info caméra scanner:', err.message);
      if (status) {
        status.innerHTML = `<span class="text-slate-300">Caméra non connectée. Entrez l'identifiant ci-dessous.</span>`;
      }
    }
  },

  startDetection(video, modal) {
    if (!this.scanCanvas) {
      this.scanCanvas = document.createElement('canvas');
    }
    const canvas = this.scanCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    this.scanInterval = setInterval(() => {
      try {
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w > 0 && h > 0) {
            // Échantillonnage optimisé
            canvas.width = Math.min(w, 640);
            canvas.height = Math.min(h, 480);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 1. Décodage ultra-rapide avec jsQR (Supporte contrastes direct et inversé)
            if (typeof window.jsQR === 'function') {
              const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });
              if (code && code.data) {
                this.handleDecodedCode(code.data, modal);
                return;
              }
            }

            // 2. Détection alternative native si dispo
            if ('BarcodeDetector' in window) {
              const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
              detector.detect(canvas).then(barcodes => {
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  this.handleDecodedCode(barcodes[0].rawValue, modal);
                }
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        // En cas d'erreur de lecture d'une frame, continuer
      }
    }, 120);
  },

  findClientByCode(codeText) {
    if (!codeText) return null;
    const clean = codeText.trim().toLowerCase();
    const clients = stateManager.getClients();

    // 1. Recherche par identifiant direct
    let match = clients.find(c => c.id.toLowerCase() === clean);
    if (match) return match;

    // 2. Recherche par numéro de reçu court (ex: CP-849201 ou 849201)
    match = clients.find(c => {
      const code = `cp-${c.id.slice(-6)}`.toLowerCase();
      const numOnly = c.id.slice(-6).toLowerCase();
      return clean.includes(code) || clean.includes(numOnly) || code.includes(clean);
    });
    if (match) return match;

    // 3. Recherche par nom complet ou téléphone
    match = clients.find(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return fullName.includes(clean) || (c.phone && c.phone.includes(clean));
    });
    return match;
  },

  handleDecodedCode(codeText, modal) {
    if (!codeText) return;
    this.stopCamera();
    modal.classList.add('hidden');

    if (window.CoachProNative && typeof window.CoachProNative.vibrate === 'function') {
      window.CoachProNative.vibrate(80);
    }

    let clientId = null;
    let receiptInfo = null;

    try {
      if (codeText.startsWith('{')) {
        const parsed = JSON.parse(codeText);
        clientId = parsed.clientId || parsed.id;
        receiptInfo = parsed;
      } else if (codeText.startsWith('client_') || codeText.includes('client_')) {
        const match = codeText.match(/client_\d+/);
        clientId = match ? match[0] : codeText.trim();
      } else {
        clientId = codeText.trim();
      }
    } catch (e) {
      clientId = codeText.trim();
    }

    const client = this.findClientByCode(clientId) || this.findClientByCode(codeText);

    if (client) {
      window.App.openClientDetail(client.id, 'attendance');
      const clientCode = `CP-${client.id.slice(-6).toUpperCase()}`;
      window.App.showToast(`Athlète identifié : ${client.firstName} ${client.lastName} (${clientCode})`, 'success');
    } else {
      alert(`Code QR scanné : "${codeText}"\nAucun athlète correspondant trouvé.`);
    }
  },

  showScanResultModal(client, receiptInfo) {
    let resultModal = document.getElementById('qr-result-modal');
    if (!resultModal) {
      resultModal = document.createElement('div');
      resultModal.id = 'qr-result-modal';
      resultModal.className = 'modal-backdrop flex items-center justify-center p-4 z-50';
      document.body.appendChild(resultModal);
    }

    const pkg = client.package || {};
    const remaining = Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0));

    resultModal.classList.remove('hidden');
    resultModal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 space-y-5 border-t-4 border-emerald-500 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">✅</span>
            <h3 class="text-base font-bold text-white">Athlète Reconnu</h3>
          </div>
          <button id="btn-close-scan-result" class="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
        </div>

        <div class="bg-slate-900/90 p-4 rounded-xl space-y-2 border border-slate-800">
          <h2 class="text-lg font-bold text-emerald-400">${client.firstName} ${client.lastName}</h2>
          <div class="text-xs text-slate-300 space-y-1.5">
            <p><strong>Objectifs :</strong> ${Array.isArray(client.goals) ? client.goals.join(', ') : (client.mainGoal || 'Transformation')}</p>
            <p><strong>Formule :</strong> ${pkg.packageName || 'Forfait'}</p>
            <p><strong>Séances :</strong> <span class="font-bold text-emerald-400">${pkg.sessionsUsed || 0} effectuées / ${remaining} restantes</span></p>
            <p><strong>Solde dû :</strong> <span class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}">${pkg.balanceDue || 0} FCFA ${(pkg.balanceDue || 0) <= 0 ? '(SOLDE RÉGLÉ ✓)' : ''}</span></p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button id="btn-scan-log-attendance" class="btn btn-primary btn-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20">
            <span>✓</span>
            <span>Pointer Séance (-1)</span>
          </button>
          <button id="btn-scan-open-profile" class="btn btn-secondary btn-sm font-bold flex items-center justify-center gap-1.5">
            <span>👤</span>
            <span>Ouvrir Fiche</span>
          </button>
        </div>
      </div>
    `;

    resultModal.querySelector('#btn-close-scan-result')?.addEventListener('click', () => {
      resultModal.classList.add('hidden');
    });

    resultModal.querySelector('#btn-scan-log-attendance')?.addEventListener('click', () => {
      stateManager.logSessionAttendance(client.id, { notes: 'Séance pointée via Scan QR Code' });
      alert(`Séance validée avec succès pour ${client.firstName} ! Il reste ${Math.max(0, remaining - 1)} séance(s).`);
      resultModal.classList.add('hidden');
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    resultModal.querySelector('#btn-scan-open-profile')?.addEventListener('click', () => {
      resultModal.classList.add('hidden');
      if (window.App) {
        window.App.openClientDetail(client.id);
      }
    });
  },

  stopCamera() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  },

  bindEvents(modal) {
    const closeBtn = modal.querySelector('#btn-close-qr-scanner');
    closeBtn?.addEventListener('click', () => {
      this.stopCamera();
      modal.classList.add('hidden');
    });

    // Recherche manuelle
    const searchBtn = modal.querySelector('#btn-manual-qr-search');
    const manualInput = modal.querySelector('#manual-qr-input');
    const doSearch = () => {
      const val = manualInput?.value.trim();
      if (val) {
        this.handleDecodedCode(val, modal);
      }
    };

    searchBtn?.addEventListener('click', doSearch);
    manualInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }
};
