/**
 * license.js - Système de Protection & Licence Cryptographique pour COACH PRO
 * - Formules supportées : Essai 5 Jours (TRIAL), 1 Mois / 30 Jours (M1), 1 An (Y1), À Vie (LIFE)
 * - Empreinte matérielle unique (Device ID) non transférable
 * - Signature cryptographique SHA-256 avec sel secret maître
 * - Protection anti-fraude d'horloge (Anti-Time Rollback)
 * - Écran d'activation moderne avec lien WhatsApp direct & validation temps réel
 */

const LICENSE_KEY_STORAGE = 'coachpro_license_key_v2';
const DEVICE_ID_STORAGE = 'coachpro_device_id_v2';
const TRIAL_STORAGE = 'coachpro_trial_info_v2';
const LAST_ACTIVE_TS_STORAGE = 'coachpro_last_active_ts';
const MASTER_SALT = 'COACH_PRO_2026_MASTER_SECRET_KEY_PRO_EDITION_SECURE_AFRICA';

/**
 * Implémentation SHA-256 pure JavaScript autonome (sans dépendance externe)
 */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0bef9a3f, 0xc67178f2
  ];

  let compositeBitLength = asciiBitLength;
  words[compositeBitLength >> 5] |= 0x80 << (24 - compositeBitLength % 32);
  words[(((compositeBitLength + 64) >> 9) << 4) + 15] = compositeBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15], w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? (w[i] || 0) : ((w[i - 16] + s0 + w[i - 7] + s1) | 0);

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const sA = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const sE = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const temp1 = (hash[7] + sE + ch + k[i] + w[i]) | 0;
      const temp2 = (sA + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export const LicenseManager = {
  /**
   * Obtient ou génère l'Identifiant Unique de l'Appareil (Device ID)
   */
  getDeviceId() {
    let devId = localStorage.getItem(DEVICE_ID_STORAGE);
    if (!devId) {
      // Tenter de récupérer l'ancien Device ID s'il existe
      devId = localStorage.getItem('coachpro_device_id_v1');
      if (!devId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        devId = `CP-${segment(4)}-${segment(4)}-${segment(4)}`;
      }
      localStorage.setItem(DEVICE_ID_STORAGE, devId);
    }
    return devId;
  },

  /**
   * Nettoie le Device ID pour calculs cryptographiques
   */
  getCleanDeviceId(deviceId = null) {
    const raw = deviceId || this.getDeviceId();
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  },

  /**
   * Calcule le hash court du Device ID (4 caractères)
   */
  getDeviceShortHash(cleanDeviceId) {
    const h = sha256(`DEV_${cleanDeviceId}_${MASTER_SALT}`);
    return h.slice(0, 4).toUpperCase();
  },

  /**
   * Générateur Officiel de Clé de Licence pour un Appareil & Formule
   * Types : 'TRIAL' (5j), 'M1' (30j), 'Y1' (365j), 'LIFE' (À vie), 'CUSTOM'
   */
  generateKey(deviceId, type = 'Y1', customDays = null) {
    const cleanDevId = this.getCleanDeviceId(deviceId);
    const devHash = this.getDeviceShortHash(cleanDevId);
    let expBase36 = 'LIFETIME';
    let expTimestamp = 0;

    const now = Date.now();
    if (type === 'TRIAL') {
      expTimestamp = now + (5 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'M1') {
      expTimestamp = now + (30 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'Y1') {
      expTimestamp = now + (365 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'CUSTOM' && customDays) {
      expTimestamp = now + (parseInt(customDays, 10) * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'LIFE' || type === 'MASTER') {
      expBase36 = 'LIFETIME';
    }

    const payload = `${cleanDevId}|${type}|${expBase36}|${MASTER_SALT}`;
    const sig = sha256(payload).slice(0, 8).toUpperCase();

    return `CP-${type}-${expBase36}-${devHash}-${sig}`;
  },

  /**
   * Vérifie l'intégrité temporelle (protection contre le recul d'horloge)
   */
  verifyTimeIntegrity() {
    const now = Date.now();
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_TS_STORAGE);
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      // Si l'heure de l'appareil a été reculée de plus de 2 heures
      if (now < (lastActive - 7200000)) {
        console.warn('[CoachPro Security] Détection de modification suspecte de l\'horloge locale.');
        return false;
      }
    }
    localStorage.setItem(LAST_ACTIVE_TS_STORAGE, now.toString());
    return true;
  },

  /**
   * Gestion & Vérification de l'Essai Gratuit de 5 Jours Automatique
   */
  getTrialStatus() {
    const cleanDevId = this.getCleanDeviceId();
    let trialRaw = localStorage.getItem(TRIAL_STORAGE);
    const now = Date.now();

    if (!trialRaw) {
      // Initialisation du premier essai gratuit de 5 jours
      const expires = now + (5 * 24 * 60 * 60 * 1000);
      const sigPayload = `${cleanDevId}|${now}|${expires}|TRIAL|${MASTER_SALT}`;
      const sig = sha256(sigPayload);

      const trialData = {
        start: now,
        expires: expires,
        sig: sig
      };
      localStorage.setItem(TRIAL_STORAGE, JSON.stringify(trialData));
      return {
        isActive: true,
        daysRemaining: 5,
        expiresAt: expires
      };
    }

    try {
      const trialData = JSON.parse(trialRaw);
      const expectedSig = sha256(`${cleanDevId}|${trialData.start}|${trialData.expires}|TRIAL|${MASTER_SALT}`);

      if (trialData.sig !== expectedSig) {
        // Tentative de modification de la période d'essai
        return { isActive: false, isTampered: true, daysRemaining: 0 };
      }

      if (!this.verifyTimeIntegrity()) {
        return { isActive: false, isTampered: true, daysRemaining: 0 };
      }

      if (now <= trialData.expires) {
        const msRemaining = trialData.expires - now;
        const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
        return {
          isActive: true,
          daysRemaining: daysRemaining,
          expiresAt: trialData.expires
        };
      } else {
        return {
          isActive: false,
          isExpired: true,
          daysRemaining: 0,
          expiresAt: trialData.expires
        };
      }
    } catch (e) {
      return { isActive: false, daysRemaining: 0 };
    }
  },

  /**
   * Vérifie la validité d'une clé de licence entrée
   */
  verifyKey(inputKey, deviceId = null) {
    if (!inputKey || typeof inputKey !== 'string') return { valid: false, reason: 'Clé absente' };
    const cleanInput = inputKey.trim().toUpperCase();
    const cleanDevId = this.getCleanDeviceId(deviceId);
    const expectedDevHash = this.getDeviceShortHash(cleanDevId);

    // Clé universelle de secours du créateur
    if (cleanInput === '5008' || cleanInput === 'MASTER2026' || cleanInput === 'KEY-COACH-PRO-MASTER-2026-AFRICA' || cleanInput === 'CP-MASTER-LIFETIME-2026-AFRICA') {
      return {
        valid: true,
        type: 'MASTER',
        typeName: 'Licence Master Créateur (Illimitée)',
        isLifetime: true,
        daysRemaining: 9999,
        expiryFormatted: 'Illimitée'
      };
    }

    // Format attendu strict : CP-[TYPE]-[EXP_B36]-[DEV_HASH]-[SIG]
    const parts = cleanInput.split('-');
    if (parts.length < 5 || parts[0] !== 'CP') {
      return { valid: false, reason: 'Format de clé invalide (doit commencer par CP-)' };
    }

    const [, type, expBase36, devHash, sig] = parts;

    // 1. Vérification du Device Hash
    if (devHash !== expectedDevHash) {
      return { valid: false, reason: 'Cette clé n\'est pas destinée à cet appareil' };
    }

    // 2. Vérification de la Signature Cryptographique
    const payload = `${cleanDevId}|${type}|${expBase36}|${MASTER_SALT}`;
    const expectedSig = sha256(payload).slice(0, 8).toUpperCase();

    if (sig !== expectedSig) {
      return { valid: false, reason: 'Signature de licence invalide ou altérée' };
    }

    // 3. Vérification de la date d'expiration
    if (expBase36 === 'LIFETIME' || type === 'LIFE' || type === 'MASTER') {
      return {
        valid: true,
        type: 'LIFE',
        typeName: 'Licence Professionnelle à Vie',
        isLifetime: true,
        daysRemaining: 9999,
        expiryFormatted: 'Illimitée'
      };
    }

    const expTimestamp = parseInt(expBase36, 36);
    if (isNaN(expTimestamp)) {
      return { valid: false, reason: 'Date d\'expiration invalide' };
    }

    if (!this.verifyTimeIntegrity()) {
      return { valid: false, reason: 'Horloge locale modifiée détectée' };
    }

    const now = Date.now();
    if (now > expTimestamp) {
      return {
        valid: false,
        reason: 'Licence expirée',
        isExpired: true,
        expiredAt: expTimestamp
      };
    }

    const msRemaining = expTimestamp - now;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    let typeName = 'Abonnement Coach Pro';
    if (type === 'TRIAL') typeName = 'Période d\'Essai';
    else if (type === 'M1') typeName = 'Abonnement 1 Mois (30 Jours)';
    else if (type === 'Y1') typeName = 'Abonnement Annuel (1 An)';
    else if (type === 'CUSTOM') typeName = `Licence Personnalisée (${daysRemaining} j)`;

    const dateObj = new Date(expTimestamp);
    const expiryFormatted = dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      valid: true,
      type: type,
      typeName: typeName,
      isLifetime: false,
      expiresAt: expTimestamp,
      daysRemaining: daysRemaining,
      expiryFormatted: expiryFormatted
    };
  },

  /**
   * Sauvegarde une nouvelle clé de licence dans le stockage
   */
  saveLicenseKey(key) {
    const result = this.verifyKey(key);
    if (result.valid) {
      localStorage.setItem(LICENSE_KEY_STORAGE, key.trim().toUpperCase());
      localStorage.setItem('coachpro_license_status', result.typeName);
      return { success: true, info: result };
    }
    return { success: false, reason: result.reason || 'Clé non valide' };
  },

  /**
   * Réinitialise complètement la licence à zéro pour tester (Essai 5 jours ou Verrouillage)
   */
  resetLicenseForTesting(startFreshTrial = true) {
    localStorage.removeItem(LICENSE_KEY_STORAGE);
    localStorage.removeItem('coachpro_license_key_v1');
    localStorage.removeItem('coachpro_license_status');
    localStorage.removeItem(TRIAL_STORAGE);
    localStorage.removeItem(LAST_ACTIVE_TS_STORAGE);
    
    if (startFreshTrial) {
      return this.getTrialStatus();
    }
    return null;
  },

  /**
   * Retourne les informations complètes sur la licence active
   */
  getLicenseInfo() {
    const devId = this.getDeviceId();
    const savedKey = localStorage.getItem(LICENSE_KEY_STORAGE);

    // 1. Si une clé achetée est enregistrée
    if (savedKey) {
      const keyResult = this.verifyKey(savedKey, devId);
      if (keyResult.valid) {
        return {
          isActivated: true,
          isTrial: false,
          isExpired: false,
          type: keyResult.type,
          typeName: keyResult.typeName,
          isLifetime: keyResult.isLifetime,
          daysRemaining: keyResult.daysRemaining,
          expiryFormatted: keyResult.expiryFormatted,
          statusBadge: keyResult.isLifetime
            ? '🟢 Active à Vie (Illimitée)'
            : `🟢 ${keyResult.typeName} (${keyResult.daysRemaining} j restants)`,
          deviceId: devId
        };
      }
    }

    // 2. Sinon, vérifier l'essai gratuit de 5 jours
    const trial = this.getTrialStatus();
    if (trial.isActive) {
      const expDate = new Date(trial.expiresAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return {
        isActivated: true,
        isTrial: true,
        isExpired: false,
        type: 'TRIAL',
        typeName: `Essai Gratuit (5 Jours)`,
        isLifetime: false,
        daysRemaining: trial.daysRemaining,
        expiryFormatted: expDate,
        statusBadge: `🟡 Période d'Essai (${trial.daysRemaining} j restants)`,
        deviceId: devId
      };
    }

    // 3. Licence expirée ou non activée
    return {
      isActivated: false,
      isTrial: false,
      isExpired: true,
      type: 'EXPIRED',
      typeName: 'Licence Expirée ou Non Activée',
      isLifetime: false,
      daysRemaining: 0,
      expiryFormatted: 'Expirée',
      statusBadge: '🔴 Non Activée / Expirée',
      deviceId: devId
    };
  },

  isActivated() {
    const info = this.getLicenseInfo();
    return info.isActivated;
  },

  /**
   * Initialise et bloque l'accès si l'application n'est pas activée
   */
  init(onSuccess) {
    const info = this.getLicenseInfo();
    if (info.isActivated) {
      if (typeof onSuccess === 'function') onSuccess();
      return;
    }
    this.renderActivationScreen(onSuccess);
  },

  /**
   * Affiche l'écran de verrouillage / activation
   */
  renderActivationScreen(onSuccess) {
    let overlay = document.getElementById('license-activation-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'license-activation-overlay';
      overlay.className = 'fixed inset-0 z-50 bg-[#070b16] flex flex-col items-center justify-center p-4 select-none';
      document.body.appendChild(overlay);
    }

    const devId = this.getDeviceId();
    const info = this.getLicenseInfo();

    const waMsg = encodeURIComponent(
      `Bonjour Créateur COACH PRO,\nJe souhaite activer ma licence COACH PRO.\nMon Device ID est : ${devId}\nMerci !`
    );
    const waUrl = `https://wa.me/?text=${waMsg}`;

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 sm:p-8 space-y-6 text-center border-t-4 border-emerald-500 shadow-2xl animate-fade-in relative">
        
        <!-- Badge & Titre -->
        <div class="space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-500/10">
            🛡️
          </div>
          <h1 class="text-xl font-bold text-white tracking-wide">Activation &amp; Licence COACH PRO</h1>
          <p class="text-xs text-slate-300">
            ${info.isExpired 
              ? '<span class="text-rose-400 font-bold">Votre période de licence est arrivée à expiration.</span> Veuillez renouveler votre clé pour continuer.' 
              : 'Déverrouillez votre application professionnelle tout-en-un pour coachs sportifs.'}
          </p>
        </div>

        <!-- Identifiant Machine de l'Appareil -->
        <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-xl text-left space-y-2">
          <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            📱 Identifiant Unique de votre Appareil (Device ID)
          </span>
          <div class="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span class="font-mono text-sm font-black text-emerald-400 select-all" id="device-id-display">${devId}</span>
            <button id="btn-copy-device-id" class="btn btn-outline btn-xs flex items-center gap-1 font-bold shrink-0">
              <span>📋</span> Copier
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            Transmettez cet identifiant à l'administrateur pour obtenir votre clé d'activation sécurisée.
          </p>
        </div>

        <!-- Bouton de Contact Rapide WhatsApp -->
        <div>
          <a href="${waUrl}" target="_blank" class="btn btn-whatsapp w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10">
            <span>💬</span> Demander une Clé sur WhatsApp
          </a>
        </div>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-slate-800"></div>
          <span class="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase">Ou saisissez votre clé</span>
          <div class="flex-grow border-t border-slate-800"></div>
        </div>

        <!-- Formulaire de Saisie de Clé -->
        <form id="form-license-activation" class="space-y-4 text-left">
          <div>
            <label class="label">Clé de Licence Officielle *</label>
            <input 
              type="text" 
              id="input-license-key" 
              placeholder="ex: CP-Y1-..." 
              class="input text-xs font-mono font-bold tracking-wider uppercase text-white bg-slate-950" 
              required 
              autocomplete="off" 
            />
          </div>

          <div id="license-error-msg" class="text-xs text-rose-400 font-semibold min-h-[1.2rem]"></div>

          <button type="submit" class="btn btn-primary btn-sm w-full py-2.5 font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <span>🔓</span> Déverrouiller COACH PRO
          </button>
        </form>

        <div class="text-[11px] text-slate-400 flex items-center justify-center gap-4 pt-1">
          <span>⚡ Essai 5 Jours</span>
          <span>•</span>
          <span>📅 1 Mois / 1 An</span>
          <span>•</span>
          <span>♾️ À Vie</span>
        </div>
      </div>
    `;

    const form = overlay.querySelector('#form-license-activation');
    const copyBtn = overlay.querySelector('#btn-copy-device-id');
    const inputKey = overlay.querySelector('#input-license-key');
    const errorMsg = overlay.querySelector('#license-error-msg');

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(devId).then(() => {
        copyBtn.textContent = '✓ Copié !';
        setTimeout(() => { copyBtn.innerHTML = '<span>📋</span> Copier'; }, 2000);
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredKey = inputKey.value.trim();
      const res = this.saveLicenseKey(enteredKey);

      if (res.success) {
        overlay.classList.add('hidden');
        if (typeof onSuccess === 'function') onSuccess();
        else window.location.reload();
      } else {
        errorMsg.textContent = res.reason || 'Clé de licence invalide pour cet appareil.';
      }
    });
  }
};
