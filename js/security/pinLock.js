/**
 * pinLock.js - Système de Verrouillage & Sécurité COACH PRO
 * Protège l'accès à l'application avec un pavé numérique tactile élégant,
 * code modifiable et confirmation de suppression sensible.
 * Code de secours secret : 008 (aucun indice affiché).
 */

const PIN_STORAGE_KEY = 'coachpro_security_pin_v1';
const DEFAULT_PIN = '008';

export const PinLock = {
  currentInput: '',
  isLocked: true,
  onUnlockCallback: null,

  getStoredPin() {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  },

  setNewPin(newPin) {
    if (!newPin || newPin.length < 3) {
      throw new Error('Le code PIN doit comporter au moins 3 chiffres.');
    }
    localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
  },

  verifyPin(pin) {
    const stored = this.getStoredPin();
    // Code personnalisé ou code de secours secret '008'
    return pin === stored || pin === '008';
  },

  lockApp() {
    this.isLocked = true;
    this.currentInput = '';
    this.renderLockScreen();
  },

  unlockApp() {
    this.isLocked = false;
    this.currentInput = '';
    const modal = document.getElementById('pin-lock-overlay');
    if (modal) {
      modal.classList.add('hidden');
    }
    if (typeof this.onUnlockCallback === 'function') {
      this.onUnlockCallback();
    }
  },

  init(onUnlock) {
    this.onUnlockCallback = onUnlock;
    this.isLocked = true;
    this.renderLockScreen();
    this.bindAutoLockEvents();
  },

  renderLockScreen() {
    let overlay = document.getElementById('pin-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pin-lock-overlay';
      overlay.className = 'fixed inset-0 z-[90] bg-[#070b16] flex flex-col items-center justify-center p-4 select-none';
      document.body.appendChild(overlay);
    }

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="max-w-sm w-full space-y-6 text-center animate-fade-in">
        
        <!-- Logo & Titre Sécurité -->
        <div class="space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-500/10">
            🔒
          </div>
          <h1 class="text-2xl font-black text-white tracking-wide">COACH <span class="text-emerald-400">PRO</span></h1>
          <p class="text-xs text-slate-300 font-semibold">Entrez votre code PIN secret</p>
        </div>

        <!-- Indicateurs de Chiffres Saisis (Points) -->
        <div class="flex items-center justify-center gap-3 my-4" id="pin-dots-container">
          <div class="w-3.5 h-3.5 rounded-full border-2 border-slate-600 transition-all" id="pin-dot-0"></div>
          <div class="w-3.5 h-3.5 rounded-full border-2 border-slate-600 transition-all" id="pin-dot-1"></div>
          <div class="w-3.5 h-3.5 rounded-full border-2 border-slate-600 transition-all" id="pin-dot-2"></div>
          <div class="w-3.5 h-3.5 rounded-full border-2 border-slate-600 transition-all" id="pin-dot-3"></div>
        </div>

        <div id="pin-error-msg" class="text-xs text-rose-400 font-semibold min-h-[1.25rem]"></div>

        <!-- Pavé Numérique Tactile Pro -->
        <div class="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
            <button type="button" class="pin-key-btn" data-key="${num}">${num}</button>
          `).join('')}
          <button type="button" class="pin-key-btn text-xs text-slate-400" data-action="clear">Effacer</button>
          <button type="button" class="pin-key-btn" data-key="0">0</button>
          <button type="button" class="pin-key-btn text-rose-400 text-base font-bold" data-action="backspace">⌫</button>
        </div>
      </div>
    `;

    this.bindKeypadEvents(overlay);
  },

  bindKeypadEvents(overlay) {
    this.currentInput = '';
    const updateDots = () => {
      for (let i = 0; i < 4; i++) {
        const dot = overlay.querySelector(`#pin-dot-${i}`);
        if (dot) {
          if (i < this.currentInput.length) {
            dot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-400 shadow-sm shadow-emerald-400/50 scale-110 transition-all';
          } else {
            dot.className = 'w-3.5 h-3.5 rounded-full border-2 border-slate-600 transition-all';
          }
        }
      }
    };

    const handleDigit = (digit) => {
      if (this.currentInput.length < 8) {
        this.currentInput += digit;
        updateDots();

        // Si le code saisi est valide
        if (this.verifyPin(this.currentInput)) {
          const errorMsg = overlay.querySelector('#pin-error-msg');
          if (errorMsg) errorMsg.textContent = '';
          this.unlockApp();
          return;
        }

        // Si 4 chiffres ou plus et invalide
        if (this.currentInput.length >= 4 && !this.getStoredPin().startsWith(this.currentInput) && !('008'.startsWith(this.currentInput))) {
          const errorMsg = overlay.querySelector('#pin-error-msg');
          if (errorMsg) {
            errorMsg.textContent = 'Code incorrect. Réessayez.';
            overlay.querySelector('#pin-dots-container')?.classList.add('animate-shake');
            setTimeout(() => {
              overlay.querySelector('#pin-dots-container')?.classList.remove('animate-shake');
            }, 400);
          }
          setTimeout(() => {
            this.currentInput = '';
            updateDots();
          }, 300);
        }
      }
    };

    overlay.querySelectorAll('.pin-key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        const action = btn.dataset.action;

        if (key !== undefined) {
          handleDigit(key);
        } else if (action === 'backspace') {
          this.currentInput = this.currentInput.slice(0, -1);
          updateDots();
        } else if (action === 'clear') {
          this.currentInput = '';
          updateDots();
        }
      });
    });

    const handleKeyDown = (e) => {
      if (!this.isLocked) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        this.currentInput = this.currentInput.slice(0, -1);
        updateDots();
      } else if (e.key === 'Escape') {
        this.currentInput = '';
        updateDots();
      }
    };

    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this._keyListener);
      this._keyListener = handleKeyDown;
      window.addEventListener('keydown', this._keyListener);
    }
  },

  bindAutoLockEvents() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        sessionStorage.setItem('coachpro_last_active', Date.now().toString());
      } else {
        const lastActive = parseInt(sessionStorage.getItem('coachpro_last_active') || '0', 10);
        if (Date.now() - lastActive > 5 * 60 * 1000) {
          this.lockApp();
        }
      }
    });
  },

  /**
   * Modal de Confirmation Sécurisée par Code PIN pour Suppression / Réinitialisation
   */
  requestPinConfirmation({ title = 'Confirmation Requise', message = 'Veuillez entrer votre code PIN pour valider cette action.', onConfirm, onCancel }) {
    let modal = document.getElementById('pin-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pin-confirm-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-4 z-50 select-none';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    let enteredPin = '';

    modal.innerHTML = `
      <div class="glass-card max-w-sm w-full p-6 space-y-4 text-center border-t-4 border-rose-500 shadow-2xl animate-fade-in">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 text-xl shadow-lg shadow-rose-500/10">
          ⚠️
        </div>
        <div>
          <h3 class="text-base font-bold text-white">${title}</h3>
          <p class="text-xs text-slate-300 mt-1">${message}</p>
        </div>

        <div class="flex items-center justify-center gap-3 my-2" id="confirm-dots-container">
          <div class="w-3 h-3 rounded-full border-2 border-slate-600" id="conf-dot-0"></div>
          <div class="w-3 h-3 rounded-full border-2 border-slate-600" id="conf-dot-1"></div>
          <div class="w-3 h-3 rounded-full border-2 border-slate-600" id="conf-dot-2"></div>
          <div class="w-3 h-3 rounded-full border-2 border-slate-600" id="conf-dot-3"></div>
        </div>

        <div id="confirm-pin-error" class="text-xs text-rose-400 font-semibold min-h-[1.25rem]"></div>

        <div class="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
            <button type="button" class="pin-key-btn text-base h-12 rounded-xl conf-key-btn" data-key="${n}">${n}</button>
          `).join('')}
          <button type="button" class="pin-key-btn text-[11px] h-12 rounded-xl text-slate-400 conf-key-btn" data-action="clear">Effacer</button>
          <button type="button" class="pin-key-btn text-base h-12 rounded-xl conf-key-btn" data-key="0">0</button>
          <button type="button" class="pin-key-btn text-base h-12 rounded-xl text-rose-400 font-bold conf-key-btn" data-action="backspace">⌫</button>
        </div>

        <div class="pt-2 border-t border-slate-800 flex justify-end">
          <button type="button" id="btn-cancel-pin-confirm" class="btn btn-secondary btn-sm w-full font-bold">Annuler</button>
        </div>
      </div>
    `;

    const close = () => {
      modal.classList.add('hidden');
      if (typeof onCancel === 'function') onCancel();
    };

    modal.querySelector('#btn-cancel-pin-confirm')?.addEventListener('click', close);

    const updateDots = () => {
      for (let i = 0; i < 4; i++) {
        const dot = modal.querySelector(`#conf-dot-${i}`);
        if (dot) {
          if (i < enteredPin.length) {
            dot.className = 'w-3 h-3 rounded-full bg-rose-400 border-2 border-rose-400 scale-110 transition-all';
          } else {
            dot.className = 'w-3 h-3 rounded-full border-2 border-slate-600 transition-all';
          }
        }
      }
    };

    const handleDigit = (digit) => {
      if (enteredPin.length < 8) {
        enteredPin += digit;
        updateDots();

        if (this.verifyPin(enteredPin)) {
          modal.classList.add('hidden');
          if (typeof onConfirm === 'function') onConfirm();
          return;
        }

        if (enteredPin.length >= 4 && !this.getStoredPin().startsWith(enteredPin) && !('008'.startsWith(enteredPin))) {
          const err = modal.querySelector('#confirm-pin-error');
          if (err) err.textContent = 'Code PIN incorrect.';
          modal.querySelector('#confirm-dots-container')?.classList.add('animate-shake');
          setTimeout(() => {
            modal.querySelector('#confirm-dots-container')?.classList.remove('animate-shake');
          }, 400);
          setTimeout(() => {
            enteredPin = '';
            updateDots();
          }, 300);
        }
      }
    };

    modal.querySelectorAll('.conf-key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        const action = btn.dataset.action;
        if (key !== undefined) {
          handleDigit(key);
        } else if (action === 'backspace') {
          enteredPin = enteredPin.slice(0, -1);
          updateDots();
        } else if (action === 'clear') {
          enteredPin = '';
          updateDots();
        }
      });
    });
  }
};
