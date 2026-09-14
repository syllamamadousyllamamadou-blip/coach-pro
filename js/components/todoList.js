/**
 * todoList.js - Espace To-Do List & Suivi d'Objectifs par Athlète / Client pour COACH PRO
 * Permet au coach d'assigner des tâches datées (Nutrition, Hydratation, Entraînement, Pesées),
 * de suivre leur validation en temps réel et de les envoyer directement par WhatsApp.
 */

import { stateManager } from '../state.js';

export const TodoList = {
  activeFilter: 'all', // 'all', 'pending', 'completed'

  render(container, client) {
    if (!client) return;

    const todos = Array.isArray(client.todos) ? client.todos : [];
    const totalCount = todos.length;
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = totalCount - completedCount;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const filteredTodos = todos.filter(t => {
      if (this.activeFilter === 'pending') return !t.completed;
      if (this.activeFilter === 'completed') return t.completed;
      return true;
    });

    // Tri : non terminés d'abord, puis par date d'échéance
    filteredTodos.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });

    container.innerHTML = `
      <div class="todo-view space-y-5">
        
        <!-- En-tête Suivi des Objectifs & Barre de Progression -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-emerald text-xs">Suivi Quotidien</span>
                <span class="text-xs text-slate-300 font-semibold">${completedCount}/${totalCount} validé(s)</span>
              </div>
              <h2 class="text-xl font-bold text-white">To-Do List &amp; Objectifs Client</h2>
              <p class="text-xs text-slate-300 mt-0.5">Assignez des directives personnalisées avec date et suivez leur accomplissement</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-open-add-todo" class="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-500/20">
                <span>+</span>
                <span>Nouvelle Tâche</span>
              </button>
              <button id="btn-share-todos-whatsapp" class="btn btn-whatsapp btn-sm flex items-center gap-1.5 font-bold" ${todos.length === 0 ? 'disabled' : ''}>
                <span>💬</span>
                <span>Envoyer WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Barre de Progression Dynamique -->
          <div class="space-y-1.5 pt-1">
            <div class="flex justify-between text-xs font-semibold text-slate-300">
              <span>Taux d'accomplissement</span>
              <span class="text-emerald-400 font-bold font-mono">${progressPct}%</span>
            </div>
            <div class="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50" style="width: ${progressPct}%"></div>
            </div>
          </div>
        </div>

        <!-- Formulaire d'Ajout de Tâche (Masqué par défaut) -->
        <div id="panel-add-todo" class="glass-card p-5 hidden space-y-4 border border-emerald-500/40">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📝</span> Ajouter un Objectif pour ${client.firstName}
            </h3>
            <button id="btn-close-add-todo" class="text-xs text-slate-400 hover:text-white">✕ Fermer</button>
          </div>

          <!-- Raccourcis / Presets en 1 Clic -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Suggestions Rapides du Coach :</span>
            <div class="flex flex-wrap gap-1.5">
              ${[
                '💧 Boire 3L d\'eau / jour',
                '⚖️ Pesée à jeun lundi matin',
                '🔥 Séance Cardio HIIT 40min',
                '🥗 Respecter plan nutritionnel',
                '🥤 Shake protéiné post-séance',
                '🧘 15min d\'étirements & mobilité',
                '😴 Dormir au moins 8 heures'
              ].map(preset => `
                <button type="button" class="btn-todo-preset text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-emerald-400 text-slate-200 hover:text-white transition-colors" data-text="${preset}">
                  ${preset}
                </button>
              `).join('')}
            </div>
          </div>

          <form id="form-create-todo" class="space-y-4 pt-2">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="label">Intitulé de l'Objectif *</label>
                <input type="text" id="todo-title-input" placeholder="ex: Faire 10 000 pas aujourd'hui" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Date d'Échéance *</label>
                <input type="date" id="todo-date-input" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Priorité</label>
                <select id="todo-priority-input" class="input text-xs font-bold">
                  <option value="high">🔥 Haute Priorité (Important)</option>
                  <option value="normal" selected>⚡ Normal</option>
                  <option value="daily">📋 Routine Quotidienne</option>
                </select>
              </div>
              <div>
                <label class="label">Consigne / Note du Coach</label>
                <input type="text" id="todo-notes-input" placeholder="ex: Prendre en photo le repas si doute" class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" id="btn-cancel-create-todo" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">Enregistrer la Tâche</button>
            </div>
          </form>
        </div>

        <!-- Filtres & Liste des Tâches -->
        <div class="glass-card p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <button class="btn-filter-todo btn-xs btn ${this.activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}" data-filter="all">
                Toutes (${totalCount})
              </button>
              <button class="btn-filter-todo btn-xs btn ${this.activeFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" data-filter="pending">
                À faire (${pendingCount})
              </button>
              <button class="btn-filter-todo btn-xs btn ${this.activeFilter === 'completed' ? 'btn-primary' : 'btn-outline'}" data-filter="completed">
                Validées (${completedCount})
              </button>
            </div>

            <span class="text-[11px] text-slate-400 font-semibold hidden sm:inline">Cliquez sur une tâche pour la valider</span>
          </div>

          ${filteredTodos.length === 0 ? `
            <div class="p-8 text-center space-y-2">
              <div class="text-3xl">📋</div>
              <p class="text-xs text-slate-300 font-semibold">Aucun objectif dans cette catégorie.</p>
              <p class="text-[11px] text-slate-400">Cliquez sur <strong>+ Nouvelle Tâche</strong> ci-dessus pour ajouter des directives.</p>
            </div>
          ` : `
            <div class="space-y-2.5">
              ${filteredTodos.map(todo => {
                const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < new Date().toISOString().split('T')[0];
                const isToday = todo.dueDate === new Date().toISOString().split('T')[0];
                const dateLabel = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date libre';

                return `
                  <div class="flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    todo.completed 
                      ? 'bg-slate-900/40 border-slate-800 opacity-70' 
                      : isOverdue 
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-500/10'
                        : isToday
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }">
                    <div class="flex items-start gap-3 min-w-0 flex-1 cursor-pointer toggle-todo-item" data-id="${todo.id}">
                      <!-- Case à Cocher Personnalisée -->
                      <div class="w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                        todo.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black text-xs' 
                          : 'border-slate-600 hover:border-emerald-400'
                      }">
                        ${todo.completed ? '✓' : ''}
                      </div>

                      <div class="min-w-0 space-y-0.5">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-bold text-white ${todo.completed ? 'line-through text-slate-400' : ''}">
                            ${todo.title}
                          </span>
                          
                          ${todo.priority === 'high' ? `<span class="badge badge-rose text-[10px] py-0.5">Urgent</span>` : ''}
                          ${todo.priority === 'daily' ? `<span class="badge badge-cyan text-[10px] py-0.5">Quotidien</span>` : ''}
                          
                          ${isOverdue ? `<span class="badge badge-rose text-[10px] py-0.5 font-mono">En retard</span>` : ''}
                          ${isToday && !todo.completed ? `<span class="badge badge-emerald text-[10px] py-0.5 font-mono">Aujourd'hui</span>` : ''}
                        </div>

                        ${todo.notes ? `<p class="text-[11px] text-slate-400 italic">${todo.notes}</p>` : ''}
                        
                        <div class="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span>📅 Échéance : ${dateLabel}</span>
                          ${todo.completed && todo.completedAt ? `<span>• Validé le ${new Date(todo.completedAt).toLocaleDateString('fr-FR')}</span>` : ''}
                        </div>
                      </div>
                    </div>

                    <!-- Action Supprimer -->
                    <button class="text-slate-500 hover:text-rose-400 p-2 text-sm btn-delete-todo" data-id="${todo.id}" title="Supprimer la tâche">
                      🗑️
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const addPanel = container.querySelector('#panel-add-todo');
    const openBtn = container.querySelector('#btn-open-add-todo');
    const closeBtn = container.querySelector('#btn-close-add-todo');
    const cancelBtn = container.querySelector('#btn-cancel-create-todo');
    const createForm = container.querySelector('#form-create-todo');
    const titleInput = container.querySelector('#todo-title-input');

    const toggleAdd = (show) => {
      if (show) {
        addPanel?.classList.remove('hidden');
        titleInput?.focus();
      } else {
        addPanel?.classList.add('hidden');
      }
    };

    openBtn?.addEventListener('click', () => toggleAdd(true));
    closeBtn?.addEventListener('click', () => toggleAdd(false));
    cancelBtn?.addEventListener('click', () => toggleAdd(false));

    // Presets en 1 clic
    container.querySelectorAll('.btn-todo-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        if (titleInput) {
          titleInput.value = btn.dataset.text;
          toggleAdd(true);
        }
      });
    });

    // Formulaire de création
    createForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const dueDate = container.querySelector('#todo-date-input')?.value || new Date().toISOString().split('T')[0];
      const priority = container.querySelector('#todo-priority-input')?.value || 'normal';
      const notes = container.querySelector('#todo-notes-input')?.value.trim() || '';

      if (!title) return;

      const newTodo = {
        id: `todo_${Date.now()}`,
        title,
        dueDate,
        priority,
        notes,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      };

      const existing = Array.isArray(client.todos) ? client.todos : [];
      const updatedTodos = [newTodo, ...existing];

      stateManager.updateClient(client.id, { todos: updatedTodos });
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast('Objectif ajouté avec succès !', 'success');
      }

      const refreshed = stateManager.getClientById(client.id);
      this.render(container, refreshed);
    });

    // Toggle état complété
    container.querySelectorAll('.toggle-todo-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const existing = Array.isArray(client.todos) ? client.todos : [];
        const updated = existing.map(t => {
          if (t.id === id) {
            return {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null
            };
          }
          return t;
        });

        stateManager.updateClient(client.id, { todos: updated });
        const refreshed = stateManager.getClientById(client.id);
        this.render(container, refreshed);
      });
    });

    // Suppression d'une tâche
    container.querySelectorAll('.btn-delete-todo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Supprimer cette tâche de la liste ?')) {
          const existing = Array.isArray(client.todos) ? client.todos : [];
          const updated = existing.filter(t => t.id !== id);
          stateManager.updateClient(client.id, { todos: updated });
          const refreshed = stateManager.getClientById(client.id);
          this.render(container, refreshed);
        }
      });
    });

    // Filtres
    container.querySelectorAll('.btn-filter-todo').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.dataset.filter;
        const refreshed = stateManager.getClientById(client.id);
        this.render(container, refreshed);
      });
    });

    // Partage WhatsApp
    container.querySelector('#btn-share-todos-whatsapp')?.addEventListener('click', () => {
      const coach = stateManager.getCoachProfile();
      const todos = Array.isArray(client.todos) ? client.todos : [];
      if (todos.length === 0) return;

      const coachName = coach.name ? `Coach ${coach.name}` : 'Votre Coach Sportif';
      let msg = `📋 *OBJECTIFS & TO-DO LIST — COACH PRO*\n`;
      msg += `👤 *Client :* ${client.firstName} ${client.lastName}\n`;
      msg += `📅 *Date :* ${new Date().toLocaleDateString('fr-FR')}\n`;
      msg += `--------------------------------\n`;

      const pending = todos.filter(t => !t.completed);
      const done = todos.filter(t => t.completed);

      if (pending.length > 0) {
        msg += `\n*🎯 À ACCOMPLIR :*\n`;
        pending.forEach((t, i) => {
          msg += `${i + 1}. ⭕ ${t.title}${t.notes ? ` _(${t.notes})_` : ''}\n`;
        });
      }

      if (done.length > 0) {
        msg += `\n*✅ DÉJÀ VALIDÉ :*\n`;
        done.forEach((t, i) => {
          msg += `${i + 1}. ✔️ ~${t.title}~\n`;
        });
      }

      msg += `\n--------------------------------\n`;
      msg += `💪 *${coach.motto || 'Discipline et régularité !'}*\n`;
      msg += `_${coachName}_`;

      const phone = (client.phone || '').replace(/[^0-9]/g, '');
      const encoded = encodeURIComponent(msg);
      const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
    });
  }
};
