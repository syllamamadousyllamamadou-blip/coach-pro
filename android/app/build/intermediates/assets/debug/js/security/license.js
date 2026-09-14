/**
 * license.js - Système de Protection & Licence d'Utilisation pour COACH PRO
 * Génère un Device ID unique et vérifie les clés de licence avec un algorithme
 * cryptographique autonome pour protéger l'œuvre du créateur.
 */

const LICENSE_KEY_STORAGE = 'coachpro_license_key_v1';
const DEVICE_ID_STORAGE = 'coachpro_device_id_v1';
const SALT = 'COACH_PRO_2026_MASTER_SECRET_KEY';

export const LicenseManager = {
  /**
   * Obtient ou génère l'Identifiant Unique de l'Appareil
   */
  getDeviceId() {
    let devId = localStorage.getItem(DEVICE_ID_STORAGE);
    if (!devId) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      devId = `CP-${segment(4)}-${segment(4)}-${segment(4)}`;
      localStorage.setItem(DEVICE_ID_STORAGE, devId);
    }
    return devId;
  },

  /**
   * Algorithme de dérivation de clé de licence valide à partir d'un Device ID
   */
  generateKeyForDevice(deviceId, type = 'PRO') {
    const cleanId = (deviceId || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let hash = 0;
    const combined = `${cleanId}_${type}_${SALT}`;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    const absHash = Math.abs(hash).toString(36).toUpperCase().padStart(8, 'X');
    const part1 = absHash.slice(0, 4);
    const part2 = absHash.slice(4, 8);
    const checkSum = (cleanId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 99).toString().padStart(2, '0');

    return `KEY-${type}-${part1}-${part2}-${checkSum}`;
  },

  /**
   * Vérifie la validité d'une clé de licence entrée
   */
  verifyKey(inputKey, deviceId = null) {
    if (!inputKey) return false;
    const devId = deviceId || this.getDeviceId();
    const cleanInput = inputKey.trim().toUpperCase();

    // Clés de licence officielles valides
    const expectedPro = this.generateKeyForDevice(devId, 'PRO');
    const expectedMaster = this.generateKeyForDevice(devId, 'MASTER');
    const expectedLifetime = this.generateKeyForDevice(devId, 'LIFETIME');

    // Clé universelle de secours du créateur
    if (cleanInput === 'KEY-COACH-PRO-MASTER-2026-AFRICA') {
      return { valid: true, type: 'Master Creator', key: cleanInput };
    }

    if (cleanInput === expectedPro) {
      return { valid: true, type: 'Licence Pro', key: cleanInput };
    }
    if (cleanInput === expectedMaster) {
      return { valid: true, type: 'Licence Master', key: cleanInput };
    }
    if (cleanInput === expectedLifetime) {
      return { valid: true, type: 'Licence À Vie', key: cleanInput };
    }

    return { valid: false };
  },

  isActivated() {
    const savedKey = localStorage.getItem(LICENSE_KEY_STORAGE);
    if (!savedKey) return false;
    return this.verifyKey(savedKey).valid;
  },

  saveLicenseKey(key) {
    const result = this.verifyKey(key);
    if (result.valid) {
      localStorage.setItem(LICENSE_KEY_STORAGE, key.trim().toUpperCase());
      return true;
    }
    return false;
  },

  getLicenseInfo() {
    const savedKey = localStorage.getItem(LICENSE_KEY_STORAGE);
    const result = this.verifyKey(savedKey);
    return {
      isActivated: result.valid,
      type: result.type || 'Non Activé',
      key: savedKey || 'Aucune',
      deviceId: this.getDeviceId()
    };
  },

  /**
   * Initialise le système et bloque l'interface si l'application n'est pas activée
   */
  init(onSuccess) {
    if (this.isActivated()) {
      if (typeof onSuccess === 'function') onSuccess();
      return;
    }
    this.renderActivationScreen(onSuccess);
  },

  renderActivationScreen(onSuccess) {
    let overlay = document.getElementById('license-activation-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'license-activation-overlay';
      overlay.className = 'fixed inset-0 z-50 bg-[#0b0f19] flex flex-col items-center justify-center p-4';
      document.body.appendChild(overlay);
    }

    const devId = this.getDeviceId();

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 sm:p-8 space-y-6 text-center border-t-4 border-emerald-500 shadow-2xl">
        
        <!-- Badge & Titre -->
        <div class="space-y-2">
          <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-2xl shadow-lg shadow-emerald-500/10">
            🛡️
          </div>
          <h1 class="text-xl font-bold text-white tracking-wide">Activation de COACH PRO</h1>
          <p class="text-xs text-slate-400">Cette application est protégée. Veuillez activer votre licence pour déverrouiller votre espace de travail.</p>
        </div>

        <!-- Identifiant Machine de l'Appareil -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-left space-y-1.5">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Identifiant de votre Appareil (Device ID)</span>
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-sm font-bold text-emerald-400 select-all" id="device-id-display">${devId}</span>
            <button id="btn-copy-device-id" class="btn btn-outline btn-xs flex items-center gap-1">
              <span>📋</span> Copier
            </button>
          </div>
          <p class="text-[10px] text-slate-500">Transmettez cet identifiant à l'administrateur pour obtenir votre clé d'activation.</p>
        </div>

        <!-- Formulaire de Saisie de Clé -->
        <form id="form-license-activation" class="space-y-4 text-left">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="label mb-0">Clé de Licence d'Activation *</label>
              <button type="button" id="btn-use-master-key" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer">
                🔑 Clé Master Créateur
              </button>
            </div>
            <input type="text" id="input-license-key" placeholder="ex: KEY-PRO-XXXX-YYYY-00" class="input text-xs font-mono font-bold tracking-wider uppercase text-white" required />
          </div>

          <div id="license-error-msg" class="text-xs text-rose-400 font-semibold min-h-[1rem]"></div>

          <button type="submit" class="btn btn-primary btn-sm w-full py-2.5 font-bold shadow-lg shadow-emerald-500/20">
            Activer Définitivement
          </button>
        </form>

        <div class="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex flex-col gap-1 items-center justify-center">
          <span>Clé Master Universelle : <strong class="text-slate-400 font-mono">KEY-COACH-PRO-MASTER-2026-AFRICA</strong></span>
        </div>
      </div>
    `;

    // Événements
    const form = overlay.querySelector('#form-license-activation');
    const copyBtn = overlay.querySelector('#btn-copy-device-id');
    const inputKey = overlay.querySelector('#input-license-key');
    const errorMsg = overlay.querySelector('#license-error-msg');
    const masterBtn = overlay.querySelector('#btn-use-master-key');

    masterBtn?.addEventListener('click', () => {
      if (inputKey) {
        inputKey.value = 'KEY-COACH-PRO-MASTER-2026-AFRICA';
        if (errorMsg) errorMsg.textContent = '';
      }
    });

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(devId).then(() => {
        copyBtn.textContent = '✓ Copié !';
        setTimeout(() => { copyBtn.innerHTML = '<span>📋</span> Copier'; }, 2000);
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredKey = inputKey.value.trim();
      if (this.saveLicenseKey(enteredKey)) {
        overlay.classList.add('hidden');
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        errorMsg.textContent = 'Clé de licence invalide pour cet appareil. Vérifiez la saisie.';
      }
    });
  }
};
