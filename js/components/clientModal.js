/**
 * clientModal.js - Formulaire Client COACH PRO
 * Champs clairs sans fausses données imposées, calcul automatique de la masse grasse et du poids santé.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const ClientModal = {
  editClientId: null,

  open(clientId = null) {
    this.editClientId = clientId;
    const client = clientId ? stateManager.getClientById(clientId) : null;
    const modalBackdrop = document.getElementById('client-form-modal');
    if (!modalBackdrop) return;

    this.renderForm(client);
    modalBackdrop.classList.remove('hidden');
    this.bindEvents(client);
  },

  close() {
    const modalBackdrop = document.getElementById('client-form-modal');
    if (modalBackdrop) modalBackdrop.classList.add('hidden');
  },

  renderForm(client) {
    const formContainer = document.getElementById('client-form-container');
    if (!formContainer) return;

    const isEdit = !!client;
    const answers = client?.riskAssessment?.answers || {};
    const lastAssessment = client?.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const pkg = client?.package || {};
    const pkgType = pkg.packageType || 'sessions';

    formContainer.innerHTML = `
      <form id="form-client-profile" class="space-y-6">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-lg font-bold text-white">
              ${isEdit ? `Modifier la fiche de ${client.firstName} ${client.lastName}` : 'Nouveau Client — Bilan & Inscription'}
            </h3>
            <p class="text-xs text-slate-400">Renseignez les informations de base du client</p>
          </div>
          <button type="button" id="btn-close-client-modal-x" class="btn-icon">✕</button>
        </div>

        <!-- 1. IDENTITÉ, HABITATION & PROFESSION -->
        <div class="sub-card p-4 space-y-3">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">1. Identité, Habitation & Contact</h4>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Prénom *</label>
              <input type="text" name="firstName" value="${client?.firstName || ''}" placeholder="ex: Jean" class="input font-semibold" required />
            </div>
            <div>
              <label class="label">Nom *</label>
              <input type="text" name="lastName" value="${client?.lastName || ''}" placeholder="ex: Kouamé" class="input font-semibold" required />
            </div>
            <div>
              <label class="label">Genre *</label>
              <select name="gender" id="modal-gender" class="input">
                <option value="H" ${client?.gender === 'H' ? 'selected' : ''}>Homme</option>
                <option value="F" ${client?.gender === 'F' ? 'selected' : ''}>Femme</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Lieu d'habitation (Quartier / Ville)</label>
              <input type="text" name="residence" value="${client?.residence || ''}" placeholder="ex: Cocody, Riviera..." class="input" />
            </div>
            <div>
              <label class="label">Profession</label>
              <input type="text" name="profession" value="${client?.profession || ''}" placeholder="ex: Cadre bancaire / Entrepreneur" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Âge (ans) *</label>
              <input type="number" name="age" id="modal-age" value="${client?.age || ''}" placeholder="ex: 32" class="input font-bold" required />
            </div>
            <div>
              <label class="label">Téléphone / WhatsApp *</label>
              <input type="tel" name="phone" value="${client?.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-semibold" required />
            </div>
            <div>
              <label class="label">Email (Optionnel)</label>
              <input type="email" name="email" value="${client?.email || ''}" placeholder="client@email.com" class="input" />
            </div>
          </div>
        </div>

        <!-- 2. OBJECTIF & POIDS CIBLE -->
        <div class="sub-card p-4 space-y-3">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">2. Objectifs du Client</h4>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Objectif Principal *</label>
              <select name="mainGoal" class="input font-semibold">
                <option value="Perte de poids" ${client?.mainGoal === 'Perte de poids' ? 'selected' : ''}>Perte de poids / Sèche</option>
                <option value="Prise de masse musculaire" ${client?.mainGoal === 'Prise de masse musculaire' ? 'selected' : ''}>Prise de masse musculaire</option>
                <option value="Remise en forme" ${client?.mainGoal === 'Remise en forme' ? 'selected' : ''}>Remise en forme & Tonification</option>
                <option value="Santé & Mobilité" ${client?.mainGoal === 'Santé & Mobilité' ? 'selected' : ''}>Santé & Mobilité</option>
              </select>
            </div>
            <div>
              <label class="label">Poids Cible (kg)</label>
              <input type="number" step="0.5" name="targetWeight" value="${client?.targetWeight || ''}" placeholder="ex: 70" class="input font-mono" />
            </div>
            <div>
              <label class="label">Date Cible (Optionnel)</label>
              <input type="date" name="targetDate" value="${client?.targetDate || ''}" class="input" />
            </div>
          </div>
        </div>

        <!-- 3. BILAN CORPOREL (Calcul Automatique) -->
        <div class="sub-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              3. Bilan Corporel (Calcul Automatique du Gras & Muscle)
            </h4>
            <span id="modal-imc-live" class="text-xs text-emerald-400 font-mono font-bold">IMC : --</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Poids (kg) *</label>
              <input type="number" step="0.1" name="initialWeight" id="modal-weight" value="${lastAssessment?.weight || ''}" placeholder="ex: 82.5" class="input font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Taille (cm) *</label>
              <input type="number" name="height" id="modal-height" value="${lastAssessment?.height || ''}" placeholder="ex: 178" class="input font-bold" required />
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="label">Gras (%)</label>
                <span class="text-[10px] text-emerald-400 font-semibold">Auto</span>
              </div>
              <input type="number" step="0.1" name="fatPct" id="modal-fat" value="${lastAssessment?.fatPct || ''}" placeholder="Calculé auto" class="input font-mono font-bold text-amber-400" />
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="label">Muscle (%)</label>
                <span class="text-[10px] text-emerald-400 font-semibold">Auto</span>
              </div>
              <input type="number" step="0.1" name="musclePct" id="modal-muscle" value="${lastAssessment?.musclePct || ''}" placeholder="Calculé auto" class="input font-mono font-bold text-emerald-400" />
            </div>
          </div>

          <!-- Mesures complémentaires facultatives -->
          <div class="pt-2 border-t border-slate-800">
            <span class="text-[11px] text-slate-400 font-semibold block mb-2">Mesures Complémentaires (Facultatif) :</span>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="label">Tour de Taille (cm)</label>
                <input type="number" step="0.5" name="waist" value="${lastAssessment?.waist || ''}" placeholder="Facultatif" class="input" />
              </div>
              <div>
                <label class="label">Tour de Hanches (cm)</label>
                <input type="number" step="0.5" name="hips" value="${lastAssessment?.hips || ''}" placeholder="Facultatif" class="input" />
              </div>
              <div>
                <label class="label">Graisse Viscérale</label>
                <input type="number" name="visceralFat" id="modal-visceral" value="${lastAssessment?.visceralFat || ''}" placeholder="Auto" class="input" />
              </div>
            </div>
          </div>
        </div>

        <!-- 4. BILAN SANTÉ (21 Facteurs LMC) -->
        <div class="sub-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">4. Bilan Santé (21 Facteurs LMC)</h4>
            <span id="modal-risk-score-badge" class="badge badge-neutral text-xs">Score : 0/21</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div class="space-y-1.5 bg-[#0c1220] p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-white block mb-1">Nutrition (7)</span>
              ${Calculations.RISK_FACTORS.filter(f => f.category === 'Nutritionnel').map(q => `
                <label class="flex items-start gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" class="modal-risk-cb mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="text-slate-300 leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>

            <div class="space-y-1.5 bg-[#0c1220] p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-white block mb-1">Physique (7)</span>
              ${Calculations.RISK_FACTORS.filter(f => f.category === 'Physique').map(q => `
                <label class="flex items-start gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" class="modal-risk-cb mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="text-slate-300 leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>

            <div class="space-y-1.5 bg-[#0c1220] p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-white block mb-1">Stress & Hygiène (7)</span>
              ${Calculations.RISK_FACTORS.filter(f => f.category === 'Stress & Hygiène').map(q => `
                <label class="flex items-start gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" class="modal-risk-cb mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="text-slate-300 leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label class="label">Contre-indications médicales</label>
              <input type="text" name="doctorRestrictions" value="${client?.medicalNotes?.doctorRestrictions || ''}" placeholder="Ex: Douleur lombaire, genou..." class="input" />
            </div>
            <div>
              <label class="label">Contact d'Urgence</label>
              <input type="text" name="emergencyContact" value="${client?.emergencyContact?.name || ''}" placeholder="Ex: Proche - 07 00 00 00 00" class="input" />
            </div>
          </div>
        </div>

        <!-- 5. FORFAIT : PACK SÉANCES OU ABONNEMENT EN FCFA -->
        <div class="sub-card p-4 space-y-3">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">5. Formule d'Abonnement (FCFA)</h4>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Type de Forfait *</label>
              <select name="packageType" id="modal-package-type" class="input font-bold text-emerald-400">
                <option value="sessions" ${pkgType === 'sessions' ? 'selected' : ''}>Pack à la Séance (ex: 10, 20 séances)</option>
                <option value="duration" ${pkgType === 'duration' ? 'selected' : ''}>Abonnement à Durée (1, 2, 3 mois...)</option>
              </select>
            </div>

            <div id="wrapper-sessions-count" class="${pkgType === 'duration' ? 'hidden' : ''}">
              <label class="label">Nombre de Séances *</label>
              <input type="number" name="totalSessions" value="${pkg.totalSessions || 10}" class="input font-bold" />
            </div>

            <div id="wrapper-duration-months" class="${pkgType === 'sessions' ? 'hidden' : ''}">
              <label class="label">Durée de l'Abonnement *</label>
              <select name="durationMonths" class="input font-bold">
                <option value="1" ${pkg.durationMonths === 1 ? 'selected' : ''}>1 Mois (30 jours)</option>
                <option value="2" ${pkg.durationMonths === 2 ? 'selected' : ''}>2 Mois (60 jours)</option>
                <option value="3" ${pkg.durationMonths === 3 ? 'selected' : ''}>3 Mois (Trimestre)</option>
                <option value="6" ${pkg.durationMonths === 6 ? 'selected' : ''}>6 Mois (Semestre)</option>
                <option value="12" ${pkg.durationMonths === 12 ? 'selected' : ''}>1 An (Annuel)</option>
              </select>
            </div>

            <div>
              <label class="label">Date de Début</label>
              <input type="date" name="startDate" value="${pkg.startDate || new Date().toISOString().split('T')[0]}" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label class="label">Tarif Total (FCFA) *</label>
              <input type="number" step="1000" name="totalAmount" value="${pkg.totalAmount || ''}" placeholder="ex: 150000" class="input font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Acompte Versé à l'Inscription (FCFA)</label>
              <input type="number" step="1000" name="amountPaid" value="${pkg.amountPaid || ''}" placeholder="ex: 100000" class="input font-bold" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button type="button" id="btn-cancel-client-modal" class="btn btn-secondary">Annuler</button>
          <button type="submit" id="btn-submit-client-form" class="btn btn-primary">
            <span>${isEdit ? 'Mettre à jour' : 'Enregistrer le Client'}</span>
          </button>
        </div>
      </form>
    `;
  },

  bindEvents(client) {
    const modalBackdrop = document.getElementById('client-form-modal');
    const closeBtnX = document.getElementById('btn-close-client-modal-x');
    const cancelBtn = document.getElementById('btn-cancel-client-modal');
    const form = document.getElementById('form-client-profile');

    const weightInput = document.getElementById('modal-weight');
    const heightInput = document.getElementById('modal-height');
    const ageInput = document.getElementById('modal-age');
    const genderSelect = document.getElementById('modal-gender');
    const fatInput = document.getElementById('modal-fat');
    const muscleInput = document.getElementById('modal-muscle');
    const visceralInput = document.getElementById('modal-visceral');
    const imcDisplay = document.getElementById('modal-imc-live');
    const riskBadge = document.getElementById('modal-risk-score-badge');

    const pkgTypeSelect = document.getElementById('modal-package-type');
    const wrapperSessions = document.getElementById('wrapper-sessions-count');
    const wrapperDuration = document.getElementById('wrapper-duration-months');

    pkgTypeSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'duration') {
        wrapperSessions?.classList.add('hidden');
        wrapperDuration?.classList.remove('hidden');
      } else {
        wrapperSessions?.classList.remove('hidden');
        wrapperDuration?.classList.add('hidden');
      }
    });

    const autoCalcBodyComp = () => {
      const w = parseFloat(weightInput?.value);
      const h = parseFloat(heightInput?.value);
      const age = parseInt(ageInput?.value, 10) || 30;
      const gender = genderSelect?.value || 'H';

      if (w && h && h > 0) {
        const comp = Calculations.calculateBodyComposition(w, h, age, gender);
        if (imcDisplay) imcDisplay.textContent = `IMC : ${comp.imc} (${comp.category})`;

        if (fatInput && (!fatInput.value || fatInput.dataset.autoFilled === 'true')) {
          fatInput.value = comp.fatPct;
          fatInput.dataset.autoFilled = 'true';
        }
        if (muscleInput && (!muscleInput.value || muscleInput.dataset.autoFilled === 'true')) {
          muscleInput.value = comp.musclePct;
          muscleInput.dataset.autoFilled = 'true';
        }
        if (visceralInput && (!visceralInput.value || visceralInput.dataset.autoFilled === 'true')) {
          visceralInput.value = comp.visceralFat;
          visceralInput.dataset.autoFilled = 'true';
        }
      } else {
        if (imcDisplay) imcDisplay.textContent = 'IMC : --';
      }
    };

    weightInput?.addEventListener('input', autoCalcBodyComp);
    heightInput?.addEventListener('input', autoCalcBodyComp);
    ageInput?.addEventListener('input', autoCalcBodyComp);
    genderSelect?.addEventListener('change', autoCalcBodyComp);

    fatInput?.addEventListener('input', () => { fatInput.dataset.autoFilled = 'false'; });
    muscleInput?.addEventListener('input', () => { muscleInput.dataset.autoFilled = 'false'; });

    autoCalcBodyComp();

    const updateRiskBadge = () => {
      let count = 0;
      form?.querySelectorAll('.modal-risk-cb').forEach(cb => { if (cb.checked) count++; });
      if (riskBadge) {
        riskBadge.textContent = `Score : ${count}/21`;
        if (count <= 3) riskBadge.className = 'badge badge-emerald text-xs';
        else if (count <= 8) riskBadge.className = 'badge badge-amber text-xs';
        else riskBadge.className = 'badge badge-rose text-xs';
      }
    };

    form?.querySelectorAll('.modal-risk-cb').forEach(cb => {
      cb.addEventListener('change', updateRiskBadge);
    });
    updateRiskBadge();

    const hide = () => this.close();
    closeBtnX?.addEventListener('click', hide);
    cancelBtn?.addEventListener('click', hide);
    modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) hide();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(form);

        const riskAnswers = {};
        form.querySelectorAll('.modal-risk-cb').forEach(cb => {
          if (cb.checked) riskAnswers[cb.getAttribute('data-id')] = true;
        });

        const totalAmt = parseFloat(formData.get('totalAmount')) || 0;
        const paidAmt = parseFloat(formData.get('amountPaid')) || 0;
        const pkgType = formData.get('packageType') || 'sessions';
        const durationMonths = parseInt(formData.get('durationMonths'), 10) || 1;
        const startDate = formData.get('startDate') || new Date().toISOString().split('T')[0];

        const clientData = {
          firstName: formData.get('firstName') || 'Client',
          lastName: formData.get('lastName') || '',
          gender: formData.get('gender') || 'H',
          age: parseInt(formData.get('age'), 10) || 30,
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          residence: formData.get('residence') || '',
          profession: formData.get('profession') || '',
          mainGoal: formData.get('mainGoal') || 'Perte de poids',
          targetWeight: parseFloat(formData.get('targetWeight')) || null,
          targetDate: formData.get('targetDate') || '',
          medicalNotes: {
            doctorRestrictions: formData.get('doctorRestrictions') || '',
            hasRestrictions: !!formData.get('doctorRestrictions')
          },
          emergencyContact: {
            name: formData.get('emergencyContact') || '',
            phone: ''
          },
          riskAnswers,
          package: {
            packageName: pkgType === 'duration' ? `Forfait ${durationMonths} Mois` : `Pack ${formData.get('totalSessions') || 10} Séances`,
            packageType: pkgType,
            durationMonths: durationMonths,
            totalSessions: parseInt(formData.get('totalSessions'), 10) || 10,
            sessionsUsed: client?.package?.sessionsUsed || 0,
            totalAmount: totalAmt,
            amountPaid: paidAmt,
            balanceDue: Math.max(0, totalAmt - paidAmt),
            startDate: startDate,
            expiryDate: pkgType === 'duration' ? stateManager.calculateExpiryDate(startDate, durationMonths) : '',
            paymentStatus: paidAmt >= totalAmt && totalAmt > 0 ? 'paid' : paidAmt > 0 ? 'partial' : 'pending'
          }
        };

        clientData.initialWeight = formData.get('initialWeight') || '';
        clientData.height = formData.get('height') || '';
        clientData.fatPct = formData.get('fatPct');
        clientData.musclePct = formData.get('musclePct');
        clientData.waist = formData.get('waist');
        clientData.hips = formData.get('hips');
        clientData.visceralFat = formData.get('visceralFat');

        if (client) {
          clientData.id = client.id;
        }

        const savedId = stateManager.saveClient(clientData);
        this.close();
        window.App.showToast(client ? 'Fiche mise à jour !' : 'Client enregistré avec succès !', 'success');
        window.App.openClientDetail(savedId || client.id);
      } catch (err) {
        console.error('Erreur lors de l\'enregistrement:', err);
        window.App.showToast('Erreur : ' + err.message, 'error');
      }
    });
  }
};
