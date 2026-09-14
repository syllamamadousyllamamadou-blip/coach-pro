/**
 * state.js - Gestion d'État Centralisée pour COACH PRO
 * Profil coach personnalisable, suivi des athlètes, photos Avant/Maintenant,
 * tension artérielle, créneaux d'entraînement, comptabilité (recettes & dépenses),
 * fiches d'engagement signées et historique des forfaits en FCFA.
 */

import { Calculations } from './calculations.js';

const STORAGE_KEY = 'coach_pro_app_v8';

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
    this.subscribers = [];
    this.data = this.load();
  }

  load() {
    try {
      // 1. Tente de charger depuis la persistance native sécurisée (fichier Android interne)
      if (typeof window !== 'undefined' && window.CoachProNative && typeof window.CoachProNative.loadDatabase === 'function') {
        const nativeData = window.CoachProNative.loadDatabase();
        if (nativeData && nativeData.trim().startsWith('{')) {
          try {
            const parsedNative = JSON.parse(nativeData);
            if (parsedNative && Array.isArray(parsedNative.clients) && parsedNative.clients.length > 0) {
              console.log(`[CoachPro] Données restaurées depuis le stockage natif (${parsedNative.clients.length} clients)`);
              return {
                coachProfile: parsedNative.coachProfile || EMPTY_COACH_PROFILE,
                clients: parsedNative.clients,
                expenses: Array.isArray(parsedNative.expenses) ? parsedNative.expenses : [],
                appointments: Array.isArray(parsedNative.appointments) ? parsedNative.appointments : []
              };
            }
          } catch (ne) {
            console.warn('Erreur parsing native database:', ne);
          }
        }
      }

      // 2. Recherche dans toutes les clés LocalStorage possibles
      const legacyKeys = [STORAGE_KEY, 'coach_pro_app_v8', 'coach_pro_app_v7', 'coach_pro_app_v6', 'coach_pro_app_v5', 'coach_pro_state', 'coach_pro_data'];
      for (const key of legacyKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              const clients = Array.isArray(parsed.clients) ? parsed.clients : [];
              if (clients.length > 0 || parsed.coachProfile?.name) {
                const recovered = {
                  coachProfile: parsed.coachProfile || EMPTY_COACH_PROFILE,
                  clients: clients,
                  expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
                  appointments: Array.isArray(parsed.appointments) ? parsed.appointments : []
                };
                // Sauvegarder immédiatement dans la clé courante et dans le stockage natif
                this.saveData(recovered);
                return recovered;
              }
            }
          } catch (pe) {}
        }
      }
    } catch (e) {
      console.error('Erreur chargement LocalStorage/Native:', e);
    }

    const initial = {
      coachProfile: EMPTY_COACH_PROFILE,
      clients: [],
      expenses: [],
      appointments: []
    };
    this.saveData(initial);
    return initial;
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
      
      // Persistance native Android permanente (fichier coachpro_database.json)
      if (typeof window !== 'undefined' && window.CoachProNative && typeof window.CoachProNative.saveDatabase === 'function') {
        window.CoachProNative.saveDatabase(JSON.stringify(data));
      }

      this.notify();
    } catch (e) {
      console.error('Erreur sauvegarde LocalStorage/Native:', e);
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

  /* =========================================================================
     PROFIL DU COACH
     ========================================================================= */
  getCoachProfile() {
    return this.data?.coachProfile || EMPTY_COACH_PROFILE;
  }

  updateCoachProfile(profile) {
    const data = { ...this.data, coachProfile: { ...this.getCoachProfile(), ...profile } };
    this.saveData(data);
  }

  /* =========================================================================
     GESTION DES CLIENTS
     ========================================================================= */
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
          systolic: parseInt(clientData.systolic, 10) || null,
          diastolic: parseInt(clientData.diastolic, 10) || null,
          pulse: parseInt(clientData.pulse, 10) || null,
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
          method: clientData.package?.paymentMethod || 'Versement Initial',
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
          // Galerie Photos Avant / Après
          photos: clientData.photos || [],
          // Créneaux d'entraînement récurrents
          trainingSchedule: clientData.trainingSchedule || {
            days: ['Lundi', 'Mercredi', 'Vendredi'],
            times: { 'Lundi': '07:00', 'Mercredi': '07:00', 'Vendredi': '07:00' },
            location: clientData.residence || 'Salle / Domicile'
          },
          // Fiche d'engagement / Contrat légal signé
          contract: clientData.contract || null,
          // Programme sportif
          program: clientData.program || {
            title: `Programme ${clientData.mainGoal || ''}`.trim(),
            frequency: '3 séances / semaine',
            recommendations: '',
            exercises: []
          },
          // Journal de pointage des séances
          attendanceLog: [],
          // Historique des Paiements / Versements
          paymentHistory: initialPayments,
          // 4 Objectifs Santé
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

  /* =========================================================================
     PHOTOS AVANT / APRÈS
     ========================================================================= */
  addClientPhoto(clientId, photoData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const newPhoto = {
      id: 'photo_' + Date.now(),
      date: photoData.date || new Date().toISOString().split('T')[0],
      type: photoData.type || 'progress', // 'before', 'after', 'progress'
      pose: photoData.pose || 'face', // 'face', 'profile_left', 'profile_right', 'back'
      weight: parseFloat(photoData.weight) || (client.history[client.history.length - 1]?.weight || null),
      notes: photoData.notes || '',
      dataUrl: photoData.dataUrl
    };

    const photos = [newPhoto, ...(client.photos || [])];
    const updatedClient = { ...client, photos, updatedAt: new Date().toISOString() };
    this.saveClient(updatedClient);
    return newPhoto;
  }

  deleteClientPhoto(clientId, photoId) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const photos = (client.photos || []).filter(p => p.id !== photoId);
    const updatedClient = { ...client, photos, updatedAt: new Date().toISOString() };
    this.saveClient(updatedClient);
    return true;
  }

  /* =========================================================================
     CONTRAT & FICHE D'ENGAGEMENT SIGNÉE
     ========================================================================= */
  saveClientContract(clientId, contractData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const contract = {
      contractNumber: contractData.contractNumber || `CTR-${Date.now().toString().slice(-6)}`,
      signedAt: contractData.signedAt || new Date().toISOString(),
      termsAccepted: true,
      coachSignature: contractData.coachSignature || null,
      clientSignature: contractData.clientSignature || null,
      specialClauses: contractData.specialClauses || ''
    };

    const updatedClient = { ...client, contract, updatedAt: new Date().toISOString() };
    this.saveClient(updatedClient);
    return contract;
  }

  /* =========================================================================
     PLANNING & CRÉNEAUX RÉCURRENTS
     ========================================================================= */
  saveClientSchedule(clientId, scheduleData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const trainingSchedule = {
      days: Array.isArray(scheduleData.days) ? scheduleData.days : ['Lundi', 'Mercredi', 'Vendredi'],
      times: scheduleData.times || {},
      location: scheduleData.location || client.residence || 'Salle / Domicile',
      notes: scheduleData.notes || ''
    };

    const updatedClient = { ...client, trainingSchedule, updatedAt: new Date().toISOString() };
    this.saveClient(updatedClient);
    return trainingSchedule;
  }

  /* =========================================================================
     PROGRAMME D'ENTRAÎNEMENT
     ========================================================================= */
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

  /* =========================================================================
     POINTAGE DES SÉANCES
     ========================================================================= */
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

  /* =========================================================================
     VERSEMENTS / ACOMPTES CLIENTS
     ========================================================================= */
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

  /* =========================================================================
     RENOUVELLEMENT D'ABONNEMENT / NOUVEAU FORFAIT
     ========================================================================= */
  renewClientPackage(clientId, newPkgData) {
    const client = this.getClientById(clientId);
    if (!client) return null;

    // Archivage de l'ancien forfait dans l'historique
    const packageHistory = Array.isArray(client.packageHistory) ? [...client.packageHistory] : [];
    if (client.package && (client.package.totalAmount || client.package.totalSessions || client.package.durationMonths)) {
      packageHistory.unshift({
        ...client.package,
        archivedAt: new Date().toISOString()
      });
    }

    const startDate = newPkgData.startDate || new Date().toISOString().split('T')[0];
    const packageType = newPkgData.packageType || 'sessions';
    const durationMonths = parseInt(newPkgData.durationMonths, 10) || 1;
    const expiryDate = packageType === 'duration' ? this.calculateExpiryDate(startDate, durationMonths) : (newPkgData.expiryDate || '');
    const totalAmount = parseFloat(newPkgData.totalAmount) || 0;
    const amountPaid = parseFloat(newPkgData.amountPaid) || 0;
    const balanceDue = Math.max(0, totalAmount - amountPaid);

    const newPackage = {
      packageName: newPkgData.packageName || (packageType === 'duration' ? `Forfait ${durationMonths} Mois` : `Pack ${newPkgData.totalSessions || 10} Séances`),
      packageType: packageType,
      durationMonths: durationMonths,
      totalSessions: parseInt(newPkgData.totalSessions, 10) || 10,
      sessionsUsed: 0,
      totalAmount: totalAmount,
      amountPaid: amountPaid,
      balanceDue: balanceDue,
      startDate: startDate,
      expiryDate: expiryDate,
      paymentStatus: amountPaid >= totalAmount && totalAmount > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending'
    };

    // Enregistrement du versement de renouvellement
    let paymentHistory = client.paymentHistory || [];
    if (amountPaid > 0) {
      const renewalPay = {
        id: 'pay_' + Date.now(),
        date: startDate,
        amount: amountPaid,
        method: newPkgData.paymentMethod || 'Espèces',
        notes: `Renouvellement : ${newPackage.packageName}`
      };
      paymentHistory = [renewalPay, ...paymentHistory];
    }

    const updatedClient = {
      ...client,
      package: newPackage,
      packageHistory,
      paymentHistory,
      status: 'active',
      updatedAt: new Date().toISOString()
    };

    this.saveClient(updatedClient);
    return newPackage;
  }

  /* =========================================================================
     ATHLÈTES DU JOUR & GESTION DU PLANNING
     ========================================================================= */
  getClientsForToday() {
    const clients = this.getClients();
    const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayDay = daysMap[new Date().getDay()];

    return clients.filter(c => {
      // 1. Vérifier si l'athlète s'entraîne ce jour
      if (c.trainingSchedule?.days && Array.isArray(c.trainingSchedule.days)) {
        if (c.trainingSchedule.days.includes(todayDay)) return true;
      }
      return false;
    });
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

  /* =========================================================================
     ÉVALUATIONS CORPORELLES & TENSION ARTÉRIELLE
     ========================================================================= */
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
      systolic: parseInt(assessmentData.systolic, 10) || null,
      diastolic: parseInt(assessmentData.diastolic, 10) || null,
      pulse: parseInt(assessmentData.pulse, 10) || null,
      mb,
      det,
      coachNotes: assessmentData.coachNotes || ''
    };

    const history = [...(client.history || []), newAssessment].sort((a, b) => new Date(a.date) - new Date(b.date));

    this.saveClient({ ...client, history });
    return newAssessment;
  }

  /* =========================================================================
     COMPTABILITÉ DU COACH (Dépenses & Livre de Caisse)
     ========================================================================= */
  getExpenses() {
    return this.data?.expenses || [];
  }

  addExpense(expenseData) {
    const amount = parseFloat(expenseData.amount) || 0;
    if (amount <= 0) return null;

    const newExpense = {
      id: 'exp_' + Date.now(),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      category: expenseData.category || 'Matériel & Équipement',
      amount: amount,
      description: expenseData.description || '',
      paymentMethod: expenseData.paymentMethod || 'Espèces'
    };

    const expenses = [newExpense, ...(this.getExpenses())];
    this.saveData({ ...this.data, expenses });
    return newExpense;
  }

  deleteExpense(id) {
    const expenses = (this.getExpenses()).filter(e => e.id !== id);
    this.saveData({ ...this.data, expenses });
  }

  /**
   * Calcule le Bilan Financier avec Filtres
   */
  getFinancialSummary(filters = {}) {
    const clients = this.getClients();
    const expenses = this.getExpenses();

    // 1. Extraire tous les encaissements
    let allIncomes = [];
    clients.forEach(c => {
      (c.paymentHistory || []).forEach(p => {
        allIncomes.push({
          id: p.id,
          date: p.date,
          amount: parseFloat(p.amount) || 0,
          method: p.method || 'Espèces',
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          notes: p.notes || `Règlement ${c.package?.packageName || 'Forfait'}`
        });
      });
    });

    // 2. Appliquer les filtres
    if (filters.period) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (filters.period === 'today') {
        allIncomes = allIncomes.filter(i => i.date === todayStr);
      } else if (filters.period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        allIncomes = allIncomes.filter(i => i.date >= weekAgo);
      } else if (filters.period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        allIncomes = allIncomes.filter(i => i.date.startsWith(currentMonth));
      } else if (filters.period === 'year') {
        const currentYear = todayStr.slice(0, 4);
        allIncomes = allIncomes.filter(i => i.date.startsWith(currentYear));
      } else if (filters.startDate && filters.endDate) {
        allIncomes = allIncomes.filter(i => i.date >= filters.startDate && i.date <= filters.endDate);
      }
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      allIncomes = allIncomes.filter(i => i.method.toLowerCase().includes(filters.paymentMethod.toLowerCase()));
    }

    if (filters.clientId && filters.clientId !== 'all') {
      allIncomes = allIncomes.filter(i => i.clientId === filters.clientId);
    }

    // Filtrer les dépenses
    let filteredExpenses = [...expenses];
    if (filters.period) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (filters.period === 'today') {
        filteredExpenses = filteredExpenses.filter(e => e.date === todayStr);
      } else if (filters.period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filteredExpenses = filteredExpenses.filter(e => e.date >= weekAgo);
      } else if (filters.period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        filteredExpenses = filteredExpenses.filter(e => e.date.startsWith(currentMonth));
      } else if (filters.period === 'year') {
        const currentYear = todayStr.slice(0, 4);
        filteredExpenses = filteredExpenses.filter(e => e.date.startsWith(currentYear));
      } else if (filters.startDate && filters.endDate) {
        filteredExpenses = filteredExpenses.filter(e => e.date >= filters.startDate && e.date <= filters.endDate);
      }
    }

    const totalIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const totalReceivables = clients.reduce((sum, c) => sum + (parseFloat(c.package?.balanceDue) || 0), 0);

    return {
      incomes: allIncomes.sort((a, b) => new Date(b.date) - new Date(a.date)),
      expenses: filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)),
      totalIncome,
      totalExpenses,
      netProfit,
      totalReceivables
    };
  }

  /* =========================================================================
     RENDEZ-VOUS & PLANNING
     ========================================================================= */
  getAppointments() {
    return this.data?.appointments || [];
  }

  saveAppointment(aptData) {
    const appointments = [...(this.getAppointments())];
    const newApt = {
      id: aptData.id || 'apt_' + Date.now(),
      clientId: aptData.clientId,
      clientName: aptData.clientName || 'Athlète',
      date: aptData.date || new Date().toISOString().split('T')[0],
      time: aptData.time || '08:00',
      duration: aptData.duration || '60 min',
      location: aptData.location || 'Domicile / Salle',
      type: aptData.type || 'Coaching Privé',
      status: aptData.status || 'scheduled'
    };

    const idx = appointments.findIndex(a => a.id === newApt.id);
    if (idx >= 0) {
      appointments[idx] = newApt;
    } else {
      appointments.push(newApt);
    }

    this.saveData({ ...this.data, appointments });
    return newApt;
  }

  deleteAppointment(id) {
    const appointments = (this.getAppointments()).filter(a => a.id !== id);
    this.saveData({ ...this.data, appointments });
  }

  clearAllData() {
    this.saveData({
      coachProfile: EMPTY_COACH_PROFILE,
      clients: [],
      expenses: [],
      appointments: []
    });
  }
}

export const stateManager = new StateManager();
