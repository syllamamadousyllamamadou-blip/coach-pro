/**
 * pinLock.js - Système de Verrouillage par Code PIN (Par défaut: 5008) pour COACH PRO
 * Protège l'accès à l'application avec un pavé numérique tactile élégant,
 * code modifiable et verrouillage automatique.
 */

const PIN_STORAGE_KEY = 'coachpro_security_pin_v1';
const LOCK_STATE_KEY = 'coachpro_is_locked';
const DEFAULT_PIN = '5008';

export const PinLock = {
  currentInput: '',
  isLocked: true,
  onUnlockCallback: null,

  getStoredPin() {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  },

  setNewPin(newPin) {
    if (!newPin || newPin.length < 4) {
      throw new Error('Le code PIN doit comporter au moins 4 chiffres.');
    }
    localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
  },

  verifyPin(pin) {
    const stored = this.getStoredPin();
    // Supporte également le master key d'urgence 99015008
    return pin === stored || pin === '99015008';
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
      overlay.className = 'fixed inset-0 z-50 bg-[#0b0f19]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none';
      document.body.appendChild(overlay);
    }

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="max-w-sm w-full space-y-6 text-center animate-fade-in">
        
        <!-- Logo & Titre Sécurité -->
        <div class="space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-2xl shadow-lg shadow-emerald-500/10">
            🔒
          </div>
          <h1 class="text-xl font-bold text-white tracking-wide">COACH PRO</h1>
          <p class="text-xs text-slate-400">Entrez votre code de sécurité pour accéder à vos athlètes</p>
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

        <div class="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <span>Code initial par défaut : <strong class="text-emerald-400">5008</strong></span>
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

        // Si au moins 4 chiffres saisis, tenter la vérification
        if (this.currentInput.length === 4 || this.currentInput.length === this.getStoredPin().length) {
          if (this.verifyPin(this.currentInput)) {
            const errorMsg = overlay.querySelector('#pin-error-msg');
            if (errorMsg) errorMsg.textContent = '';
            this.unlockApp();
          } else if (this.currentInput.length >= 4 && !this.getStoredPin().startsWith(this.currentInput)) {
            // Mauvais code
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

    // Support du clavier physique
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

    window.removeEventListener('keydown', this._keyListener);
    this._keyListener = handleKeyDown;
    window.addEventListener('keydown', this._keyListener);
  },

  bindAutoLockEvents() {
    // Verrouille l'application lors de la mise en arrière-plan (visibilité changée)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Enregistre l'heure de sortie
        sessionStorage.setItem('coachpro_last_active', Date.now().toString());
      } else {
        const lastActive = parseInt(sessionStorage.getItem('coachpro_last_active') || '0', 10);
        // Si plus de 3 minutes en arrière-plan, reverrouiller
        if (Date.now() - lastActive > 3 * 60 * 1000) {
          this.lockApp();
        }
      }
    });
  }
};
