/**
 * qrScanner.js - Lecteur & Scanner Universel de Code QR Haute Performance pour COACH PRO
 * - Détection Vidéo Directe Temps Réel avec jsQR + Rehaussement de contraste pour tickets thermiques
 * - Capture Photo Directe Native (Fallback infaillible pour tous téléphones et tablettes)
 * - Décodage instantané des reçus, des fiches clients et pointage automatique des séances
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
      <div class="glass-card max-w-md w-full p-5 space-y-4 border-t-4 border-emerald-500 shadow-2xl relative animate-fade-in">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-lg shadow-emerald-500/10">
              🔲
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Scanner un Reçu / Athlète</h3>
              <p class="text-[11px] text-slate-400">Pointez la caméra vers le QR Code du ticket</p>
            </div>
          </div>
          <button id="btn-close-qr-scanner" class="text-slate-400 hover:text-white text-lg p-1 font-bold">✕</button>
        </div>

        <!-- Zone Vidéo Caméra avec Viseur Haute Précision -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
          <video id="qr-video-feed" playsinline autoplay muted class="w-full h-full object-cover"></video>
          
          <!-- Viseur Visuel -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-3/4 h-3/4 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
              <!-- Coins renforcés du viseur -->
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
            Démarrage de la caméra...
          </div>
        </div>

        <!-- Boutons d'Action Rapide : Photo Directe & Manuel -->
        <div class="grid grid-cols-2 gap-2">
          <label class="btn btn-secondary btn-sm flex items-center justify-center gap-1.5 font-bold cursor-pointer">
            <span>📷</span>
            <span>Prendre Photo</span>
            <input type="file" id="input-qr-file-capture" accept="image/*" capture="environment" class="hidden" />
          </label>
          <button type="button" id="btn-switch-camera" class="btn btn-outline btn-sm flex items-center justify-center gap-1.5 font-bold">
            <span>🔄</span>
            <span>Changer Caméra</span>
          </button>
        </div>

        <!-- Recherche Manuelle de Secours -->
        <div class="pt-2 border-t border-slate-800 space-y-1.5">
          <span class="text-[11px] text-slate-400 block font-semibold">Recherche par Nom, Tél ou Code Reçu (ex: CP-123456) :</span>
          <div class="flex gap-2">
            <input type="text" id="manual-qr-input" placeholder="ex: Mamadou ou 849201" class="input text-xs font-mono flex-1" />
            <button id="btn-manual-qr-search" class="btn btn-primary btn-sm shrink-0 font-bold">Valider</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(modal);
    this.startCamera(modal);
  },

  currentFacingMode: 'environment',

  async startCamera(modal) {
    const video = modal.querySelector('#qr-video-feed');
    const status = modal.querySelector('#qr-camera-status');

    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.innerHTML = `<span class="text-amber-400">Caméra vidéo directe non supportée. Utilisez le bouton "Prendre Photo" ci-dessous.</span>`;
      return;
    }

    // Stratégie de connexion multi-niveaux pour compatibilité 100% Android
    const constraintLevels = [
      { video: { facingMode: { ideal: this.currentFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: this.currentFacingMode } },
      { video: { facingMode: 'environment' } },
      { video: true }
    ];

    let stream = null;
    for (const constraints of constraintLevels) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        // Essayer le niveau suivant
      }
    }

    if (stream && video) {
      this.videoStream = stream;
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.srcObject = stream;
      try {
        await video.play();
      } catch (e) {}
      if (status) status.textContent = 'Pointez le QR code du ticket dans le cadre vert.';
      this.startDetection(video, modal);
    } else {
      if (status) {
        status.innerHTML = `<span class="text-amber-400">Accès caméra restreint. Cliquez sur <strong>"📷 Prendre Photo"</strong> pour scanner le reçu.</span>`;
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
        if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w > 0 && h > 0) {
            canvas.width = Math.min(w, 640);
            canvas.height = Math.min(h, 480);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 1. Décodage standard jsQR
            if (typeof window.jsQR === 'function') {
              let code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });

              if (code && code.data) {
                this.handleDecodedCode(code.data, modal);
                return;
              }

              // 2. Détection avec rehaussement de contraste pour tickets thermiques
              const binarized = this.binarizeImageData(imageData);
              code = window.jsQR(binarized.data, binarized.width, binarized.height, {
                inversionAttempts: 'dontInvert'
              });

              if (code && code.data) {
                this.handleDecodedCode(code.data, modal);
                return;
              }
            }

            // 3. Détection native BarcodeDetector si supportée
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
      } catch (e) {}
    }, 90);
  },

  /**
   * Binarisation / Rehaussement de contraste pour lire les tickets thermiques
   */
  binarizeImageData(imageData) {
    const d = new Uint8ClampedArray(imageData.data);
    const len = d.length;
    for (let i = 0; i < len; i += 4) {
      const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      const val = gray < 128 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    return new ImageData(d, imageData.width, imageData.height);
  },

  /**
   * Décode un fichier image sélectionné ou pris en photo
   */
  decodeImageFile(file, modal) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = Math.min(img.width, 1200);
        canvas.height = Math.min(img.height, 1200);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = null;

        if (typeof window.jsQR === 'function') {
          code = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (!code) {
            const binarized = this.binarizeImageData(imgData);
            code = window.jsQR(binarized.data, binarized.width, binarized.height, {
              inversionAttempts: 'dontInvert'
            });
          }
        }

        if (code && code.data) {
          this.handleDecodedCode(code.data, modal);
        } else {
          alert('Aucun QR code détecté sur cette photo. Assurez-vous que le code est bien visible et éclairé.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  findClientByCode(codeText) {
    if (!codeText) return null;
    const clean = codeText.trim().toLowerCase();
    const clients = stateManager.getClients();

    // 1. Recherche par identifiant direct (ex: client_1712345678)
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
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
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
      this.showScanResultModal(client, receiptInfo);
    } else {
      alert(`Code scanné : "${codeText}"\nAucun athlète correspondant trouvé dans vos données.`);
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
      <div class="glass-card max-w-md w-full p-6 space-y-5 border-t-4 border-emerald-500 shadow-2xl animate-fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-2xl">✅</span>
            <div>
              <h3 class="text-base font-bold text-white">Athlète Reconnu</h3>
              <p class="text-[11px] text-emerald-400 font-mono font-bold">CP-${client.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button id="btn-close-scan-result" class="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
        </div>

        <div class="bg-slate-900/90 p-4 rounded-xl space-y-2 border border-slate-800">
          <h2 class="text-lg font-black text-emerald-400">${client.firstName} ${client.lastName}</h2>
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
      window.App?.showToast?.(`Séance validée ! Reste ${Math.max(0, remaining - 1)} séance(s).`, 'success');
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

    // Changer de caméra
    const switchBtn = modal.querySelector('#btn-switch-camera');
    switchBtn?.addEventListener('click', () => {
      this.currentFacingMode = (this.currentFacingMode === 'environment') ? 'user' : 'environment';
      this.startCamera(modal);
    });

    // Capture photo de reçu
    const fileCapture = modal.querySelector('#input-qr-file-capture');
    fileCapture?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.decodeImageFile(file, modal);
      }
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
