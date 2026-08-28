/**
 * programs.js - Builder de Programmes d'Entraînement pour Coach Privé
 * Structure : Programme -> Semaine -> Séance -> Exercices (Séries, Reps, Charges, Repos, RPE, Consignes).
 */

import { stateManager } from '../state.js';

export const Programs = {
  activeClientId: null,

  render(container, clientId = null) {
    this.activeClientId = clientId;
    const clients = stateManager.getClients();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Créez ou sélectionnez un client pour lui assigner un programme d'entraînement sur-mesure.</p>
          <button id="btn-create-client-prog" class="btn btn-primary btn-sm">+ Créer un client</button>
        </div>
      `;
      container.querySelector('#btn-create-client-prog')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    const program = client.assignedProgram || {
      title: `Programme ${client.mainGoal}`,
      frequency: '3 séances / semaine',
      workouts: [
        {
          name: 'Séance 1 : Bas du Corps & Gainage',
          exercises: [
            { name: 'Squat Goblet (Haltère)', sets: 4, reps: '10-12', weight: '16 kg', rest: '60s', rpe: 8, notes: 'Pieds écartés, dos droit, genoux alignés.' },
            { name: 'Fentes Marchées', sets: 3, reps: '12 / jambe', weight: '2 x 10 kg', rest: '60s', rpe: 7, notes: 'Buste vertical, genou avant à 90°.' },
            { name: 'Gainage Planche', sets: 4, reps: '45 sec', weight: 'Poids du corps', rest: '45s', rpe: 7, notes: 'Rétroversion du bassin, nombril aspiré.' }
          ]
        },
        {
          name: 'Séance 2 : Haut du Corps & Posture',
          exercises: [
            { name: 'Développé Couché Haltères', sets: 4, reps: '10', weight: '2 x 14 kg', rest: '75s', rpe: 8, notes: 'Omoplates serrées, amplitude complète.' },
            { name: 'Rowing Buste Penché', sets: 4, reps: '12', weight: '2 x 12 kg', rest: '60s', rpe: 7, notes: 'Tirer vers les hanches, dos stable.' },
            { name: 'Développé Militaire Haltères', sets: 3, reps: '10', weight: '2 x 8 kg', rest: '60s', rpe: 7, notes: 'Gainer les abdominaux, ne pas cambrer.' }
          ]
        },
        {
          name: 'Séance 3 : Full Body & Cardio HIIT',
          exercises: [
            { name: 'Soulevé de Terre Roumain', sets: 3, reps: '12', weight: '2 x 16 kg', rest: '60s', rpe: 8, notes: 'Hanches en arrière, dos neutre.' },
            { name: 'Pompes (Push-ups)', sets: 3, reps: '12-15', weight: 'Poids du corps', rest: '45s', rpe: 7, notes: 'Corps gainé, coudes à 45°.' },
            { name: 'Burpees / Mountain Climbers', sets: 4, reps: '30 sec effort', weight: 'Cardio', rest: '30s', rpe: 9, notes: 'Rythme soutenu pour dépense calorique.' }
          ]
        }
      ]
    };

    container.innerHTML = `
      <div class="programs-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Builder d'Entraînement</span>
              <span class="text-xs text-slate-400">Programme personnalisé</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Programme de <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Objectif : ${client.mainGoal} • ${program.frequency}</p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Sélecteur Client -->
            <select id="select-prog-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName} (${c.mainGoal})
                </option>
              `).join('')}
            </select>
            
            <button id="btn-add-workout-session" class="btn btn-primary btn-sm">
              + Ajouter Séance
            </button>
          </div>
        </div>

        <!-- Liste des Séances d'Entraînement -->
        <div class="space-y-4" id="workouts-list-container">
          ${program.workouts.map((w, wIdx) => `
            <div class="glass-card p-5 space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-base">🏋️</span>
                  <input type="text" class="input font-bold text-sm bg-transparent border-none p-0 text-white w-auto" value="${w.name}" data-workout-idx="${wIdx}" />
                </div>
                <div class="flex items-center gap-2">
                  <button class="btn btn-secondary btn-xs" data-action="add-exercise" data-workout-idx="${wIdx}">
                    + Exercice
                  </button>
                  <button class="btn btn-outline btn-xs text-red-400" data-action="delete-workout" data-workout-idx="${wIdx}">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Tableau des Exercices de la Séance -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th class="p-2.5">Exercice</th>
                      <th class="p-2.5">Séries</th>
                      <th class="p-2.5">Répétitions</th>
                      <th class="p-2.5">Charge</th>
                      <th class="p-2.5">Repos</th>
                      <th class="p-2.5">RPE</th>
                      <th class="p-2.5">Consignes du Coach</th>
                      <th class="p-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800">
                    ${w.exercises.map((ex, exIdx) => `
                      <tr class="hover:bg-slate-800/40">
                        <td class="p-2 font-bold text-white">${ex.name}</td>
                        <td class="p-2 font-mono">${ex.sets}</td>
                        <td class="p-2 font-mono">${ex.reps}</td>
                        <td class="p-2 font-mono text-emerald-400 font-bold">${ex.weight || '--'}</td>
                        <td class="p-2 font-mono text-slate-400">${ex.rest || '60s'}</td>
                        <td class="p-2 font-mono"><span class="badge badge-neutral text-[10px]">RPE ${ex.rpe || 7}</span></td>
                        <td class="p-2 text-slate-400 text-[11px] italic max-w-xs truncate">${ex.notes || ''}</td>
                        <td class="p-2 text-right">
                          <button class="text-slate-500 hover:text-red-400 text-xs" data-action="delete-exercise" data-workout-idx="${wIdx}" data-exercise-idx="${exIdx}">✕</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Bouton Sauvegarder le Programme -->
        <div class="flex justify-end gap-2 pt-2">
          <button id="btn-save-full-program" class="btn btn-primary">
            💾 Enregistrer le Programme d'Entraînement
          </button>
        </div>
      </div>
    `;

    this.bindEvents(container, client, program);
  },

  bindEvents(container, client, program) {
    const selectClient = container.querySelector('#select-prog-client');
    selectClient?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    // Sauvegarder le programme
    container.querySelector('#btn-save-full-program')?.addEventListener('click', () => {
      stateManager.saveClientProgram(client.id, program);
      window.App.showToast('Programme d\'entraînement sauvegardé !', 'success');
    });

    // Ajouter une séance
    container.querySelector('#btn-add-workout-session')?.addEventListener('click', () => {
      const sessionName = prompt('Nom de la nouvelle séance (ex: Séance 4 : Cuisses & Ischios) :');
      if (sessionName) {
        program.workouts.push({
          name: sessionName,
          exercises: [
            { name: 'Squat Arrière', sets: 4, reps: '10', weight: '20 kg', rest: '75s', rpe: 8, notes: 'Descente contrôlée.' }
          ]
        });
        stateManager.saveClientProgram(client.id, program);
        this.render(container, client.id);
      }
    });

    // Supprimer une séance
    container.querySelectorAll('[data-action="delete-workout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const wIdx = parseInt(e.currentTarget.getAttribute('data-workout-idx'), 10);
        if (confirm('Supprimer cette séance ?')) {
          program.workouts.splice(wIdx, 1);
          stateManager.saveClientProgram(client.id, program);
          this.render(container, client.id);
        }
      });
    });

    // Ajouter un exercice à une séance
    container.querySelectorAll('[data-action="add-exercise"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const wIdx = parseInt(e.currentTarget.getAttribute('data-workout-idx'), 10);
        const exName = prompt('Nom de l\'exercice (ex: Développé Couché, Fentes, Tractions) :');
        if (exName) {
          program.workouts[wIdx].exercises.push({
            name: exName,
            sets: 3,
            reps: '10-12',
            weight: 'Poids libre',
            rest: '60s',
            rpe: 7,
            notes: 'Exécution propre et contrôlée.'
          });
          stateManager.saveClientProgram(client.id, program);
          this.render(container, client.id);
        }
      });
    });

    // Supprimer un exercice
    container.querySelectorAll('[data-action="delete-exercise"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const wIdx = parseInt(e.currentTarget.getAttribute('data-workout-idx'), 10);
        const exIdx = parseInt(e.currentTarget.getAttribute('data-exercise-idx'), 10);
        program.workouts[wIdx].exercises.splice(exIdx, 1);
        stateManager.saveClientProgram(client.id, program);
        this.render(container, client.id);
      });
    });
  }
};
