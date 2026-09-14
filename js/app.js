/**
 * app.js - Contrôleur Principal & Routeur COACH PRO
 * Intègre la Sécurité PIN 5008, la Licence, la Comptabilité, le Scanner QR,
 * la To-Do list, les Photos et l'Impression Bluetooth MPT.
 */

import { stateManager } from './state.js';
import { Dashboard } from './components/dashboard.js';
import { ClientList } from './components/clientList.js';
import { ClientDetail } from './components/clientDetail.js';
import { ClientModal } from './components/clientModal.js';
import { ThermalModal } from './components/thermalModal.js';
import { QuickTools } from './components/quickTools.js';
import { SettingsModal } from './components/settingsModal.js';
import { Accounting } from './components/accounting.js';
import { QRScannerComponent } from './components/qrScanner.js';
import { ContractModal } from './components/contractModal.js';
import { TodoList } from './components/todoList.js';
import { ThermalPrinter } from './printer.js';
import { PinLock } from './security/pinLock.js';
import { LicenseManager } from './security/license.js';

class Application {
  constructor() {
    this.currentRoute = 'dashboard';
    this.selectedClientId = null;
    this.selectedSubTab = 'overview';
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // 1. Contrôle de Licence Cryptographique (Essai 5j, 1 Mois, 1 An, À Vie)
      LicenseManager.init(() => {
        // 2. Verrouillage PIN d'accès sécurisé
        PinLock.init(() => {
          this.startApp();
        });
      });
    } catch (err) {
      console.error('Erreur initialisation COACH PRO:', err);
      this.startApp();
    }
  }

  startApp() {
    this.bindGlobalNavigation();
    this.renderCurrentView();

    stateManager.subscribe(() => {
      this.renderCurrentView();
    });
  }

  navigateTo(route, params = {}) {
    this.currentRoute = route;
    if (params.clientId) this.selectedClientId = params.clientId;
    if (params.subTab) this.selectedSubTab = params.subTab;

    document.querySelectorAll('.nav-link, .mobile-nav-btn').forEach(link => {
      const target = link.getAttribute('data-nav');
      if (target === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    this.renderCurrentView();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    try {
      switch (this.currentRoute) {
        case 'clients':
          ClientList.render(mainContainer);
          break;
        case 'clientDetail':
          ClientDetail.render(mainContainer, this.selectedClientId, this.selectedSubTab);
          break;
        case 'accounting':
          Accounting.render(mainContainer);
          break;
        case 'dashboard':
        default:
          Dashboard.render(mainContainer);
          break;
      }
    } catch (err) {
      console.error('Erreur de rendu de la vue:', err);
      mainContainer.innerHTML = `
        <div class="glass-card p-8 text-center space-y-4">
          <h2 class="text-lg font-bold text-white">Tableau de Bord COACH PRO</h2>
          <p class="text-xs text-slate-400">Cliquez ci-dessous pour actualiser le tableau de bord :</p>
          <button onclick="window.App.navigateTo('dashboard')" class="btn btn-primary btn-sm font-bold">Afficher le Tableau de Bord</button>
        </div>
      `;
    }
  }

  openClientDetail(clientId, subTab = 'overview') {
    this.selectedClientId = clientId;
    this.selectedSubTab = subTab;
    this.navigateTo('clientDetail', { clientId, subTab });
  }

  openNewClientModal() {
    ClientModal.open(null);
  }

  openEditClientModal(clientId) {
    ClientModal.open(clientId);
  }

  openThermalModal(clientId, customAssessment = null, receiptType = 'assessment') {
    ThermalModal.open(clientId, customAssessment, receiptType);
  }

  openQuickToolsModal() {
    QuickTools.open();
  }

  openSettingsModal() {
    SettingsModal.open();
  }

  openQRScanner() {
    QRScannerComponent.openModal();
  }

  openContractModal(clientId) {
    ContractModal.open(clientId);
  }

  sendWhatsAppToClient(clientId, assessment = null) {
    const client = stateManager.getClientById(clientId);
    if (!client) return;
    const targetAssessment = assessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {});
    const coach = stateManager.getCoachProfile();
    const url = ThermalPrinter.generateWhatsAppLink(client, targetAssessment, coach);
    window.open(url, '_blank');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10' :
                       type === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10' : 'bg-slate-800 text-slate-200 border-slate-700';
    
    toast.className = `p-3.5 rounded-xl border ${colorClass} text-xs font-bold shadow-2xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 backdrop-blur-md`;
    toast.innerHTML = `
      <span class="text-sm">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  bindGlobalNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-nav');
        this.navigateTo(route);
      });
    });

    document.getElementById('header-btn-new-client')?.addEventListener('click', () => {
      this.openNewClientModal();
    });

    document.getElementById('header-btn-quick-tools')?.addEventListener('click', () => {
      this.openQuickToolsModal();
    });

    document.getElementById('header-btn-scan-qr')?.addEventListener('click', () => {
      this.openQRScanner();
    });
  }
}

// Instance globale
window.App = new Application();
window.ThermalPrinter = ThermalPrinter;
window.PinLock = PinLock;
window.LicenseManager = LicenseManager;
window.ThermalModal = ThermalModal;
window.ContractModal = ContractModal;
window.QRScannerComponent = QRScannerComponent;
window.TodoList = TodoList;
window.stateManager = stateManager;

// Démarrage robuste & infaillible (Web, Mobile, PWA & Android WebView)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });
} else {
  window.App.init();
}
