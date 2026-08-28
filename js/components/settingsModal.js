/**
 * settingsModal.js - Paramètres du Coach & Configuration des Reçus
 * Champs propres et personnalisables sans fausses données imposées par défaut.
 */

import { stateManager } from '../state.js';

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

    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Paramètres du Coach & En-tête des Reçus</h3>
            <p class="text-xs text-slate-400">Ces informations apparaîtront sur vos tickets d'impression 58mm / 80mm</p>
          </div>
          <button id="btn-close-settings-x" class="btn-icon">✕</button>
        </div>

        <form id="form-coach-profile" class="space-y-4">
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
              <input type="text" name="brand" value="${coach.brand || ''}" placeholder="ex: FOR ACCOMPAGNEMENT" class="input" />
            </div>
            <div>
              <label class="label">Ville / Zone d'intervention</label>
              <input type="text" name="city" value="${coach.city || ''}" placeholder="ex: Abidjan Cocody" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Téléphone / WhatsApp (Pour les reçus) *</label>
              <input type="tel" name="phone" value="${coach.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-mono font-bold" />
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

          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <button type="button" id="btn-reset-app-data" class="text-xs text-red-400 hover:underline">
              Réinitialiser l'application
            </button>

            <div class="flex items-center gap-2">
              <button type="button" id="btn-close-settings" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </div>
        </form>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('settings-modal');
    const closeBtnX = document.getElementById('btn-close-settings-x');
    const closeBtn = document.getElementById('btn-close-settings');
    const form = document.getElementById('form-coach-profile');
    const resetBtn = document.getElementById('btn-reset-app-data');

    const hide = () => this.close();
    closeBtnX?.addEventListener('click', hide);
    closeBtn?.addEventListener('click', hide);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) hide();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updatedProfile = {
        name: formData.get('name'),
        title: formData.get('title'),
        brand: formData.get('brand'),
        city: formData.get('city'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        motto: formData.get('motto')
      };

      stateManager.updateCoachProfile(updatedProfile);
      window.App.showToast('Profil coach enregistré avec succès !', 'success');
      this.close();
    });

    resetBtn?.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment effacer tous les clients et réinitialiser l\'application ? Cette action est irréversible.')) {
        stateManager.clearAllData();
        window.App.showToast('Application réinitialisée', 'info');
        this.close();
        window.App.navigateTo('dashboard');
      }
    });
  }
};
