/**
 * settingsModal.js - Paramètres du Coach, Imprimante Bluetooth MPT, Licence & Sauvegarde
 * Gestion complète : Profil du coach, Sélection directe & Test imprimante Bluetooth, Sauvegardes.
 */

import { stateManager } from '../state.js';
import { ThermalPrinter } from '../printer.js';
import { LicenseManager } from '../security/license.js';
import { BackupManager } from '../security/backup.js';

export const SettingsModal = {
  selectedPrinterAddress: '',

  open() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    this.selectedPrinterAddress = ThermalPrinter.getSavedDeviceAddress() || '';
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
    const pairedDevices = ThermalPrinter.getPairedDevices();
    const currentDeviceName = ThermalPrinter.getConnectedDeviceName() || ThermalPrinter.getSavedDeviceName();
    const currentDeviceAddress = ThermalPrinter.getConnectedDeviceAddress() || ThermalPrinter.getSavedDeviceAddress();

    if (!this.selectedPrinterAddress && currentDeviceAddress) {
      this.selectedPrinterAddress = currentDeviceAddress;
    }

    container.innerHTML = `
      <div class="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Paramètres &amp; Configuration Imprimante
            </h3>
            <p class="text-xs text-slate-400">Profil du coach, Imprimante Bluetooth thermique, Licence et Sauvegardes</p>
          </div>
          <button id="btn-close-settings-x" class="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
        </div>

        <!-- 1. CONFIGURATION DIRECTE IMPRIMANTE BLUETOOTH THERMIQUE -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500 shadow-xl bg-slate-900/90">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>📶</span> Imprimante Bluetooth Thermique (MPT-II / POS-58 / 80mm)
              </h4>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Sélectionnez votre imprimante une seule fois pour imprimer instantanément sans déconnexion.
              </p>
            </div>
            
            <div>
              ${currentDeviceName ? `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ${currentDeviceName}
                </span>
              ` : `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  ⚪ Aucune imprimante enregistrée
                </span>
              `}
            </div>
          </div>

          <!-- Sélecteur d'imprimante Bluetooth -->
          <div class="space-y-2 pt-1">
            <label class="label flex items-center justify-between">
              <span>Appareils Bluetooth détectés sur l'appareil :</span>
              <button type="button" id="btn-refresh-bt-list" class="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                <span>🔄</span> Actualiser la liste
              </button>
            </label>

            ${pairedDevices && pairedDevices.length > 0 ? `
              <div class="grid grid-cols-1 gap-2">
                <select id="select-bt-printer" class="input font-mono font-bold text-xs bg-slate-950 text-emerald-400 border-slate-700">
                  <option value="">-- Choisir une imprimante dans la liste --</option>
                  ${pairedDevices.map(dev => `
                    <option value="${dev.address}" ${(this.selectedPrinterAddress === dev.address || currentDeviceAddress === dev.address) ? 'selected' : ''}>
                      ${dev.name} (${dev.address}) ${dev.isConnected ? '✓ Connectée' : ''}
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <p class="text-xs text-slate-300">
                  Activez le Bluetooth sur votre tablette/téléphone et allumez votre imprimante MPT.
                </p>
                <div class="flex justify-center gap-2">
                  <button type="button" id="btn-scan-web-bt" class="btn btn-secondary btn-xs font-bold">
                    Rechercher en Bluetooth
                  </button>
                </div>
              </div>
            `}
          </div>

          <!-- Boutons de Test & d'Enregistrement -->
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button type="button" id="btn-save-default-printer" class="btn btn-primary btn-sm font-bold flex items-center gap-1.5">
              <span>💾</span>
              <span>Enregistrer comme Imprimante par Défaut</span>
            </button>
            
            <button type="button" id="btn-test-print-direct" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5">
              <span>🖨️</span>
              <span>Tester l'Impression Directe</span>
            </button>
          </div>
        </div>

        <!-- 2. PROFIL DU COACH & EN-TÊTE DES REÇUS -->
        <form id="form-coach-profile" class="glass-card p-5 space-y-4">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>👤</span> Profil du Coach &amp; Coordonnées sur les Tickets
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom &amp; Prénom du Coach *</label>
              <input type="text" name="name" value="${coach.name || ''}" placeholder="Votre Nom &amp; Prénom" class="input font-bold" required />
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
              <label class="label">Ville / Commune d'intervention</label>
              <input type="text" name="city" value="${coach.city || ''}" placeholder="ex: Abidjan Cocody" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Téléphone / WhatsApp (Sur tous les reçus) *</label>
              <input type="tel" inputmode="tel" name="phone" value="${coach.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-mono font-bold text-emerald-400" />
            </div>
            <div>
              <label class="label">Email de Contact</label>
              <input type="email" name="email" value="${coach.email || ''}" placeholder="coach@email.com" class="input" />
            </div>
          </div>

          <div>
            <label class="label">Devise &amp; Slogan sur les Reçus</label>
            <input type="text" name="motto" value="${coach.motto || ''}" placeholder="ex: Votre transformation, votre mission !" class="input text-xs" />
          </div>

          <div class="flex justify-end pt-1">
            <button type="submit" class="btn btn-primary btn-sm font-bold">Enregistrer les Coordonnées</button>
          </div>
        </form>

        <!-- 3. PROTECTION, MOT DE PASSE & CODE PIN -->
        <div class="glass-card p-4 space-y-4 border-l-4 border-amber-500">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Sécurité d'Accès &amp; Code PIN
            </h4>
            <span class="badge badge-emerald text-xs font-bold">
              🟢 Actif (Sécurisé)
            </span>
          </div>

          <form id="form-change-pin" class="space-y-3 pt-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="label">Nouveau Code PIN :</label>
                <input type="password" id="input-new-pin" maxlength="8" inputmode="numeric" placeholder="••••" class="input font-mono font-bold text-amber-400" required />
              </div>
              <div class="flex items-end">
                <button type="submit" class="btn btn-secondary btn-sm w-full font-bold">
                  Enregistrer le Code PIN
                </button>
              </div>
            </div>
          </form>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <span class="text-xs text-slate-400">Verrouiller maintenant l'application :</span>
            <button type="button" onclick="window.PinLock.lockApp(); window.App.openSettingsModal?.();" class="btn btn-outline btn-xs font-bold text-rose-400 hover:text-rose-300">
              🚪 Déconnexion Immédiate
            </button>
          </div>
        </div>

        <!-- 4. PROTECTION & LICENCE DE L'ŒUVRE -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Licence &amp; Protection Logicielle
            </h4>
            <span class="badge ${licenseInfo.isExpired ? 'badge-rose' : (licenseInfo.isTrial ? 'badge-amber' : 'badge-emerald')} text-xs font-bold">
              ${licenseInfo.statusBadge}
            </span>
          </div>

          <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
            <div class="flex items-center justify-between">
              <span>Formule active :</span>
              <strong class="text-white font-bold">${licenseInfo.typeName}</strong>
            </div>

            <div class="flex items-center justify-between">
              <span>Expiration :</span>
              <strong class="${licenseInfo.isLifetime ? 'text-emerald-400' : 'text-amber-400'} font-bold">
                ${licenseInfo.expiryFormatted} ${(!licenseInfo.isLifetime && licenseInfo.daysRemaining > 0) ? `(${licenseInfo.daysRemaining} j restants)` : ''}
              </strong>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Identifiant Appareil :</span>
              <div class="flex items-center gap-2">
                <strong class="font-mono text-emerald-400 font-bold select-all text-[11px]">${licenseInfo.deviceId}</strong>
                <button type="button" id="btn-copy-settings-devid" class="btn btn-outline btn-xs py-0.5 px-2 text-[10px] font-bold">
                  Copier
                </button>
              </div>
            </div>
          </div>

          <!-- Formulaire de saisie / renouvellement de clé -->
          <form id="form-update-license" class="space-y-2 pt-1 border-t border-slate-800">
            <label class="label text-[11px]">Saisir une nouvelle Clé de Licence / Renouvellement :</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="input-settings-license-key" 
                placeholder="ex: CP-Y1-..." 
                class="input text-xs font-mono font-bold uppercase text-white bg-slate-950 flex-1" 
                required 
              />
              <button type="submit" class="btn btn-primary btn-sm font-bold shrink-0">
                Activer
              </button>
            </div>
            <div id="settings-license-msg" class="text-[11px] font-semibold min-h-[1rem]"></div>
          </form>
        </div>

        <!-- 5. SAUVEGARDE COMPLÈTE & RESTAURATION -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-cyan-500">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>💾</span> Sauvegarde &amp; Restauration Complète
          </h4>
          <p class="text-xs text-slate-400">
            Protégez vos athlètes, vos photos et votre comptabilité. Exportez un fichier de sauvegarde ou restaurez vos données en cas de changement d'appareil.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button type="button" id="btn-export-backup" class="btn btn-primary btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>📥</span>
              <span>Télécharger</span>
            </button>
            <button type="button" id="btn-share-backup" class="btn btn-whatsapp btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            <label class="btn btn-outline btn-sm flex items-center justify-center gap-1.5 cursor-pointer">
              <span>📤</span>
              <span>Restaurer</span>
              <input type="file" id="input-restore-backup" accept=".coachpro,.json" class="hidden" />
            </label>
          </div>
        </div>

        <!-- 6. PIED DE PAGE : RÉINITIALISATION & FERMETURE -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" id="btn-reset-app-data" class="text-xs text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1">
            <span>🗑️</span> Réinitialiser toutes les données
          </button>
          <button type="button" id="btn-close-settings" class="btn btn-secondary btn-sm font-bold">Fermer</button>
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

    // Sélecteur d'imprimante
    const selectBt = document.getElementById('select-bt-printer');
    selectBt?.addEventListener('change', (e) => {
      this.selectedPrinterAddress = e.target.value;
    });

    // Rafraîchir la liste Bluetooth
    document.getElementById('btn-refresh-bt-list')?.addEventListener('click', () => {
      this.render();
      this.bindEvents();
      window.App.showToast('Liste des appareils actualisée', 'info');
    });

    // Scan Web Bluetooth
    document.getElementById('btn-scan-web-bt')?.addEventListener('click', () => {
      ThermalPrinter.openPrinterPickerModal(() => {
        this.render();
        this.bindEvents();
      });
    });

    // Enregistrer comme imprimante par défaut
    document.getElementById('btn-save-default-printer')?.addEventListener('click', async () => {
      const select = document.getElementById('select-bt-printer');
      const address = select ? select.value : this.selectedPrinterAddress;

      if (!address) {
        alert('Veuillez sélectionner une imprimante dans la liste.');
        return;
      }

      const paired = ThermalPrinter.getPairedDevices();
      const match = paired.find(d => d.address === address);
      const name = match ? match.name : 'Imprimante MPT';

      ThermalPrinter.saveDefaultPrinter(address, name);
      window.App.showToast(`Imprimante "${name}" enregistrée par défaut !`, 'success');
      this.render();
      this.bindEvents();
    });

    // Tester l'impression directe
    document.getElementById('btn-test-print-direct')?.addEventListener('click', async () => {
      try {
        const select = document.getElementById('select-bt-printer');
        const address = select ? select.value : this.selectedPrinterAddress;

        if (address) {
          const paired = ThermalPrinter.getPairedDevices();
          const match = paired.find(d => d.address === address);
          const name = match ? match.name : 'Imprimante MPT';
          ThermalPrinter.saveDefaultPrinter(address, name);
        }

        const coach = stateManager.getCoachProfile();
        const testText = `${coach.name || 'COACH PRO'}\n${coach.phone ? 'Tel: ' + coach.phone + '\n' : ''}================================\nTEST D'IMPRESSION THERMIQUE\n--------------------------------\nImprimante MPT : OPERATIONNELLE\nConnexion Bluetooth : REUSSIE\nDate : ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n================================\nMerci pour votre confiance !\n\n\n`;

        await ThermalPrinter.printDirect(testText);
        window.App.showToast("Test d'impression envoyé avec succès !", 'success');
        this.render();
        this.bindEvents();
      } catch (err) {
        alert(`Erreur d'impression : ${err.message}`);
      }
    });

    // 1. Profil Coach
    const profileForm = document.getElementById('form-coach-profile');
    profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const updated = {
        name: formData.get('name') || '',
        title: formData.get('title') || '',
        brand: formData.get('brand') || '',
        phone: formData.get('phone') || '',
        email: formData.get('email') || '',
        city: formData.get('city') || '',
        motto: formData.get('motto') || ''
      };
      stateManager.updateCoachProfile(updated);
      window.App.showToast('Profil et coordonnées enregistrés !', 'success');
      this.close();
    });

    // 2. Modification Code PIN
    const pinForm = document.getElementById('form-change-pin');
    pinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPinInput = document.getElementById('input-new-pin');
      const newPin = newPinInput?.value?.trim();
      if (!newPin || newPin.length < 4) {
        alert('Le code PIN doit comporter au moins 4 chiffres.');
        return;
      }

      PinLock.requestPinConfirmation({
        title: 'Changer le Code PIN',
        message: 'Entrez votre code PIN actuel pour valider la modification.',
        onConfirm: () => {
          PinLock.setNewPin(newPin);
          window.App.showToast(`Nouveau Code PIN "${newPin}" enregistré avec succès !`, 'success');
          this.render();
          this.bindEvents();
        }
      });
    });

    // 3. Sauvegardes
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      BackupManager.exportBackup();
    });

    document.getElementById('btn-share-backup')?.addEventListener('click', () => {
      BackupManager.shareViaWhatsApp();
    });

    document.getElementById('input-restore-backup')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        PinLock.requestPinConfirmation({
          title: 'Restaurer la Sauvegarde',
          message: `Entrez votre code PIN pour restaurer les données depuis "${file.name}". Les données actuelles seront remplacées.`,
          onConfirm: () => {
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
        });
      }
    });

    // 4. Copie Device ID & Mise à jour Licence
    const copyDevIdBtn = document.getElementById('btn-copy-settings-devid');
    copyDevIdBtn?.addEventListener('click', () => {
      const devId = LicenseManager.getDeviceId();
      navigator.clipboard.writeText(devId).then(() => {
        copyDevIdBtn.textContent = '✓ Copié !';
        setTimeout(() => { copyDevIdBtn.textContent = 'Copier'; }, 2000);
      });
    });

    const licenseForm = document.getElementById('form-update-license');
    licenseForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputKey = document.getElementById('input-settings-license-key');
      const msgDiv = document.getElementById('settings-license-msg');
      const keyVal = inputKey?.value?.trim();

      if (!keyVal) return;

      const res = LicenseManager.saveLicenseKey(keyVal);
      if (res.success) {
        msgDiv.className = 'text-[11px] font-bold text-emerald-400';
        msgDiv.textContent = `✓ Licence "${res.info.typeName}" activée avec succès !`;
        window.App?.showToast?.('Licence mise à jour avec succès !', 'success');
        setTimeout(() => {
          this.render();
          this.bindEvents();
          if (window.App && typeof window.App.renderCurrentView === 'function') {
            window.App.renderCurrentView();
          }
        }, 1200);
      } else {
        msgDiv.className = 'text-[11px] font-bold text-rose-400';
        msgDiv.textContent = `❌ ${res.reason || 'Clé de licence invalide pour cet appareil.'}`;
      }
    });

    // 5. Réinitialisation Complète Sécurisée par PIN
    document.getElementById('btn-reset-app-data')?.addEventListener('click', () => {
      PinLock.requestPinConfirmation({
        title: 'Réinitialisation Totale',
        message: 'ATTENTION : Entrez votre code PIN pour effacer TOUTES les données (clients, séances, photos, comptabilité).',
        onConfirm: () => {
          stateManager.clearAllData();
          window.App.showToast('Application réinitialisée avec succès', 'info');
          this.close();
          if (window.App && typeof window.App.renderCurrentView === 'function') {
            window.App.renderCurrentView();
          }
        }
      });
    });
  }
};
