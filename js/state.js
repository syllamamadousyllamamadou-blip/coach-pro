/**
 * state.js - Gestion d'État Centralisée pour COACH PRO
 * Profil coach personnalisable sans fausses données par défaut, historique des paiements (versements),
 * pointage des séances et programmes d'entraînement.
 */

import { Calculations } from './calculations.js';

const STORAGE_KEY = 'coach_pro_app_v7';

const EMPTY_COACH_PROFILE = {
  name: '',
  title: 'Coach Sportif Privé',
  brand: '',
  phone: '',
  email: '',
  city: '',
  motto: ''
};

class StateManager {
  constructor() {
    this.data = this.load();
    this.subscribers = [];
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            coachProfile: parsed.coachProfile || EMPTY_COACH_PROFILE,
            clients: Array.isArray(parsed.clients) ? parsed.clients : []
          };
        }
      }
    } catch (e) {
      console.error('Erreur chargement LocalStorage:', e);
    }
    const initial = {
      coachProfile: EMPTY_COACH_PROFILE,
      clients: []
    };
    this.saveData(initial);
    return initial;
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
      this.notify();
    } catch (e) {
      console.error('Erreur sauvegarde LocalStorage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(this.data); } catch (err) { console.error(err); }
    });
  }

  getCoachProfile() {
    return this.data?.coachProfile || EMPTY_COACH_PROFILE;
  }

  updateCoachProfile(profile) {
    const data = { ...this.data, coachProfile: { ...this.getCoachProfile(), ...profile } };
    this.saveData(data);
  }

  getClients() {
    return this.data?.clients || [];
  }

  getClientById(id) {
    return (this.getClients()).find(c => c.id === id) || null;
  }

  calculateExpiryDate(startDateStr, months) {
    const d = startDateStr ? new Date(startDateStr) : new Date();
    d.setMonth(d.getMonth() + parseInt(months, 10));
    return d.toISOString().split('T')[0];
  }

  saveClient(clientData) {
    try {
      const clients = [...(this.getClients())];
      let clientIndex = clients.findIndex(c => c.id === clientData.id);

      if (clientIndex >= 0) {
        clients[clientIndex] = {
          ...clients[clientIndex],
          ...clientData,
          updatedAt: new Date().toISOString()
        };
        this.saveData({ ...this.data, clients });
        return clientData.id;
      } else {
        const newId = 'client_' + Date.now();
        const weight = parseFloat(clientData.initialWeight) || 0;
        const height = parseFloat(clientData.height) || 0;
        const age = parseInt(clientData.age, 10) || 30;
        const gender = clientData.gender || 'H';

        const comps = Calculations.calculateBodyComposition(weight, height, age, gender, clientData.fatPct, clientData.musclePct);
        const mb = Calculations.calculateMB(weight, height, age, gender);
        const nap = clientData.lifestyle?.activityLevel || 1.375;
        const det = Calculations.calculateDET(mb, nap);

        const initialHistory = weight > 0 ? [{
          id: 'hist_' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          weight,
          height: height || 175,
          imc: comps.imc,
          imcCategory: comps.imcCategory,
          fatPct: comps.fatPct,
          fatKg: comps.fatKg,
          musclePct: comps.musclePct,
          muscleKg: comps.muscleKg,
          waterPct: comps.waterPct,
          waterKg: comps.waterKg,
          visceralFat: comps.visceralFat,
          waist: parseFloat(clientData.waist) || 0,
          hips: parseFloat(clientData.hips) || 0,
          mb,
          det,
          coachNotes: 'Bilan initial d\'entrée.'
        }] : [];

        const startDate = clientData.package?.startDate || new Date().toISOString().split('T')[0];
        const packageType = clientData.package?.packageType || 'sessions';
        const durationMonths = parseInt(clientData.package?.durationMonths, 10) || 1;
        const expiryDate = packageType === 'duration' ? this.calculateExpiryDate(startDate, durationMonths) : '';

        const initialPaid = parseFloat(clientData.package?.amountPaid) || 0;
        const totalAmt = parseFloat(clientData.package?.totalAmount) || 0;

        const initialPayments = initialPaid > 0 ? [{
          id: 'pay_' + Date.now(),
          date: startDate,
          amount: initialPaid,
          method: 'Versement Initial',
          notes: 'Acompte versé à l\'inscription'
        }] : [];

        const newClient = {
          id: newId,
          avatar: gender === 'F' ? 'F' : 'H',
          status: 'active',
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          gender: gender,
          age: age,
          phone: clientData.phone || '',
          email: clientData.email || '',
          residence: clientData.residence || '',
          profession: clientData.profession || '',
          mainGoal: clientData.mainGoal || 'Perte de poids',
          targetWeight: parseFloat(clientData.targetWeight) || null,
          targetDate: clientData.targetDate || '',
          history: initialHistory,
          // Programme défini librement par le coach
          program: clientData.program || {
            title: `Programme ${clientData.mainGoal || ''}`.trim(),
            frequency: '',
            recommendations: '',
            exercises: []
          },
          // Journal de pointage des séances
          attendanceLog: [],
          // Historique des Paiements / Versements
          paymentHistory: initialPayments,
          // 4 Objectifs Check-out Santé
          goals4D: clientData.goals4D || {
            health: '',
            look: '',
            fitness: '',
            wellness: ''
          },
          // Contre-indications & Interdictions médicales
          medicalNotes: clientData.medicalNotes || {
            hasDoctorRestrictions: false,
            doctorRestrictions: '',
            hasJointProsthesis: false,
            jointDetails: ''
          },
          emergencyContact: clientData.emergencyContact || { name: '', phone: '' },
          riskAssessment: {
            date: new Date().toISOString().split('T')[0],
            answers: clientData.riskAnswers || {}
          },
          lifestyle: clientData.lifestyle || { activityLevel: nap, sleepHours: 7, dietQuality: 'Équilibrée', waterLiters: (weight * 0.035).toFixed(1) },
          package: {
            packageName: clientData.package?.packageName || (packageType === 'duration' ? `Forfait ${durationMonths} Mois` : `Pack ${clientData.package?.totalSessions || 10} Séances`),
            packageType: packageType,
            durationMonths: durationMonths,
            totalSessions: parseInt(clientData.package?.totalSessions, 10) || 10,
            sessionsUsed: 0,
            totalAmount: totalAmt,
            amountPaid: initialPaid,
            balanceDue: Math.max(0, totalAmt - initialPaid),
            startDate: startDate,
            expiryDate: expiryDate,
            paymentStatus: initialPaid >= totalAmt && totalAmt > 0 ? 'paid' : initialPaid > 0 ? 'partial' : 'pending'
          },
          createdAt: new Date().toISOString()
        };

        clients.unshift(newClient);
        this.saveData({ ...this.data, clients });
        return newId;
      }
    } catch (err) {
      console.error('Erreur saveClient:', err);
      throw err;
    }
  }

  deleteClient(id) {
    const clients = (this.getClients()).filter(c => c.id !== id);
    this.saveData({ ...this.data, clients });
  }

  saveClientProgram(clientId, programData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const program = {
      title: programData.title || client.program?.title || '',
      frequency: programData.frequency !== undefined ? programData.frequency : (client.program?.frequency || ''),
      recommendations: programData.recommendations !== undefined ? programData.recommendations : (client.program?.recommendations || ''),
      exercises: Array.isArray(programData.exercises) ? programData.exercises : (client.program?.exercises || [])
    };

    const updatedClient = { ...client, program, updatedAt: new Date().toISOString() };
    this.saveClient(updatedClient);
    return program;
  }

  logSessionAttendance(clientId, sessionInfo = {}) {
    const client = this.getClientById(clientId);
    if (!client || !client.package) return null;

    const attendanceLog = Array.isArray(client.attendanceLog) ? [...client.attendanceLog] : [];
    const newLog = {
      id: 'att_' + Date.now(),
      date: sessionInfo.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      sessionType: sessionInfo.sessionType || 'Séance de Coaching',
      notes: sessionInfo.notes || 'Séance validée.',
      sessionNumber: (client.package.sessionsUsed || 0) + 1
    };

    attendanceLog.unshift(newLog);

    const currentUsed = client.package.sessionsUsed || 0;
    const total = client.package.totalSessions || 10;
    const newUsed = currentUsed + 1;

    const updatedPackage = { ...client.package, sessionsUsed: newUsed };
    
    let newStatus = client.status;
    if (client.package.packageType === 'sessions') {
      if (total - newUsed <= 2 && total - newUsed > 0) {
        newStatus = 'warning';
      } else if (total - newUsed <= 0) {
        newStatus = 'completed';
      }
    }

    const updatedClient = {
      ...client,
      package: updatedPackage,
      attendanceLog,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    this.saveClient(updatedClient);
    return { newLog, updatedPackage };
  }

  removeSessionAttendance(clientId, logId) {
    const client = this.getClientById(clientId);
    if (!client || !client.package) return null;

    const attendanceLog = (client.attendanceLog || []).filter(l => l.id !== logId);
    const newUsed = Math.max(0, (client.package.sessionsUsed || 1) - 1);
    const updatedPackage = { ...client.package, sessionsUsed: newUsed };

    const updatedClient = {
      ...client,
      package: updatedPackage,
      attendanceLog,
      status: 'active',
      updatedAt: new Date().toISOString()
    };

    this.saveClient(updatedClient);
    return updatedPackage;
  }

  /**
   * Enregistre un versement / acompte dans l'historique des paiements
   */
  addPayment(clientId, paymentData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const amount = parseFloat(paymentData.amount) || 0;
    if (amount <= 0) return null;

    const newPayment = {
      id: 'pay_' + Date.now(),
      date: paymentData.date || new Date().toISOString().split('T')[0],
      amount: amount,
      method: paymentData.method || 'Espèces',
      notes: paymentData.notes || ''
    };

    const paymentHistory = [newPayment, ...(client.paymentHistory || [])];
    
    // Recalcule le total payé et le solde restant dû
    const totalPaid = paymentHistory.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalAmount = parseFloat(client.package?.totalAmount) || 0;
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    const updatedPackage = {
      ...client.package,
      amountPaid: totalPaid,
      balanceDue: balanceDue,
      paymentStatus: totalPaid >= totalAmount && totalAmount > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'
    };

    const updatedClient = {
      ...client,
      package: updatedPackage,
      paymentHistory,
      updatedAt: new Date().toISOString()
    };

    this.saveClient(updatedClient);
    return { newPayment, updatedPackage };
  }

  removePayment(clientId, paymentId) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const paymentHistory = (client.paymentHistory || []).filter(p => p.id !== paymentId);
    const totalPaid = paymentHistory.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalAmount = parseFloat(client.package?.totalAmount) || 0;
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    const updatedPackage = {
      ...client.package,
      amountPaid: totalPaid,
      balanceDue: balanceDue,
      paymentStatus: totalPaid >= totalAmount && totalAmount > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'
    };

    const updatedClient = {
      ...client,
      package: updatedPackage,
      paymentHistory,
      updatedAt: new Date().toISOString()
    };

    this.saveClient(updatedClient);
    return updatedPackage;
  }

  addAssessmentToClient(clientId, assessmentData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const weight = parseFloat(assessmentData.weight) || 75;
    const height = parseFloat(assessmentData.height || client.history[0]?.height || 175);
    const age = client.age || 30;
    const gender = client.gender || 'H';

    const comps = Calculations.calculateBodyComposition(weight, height, age, gender, assessmentData.fatPct, assessmentData.musclePct);
    const mb = Calculations.calculateMB(weight, height, age, gender);
    const nap = client.lifestyle?.activityLevel || 1.375;
    const det = Calculations.calculateDET(mb, nap);

    const newAssessment = {
      id: 'hist_' + Date.now(),
      date: assessmentData.date || new Date().toISOString().split('T')[0],
      weight,
      height,
      imc: comps.imc,
      imcCategory: comps.imcCategory,
      fatPct: comps.fatPct,
      fatKg: comps.fatKg,
      musclePct: comps.musclePct,
      muscleKg: comps.muscleKg,
      waterPct: comps.waterPct,
      waterKg: comps.waterKg,
      visceralFat: comps.visceralFat,
      waist: parseFloat(assessmentData.waist) || 0,
      hips: parseFloat(assessmentData.hips) || 0,
      mb,
      det,
      coachNotes: assessmentData.coachNotes || ''
    };

    const history = [...(client.history || []), newAssessment].sort((a, b) => new Date(a.date) - new Date(b.date));

    this.saveClient({ ...client, history });
    return newAssessment;
  }

  updateBilling(clientId, packageData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const total = parseFloat(packageData.totalAmount) || 0;
    const totalPaid = (client.paymentHistory || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balance = Math.max(0, total - totalPaid);

    const packageType = packageData.packageType || client.package?.packageType || 'sessions';
    const startDate = packageData.startDate || client.package?.startDate || new Date().toISOString().split('T')[0];
    const durationMonths = parseInt(packageData.durationMonths, 10) || client.package?.durationMonths || 1;
    const expiryDate = packageType === 'duration' ? this.calculateExpiryDate(startDate, durationMonths) : '';

    const updatedPackage = {
      ...client.package,
      ...packageData,
      packageType,
      durationMonths,
      startDate,
      expiryDate,
      totalAmount: total,
      amountPaid: totalPaid,
      balanceDue: balance,
      paymentStatus: totalPaid >= total && total > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'
    };

    this.saveClient({ ...client, package: updatedPackage });
    return updatedPackage;
  }

  clearAllData() {
    this.saveData({
      coachProfile: EMPTY_COACH_PROFILE,
      clients: []
    });
  }
}

export const stateManager = new StateManager();
