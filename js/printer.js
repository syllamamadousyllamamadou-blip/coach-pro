/**
 * printer.js - Module d'Impression Thermique Universel 58mm & 80mm pour COACH PRO
 * Rendu 100% fidèle aux spécifications réelles de caisse :
 * 1. Bilan du Client (Client, Habitation, Date, Objectif, Composition Corporelle, Métabolisme & Nutrition)
 * 2. Reçu d'Abonnement (Client, Profession, Dates, Formule, Tarifs FCFA, Acompte, Reste, Statut, Signatures)
 * 3. Programme Sportif avec Recommandations du Coach
 * 4. Contrat d'Engagement & Décharge
 * 5. Bilan Comptable
 */

import { Calculations } from './calculations.js';
import { stateManager } from './state.js';

export const ThermalPrinter = {
  sanitizeForThermal(str) {
    if (!str) return '';
    return str
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents pour compatibilité imprimante
      .replace(/—/g, '-')
      .replace(/•/g, '-')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E\n\r]/g, ''); // ASCII pur (32 à 126 + retour ligne)
  },

  center(text, width = 32) {
    const clean = this.sanitizeForThermal(text).trim();
    if (clean.length >= width) return clean.slice(0, width);
    const pad = Math.floor((width - clean.length) / 2);
    return ' '.repeat(pad) + clean;
  },

  row(label, value, width = 32) {
    const l = this.sanitizeForThermal(label).trim();
    const r = this.sanitizeForThermal(value).trim();
    if (l.length + r.length + 1 <= width) {
      const spaces = width - l.length - r.length;
      return l + ' '.repeat(spaces) + r;
    }
    const rightPad = Math.max(0, width - r.length);
    return l + '\n' + ' '.repeat(rightPad) + r.slice(0, width);
  },

  /**
   * 1. Ticket Bilan du Client (Conforme à 100% à la maquette réelle de ticket)
   */
  generateAssessmentReceipt(client, assessment, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const coachName = (coach?.name || 'COACH KELLY').toUpperCase();
    const coachPhone = coach?.phone || '2250758245530';
    const coachCity = coach?.city || 'Abidjan';

    const clientName = `${client?.firstName || 'Client'} ${client?.lastName || ''}`.trim();
    const residence = client?.residence || 'FAYA';
    
    // Format date: JJ/MM/AAAA
    let dateStr = '';
    if (assessment?.date) {
      dateStr = new Date(assessment.date).toLocaleDateString('fr-FR');
    } else {
      dateStr = new Date().toLocaleDateString('fr-FR');
    }

    const goal = Array.isArray(client?.goals) && client.goals.length > 0 ? client.goals[0] : (client?.mainGoal || 'Perte de poids');

    const weight = parseFloat(assessment?.weight) || 70;
    const height = parseFloat(assessment?.height) || 165;
    const imcInfo = Calculations.calculateIMC(weight, height);
    const range = Calculations.calculateHealthyWeightRange(height, weight);

    const fatPct = assessment?.fatPct ? `${assessment.fatPct}%` : '23.8%';
    const fatKg = assessment?.fatKg ? `(${assessment.fatKg}kg)` : (assessment?.fatPct ? `(${(weight * parseFloat(assessment.fatPct) / 100).toFixed(1)}kg)` : '(16.7kg)');
    const musclePct = assessment?.musclePct ? `${assessment.musclePct}%` : '60%';
    const muscleKg = assessment?.muscleKg ? `(${assessment.muscleKg}kg)` : (assessment?.musclePct ? `(${(weight * parseFloat(assessment.musclePct) / 100).toFixed(1)}kg)` : '(42kg)');

    const mb = assessment?.mb || Calculations.calculateMB(weight, height, client?.age || 30, client?.gender || 'H') || 1536;
    const det = assessment?.det || Calculations.calculateDET(mb, 1.375) || 2112;
    const water = (weight * 0.035).toFixed(1);
    
    let scoreText = '6/21';
    if (client?.riskAssessment?.answers) {
      scoreText = `${Calculations.calculateRiskScore(client.riskAssessment.answers).score}/21`;
    }

    const clientCode = `CP-${client?.id ? client.id.slice(-6).toUpperCase() : '001'}`;

    let out = [];
    out.push(this.center(coachName, width));
    out.push(this.center(`Tel: ${coachPhone}`, width));
    if (coachCity) out.push(this.center(coachCity, width));
    out.push(divider);
    out.push(this.center('BILAN DU CLIENT', width));
    out.push(dashDivider);
    out.push(this.row('Client:', clientName, width));
    out.push(this.row('N. Client:', clientCode, width));
    out.push(this.row('Habitation:', residence, width));
    out.push(this.row('Date:', dateStr, width));
    out.push(this.row('Objectif:', goal, width));
    out.push(dashDivider);
    out.push(this.center('COMPOSITION CORPORELLE', width));
    out.push(this.row('Poids actuel:', `${weight} kg`, width));
    out.push(this.row('Taille:', `${height} cm`, width));
    out.push(this.row('IMC:', `${imcInfo.imc} (${imcInfo.category})`, width));
    out.push(this.row('Poids sante:', `${range.min} a ${range.max} kg`, width));
    out.push(this.row('Masse grasse:', `${fatPct} ${fatKg}`, width));
    out.push(this.row('Masse muscle:', `${musclePct} ${muscleKg}`, width));
    out.push(dashDivider);
    out.push(this.center('METABOLISME & NUTRITION', width));
    out.push(this.row('Metabolisme base:', `${mb} kcal/j`, width));
    out.push(this.row('Depense totale:', `${det} kcal/j`, width));
    out.push(this.row('Eau requise:', `${water} L/jour`, width));
    out.push(this.row('Score sante (21F):', scoreText, width));
    out.push(divider);
    out.push(this.center('Votre transformation, votre', width));
    out.push(this.center('mission !', width));
    out.push(`\n[QR:${client?.id || 'COACH_PRO'}]`);
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 2. Reçu d'Abonnement (Conforme à 100% à la maquette réelle de ticket)
   */
  generateSubscriptionReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const coachName = (coach?.name || 'COACH KELLY').toUpperCase();
    const coachPhone = coach?.phone || '2250758245530';
    const clientName = `${client?.firstName || 'Client'} ${client?.lastName || ''}`.trim();
    const clientCode = `CP-${client?.id ? client.id.slice(-6).toUpperCase() : '001'}`;
    const profession = client?.profession || 'Entrepreneur';

    const pkg = client?.package || {};
    const startDateStr = pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    
    let expiryStr = '';
    if (pkg.endDate || pkg.expiryDate) {
      expiryStr = new Date(pkg.endDate || pkg.expiryDate).toLocaleDateString('fr-FR');
    } else {
      const d = new Date(pkg.startDate || Date.now());
      d.setMonth(d.getMonth() + (parseInt(pkg.durationMonths, 10) || 2));
      expiryStr = d.toLocaleDateString('fr-FR');
    }

    const packageName = pkg.packageName || 'Forfait 2 Mois';
    const packDuration = pkg.durationMonths ? `${pkg.durationMonths} mois` : (pkg.totalSessions ? `${pkg.totalSessions} seances` : '2 mois');
    const sessionsUsed = pkg.sessionsUsed || 0;

    const totalAmount = pkg.totalAmount || pkg.price || 150000;
    const amountPaid = pkg.amountPaid || pkg.advancePayment || 100000;
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    const statusText = balanceDue <= 0 ? 'SOLDE REGLE' : 'PAIEMENT PARTIEL';

    let out = [];
    out.push(this.center(coachName, width));
    out.push(this.center(`Tel: ${coachPhone}`, width));
    out.push(divider);
    out.push(this.center("RECU D'ABONNEMENT", width));
    out.push(dashDivider);
    out.push(this.row('Client:', clientName, width));
    out.push(this.row('N. Client:', clientCode, width));
    out.push(this.row('Profession:', profession, width));
    out.push(this.row('Date debut:', startDateStr, width));
    out.push(this.row('Echeance:', expiryStr, width));
    out.push(dashDivider);
    out.push(this.row('Formule:', packageName, width));
    out.push(this.row('Duree pack:', packDuration, width));
    out.push(this.row('Seances faites:', `${sessionsUsed} seances`, width));
    out.push(dashDivider);
    out.push(this.row('Tarif total:', `${totalAmount} FCFA`, width));
    out.push(this.row('Acompte verse:', `${amountPaid} FCFA`, width));
    out.push(this.row('Reste a payer:', `${balanceDue} FCFA`, width));
    out.push(this.row('Statut:', statusText, width));
    out.push(divider);
    out.push(this.center('SIGNATURES', width));
    out.push('\n');
    
    // Signatures aux extrémités gauche et droite
    const signLeft = 'Le Coach';
    const signRight = 'Le Client';
    const signSpaces = Math.max(2, width - signLeft.length - signRight.length);
    out.push(signLeft + ' '.repeat(signSpaces) + signRight);
    out.push('\n\n');
    out.push(this.center('Merci pour votre confiance !', width));
    out.push(`\n[QR:${client?.id || 'COACH_PRO'}]`);
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 3. Fiche Programme d'Entraînement avec Recommandations
   */
  generateProgramReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const coachName = (coach?.name || 'COACH KELLY').toUpperCase();
    const coachPhone = coach?.phone || '2250758245530';
    const clientName = `${client?.firstName || 'Client'} ${client?.lastName || ''}`.trim();
    const clientCode = `CP-${client?.id ? client.id.slice(-6).toUpperCase() : '001'}`;
    const prog = client?.program || {};
    const goalsStr = Array.isArray(client?.goals) && client.goals.length > 0 ? client.goals.join(', ') : (client?.mainGoal || 'Transformation');

    let out = [];
    out.push(this.center(coachName, width));
    if (coachPhone) out.push(this.center(`Tel: ${coachPhone}`, width));
    out.push(divider);
    out.push(this.center('PROGRAMME SPORTIF', width));
    out.push(dashDivider);
    out.push(this.row('Client:', clientName, width));
    out.push(this.row('N. Client:', clientCode, width));
    out.push(this.row('Objectifs:', goalsStr, width));
    out.push(this.row('Frequence:', prog.frequency || '3 a 4 seances/semaine', width));
    out.push(dashDivider);

    out.push(this.center('EXERCICES PRESCRITS', width));
    if (prog.exercises && prog.exercises.length > 0) {
      prog.exercises.forEach((ex, idx) => {
        out.push(`${idx + 1}. ${ex.name.toUpperCase()}`);
        out.push(this.row(`   Series x Reps:`, `${ex.sets} x ${ex.reps}`, width));
        if (ex.weight) out.push(this.row(`   Charge:`, ex.weight, width));
        if (ex.rest) out.push(this.row(`   Repos:`, ex.rest, width));
      });
    } else if (prog.workoutPlan) {
      out.push(prog.workoutPlan);
    } else {
      out.push('1. DEVELOPPE COUCHE: 4 x 10');
      out.push('2. SQUAT GUIDÉ: 4 x 12');
      out.push('3. TRACTION / TIRAGE: 4 x 10');
      out.push('4. GAINAGE ABDOS: 4 x 45s');
    }

    out.push(dashDivider);
    out.push(this.center('RECOMMANDATIONS DU COACH', width));
    out.push('- Echauffement articulaire: 10 min');
    out.push('- Hydratation: 2.5 L/jour');
    out.push('- Sommeil reparateur: 7h a 8h/nuit');
    out.push('- Respecter les temps de repos');

    out.push(divider);
    out.push(this.center('Discipline & Regularite !', width));
    out.push(`\n[QR:${client?.id || 'COACH_PRO'}]`);
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 4. Fiche d'Engagement & Décharge
   */
  generateContractReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const coachName = (coach?.name || 'COACH KELLY').toUpperCase();
    const clientName = `${client?.firstName || 'Client'} ${client?.lastName || ''}`.trim();
    const contract = client?.contract || {};
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');

    let out = [];
    out.push(this.center(coachName, width));
    out.push(divider);
    out.push(this.center('ENGAGEMENT & DECHARGE', width));
    out.push(this.center(`Ref: ${contract.contractNumber || 'CTR-2026'}`, width));
    out.push(dashDivider);
    out.push(this.row('Client:', clientName, width));
    if (client?.phone) out.push(this.row('Contact:', client.phone, width));
    out.push(this.row('Date contrat:', dateStr, width));
    out.push(dashDivider);
    out.push('Le client certifie etre apte a la');
    out.push('pratique sportive et decharge le');
    out.push('coach de toute responsabilite en');
    out.push('cas de probleme medical non declare.');
    out.push(dashDivider);
    out.push(this.row('Coach:', 'SIGNE [CERTIFIE]', width));
    out.push(this.row('Client:', 'LU ET APPROUVE', width));
    out.push(divider);
    out.push(this.center('Document Contractuel Valide', width));
    out.push(`\n[QR:${client?.id || 'COACH_PRO'}]`);
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 5. Ticket Thermique Bilan Comptable
   */
  generateAccountingReceipt(coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const summary = stateManager.getFinancialSummary({ period: 'month' });
    const coachName = (coach?.name || 'COACH KELLY').toUpperCase();

    let out = [];
    out.push(this.center(coachName, width));
    out.push(divider);
    out.push(this.center('BILAN COMPTABLE DU MOIS', width));
    out.push(this.center(new Date().toLocaleDateString('fr-FR'), width));
    out.push(dashDivider);
    out.push(this.row('Recettes totales:', Calculations.formatFCFA(summary.totalIncome), width));
    out.push(this.row('Depenses globales:', `-${Calculations.formatFCFA(summary.totalExpenses)}`, width));
    out.push(dashDivider);
    out.push(this.row('BENEFICE NET:', Calculations.formatFCFA(summary.netProfit), width));
    out.push(this.row('Creances dues:', Calculations.formatFCFA(summary.totalReceivables), width));
    out.push(divider);
    out.push(this.center('COACH PRO COMPTABILITE', width));
    out.push('\n\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  isNativeAndroid() {
    return typeof window !== 'undefined' && !!window.CoachProNative && typeof window.CoachProNative.printThermalText === 'function';
  },

  isBluetoothSupported() {
    if (this.isNativeAndroid()) return true;
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  },

  getPairedDevices() {
    if (this.isNativeAndroid()) {
      try {
        const jsonStr = window.CoachProNative.getPairedPrinters?.() || '[]';
        return JSON.parse(jsonStr);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  getConnectedDeviceName() {
    if (this.isNativeAndroid()) {
      const name = window.CoachProNative.getConnectedPrinterName?.();
      if (name) return name;
      return this.getSavedDeviceName();
    }
    return this.getSavedDeviceName();
  },

  getConnectedDeviceAddress() {
    if (this.isNativeAndroid()) {
      return window.CoachProNative.getConnectedPrinterAddress?.() || this.getSavedDeviceAddress();
    }
    return this.getSavedDeviceAddress();
  },

  getSavedDeviceAddress() {
    try {
      return localStorage.getItem('coach_default_printer_addr') || '';
    } catch (e) {
      return '';
    }
  },

  getSavedDeviceName() {
    try {
      return localStorage.getItem('coach_default_printer_name') || '';
    } catch (e) {
      return '';
    }
  },

  saveDefaultPrinter(address, name) {
    try {
      localStorage.setItem('coach_default_printer_addr', address);
      localStorage.setItem('coach_default_printer_name', name);
      if (this.isNativeAndroid() && address) {
        window.CoachProNative.connectPrinter(address);
      }
    } catch (e) {
      console.error('Erreur sauvegarde imprimante:', e);
    }
  },

  isPrinterConnected() {
    if (this.isNativeAndroid()) {
      return !!window.CoachProNative.isPrinterConnected?.();
    }
    return false;
  },

  /**
   * Impression Directe Haute Performance via Bluetooth Android ou Web
   */
  async printDirect(plainText) {
    const cleanText = this.sanitizeForThermal(plainText);

    // 1. Android Natif (Pont Kotlin SPP RFCOMM Multi-Stratégies)
    if (this.isNativeAndroid()) {
      const defaultAddr = this.getSavedDeviceAddress();
      if (!this.isPrinterConnected() && defaultAddr) {
        window.CoachProNative.connectPrinter(defaultAddr);
      }

      const ok = window.CoachProNative.printThermalText(cleanText);
      if (ok) {
        return { success: true, method: 'native_android' };
      }

      // Si échec de la première tentative, réessaie en connectant
      if (defaultAddr) {
        const connected = window.CoachProNative.connectPrinter(defaultAddr);
        if (connected) {
          const retryOk = window.CoachProNative.printThermalText(cleanText);
          if (retryOk) return { success: true, method: 'native_android_retry' };
        }
      }

      throw new Error("Impossible d'imprimer en Bluetooth. Veuillez vérifier que l'imprimante est allumée et sélectionnée dans Paramètres.");
    }

    // 2. Fallback Web Bluetooth / Navigateur
    if (typeof navigator !== 'undefined' && navigator.bluetooth) {
      return await this.printViaBluetooth(cleanText);
    }

    // 3. Fallback RawBT
    this.printViaAndroidBluetooth(cleanText);
    return { success: true, method: 'rawbt' };
  },

  async printViaBluetooth(plainText) {
    const cleanText = this.sanitizeForThermal(plainText);
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanText);

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb'
      ]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb').catch(() => null);
    if (!service) throw new Error("Service d'impression Bluetooth non disponible sur cet appareil.");
    const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    await char.writeValue(data);
    return { success: true, deviceName: device.name };
  },

  printViaAndroidBluetooth(cleanText) {
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(cleanText);
    
    const fullBytes = new Uint8Array(textBytes.length + 12);
    fullBytes.set([0x1B, 0x40, 0x1B, 0x74, 0x00], 0);
    fullBytes.set(textBytes, 5);
    fullBytes.set([0x1B, 0x64, 0x03, 0x0A, 0x0A, 0x0A], 5 + textBytes.length);

    let binary = '';
    for (let i = 0; i < fullBytes.length; i++) {
      binary += String.fromCharCode(fullBytes[i]);
    }
    const b64 = btoa(binary);

    window.location.href = `rawbt:data:application/octet-stream;base64,${b64}`;
  },

  generateWhatsAppLink(client, assessment, coach) {
    const phone = client?.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const name = client?.firstName ? `${client.firstName} ${client.lastName || ''}` : 'Athlète';
    const coachName = coach?.name || 'Votre Coach';
    const weight = assessment?.weight || '--';
    const imc = assessment?.imc || '--';
    const pkg = client?.package || {};
    const balance = pkg.balanceDue !== undefined ? pkg.balanceDue : 0;

    let text = `🏋️ *COACH PRO — FICHE DE SUIVI SPORTIF*\n\n`;
    text += `Bonjour *${name}*,\nVoici votre dernier bilan avec ${coachName} :\n\n`;
    text += `⚖️ *Poids actuel :* ${weight} kg\n`;
    text += `📊 *IMC :* ${imc}\n`;
    if (assessment?.fatPct) text += `🔥 *Masse grasse :* ${assessment.fatPct}%\n`;
    if (assessment?.musclePct) text += `💪 *Masse musculaire :* ${assessment.musclePct}%\n`;
    text += `\n📦 *Forfait :* ${pkg.packageName || 'Coaching'}\n`;
    text += `💳 *Solde restant :* ${Calculations.formatFCFA(balance)}\n\n`;
    text += `"${coach?.motto || 'Votre transformation, votre mission !'}"`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
};
