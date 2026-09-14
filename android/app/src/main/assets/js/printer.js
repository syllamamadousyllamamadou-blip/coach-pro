/**
 * printer.js - Module d'Impression Thermique 58mm & 80mm & A4 pour COACH PRO
 * Remplacement de "Athlete" par "Client", statut pondéral précis,
 * tickets avec QR Code de vérification, bilan comptable et fiche d'engagement.
 */

import { Calculations } from './calculations.js';
import { QRGenerator } from './qrGenerator.js';

export const ThermalPrinter = {
  sanitizeForThermal(str) {
    if (!str) return '';
    return str
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques/accents
      .replace(/—/g, '-')
      .replace(/•/g, '-')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E\n\r]/g, ''); // Ne garde que l'ASCII pur (32 à 126 + retours à la ligne)
  },

  /**
   * 1. Ticket Bilan Corporel & Métabolique
   */
  generateAssessmentReceipt(client, assessment, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const center = (text) => {
      const clean = this.sanitizeForThermal(text);
      const pad = Math.max(0, Math.floor((width - clean.length) / 2));
      return ' '.repeat(pad) + clean;
    };

    const row = (left, right) => {
      const l = this.sanitizeForThermal(left);
      const r = this.sanitizeForThermal(right);
      const space = Math.max(1, width - l.length - r.length);
      return l + ' '.repeat(space) + r;
    };

    const dateStr = assessment.date ? new Date(assessment.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const coachName = coach?.name ? coach.name.toUpperCase() : 'COACH SPORTIF';
    const imcInfo = Calculations.calculateIMC(assessment.weight, assessment.height || 175);
    const range = Calculations.calculateHealthyWeightRange(assessment.height || 175, assessment.weight);

    let out = [];
    out.push(center(coachName));
    if (coach?.phone) out.push(center(`Tel: ${coach.phone}`));
    if (coach?.city) out.push(center(coach.city));
    out.push(divider);
    out.push(center('BILAN DU CLIENT'));
    out.push(dashDivider);
    out.push(row('Client:', `${client.firstName} ${client.lastName}`));
    if (client.residence) out.push(row('Habitation:', client.residence));
    out.push(row('Date:', dateStr));
    out.push(row('Objectif:', client.mainGoal || 'Remise en forme'));
    out.push(dashDivider);

    out.push(center('COMPOSITION CORPORELLE'));
    out.push(row('Poids actuel:', `${assessment.weight} kg`));
    if (assessment.height) out.push(row('Taille:', `${assessment.height} cm`));
    out.push(row('IMC:', `${imcInfo.imc} (${imcInfo.category})`));
    out.push(row('Poids sante:', `${range.min} a ${range.max} kg`));
    
    if (assessment.fatPct) out.push(row('Masse grasse:', `${assessment.fatPct}% (${assessment.fatKg || '--'}kg)`));
    if (assessment.musclePct) out.push(row('Masse muscle:', `${assessment.musclePct}% (${assessment.muscleKg || '--'}kg)`));
    if (assessment.waist) out.push(row('Tour taille:', `${assessment.waist} cm`));

    // Tension artérielle si renseignée
    if (assessment.systolic && assessment.diastolic) {
      const bp = Calculations.calculateBloodPressure(assessment.systolic, assessment.diastolic, assessment.pulse);
      out.push(row('Tension art.:', `${bp.formatted}`));
      out.push(row('Statut tension:', `${bp.category}`));
    }

    out.push(dashDivider);
    out.push(center('METABOLISME & NUTRITION'));
    if (assessment.mb) out.push(row('Metabolisme base:', `${assessment.mb} kcal/j`));
    if (assessment.det) out.push(row('Depense totale:', `${assessment.det} kcal/j`));
    if (assessment.targetKcal) out.push(row('Cible calories:', `${assessment.targetKcal} kcal/j`));
    out.push(row('Eau requise:', `${(assessment.weight * 0.035).toFixed(1)} L/jour`));

    if (client.riskAssessment?.answers) {
      const score = Calculations.calculateRiskScore(client.riskAssessment.answers).score;
      out.push(row('Score sante (21F):', `${score}/21`));
    }

    out.push(divider);
    out.push(center(`CODE QR: ${client.id}`));
    out.push(center(coach?.motto || 'Votre transformation, votre mission !'));
    out.push('\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 2. Reçu d'Abonnement / Facturette en FCFA avec QR Code
   */
  generateSubscriptionReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const center = (text) => {
      const clean = this.sanitizeForThermal(text);
      const pad = Math.max(0, Math.floor((width - clean.length) / 2));
      return ' '.repeat(pad) + clean;
    };

    const row = (left, right) => {
      const l = this.sanitizeForThermal(left);
      const r = this.sanitizeForThermal(right);
      const space = Math.max(1, width - l.length - r.length);
      return l + ' '.repeat(space) + r;
    };

    const pkg = client.package || {};
    const dateStr = pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const coachName = coach?.name ? coach.name.toUpperCase() : 'COACH SPORTIF';

    let out = [];
    out.push(center(coachName));
    if (coach?.phone) out.push(center(`Tel: ${coach.phone}`));
    out.push(divider);
    out.push(center('RECU D\'ABONNEMENT'));
    out.push(dashDivider);
    out.push(row('Client:', `${client.firstName} ${client.lastName}`));
    if (client.profession) out.push(row('Profession:', client.profession));
    out.push(row('Date debut:', dateStr));
    if (pkg.expiryDate) {
      out.push(row('Echeance:', new Date(pkg.expiryDate).toLocaleDateString('fr-FR')));
    }
    out.push(dashDivider);

    out.push(row('Formule:', pkg.packageName || 'Forfait Coaching'));
    
    if (pkg.packageType === 'duration') {
      out.push(row('Duree pack:', `${pkg.durationMonths || 1} mois`));
      out.push(row('Seances faites:', `${pkg.sessionsUsed || 0} seances`));
    } else {
      const remaining = Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0));
      out.push(row('Total seances:', `${pkg.totalSessions || 0}`));
      out.push(row('Effectuees:', `${pkg.sessionsUsed || 0}`));
      out.push(row('Restantes:', `${remaining}`));
    }

    out.push(dashDivider);
    out.push(row('Tarif total:', Calculations.formatFCFA(pkg.totalAmount || 0)));
    out.push(row('Acompte verse:', Calculations.formatFCFA(pkg.amountPaid || 0)));
    out.push(row('Reste a payer:', Calculations.formatFCFA(pkg.balanceDue || 0)));
    out.push(row('Statut:', pkg.balanceDue <= 0 ? 'SOLDE REGLE' : 'PAIEMENT PARTIEL'));

    out.push(divider);
    out.push(center('VERIFICATION & SIGNATURES'));
    out.push(center(`QR SCAN: ${client.id}`));
    out.push('\n');
    out.push(row('Le Coach', 'Le Client'));
    out.push('\n');
    out.push(center('Merci pour votre confiance !'));
    out.push('\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 3. Fiche Programme d'Entraînement
   */
  generateProgramReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const center = (text) => {
      const clean = this.sanitizeForThermal(text);
      const pad = Math.max(0, Math.floor((width - clean.length) / 2));
      return ' '.repeat(pad) + clean;
    };

    const row = (left, right) => {
      const l = this.sanitizeForThermal(left);
      const r = this.sanitizeForThermal(right);
      const space = Math.max(1, width - l.length - r.length);
      return l + ' '.repeat(space) + r;
    };

    const coachName = coach?.name ? coach.name.toUpperCase() : 'COACH SPORTIF';
    const prog = client.program || {};

    let out = [];
    out.push(center(coachName));
    if (coach?.phone) out.push(center(`Tel: ${coach.phone}`));
    out.push(divider);
    out.push(center('PROGRAMME DU CLIENT'));
    out.push(dashDivider);
    out.push(row('Client:', `${client.firstName} ${client.lastName}`));
    out.push(row('Objectif:', client.mainGoal || 'Transformation'));
    out.push(row('Frequence:', prog.frequency || '3 seances / semaine'));
    out.push(dashDivider);

    out.push(center('EXERCICES PRESCRITS'));
    if (prog.exercises && prog.exercises.length > 0) {
      prog.exercises.forEach((ex, idx) => {
        out.push(`${idx + 1}. ${ex.name.toUpperCase()}`);
        out.push(row(`   Series x Reps:`, `${ex.sets} x ${ex.reps}`));
        if (ex.weight) out.push(row(`   Charge:`, ex.weight));
        if (ex.rest) out.push(row(`   Repos:`, ex.rest));
        if (ex.notes) out.push(`   > ${ex.notes}`);
      });
    } else if (prog.workoutPlan) {
      out.push(prog.workoutPlan);
    } else {
      out.push('Programme personnalise defini en seance.');
    }

    if (prog.recommendations) {
      out.push(dashDivider);
      out.push(center('CONSIGNES DU COACH'));
      out.push(prog.recommendations);
    }

    out.push(divider);
    out.push(center('Discipline & Regularite !'));
    out.push('\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 4. Ticket Thermique Bilan Comptable / Livre de Caisse
   */
  generateAccountingReceipt(coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const center = (text) => {
      const clean = this.sanitizeForThermal(text);
      const pad = Math.max(0, Math.floor((width - clean.length) / 2));
      return ' '.repeat(pad) + clean;
    };

    const row = (left, right) => {
      const l = this.sanitizeForThermal(left);
      const r = this.sanitizeForThermal(right);
      const space = Math.max(1, width - l.length - r.length);
      return l + ' '.repeat(space) + r;
    };

    const summary = stateManager.getFinancialSummary({ period: 'month' });
    const coachName = coach?.name ? coach.name.toUpperCase() : 'COACH SPORTIF';
    const dateStr = new Date().toLocaleDateString('fr-FR');

    let out = [];
    out.push(center(coachName));
    out.push(divider);
    out.push(center('BILAN COMPTABLE DU MOIS'));
    out.push(center(dateStr));
    out.push(dashDivider);

    out.push(row('Recettes totales:', Calculations.formatFCFA(summary.totalIncome)));
    out.push(row('Nb versements:', `${summary.incomes.length}`));
    out.push(row('Depenses totales:', Calculations.formatFCFA(summary.totalExpenses)));
    out.push(row('Nb charges:', `${summary.expenses.length}`));
    out.push(dashDivider);

    out.push(row('BENEFICE NET:', Calculations.formatFCFA(summary.netProfit)));
    out.push(row('Creances en attente:', Calculations.formatFCFA(summary.totalReceivables)));
    out.push(divider);
    out.push(center('COACH PRO COMPTABILITE'));
    out.push('\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  /**
   * 5. Ticket Thermique Fiche d'Engagement & Décharge
   */
  generateContractReceipt(client, coach, paperWidth = '58mm') {
    const width = paperWidth === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const dashDivider = '-'.repeat(width);

    const center = (text) => {
      const clean = this.sanitizeForThermal(text);
      const pad = Math.max(0, Math.floor((width - clean.length) / 2));
      return ' '.repeat(pad) + clean;
    };

    const row = (left, right) => {
      const l = this.sanitizeForThermal(left);
      const r = this.sanitizeForThermal(right);
      const space = Math.max(1, width - l.length - r.length);
      return l + ' '.repeat(space) + r;
    };

    const contract = client.contract || {};
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const coachName = coach?.name ? coach.name.toUpperCase() : 'COACH SPORTIF';

    let out = [];
    out.push(center(coachName));
    out.push(divider);
    out.push(center('ENGAGEMENT & DECHARGE'));
    out.push(center(`Ref: ${contract.contractNumber || 'CTR-' + client.id.slice(-6)}`));
    out.push(dashDivider);
    out.push(row('Client:', `${client.firstName} ${client.lastName}`));
    out.push(row('Date signature:', dateStr));
    out.push(dashDivider);
    out.push('Le client certifie etre apte a la');
    out.push('pratique sportive et decharge le');
    out.push('coach de toute responsabilite en');
    out.push('cas de probleme medical non declare.');
    out.push(dashDivider);
    out.push(row('Statut coach:', contract.coachSignature ? 'SIGNE [OK]' : 'EN ATTENTE'));
    out.push(row('Statut client:', contract.clientSignature ? 'SIGNE [OK]' : 'EN ATTENTE'));
    out.push(divider);
    out.push(center('Document Contractuel'));
    out.push('\n');
    return this.sanitizeForThermal(out.join('\n'));
  },

  isBluetoothSupported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  },

  cachedDevice: (typeof window !== 'undefined' && window.__COACH_BT_DEVICE__) ? window.__COACH_BT_DEVICE__ : null,
  cachedWriteChar: (typeof window !== 'undefined' && window.__COACH_BT_CHAR__) ? window.__COACH_BT_CHAR__ : null,

  KNOWN_SERVICES: [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / POS-58
    '0000ff00-0000-1000-8000-00805f9b34fb', // MPT-II / POS-80
    '0000fee7-0000-1000-8000-00805f9b34fb', // Wechat / Tencent POS
    '0000af30-0000-1000-8000-00805f9b34fb', // MPT-III / Xprinter
    '0000fff0-0000-1000-8000-00805f9b34fb', // POS-588
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Everycom / Rongta
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    '00001800-0000-1000-8000-00805f9b34fb',
    '00001801-0000-1000-8000-00805f9b34fb',
    '0000180a-0000-1000-8000-00805f9b34fb'
  ],

  getConnectedDeviceName() {
    const dev = this.cachedDevice || (typeof window !== 'undefined' ? window.__COACH_BT_DEVICE__ : null);
    return dev ? (dev.name || 'Imprimante Bluetooth') : null;
  },

  async findWriteCharacteristic(server) {
    let writeChar = null;

    for (const uuid of this.KNOWN_SERVICES) {
      try {
        const service = await server.getPrimaryService(uuid);
        if (service) {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              writeChar = c;
              break;
            }
          }
          if (writeChar) break;
        }
      } catch (e) {}
    }

    if (!writeChar) {
      try {
        const services = await server.getPrimaryServices();
        for (const s of services) {
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              writeChar = c;
              break;
            }
          }
          if (writeChar) break;
        }
      } catch (e) {}
    }

    return writeChar;
  },

  setCachedDevice(device, writeChar) {
    this.cachedDevice = device;
    this.cachedWriteChar = writeChar;
    if (typeof window !== 'undefined') {
      window.__COACH_BT_DEVICE__ = device;
      window.__COACH_BT_CHAR__ = writeChar;
    }
  },

  async getWritableCharacteristic(forceNew = false) {
    const dev = this.cachedDevice || (typeof window !== 'undefined' ? window.__COACH_BT_DEVICE__ : null);

    if (!forceNew && dev && dev.gatt && dev.gatt.connected && this.cachedWriteChar) {
      return { device: dev, writeChar: this.cachedWriteChar };
    }

    if (!forceNew && dev && dev.gatt) {
      try {
        const server = dev.gatt.connected ? dev.gatt : await dev.gatt.connect();
        const writeChar = await this.findWriteCharacteristic(server);
        if (writeChar) {
          this.setCachedDevice(dev, writeChar);
          return { device: dev, writeChar };
        }
      } catch (err) {}
    }

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: this.KNOWN_SERVICES
    });

    if (!device || !device.gatt) {
      throw new Error('Aucun appareil sélectionné.');
    }

    const server = await device.gatt.connect();
    const writeChar = await this.findWriteCharacteristic(server);

    if (!writeChar) {
      throw new Error('Imprimante connectée mais canal d\'écriture introuvable.');
    }

    this.setCachedDevice(device, writeChar);
    return { device, writeChar };
  },

  async printViaBluetooth(plainText, forceNewDevice = false) {
    if (!this.isBluetoothSupported()) {
      throw new Error("Le Bluetooth n'est pas supporté par ce navigateur.");
    }

    try {
      const { device, writeChar } = await this.getWritableCharacteristic(forceNewDevice);

      const sendChunk = async (bytes) => {
        if (writeChar.properties.writeWithoutResponse && typeof writeChar.writeValueWithoutResponse === 'function') {
          await writeChar.writeValueWithoutResponse(bytes);
        } else {
          await writeChar.writeValue(bytes);
        }
      };

      const initBuffer = new Uint8Array([0x1B, 0x40, 0x1C, 0x2E, 0x1B, 0x74, 0x00]);
      await sendChunk(initBuffer);
      await new Promise(r => setTimeout(r, 40));

      const cleanText = this.sanitizeForThermal(plainText);
      const encoder = new TextEncoder();
      const data = encoder.encode(cleanText);

      const chunkSize = 64;
      for (let i = 0; i < data.length; i += chunkSize) {
        await sendChunk(data.slice(i, i + chunkSize));
        await new Promise(r => setTimeout(r, 20));
      }

      await sendChunk(new Uint8Array([0x0A, 0x0A]));
      await new Promise(r => setTimeout(r, 40));

      return { success: true, deviceName: device.name || 'Imprimante Bluetooth' };
    } catch (err) {
      console.error('Erreur Bluetooth:', err);
      throw err;
    }
  },

  printViaAndroidBluetooth(plainText) {
    const cleanText = this.sanitizeForThermal(plainText);
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(cleanText);
    
    const fullBytes = new Uint8Array(textBytes.length + 12);
    fullBytes.set([0x1B, 0x40, 0x1C, 0x2E, 0x1B, 0x74, 0x00], 0);
    fullBytes.set(textBytes, 7);
    fullBytes.set([0x1B, 0x64, 0x03, 0x0A, 0x0A], 7 + textBytes.length);

    let binary = '';
    for (let i = 0; i < fullBytes.length; i++) {
      binary += String.fromCharCode(fullBytes[i]);
    }
    const b64 = btoa(binary);

    window.location.href = `rawbt:data:application/octet-stream;base64,${b64}`;
  }
};
