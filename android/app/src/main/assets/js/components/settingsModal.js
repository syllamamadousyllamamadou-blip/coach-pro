/**
 * settingsModal.js - Paramètres du Coach, Sécurité PIN 5008, Licence & Sauvegarde
 * Configuration complète : Profil, Bluetooth, Code PIN modifiable, Licence et Restauration.
 */

import { stateManager } from '../state.js';
import { ThermalPrinter } from '../printer.js';
import { PinLock } from '../security/pinLock.js';
import { LicenseManager } from '../security/license.js';
import { BackupManager } from '../security/backup.js';

export const SettingsModal = {
  open() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    this.render();
    modal.classList.remove('hidden');
    this.bindEvents();
  },

  close() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  },

  render() {
    const container = document.getElementById('settings-modal-container');
    if (!container) return;

    const coach = stateManager.getCoachProfile();
    const licenseInfo = LicenseManager.getLicenseInfo();
    const currentPin = PinLock.getStoredPin();

    container.innerHTML = `
      <div class="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Paramètres & Sécurité COACH PRO</h3>
            <p class="text-xs text-slate-400">Profil du coach, Code PIN, Licence et Sauvegardes</p>
          </div>
          <button id="btn-close-settings-x" class="btn-icon">✕</button>
        </div>

        <!-- 1. PROFIL DU COACH & EN-TÊTE DES REÇUS -->
        <form id="form-coach-profile" class="space-y-4">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">1. Profil du Coach & Reçus Thermiques</h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom & Prénom du Coach *</label>
              <input type="text" name="name" value="${coach.name || ''}" placeholder="Votre Nom & Prénom" class="input font-bold" required />
            </div>
            <div>
              <label class="label">Titre Professionnel</label>
              <input type="text" name="title" value="${coach.title || ''}" placeholder="ex: Coach Sportif Privé" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom de la Marque / Structure</label>
              <input type="text" name="brand" value="${coach.brand || ''}" placeholder="ex: COACH PRO PRIVÉ" class="input" />
            </div>
            <div>
              <label class="label">Ville / Zone d'intervention</label>
              <input type="text" name="city" value="${coach.city || ''}" placeholder="ex: Abidjan Cocody" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Téléphone / WhatsApp (Pour les reçus) *</label>
              <input type="tel" inputmode="tel" name="phone" value="${coach.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-mono font-bold" />
            </div>
            <div>
              <label class="label">Email de Contact</label>
              <input type="email" name="email" value="${coach.email || ''}" placeholder="coach@email.com" class="input" />
            </div>
          </div>

          <div>
            <label class="label">Devise & Signature sur les Reçus</label>
            <input type="text" name="motto" value="${coach.motto || ''}" placeholder="ex: Votre transformation, votre mission !" class="input text-xs" />
          </div>

          <div class="flex justify-end">
            <button type="submit" class="btn btn-primary btn-sm">Enregistrer le Profil</button>
          </div>
        </form>

        <!-- 2. SÉCURITÉ & MODIFICATION DU CODE PIN (5008) -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Sécurité & Code PIN (Actuel : ${currentPin})
            </h4>
            <button id="btn-lock-now" class="btn btn-secondary btn-xs">Verrouiller maintenant</button>
          </div>

          <form id="form-change-pin" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Ancien Code PIN</label>
              <input type="password" inputmode="numeric" id="old-pin-input" placeholder="ex: 5008" class="input text-xs font-mono font-bold" required />
            </div>
            <div>
              <label class="label">Nouveau Code PIN</label>
              <input type="password" inputmode="numeric" id="new-pin-input" placeholder="Nouveau code (4+ chiffres)" class="input text-xs font-mono font-bold text-emerald-400" required />
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-primary btn-sm w-full font-bold">Changer le Code PIN</button>
            </div>
          </form>
        </div>

        <!-- 3. PROTECTION & LICENCE DE L'ŒUVRE -->
        <div class="glass-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Licence & Protection Logicielle
            </h4>
            <span class="badge ${licenseInfo.isActivated ? 'badge-emerald' : 'badge-danger'} text-xs font-bold">
              ${licenseInfo.isActivated ? `✓ ${licenseInfo.type}` : 'Non Activé'}
            </span>
          </div>

          <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <div class="flex items-center justify-between">
              <span>Identifiant Appareil (Device ID) :</span>
              <strong class="font-mono text-emerald-400 select-all">${licenseInfo.deviceId}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span>Clé de Licence Active :</span>
              <span class="font-mono text-slate-400 truncate max-w-[200px]">${licenseInfo.key}</span>
            </div>
          </div>
        </div>

        <!-- 4. SAUVEGARDE COMPLÈTE & RESTAURATION (ANTI-PERTE DE DONNÉES) -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-cyan-500">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>💾</span> Sauvegarde & Restauration Complète
          </h4>
          <p class="text-xs text-slate-400">
            Protégez vos athlètes, vos photos et votre comptabilité. Exportez un fichier de sauvegarde ou restaurez vos données en cas de changement d'appareil.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button type="button" id="btn-export-backup" class="btn btn-primary btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>📥</span>
              <span>Télécharger Sauvegarde</span>
            </button>
            <button type="button" id="btn-share-backup" class="btn btn-whatsapp btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>💬</span>
              <span>Partager WhatsApp</span>
            </button>
            <label class="btn btn-outline btn-sm flex items-center justify-center gap-1.5 cursor-pointer">
              <span>📤</span>
              <span>Restaurer Fichier</span>
              <input type="file" id="input-restore-backup" accept=".coachpro,.json" class="hidden" />
            </label>
          </div>
        </div>

        <!-- 5. IMPRIMANTE BLUETOOTH -->
        <div class="p-3.5 rounded-lg bg-[#0c1220] border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📶</span> Imprimante Bluetooth Thermique
            </h4>
            ${(() => {
              const dev = ThermalPrinter.getConnectedDeviceName() || (typeof localStorage !== 'undefined' ? localStorage.getItem('coach_last_bt_device') : null);
              return dev ? `<span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">${dev}</span>` : '';
            })()}
          </div>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" id="btn-test-bt-settings" class="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-2 font-semibold">
              <span>🖨️</span>
              <span>Tester l'imprimante</span>
            </button>
            ${(() => {
              const dev = ThermalPrinter.getConnectedDeviceName() || (typeof localStorage !== 'undefined' ? localStorage.getItem('coach_last_bt_device') : null);
              return dev ? `
                <button type="button" id="btn-disconnect-bt-settings" class="btn btn-outline btn-sm text-xs text-slate-400 hover:text-white">
                  Dissocier
                </button>
              ` : '';
            })()}
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" id="btn-reset-app-data" class="text-xs text-rose-400 hover:underline">
            Réinitialiser toutes les données
          </button>
          <button type="button" id="btn-close-settings" class="btn btn-secondary btn-sm">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('settings-modal');
    const closeX = document.getElementById('btn-close-settings-x');
    const closeBtn = document.getElementById('btn-close-settings');

    closeX?.addEventListener('click', () => this.close());
    closeBtn?.addEventListener('click', () => this.close());

    // 1. Profil Coach
    const profileForm = document.getElementById('form-coach-profile');
    profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const updated = {
        name: formData.get('name') || '',
        title: formData.get('title') || '',
        brand: formData.get('brand') || '',
        city: formData.get('city') || '',
        phone: formData.get('phone') || '',
        email: formData.get('email') || '',
        motto: formData.get('motto') || ''
      };

      stateManager.updateCoachProfile(updated);
      alert('Profil du coach enregistré avec succès !');
      this.close();
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    // 2. Changer le Code PIN
    const formPin = document.getElementById('form-change-pin');
    formPin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPin = document.getElementById('old-pin-input')?.value;
      const newPin = document.getElementById('new-pin-input')?.value;

      if (!PinLock.verifyPin(oldPin)) {
        alert('Ancien code PIN incorrect.');
        return;
      }

      if (!newPin || newPin.length < 4) {
        alert('Le nouveau code PIN doit comporter au moins 4 chiffres.');
        return;
      }

      PinLock.setNewPin(newPin);
      alert(`Code PIN modifié avec succès ! Votre nouveau code de déverrouillage est : ${newPin}`);
      this.render();
      this.bindEvents();
    });

    // Verrouiller maintenant
    document.getElementById('btn-lock-now')?.addEventListener('click', () => {
      this.close();
      PinLock.lockApp();
    });

    // 3. Sauvegarde & Restauration
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      const res = BackupManager.exportToFile();
      if (res.success) {
        alert(`Sauvegarde téléchargée avec succès (${res.filename}). Conservez ce fichier en lieu sûr !`);
      }
    });

    document.getElementById('btn-share-backup')?.addEventListener('click', async () => {
      await BackupManager.shareBackup();
    });

    document.getElementById('input-restore-backup')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (confirm('Attention : La restauration va remplacer les données actuelles par celles du fichier de sauvegarde. Voulez-vous continuer ?')) {
          BackupManager.restoreFromFile(file, (success, msg) => {
            alert(msg);
            if (success) {
              this.close();
              if (window.App && typeof window.App.renderCurrentView === 'function') {
                window.App.renderCurrentView();
              }
            }
          });
        }
      }
    });

    // 4. Imprimante Bluetooth
    document.getElementById('btn-test-bt-settings')?.addEventListener('click', async () => {
      try {
        const coach = stateManager.getCoachProfile();
        const testText = `${coach.name || 'COACH PRO'}\nTest d'impression reussi !\nConnexion active et prete.\n`;
        await ThermalPrinter.printViaBluetooth(testText, true);
        alert('Impression test envoyée avec succès !');
        this.render();
        this.bindEvents();
      } catch (err) {
        alert(`Erreur d'impression : ${err.message}`);
      }
    });

    document.getElementById('btn-disconnect-bt-settings')?.addEventListener('click', () => {
      ThermalPrinter.forgetDevice();
      alert('Imprimante dissociée.');
      this.render();
      this.bindEvents();
    });

    // Réinitialisation
    document.getElementById('btn-reset-app-data')?.addEventListener('click', () => {
      if (confirm('Êtes-vous absolument sûr de vouloir réinitialiser toutes les données de COACH PRO ?')) {
        stateManager.clearAllData();
        alert('Application réinitialisée.');
        this.close();
        if (window.App && typeof window.App.renderCurrentView === 'function') {
          window.App.renderCurrentView();
        }
      }
    });
  }
};
