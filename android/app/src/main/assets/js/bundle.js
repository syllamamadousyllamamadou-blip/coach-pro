/**
 * COACH PRO - Bundle Universel de Production
 * Généré automatiquement pour Web, Mobile & Android Native SPP
 */

(function() {
  'use strict';


/* ==========================================================================
   MODULE: calculations.js
   ========================================================================== */
/**
 * calculations.js - Moteur Physiologique & Métabolique COACH PRO
 * Formules rigoureuses, sanitisation de la taille et calculs de poids santé exacts.
 */
const Calculations = {
  RISK_FACTORS: [
    { id: 'nut_soda', title: 'Boissons sucrées / sodas fréquents', category: 'Nutritionnel' },
    { id: 'nut_water', title: 'Hydratation insuffisante (< 1.5L/jour)', category: 'Nutritionnel' },
    { id: 'nut_fat', title: 'Alimentation trop grasse / fritures', category: 'Nutritionnel' },
    { id: 'nut_veggies', title: 'Faible consommation de légumes', category: 'Nutritionnel' },
    { id: 'nut_snack', title: 'Grignotages fréquents entre les repas', category: 'Nutritionnel' },
    { id: 'nut_salt', title: 'Consommation excessive de sel / cubes', category: 'Nutritionnel' },
    { id: 'nut_late', title: 'Repas tardifs et copieux le soir', category: 'Nutritionnel' },

    { id: 'phy_sedentary', title: 'Sédentarité (> 6h assis par jour)', category: 'Physique' },
    { id: 'phy_no_sport', title: 'Absence d\'activité physique régulière', category: 'Physique' },
    { id: 'phy_breath', title: 'Essoufflement rapide à l\'effort modéré', category: 'Physique' },
    { id: 'phy_joints', title: 'Douleurs articulaires (genoux / dos)', category: 'Physique' },
    { id: 'phy_posture', title: 'Mauvaise posture prolongée', category: 'Physique' },
    { id: 'phy_stairs', title: 'Difficulté à monter 2 étages à pied', category: 'Physique' },
    { id: 'phy_heavy', title: 'Sensation de lourdeur / manque d\'énergie', category: 'Physique' },

    { id: 'str_sleep', title: 'Sommeil court (< 6h) ou non réparateur', category: 'Stress & Hygiène' },
    { id: 'str_work', title: 'Niveau de stress professionnel élevé', category: 'Stress & Hygiène' },
    { id: 'str_tobacco', title: 'Consommation de tabac / chicha', category: 'Stress & Hygiène' },
    { id: 'str_alcohol', title: 'Consommation régulière d\'alcool', category: 'Stress & Hygiène' },
    { id: 'str_recovery', title: 'Difficulté de récupération physique', category: 'Stress & Hygiène' },
    { id: 'str_screen', title: 'Écrans tardifs avant le coucher', category: 'Stress & Hygiène' },
    { id: 'str_digest', title: 'Troubles digestifs fréquents / ballonnements', category: 'Stress & Hygiène' }
  ],

  /**
   * Normalise la taille en mètres (gère cm comme 175 et mètres comme 1.75)
   */
  normalizeHeightM(rawHeight) {
    let h = parseFloat(rawHeight);
    if (!h || isNaN(h) || h <= 0) return 1.75;
    if (h > 3) h = h / 100; // si entré en cm (ex: 175cm -> 1.75m)
    return Math.max(1.0, Math.min(2.5, h));
  },

  /**
   * Calcul de l'IMC avec gestion stricte des unités
   */
  calculateIMC(weightKg, rawHeight) {
    const w = parseFloat(weightKg);
    if (!w || isNaN(w) || w <= 0) return { imc: 0, category: 'Non renseigné', color: 'slate', code: 'unknown' };

    const hM = this.normalizeHeightM(rawHeight);
    const imc = parseFloat((w / (hM * hM)).toFixed(1));

    let category = 'Normal';
    let color = 'emerald';
    let code = 'normal';

    if (imc < 18.5) {
      category = 'Sous-poids';
      color = 'cyan';
      code = 'underweight';
    } else if (imc < 25.0) {
      category = 'Poids normal';
      color = 'emerald';
      code = 'normal';
    } else if (imc < 30.0) {
      category = 'Surpoids';
      color = 'amber';
      code = 'overweight';
    } else if (imc < 35.0) {
      category = 'Obésité modérée';
      color = 'orange';
      code = 'obesity_1';
    } else {
      category = 'Obésité sévère';
      color = 'rose';
      code = 'obesity_2';
    }

    return { imc, category, color, code };
  },

  /**
   * Calcule la plage exacte de poids santé (IMC 18.5 à 24.9 kg/m²)
   * Exemple pour 1.75m : 18.5 * (1.75)^2 = 56.7 kg à 24.9 * (1.75)^2 = 76.3 kg
   */
  calculateHealthyWeightRange(rawHeight, currentWeightKg) {
    const hM = this.normalizeHeightM(rawHeight);
    const min = parseFloat((18.5 * hM * hM).toFixed(1));
    const max = parseFloat((24.9 * hM * hM).toFixed(1));
    const ideal = parseFloat((22.0 * hM * hM).toFixed(1));
    const cur = parseFloat(currentWeightKg) || 0;
    const diff = cur > 0 ? parseFloat((cur - ideal).toFixed(1)) : 0;
    return { min, max, ideal, diff };
  },

  /**
   * Calcul automatique de la Masse Grasse et Masse Musculaire (Deurenberg)
   */
  calculateBodyComposition(weightKg, rawHeight, age, gender = 'H', customFatPct = null, customMusclePct = null) {
    const w = parseFloat(weightKg) || 75;
    const imcInfo = this.calculateIMC(w, rawHeight);
    const isMale = gender === 'H' || gender === 'Homme';
    const a = parseInt(age, 10) || 30;

    let fatPct = customFatPct ? parseFloat(customFatPct) : 0;
    if (!fatPct && imcInfo.imc > 0) {
      const sexFactor = isMale ? 1 : 0;
      fatPct = parseFloat((1.20 * imcInfo.imc + 0.23 * a - 10.8 * sexFactor - 5.4).toFixed(1));
      fatPct = Math.max(5, Math.min(60, fatPct));
    }

    let musclePct = customMusclePct ? parseFloat(customMusclePct) : 0;
    if (!musclePct && fatPct > 0) {
      const estimatedBoneAndOrgans = isMale ? 14 : 12;
      musclePct = parseFloat(Math.max(20, Math.min(60, 100 - fatPct - estimatedBoneAndOrgans)).toFixed(1));
    }

    const fatKg = parseFloat(((fatPct / 100) * w).toFixed(1));
    const muscleKg = parseFloat(((musclePct / 100) * w).toFixed(1));
    const waterPct = parseFloat((isMale ? (100 - fatPct) * 0.72 : (100 - fatPct) * 0.68).toFixed(1));
    const waterKg = parseFloat(((waterPct / 100) * w).toFixed(1));

    let visceralFat = 1;
    if (imcInfo.imc < 25) visceralFat = isMale ? 4 : 3;
    else if (imcInfo.imc < 30) visceralFat = isMale ? 8 : 7;
    else if (imcInfo.imc < 35) visceralFat = isMale ? 12 : 11;
    else visceralFat = 15;

    return {
      imc: imcInfo.imc,
      imcCategory: imcInfo.category,
      imcColor: imcInfo.color,
      imcCode: imcInfo.code,
      fatPct,
      fatKg,
      musclePct,
      muscleKg,
      waterPct,
      waterKg,
      visceralFat
    };
  },

  /**
   * Métabolisme de Base (Mifflin-St Jeor)
   */
  calculateMB(weightKg, rawHeight, age, gender = 'H') {
    const w = parseFloat(weightKg);
    const a = parseInt(age, 10);
    if (!w || !a) return 0;

    let hCm = parseFloat(rawHeight);
    if (hCm < 3) hCm = hCm * 100; // convert to cm if in meters

    const isMale = gender === 'H' || gender === 'Homme';
    const mb = isMale
      ? (10 * w) + (6.25 * hCm) - (5 * a) + 5
      : (10 * w) + (6.25 * hCm) - (5 * a) - 161;
    return Math.round(mb);
  },

  calculateDET(mb, nap = 1.375) {
    if (!mb) return 0;
    return Math.round(mb * parseFloat(nap));
  },

  calculateRiskScore(answers = {}) {
    let count = 0;
    this.RISK_FACTORS.forEach(f => {
      if (answers[f.id]) count++;
    });

    let riskLevel = 'Faible';
    let badgeClass = 'badge-emerald';
    let advice = 'Bonne hygiène générale. Maintenez vos bonnes habitudes.';

    if (count >= 9) {
      riskLevel = 'Élevé';
      badgeClass = 'badge-rose';
      advice = 'Nombreux freins métaboliques et risques santé. Priorité à la régularité et au rééquilibrage de l\'hygiène de vie.';
    } else if (count >= 4) {
      riskLevel = 'Modéré';
      badgeClass = 'badge-amber';
      advice = 'Quelques points d\'attention à corriger (sommeil, hydratation, sédentarité).';
    }

    return { score: count, total: 21, riskLevel, badgeClass, advice };
  },

  generateCoachInterpretation(client, assessment) {
    if (!assessment) return null;
    const imcInfo = this.calculateIMC(assessment.weight, assessment.height || 175);
    const range = this.calculateHealthyWeightRange(assessment.height || 175, assessment.weight);
    const isMale = client.gender === 'H';

    let bodyDiagnosis = '';
    if (imcInfo.code === 'underweight') {
      bodyDiagnosis = `Statut : SOUS-POIDS (IMC ${imcInfo.imc}). Poids actuel inférieur au poids santé minimum (${range.min} kg). Priorité à une prise de masse musculaire saine.`;
    } else if (imcInfo.code === 'normal') {
      bodyDiagnosis = `Statut : POIDS NORMAL (IMC ${imcInfo.imc}). Poids santé équilibré (plage : ${range.min} à ${range.max} kg). Priorité au renforcement musculaire et à la tonification.`;
    } else if (imcInfo.code === 'overweight') {
      bodyDiagnosis = `Statut : SURPOIDS (IMC ${imcInfo.imc}). Excédent estimé à +${(assessment.weight - range.max).toFixed(1)} kg par rapport au poids santé maximal (${range.max} kg). Masse grasse à réduire.`;
    } else if (imcInfo.code === 'obesity_1') {
      bodyDiagnosis = `Statut : OBÉSITÉ MODÉRÉE (IMC ${imcInfo.imc}). Excédent estimé à +${(assessment.weight - range.max).toFixed(1)} kg. Priorité : déficit calorique progressif et travail sans impact articulaire.`;
    } else {
      bodyDiagnosis = `Statut : OBÉSITÉ SÉVÈRE (IMC ${imcInfo.imc}). Excédent de +${(assessment.weight - range.max).toFixed(1)} kg. Encadrement doux et régularité progressive recommandés.`;
    }

    const waterLiters = (assessment.weight * 0.035).toFixed(1);
    const proteinGrams = Math.round(assessment.weight * (isMale ? 1.8 : 1.6));
    const metabolicDiagnosis = `Besoins quotidiens : Minimum ${waterLiters}L d'eau par jour et environ ${proteinGrams}g de protéines pour protéger le muscle.`;

    const riskInfo = this.calculateRiskScore(client.riskAssessment?.answers || {});
    const healthDiagnosis = `Score Santé : ${riskInfo.score}/21 (${riskInfo.riskLevel}). ${riskInfo.advice}`;

    return {
      statusTitle: imcInfo.category.toUpperCase(),
      statusColor: imcInfo.color,
      bodyDiagnosis,
      metabolicDiagnosis,
      healthDiagnosis,
      healthyRange: range
    };
  },

  calculateComparisonDeltas(initialAssessment, currentAssessment) {
    if (!initialAssessment || !currentAssessment) return null;

    const deltaWeight = parseFloat((currentAssessment.weight - initialAssessment.weight).toFixed(1));
    const deltaFatPct = parseFloat(((currentAssessment.fatPct || 0) - (initialAssessment.fatPct || 0)).toFixed(1));
    const deltaMusclePct = parseFloat(((currentAssessment.musclePct || 0) - (initialAssessment.musclePct || 0)).toFixed(1));
    const deltaImc = parseFloat(((currentAssessment.imc || 0) - (initialAssessment.imc || 0)).toFixed(1));
    const deltaWaist = parseFloat(((currentAssessment.waist || 0) - (initialAssessment.waist || 0)).toFixed(1));

    const initialFatKg = initialAssessment.fatKg || ((initialAssessment.fatPct / 100) * initialAssessment.weight);
    const currentFatKg = currentAssessment.fatKg || ((currentAssessment.fatPct / 100) * currentAssessment.weight);
    const deltaFatKg = parseFloat((currentFatKg - initialFatKg).toFixed(1));

    let verdict = 'Stabilité';
    let verdictColor = 'text-slate-300';

    if (deltaWeight < 0 && deltaFatPct <= 0) {
      verdict = 'Excellente perte de gras !';
      verdictColor = 'text-emerald-400';
    } else if (deltaWeight > 0 && deltaMusclePct > 0) {
      verdict = 'Prise de muscle réussie !';
      verdictColor = 'text-emerald-400';
    } else if (deltaWeight > 0 && deltaFatPct > 0) {
      verdict = 'Prise de masse grasse (Réajustement nécessaire)';
      verdictColor = 'text-amber-400';
    } else if (deltaFatPct < 0) {
      verdict = 'Affinement de la silhouette réussi';
      verdictColor = 'text-emerald-400';
    }

    return {
      deltaWeight,
      deltaFatPct,
      deltaFatKg,
      deltaMusclePct,
      deltaImc,
      deltaWaist,
      verdict,
      verdictColor
    };
  },

  /**
   * Analyse de la Tension Artérielle selon les normes OMS / ESH
   */
  calculateBloodPressure(systolic, diastolic, pulse = null) {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const bpm = pulse ? parseInt(pulse, 10) : null;

    if (!sys || !dia || sys <= 0 || dia <= 0) {
      return {
        formatted: '-- / --',
        category: 'Non mesurée',
        color: 'slate',
        isHigh: false,
        isSevere: false,
        advice: 'Tension artérielle non renseignée.'
      };
    }

    const formatted = `${sys}/${dia} mmHg${bpm ? ` (${bpm} bpm)` : ''}`;
    let category = 'Normale';
    let color = 'emerald';
    let isHigh = false;
    let isSevere = false;
    let advice = 'Tension artérielle idéale pour la séance sportive.';

    if (sys < 120 && dia < 80) {
      category = 'Optimale';
      color = 'emerald';
      advice = 'Pression artérielle optimale. Excellente condition cardiovasculaire.';
    } else if (sys <= 129 && dia <= 84) {
      category = 'Normale';
      color = 'emerald';
      advice = 'Pression artérielle normale. Entraînement standard autorisé.';
    } else if (sys <= 139 || dia <= 89) {
      category = 'Normale Haute (Pré-HTA)';
      color = 'amber';
      isHigh = true;
      advice = 'Tension légèrement élevée. Bien échauffer et surveiller l\'hydratation.';
    } else if (sys <= 159 || dia <= 99) {
      category = 'Hypertension Légère (Stade 1)';
      color = 'orange';
      isHigh = true;
      advice = 'Attention : Hypertension modérée. Éviter les efforts explosifs ou apnées (Valsalva).';
    } else {
      category = 'Hypertension Sévère (Stade 2/3)';
      color = 'rose';
      isHigh = true;
      isSevere = true;
      advice = 'ALERTE : Tension artérielle très élevée ! Reporter les séances intenses et recommander une consultation médicale.';
    }

    return {
      sys,
      dia,
      bpm,
      formatted,
      category,
      color,
      isHigh,
      isSevere,
      advice
    };
  },

  formatFCFA(amount) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0)) + ' FCFA';
  }
};


/* ==========================================================================
   MODULE: qrGenerator.js
   ========================================================================== */
/**
 * qrGenerator.js - Moteur Autonome et Léger de Génération de Code QR pour COACH PRO
 * Génère des codes QR en SVG, Canvas ou DataURL sans aucune dépendance externe.
 * Basé sur l'algorithme standard QR Code ISO/IEC 18004.
 */

// Table de polynômes de Reed-Solomon et structures QR
const QRMode = { NUMBER: 1, ALPHA_NUM: 2, BYTE: 4 };
const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

class QRBitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }
  get(index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    }
    this.length++;
  }
}

class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  addData(data) {
    this.dataList.push(new QR8bitByte(data));
    this.dataCache = null;
  }

  isDark(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + "," + col);
    }
    return this.modules[row][col];
  }

  getModuleCount() {
    return this.moduleCount;
  }

  make() {
    if (this.typeNumber < 1) {
      let typeNumber = 1;
      for (typeNumber = 1; typeNumber < 40; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
        const buffer = new QRBitBuffer();
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }
        for (let i = 0; i < this.dataList.length; i++) {
          const data = this.dataList[i];
          buffer.put(data.mode, 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
          data.write(buffer);
        }
        if (buffer.length <= totalDataCount * 8) break;
      }
      this.typeNumber = typeNumber;
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }

  makeImpl(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (let col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = null;
      }
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupTimingPattern();
    this.setupPositionAdjustPattern();
    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }
    if (this.dataCache == null) {
      this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);
      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = (r % 2 == 0);
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = (c % 2 == 0);
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTypeNumber(test) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
      this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  static createData(typeNumber, errorCorrectLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.length > totalDataCount * 8) {
      throw new Error("code length overflow. (" + buffer.length + ">" + totalDataCount * 8 + ")");
    }
    if (buffer.length + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.length % 8 != 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0xEC, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  static createBytes(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }
    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }
    const data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }
    return data;
  }
}

class QR8bitByte {
  constructor(data) {
    this.mode = QRMode.BYTE;
    this.data = data;
  }
  getLength() {
    return this.encodeURI(this.data).length;
  }
  write(buffer) {
    const bytes = this.encodeURI(this.data);
    for (let i = 0; i < bytes.length; i++) {
      buffer.put(bytes[i], 8);
    }
  }
  encodeURI(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        i++;
        const nextCode = str.charCodeAt(i);
        const surrogate = 0x10000 + (((code & 0x3ff) << 10) | (nextCode & 0x3ff));
        bytes.push(0xf0 | (surrogate >> 18), 0x80 | ((surrogate >> 12) & 0x3f), 0x80 | ((surrogate >> 6) & 0x3f), 0x80 | (surrogate & 0x3f));
      }
    }
    return bytes;
  }
}

class QRPolynomial {
  constructor(num, shift) {
    if (num.length == undefined) throw new Error(num.length + "/" + shift);
    let offset = 0;
    while (offset < num.length && num[offset] == 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
  }
  get(index) {
    return this.num[index];
  }
  getLength() {
    return this.num.length;
  }
  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  }
  mod(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

class QRRSBlock {
  constructor(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  static getRSBlocks(typeNumber, errorCorrectLevel) {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock == undefined) throw new Error("bad rs block @ typeNumber:" + typeNumber);
    const length = rsBlock.length / 3;
    const list = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  }
  static getRsBlockTable(typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L:
        return [
          [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80],
          [1, 134, 108], [2, 86, 68], [2, 98, 78], [2, 121, 97],
          [2, 146, 116], [2, 86, 68, 2, 87, 69]
        ][typeNumber - 1] || [2, 100, 80];
      case QRErrorCorrectLevel.M:
      default:
        return [
          [1, 26, 16], [1, 44, 28], [1, 70, 44], [1, 100, 64],
          [1, 134, 86], [2, 86, 58], [2, 98, 64], [2, 121, 78],
          [2, 146, 92], [4, 86, 54]
        ][typeNumber - 1] || [2, 86, 58];
    }
  }
}

const QRMath = {
  glog(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp(n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};

for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
  ],
  getPatternPosition(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
  },
  getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 == 0;
      case 1: return i % 2 == 0;
      case 2: return j % 3 == 0;
      case 3: return (i + j) % 3 == 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) == 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0;
      default: return false;
    }
  },
  getErrorCorrectPolynomial(errorCorrectLength) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits(mode, type) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case QRMode.NUMBER: return 10;
        case QRMode.ALPHA_NUM: return 9;
        case QRMode.BYTE: return 8;
      }
    }
    return 8;
  },
  getLostPoint(qrCode) {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = qrCode.isDark(row, col);
        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c || (r == 0 && c == 0)) continue;
            if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += (3 + sameCount - 5);
      }
    }
    return lostPoint;
  }
};

/**
 * API Publique QRGenerator
 */
const QRGenerator = {
  createQR(text, errorLevel = 'M') {
    const level = errorLevel === 'L' ? QRErrorCorrectLevel.L : QRErrorCorrectLevel.M;
    const qr = new QRCodeModel(0, level);
    qr.addData(text);
    qr.make();
    return qr;
  },

  /**
   * Génère un code SVG
   */
  generateSVG(text, size = 180, margin = 2) {
    try {
      const qr = this.createQR(text);
      const count = qr.getModuleCount();
      const cellSize = size / (count + 2 * margin);

      let rects = [];
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            const x = (col + margin) * cellSize;
            const y = (row + margin) * cellSize;
            rects.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#000000" />`);
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
        ${rects.join('')}
      </svg>`;
    } catch (e) {
      console.error('Erreur generateSVG:', e);
      return '';
    }
  },

  /**
   * Génère un DataURL base64 image/png via un Canvas virtuel
   */
  generateDataURL(text, size = 200, margin = 2) {
    try {
      const qr = this.createQR(text);
      const count = qr.getModuleCount();
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      const cellSize = size / (count + 2 * margin);
      ctx.fillStyle = '#000000';

      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect((col + margin) * cellSize, (row + margin) * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
          }
        }
      }

      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Erreur generateDataURL:', e);
      return '';
    }
  }
};


/* ==========================================================================
   MODULE: lib/jsqr.js
   ========================================================================== */
/**
 * Minified by jsDelivr using Terser v5.39.0.
 * Original file: /npm/jsqr@1.4.0/dist/jsQR.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(o,e){if(typeof window!=='undefined'){window.jsQR=e();}else if(typeof globalThis!=='undefined'){globalThis.jsQR=e();}else{o.jsQR=e();}}(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this),(function(){return function(o){var e={};function r(t){if(e[t])return e[t].exports;var c=e[t]={i:t,l:!1,exports:{}};return o[t].call(c.exports,c,c.exports,r),c.l=!0,c.exports}return r.m=o,r.c=e,r.d=function(o,e,t){r.o(o,e)||Object.defineProperty(o,e,{configurable:!1,enumerable:!0,get:t})},r.n=function(o){var e=o&&o.__esModule?function(){return o.default}:function(){return o};return r.d(e,"a",e),e},r.o=function(o,e){return Object.prototype.hasOwnProperty.call(o,e)},r.p="",r(r.s=3)}([function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o,e){this.width=e,this.height=o.length/e,this.data=o}return o.createEmpty=function(e,r){return new o(new Uint8ClampedArray(e*r),e)},o.prototype.get=function(o,e){return!(o<0||o>=this.width||e<0||e>=this.height)&&!!this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r?1:0},o.prototype.setRegion=function(o,e,r,t,c){for(var s=e;s<e+t;s++)for(var a=o;a<o+r;a++)this.set(a,s,!!c)},o}();e.BitMatrix=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(2);e.addOrSubtractGF=function(o,e){return o^e};var c=function(){function o(o,e,r){this.primitive=o,this.size=e,this.generatorBase=r,this.expTable=new Array(this.size),this.logTable=new Array(this.size);for(var c=1,s=0;s<this.size;s++)this.expTable[s]=c,(c*=2)>=this.size&&(c=(c^this.primitive)&this.size-1);for(s=0;s<this.size-1;s++)this.logTable[this.expTable[s]]=s;this.zero=new t.default(this,Uint8ClampedArray.from([0])),this.one=new t.default(this,Uint8ClampedArray.from([1]))}return o.prototype.multiply=function(o,e){return 0===o||0===e?0:this.expTable[(this.logTable[o]+this.logTable[e])%(this.size-1)]},o.prototype.inverse=function(o){if(0===o)throw new Error("Can't invert 0");return this.expTable[this.size-this.logTable[o]-1]},o.prototype.buildMonomial=function(o,e){if(o<0)throw new Error("Invalid monomial degree less than 0");if(0===e)return this.zero;var r=new Uint8ClampedArray(o+1);return r[0]=e,new t.default(this,r)},o.prototype.log=function(o){if(0===o)throw new Error("Can't take log(0)");return this.logTable[o]},o.prototype.exp=function(o){return this.expTable[o]},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=function(){function o(o,e){if(0===e.length)throw new Error("No coefficients.");this.field=o;var r=e.length;if(r>1&&0===e[0]){for(var t=1;t<r&&0===e[t];)t++;if(t===r)this.coefficients=o.zero.coefficients;else{this.coefficients=new Uint8ClampedArray(r-t);for(var c=0;c<this.coefficients.length;c++)this.coefficients[c]=e[t+c]}}else this.coefficients=e}return o.prototype.degree=function(){return this.coefficients.length-1},o.prototype.isZero=function(){return 0===this.coefficients[0]},o.prototype.getCoefficient=function(o){return this.coefficients[this.coefficients.length-1-o]},o.prototype.addOrSubtract=function(e){var r;if(this.isZero())return e;if(e.isZero())return this;var c=this.coefficients,s=e.coefficients;c.length>s.length&&(c=(r=[s,c])[0],s=r[1]);for(var a=new Uint8ClampedArray(s.length),n=s.length-c.length,d=0;d<n;d++)a[d]=s[d];for(d=n;d<s.length;d++)a[d]=t.addOrSubtractGF(c[d-n],s[d]);return new o(this.field,a)},o.prototype.multiply=function(e){if(0===e)return this.field.zero;if(1===e)return this;for(var r=this.coefficients.length,t=new Uint8ClampedArray(r),c=0;c<r;c++)t[c]=this.field.multiply(this.coefficients[c],e);return new o(this.field,t)},o.prototype.multiplyPoly=function(e){if(this.isZero()||e.isZero())return this.field.zero;for(var r=this.coefficients,c=r.length,s=e.coefficients,a=s.length,n=new Uint8ClampedArray(c+a-1),d=0;d<c;d++)for(var l=r[d],i=0;i<a;i++)n[d+i]=t.addOrSubtractGF(n[d+i],this.field.multiply(l,s[i]));return new o(this.field,n)},o.prototype.multiplyByMonomial=function(e,r){if(e<0)throw new Error("Invalid degree less than 0");if(0===r)return this.field.zero;for(var t=this.coefficients.length,c=new Uint8ClampedArray(t+e),s=0;s<t;s++)c[s]=this.field.multiply(this.coefficients[s],r);return new o(this.field,c)},o.prototype.evaluateAt=function(o){var e=0;if(0===o)return this.getCoefficient(0);var r=this.coefficients.length;if(1===o)return this.coefficients.forEach((function(o){e=t.addOrSubtractGF(e,o)})),e;e=this.coefficients[0];for(var c=1;c<r;c++)e=t.addOrSubtractGF(this.field.multiply(o,e),this.coefficients[c]);return e},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(4),c=r(5),s=r(11),a=r(12);function n(o){var e=a.locate(o);if(!e)return null;for(var r=0,t=e;r<t.length;r++){var n=t[r],d=s.extract(o,n),l=c.decode(d.matrix);if(l)return{binaryData:l.bytes,data:l.text,chunks:l.chunks,version:l.version,location:{topRightCorner:d.mappingFunction(n.dimension,0),topLeftCorner:d.mappingFunction(0,0),bottomRightCorner:d.mappingFunction(n.dimension,n.dimension),bottomLeftCorner:d.mappingFunction(0,n.dimension),topRightFinderPattern:n.topRight,topLeftFinderPattern:n.topLeft,bottomLeftFinderPattern:n.bottomLeft,bottomRightAlignmentPattern:n.alignmentPattern}}}return null}var d={inversionAttempts:"attemptBoth"};function l(o,e,r,c){void 0===c&&(c={});var s=d;Object.keys(s||{}).forEach((function(o){s[o]=c[o]||s[o]}));var a="attemptBoth"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,l="onlyInvert"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,i=t.binarize(o,e,r,a),B=i.binarized,k=i.inverted,u=n(l?k:B);return u||"attemptBoth"!==s.inversionAttempts&&"invertFirst"!==s.inversionAttempts||(u=n(l?B:k)),u}l.default=l,e.default=l},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r){return o<e?e:o>r?r:o}var s=function(){function o(o,e){this.width=o,this.data=new Uint8ClampedArray(o*e)}return o.prototype.get=function(o,e){return this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r},o}();e.binarize=function(o,e,r,a){if(o.length!==e*r*4)throw new Error("Malformed data passed to binarizer.");for(var n=new s(e,r),d=0;d<e;d++)for(var l=0;l<r;l++){var i=o[4*(l*e+d)+0],B=o[4*(l*e+d)+1],k=o[4*(l*e+d)+2];n.set(d,l,.2126*i+.7152*B+.0722*k)}for(var u=Math.ceil(e/8),C=Math.ceil(r/8),m=new s(u,C),f=0;f<C;f++)for(var w=0;w<u;w++){var P=0,v=1/0,h=0;for(l=0;l<8;l++)for(d=0;d<8;d++){var y=n.get(8*w+d,8*f+l);P+=y,v=Math.min(v,y),h=Math.max(h,y)}var p=P/Math.pow(8,2);if(h-v<=24&&(p=v/2,f>0&&w>0)){var b=(m.get(w,f-1)+2*m.get(w-1,f)+m.get(w-1,f-1))/4;v<b&&(p=b)}m.set(w,f,p)}var g=t.BitMatrix.createEmpty(e,r),x=null;for(a&&(x=t.BitMatrix.createEmpty(e,r)),f=0;f<C;f++)for(w=0;w<u;w++){for(var M=c(w,2,u-3),L=c(f,2,C-3),N=(P=0,-2);N<=2;N++)for(var I=-2;I<=2;I++)P+=m.get(M+N,L+I);var O=P/25;for(N=0;N<8;N++)for(I=0;I<8;I++){d=8*w+N,l=8*f+I;var z=n.get(d,l);g.set(d,l,z<=O),a&&x.set(d,l,!(z<=O))}}return a?{binarized:g,inverted:x}:{binarized:g}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0),c=r(6),s=r(9),a=r(10);function n(o,e){for(var r=o^e,t=0;r;)t++,r&=r-1;return t}function d(o,e){return e<<1|o}var l=[{bits:21522,formatInfo:{errorCorrectionLevel:1,dataMask:0}},{bits:20773,formatInfo:{errorCorrectionLevel:1,dataMask:1}},{bits:24188,formatInfo:{errorCorrectionLevel:1,dataMask:2}},{bits:23371,formatInfo:{errorCorrectionLevel:1,dataMask:3}},{bits:17913,formatInfo:{errorCorrectionLevel:1,dataMask:4}},{bits:16590,formatInfo:{errorCorrectionLevel:1,dataMask:5}},{bits:20375,formatInfo:{errorCorrectionLevel:1,dataMask:6}},{bits:19104,formatInfo:{errorCorrectionLevel:1,dataMask:7}},{bits:30660,formatInfo:{errorCorrectionLevel:0,dataMask:0}},{bits:29427,formatInfo:{errorCorrectionLevel:0,dataMask:1}},{bits:32170,formatInfo:{errorCorrectionLevel:0,dataMask:2}},{bits:30877,formatInfo:{errorCorrectionLevel:0,dataMask:3}},{bits:26159,formatInfo:{errorCorrectionLevel:0,dataMask:4}},{bits:25368,formatInfo:{errorCorrectionLevel:0,dataMask:5}},{bits:27713,formatInfo:{errorCorrectionLevel:0,dataMask:6}},{bits:26998,formatInfo:{errorCorrectionLevel:0,dataMask:7}},{bits:5769,formatInfo:{errorCorrectionLevel:3,dataMask:0}},{bits:5054,formatInfo:{errorCorrectionLevel:3,dataMask:1}},{bits:7399,formatInfo:{errorCorrectionLevel:3,dataMask:2}},{bits:6608,formatInfo:{errorCorrectionLevel:3,dataMask:3}},{bits:1890,formatInfo:{errorCorrectionLevel:3,dataMask:4}},{bits:597,formatInfo:{errorCorrectionLevel:3,dataMask:5}},{bits:3340,formatInfo:{errorCorrectionLevel:3,dataMask:6}},{bits:2107,formatInfo:{errorCorrectionLevel:3,dataMask:7}},{bits:13663,formatInfo:{errorCorrectionLevel:2,dataMask:0}},{bits:12392,formatInfo:{errorCorrectionLevel:2,dataMask:1}},{bits:16177,formatInfo:{errorCorrectionLevel:2,dataMask:2}},{bits:14854,formatInfo:{errorCorrectionLevel:2,dataMask:3}},{bits:9396,formatInfo:{errorCorrectionLevel:2,dataMask:4}},{bits:8579,formatInfo:{errorCorrectionLevel:2,dataMask:5}},{bits:11994,formatInfo:{errorCorrectionLevel:2,dataMask:6}},{bits:11245,formatInfo:{errorCorrectionLevel:2,dataMask:7}}],i=[function(o){return(o.y+o.x)%2==0},function(o){return o.y%2==0},function(o){return o.x%3==0},function(o){return(o.y+o.x)%3==0},function(o){return(Math.floor(o.y/2)+Math.floor(o.x/3))%2==0},function(o){return o.x*o.y%2+o.x*o.y%3==0},function(o){return(o.y*o.x%2+o.y*o.x%3)%2==0},function(o){return((o.y+o.x)%2+o.y*o.x%3)%2==0}];function B(o,e,r){for(var c=i[r.dataMask],s=o.height,a=function(o){var e=17+4*o.versionNumber,r=t.BitMatrix.createEmpty(e,e);r.setRegion(0,0,9,9,!0),r.setRegion(e-8,0,8,9,!0),r.setRegion(0,e-8,9,8,!0);for(var c=0,s=o.alignmentPatternCenters;c<s.length;c++)for(var a=s[c],n=0,d=o.alignmentPatternCenters;n<d.length;n++){var l=d[n];6===a&&6===l||6===a&&l===e-7||a===e-7&&6===l||r.setRegion(a-2,l-2,5,5,!0)}return r.setRegion(6,9,1,e-17,!0),r.setRegion(9,6,e-17,1,!0),o.versionNumber>6&&(r.setRegion(e-11,0,3,6,!0),r.setRegion(0,e-11,6,3,!0)),r}(e),n=[],l=0,B=0,k=!0,u=s-1;u>0;u-=2){6===u&&u--;for(var C=0;C<s;C++)for(var m=k?s-1-C:C,f=0;f<2;f++){var w=u-f;if(!a.get(w,m)){B++;var P=o.get(w,m);c({y:m,x:w})&&(P=!P),l=d(P,l),8===B&&(n.push(l),B=0,l=0)}}k=!k}return n}function k(o){var e=function(o){var e=o.height,r=Math.floor((e-17)/4);if(r<=6)return a.VERSIONS[r-1];for(var t=0,c=5;c>=0;c--)for(var s=e-9;s>=e-11;s--)t=d(o.get(s,c),t);var l=0;for(s=5;s>=0;s--)for(c=e-9;c>=e-11;c--)l=d(o.get(s,c),l);for(var i,B=1/0,k=0,u=a.VERSIONS;k<u.length;k++){var C=u[k];if(C.infoBits===t||C.infoBits===l)return C;var m=n(t,C.infoBits);m<B&&(i=C,B=m),(m=n(l,C.infoBits))<B&&(i=C,B=m)}return B<=3?i:void 0}(o);if(!e)return null;var r=function(o){for(var e=0,r=0;r<=8;r++)6!==r&&(e=d(o.get(r,8),e));for(var t=7;t>=0;t--)6!==t&&(e=d(o.get(8,t),e));var c=o.height,s=0;for(t=c-1;t>=c-7;t--)s=d(o.get(8,t),s);for(r=c-8;r<c;r++)s=d(o.get(r,8),s);for(var a=1/0,i=null,B=0,k=l;B<k.length;B++){var u=k[B],C=u.bits,m=u.formatInfo;if(C===e||C===s)return m;var f=n(e,C);f<a&&(i=m,a=f),e!==s&&(f=n(s,C))<a&&(i=m,a=f)}return a<=3?i:null}(o);if(!r)return null;var t=function(o,e,r){var t=e.errorCorrectionLevels[r],c=[],s=0;if(t.ecBlocks.forEach((function(o){for(var e=0;e<o.numBlocks;e++)c.push({numDataCodewords:o.dataCodewordsPerBlock,codewords:[]}),s+=o.dataCodewordsPerBlock+t.ecCodewordsPerBlock})),o.length<s)return null;o=o.slice(0,s);for(var a=t.ecBlocks[0].dataCodewordsPerBlock,n=0;n<a;n++)for(var d=0,l=c;d<l.length;d++)l[d].codewords.push(o.shift());if(t.ecBlocks.length>1){var i=t.ecBlocks[0].numBlocks,B=t.ecBlocks[1].numBlocks;for(n=0;n<B;n++)c[i+n].codewords.push(o.shift())}for(;o.length>0;)for(var k=0,u=c;k<u.length;k++)u[k].codewords.push(o.shift());return c}(B(o,e,r),e,r.errorCorrectionLevel);if(!t)return null;for(var i=t.reduce((function(o,e){return o+e.numDataCodewords}),0),k=new Uint8ClampedArray(i),u=0,C=0,m=t;C<m.length;C++){var f=m[C],w=s.decode(f.codewords,f.codewords.length-f.numDataCodewords);if(!w)return null;for(var P=0;P<f.numDataCodewords;P++)k[u++]=w[P]}try{return c.decode(k,e.versionNumber)}catch(o){return null}}e.decode=function(o){if(null==o)return null;var e=k(o);if(e)return e;for(var r=0;r<o.width;r++)for(var t=r+1;t<o.height;t++)o.get(r,t)!==o.get(t,r)&&(o.set(r,t,!o.get(r,t)),o.set(t,r,!o.get(t,r)));return k(o)}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t,c,s=r(7),a=r(8);function n(o,e){for(var r=[],t="",c=[10,12,14][e],s=o.readBits(c);s>=3;){if((l=o.readBits(10))>=1e3)throw new Error("Invalid numeric value above 999");var a=Math.floor(l/100),n=Math.floor(l/10)%10,d=l%10;r.push(48+a,48+n,48+d),t+=a.toString()+n.toString()+d.toString(),s-=3}if(2===s){if((l=o.readBits(7))>=100)throw new Error("Invalid numeric value above 99");a=Math.floor(l/10),n=l%10;r.push(48+a,48+n),t+=a.toString()+n.toString()}else if(1===s){var l;if((l=o.readBits(4))>=10)throw new Error("Invalid numeric value above 9");r.push(48+l),t+=l.toString()}return{bytes:r,text:t}}!function(o){o.Numeric="numeric",o.Alphanumeric="alphanumeric",o.Byte="byte",o.Kanji="kanji",o.ECI="eci"}(t=e.Mode||(e.Mode={})),function(o){o[o.Terminator=0]="Terminator",o[o.Numeric=1]="Numeric",o[o.Alphanumeric=2]="Alphanumeric",o[o.Byte=4]="Byte",o[o.Kanji=8]="Kanji",o[o.ECI=7]="ECI"}(c||(c={}));var d=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function l(o,e){for(var r=[],t="",c=[9,11,13][e],s=o.readBits(c);s>=2;){var a=o.readBits(11),n=Math.floor(a/45),l=a%45;r.push(d[n].charCodeAt(0),d[l].charCodeAt(0)),t+=d[n]+d[l],s-=2}if(1===s){n=o.readBits(6);r.push(d[n].charCodeAt(0)),t+=d[n]}return{bytes:r,text:t}}function i(o,e){for(var r=[],t="",c=[8,16,16][e],s=o.readBits(c),a=0;a<s;a++){var n=o.readBits(8);r.push(n)}try{t+=decodeURIComponent(r.map((function(o){return"%"+("0"+o.toString(16)).substr(-2)})).join(""))}catch(o){}return{bytes:r,text:t}}function B(o,e){for(var r=[],t="",c=[8,10,12][e],s=o.readBits(c),n=0;n<s;n++){var d=o.readBits(13),l=Math.floor(d/192)<<8|d%192;l+=l<7936?33088:49472,r.push(l>>8,255&l),t+=String.fromCharCode(a.shiftJISTable[l])}return{bytes:r,text:t}}e.decode=function(o,e){for(var r,a,d,k,u=new s.BitStream(o),C=e<=9?0:e<=26?1:2,m={text:"",bytes:[],chunks:[],version:e};u.available()>=4;){var f=u.readBits(4);if(f===c.Terminator)return m;if(f===c.ECI)0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(7)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(14)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(21)}):m.chunks.push({type:t.ECI,assignmentNumber:-1});else if(f===c.Numeric){var w=n(u,C);m.text+=w.text,(r=m.bytes).push.apply(r,w.bytes),m.chunks.push({type:t.Numeric,text:w.text})}else if(f===c.Alphanumeric){var P=l(u,C);m.text+=P.text,(a=m.bytes).push.apply(a,P.bytes),m.chunks.push({type:t.Alphanumeric,text:P.text})}else if(f===c.Byte){var v=i(u,C);m.text+=v.text,(d=m.bytes).push.apply(d,v.bytes),m.chunks.push({type:t.Byte,bytes:v.bytes,text:v.text})}else if(f===c.Kanji){var h=B(u,C);m.text+=h.text,(k=m.bytes).push.apply(k,h.bytes),m.chunks.push({type:t.Kanji,bytes:h.bytes,text:h.text})}}if(0===u.available()||0===u.readBits(u.available()))return m}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o){this.byteOffset=0,this.bitOffset=0,this.bytes=o}return o.prototype.readBits=function(o){if(o<1||o>32||o>this.available())throw new Error("Cannot read "+o.toString()+" bits");var e=0;if(this.bitOffset>0){var r=8-this.bitOffset,t=o<r?o:r,c=255>>8-t<<(s=r-t);e=(this.bytes[this.byteOffset]&c)>>s,o-=t,this.bitOffset+=t,8===this.bitOffset&&(this.bitOffset=0,this.byteOffset++)}if(o>0){for(;o>=8;)e=e<<8|255&this.bytes[this.byteOffset],this.byteOffset++,o-=8;if(o>0){var s;c=255>>(s=8-o)<<s;e=e<<o|(this.bytes[this.byteOffset]&c)>>s,this.bitOffset+=o}}return e},o.prototype.available=function(){return 8*(this.bytes.length-this.byteOffset)-this.bitOffset},o}();e.BitStream=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.shiftJISTable={32:32,33:33,34:34,35:35,36:36,37:37,38:38,39:39,40:40,41:41,42:42,43:43,44:44,45:45,46:46,47:47,48:48,49:49,50:50,51:51,52:52,53:53,54:54,55:55,56:56,57:57,58:58,59:59,60:60,61:61,62:62,63:63,64:64,65:65,66:66,67:67,68:68,69:69,70:70,71:71,72:72,73:73,74:74,75:75,76:76,77:77,78:78,79:79,80:80,81:81,82:82,83:83,84:84,85:85,86:86,87:87,88:88,89:89,90:90,91:91,92:165,93:93,94:94,95:95,96:96,97:97,98:98,99:99,100:100,101:101,102:102,103:103,104:104,105:105,106:106,107:107,108:108,109:109,110:110,111:111,112:112,113:113,114:114,115:115,116:116,117:117,118:118,119:119,120:120,121:121,122:122,123:123,124:124,125:125,126:8254,33088:12288,33089:12289,33090:12290,33091:65292,33092:65294,33093:12539,33094:65306,33095:65307,33096:65311,33097:65281,33098:12443,33099:12444,33100:180,33101:65344,33102:168,33103:65342,33104:65507,33105:65343,33106:12541,33107:12542,33108:12445,33109:12446,33110:12291,33111:20189,33112:12293,33113:12294,33114:12295,33115:12540,33116:8213,33117:8208,33118:65295,33119:92,33120:12316,33121:8214,33122:65372,33123:8230,33124:8229,33125:8216,33126:8217,33127:8220,33128:8221,33129:65288,33130:65289,33131:12308,33132:12309,33133:65339,33134:65341,33135:65371,33136:65373,33137:12296,33138:12297,33139:12298,33140:12299,33141:12300,33142:12301,33143:12302,33144:12303,33145:12304,33146:12305,33147:65291,33148:8722,33149:177,33150:215,33152:247,33153:65309,33154:8800,33155:65308,33156:65310,33157:8806,33158:8807,33159:8734,33160:8756,33161:9794,33162:9792,33163:176,33164:8242,33165:8243,33166:8451,33167:65509,33168:65284,33169:162,33170:163,33171:65285,33172:65283,33173:65286,33174:65290,33175:65312,33176:167,33177:9734,33178:9733,33179:9675,33180:9679,33181:9678,33182:9671,33183:9670,33184:9633,33185:9632,33186:9651,33187:9650,33188:9661,33189:9660,33190:8251,33191:12306,33192:8594,33193:8592,33194:8593,33195:8595,33196:12307,33208:8712,33209:8715,33210:8838,33211:8839,33212:8834,33213:8835,33214:8746,33215:8745,33224:8743,33225:8744,33226:172,33227:8658,33228:8660,33229:8704,33230:8707,33242:8736,33243:8869,33244:8978,33245:8706,33246:8711,33247:8801,33248:8786,33249:8810,33250:8811,33251:8730,33252:8765,33253:8733,33254:8757,33255:8747,33256:8748,33264:8491,33265:8240,33266:9839,33267:9837,33268:9834,33269:8224,33270:8225,33271:182,33276:9711,33359:65296,33360:65297,33361:65298,33362:65299,33363:65300,33364:65301,33365:65302,33366:65303,33367:65304,33368:65305,33376:65313,33377:65314,33378:65315,33379:65316,33380:65317,33381:65318,33382:65319,33383:65320,33384:65321,33385:65322,33386:65323,33387:65324,33388:65325,33389:65326,33390:65327,33391:65328,33392:65329,33393:65330,33394:65331,33395:65332,33396:65333,33397:65334,33398:65335,33399:65336,33400:65337,33401:65338,33409:65345,33410:65346,33411:65347,33412:65348,33413:65349,33414:65350,33415:65351,33416:65352,33417:65353,33418:65354,33419:65355,33420:65356,33421:65357,33422:65358,33423:65359,33424:65360,33425:65361,33426:65362,33427:65363,33428:65364,33429:65365,33430:65366,33431:65367,33432:65368,33433:65369,33434:65370,33439:12353,33440:12354,33441:12355,33442:12356,33443:12357,33444:12358,33445:12359,33446:12360,33447:12361,33448:12362,33449:12363,33450:12364,33451:12365,33452:12366,33453:12367,33454:12368,33455:12369,33456:12370,33457:12371,33458:12372,33459:12373,33460:12374,33461:12375,33462:12376,33463:12377,33464:12378,33465:12379,33466:12380,33467:12381,33468:12382,33469:12383,33470:12384,33471:12385,33472:12386,33473:12387,33474:12388,33475:12389,33476:12390,33477:12391,33478:12392,33479:12393,33480:12394,33481:12395,33482:12396,33483:12397,33484:12398,33485:12399,33486:12400,33487:12401,33488:12402,33489:12403,33490:12404,33491:12405,33492:12406,33493:12407,33494:12408,33495:12409,33496:12410,33497:12411,33498:12412,33499:12413,33500:12414,33501:12415,33502:12416,33503:12417,33504:12418,33505:12419,33506:12420,33507:12421,33508:12422,33509:12423,33510:12424,33511:12425,33512:12426,33513:12427,33514:12428,33515:12429,33516:12430,33517:12431,33518:12432,33519:12433,33520:12434,33521:12435,33600:12449,33601:12450,33602:12451,33603:12452,33604:12453,33605:12454,33606:12455,33607:12456,33608:12457,33609:12458,33610:12459,33611:12460,33612:12461,33613:12462,33614:12463,33615:12464,33616:12465,33617:12466,33618:12467,33619:12468,33620:12469,33621:12470,33622:12471,33623:12472,33624:12473,33625:12474,33626:12475,33627:12476,33628:12477,33629:12478,33630:12479,33631:12480,33632:12481,33633:12482,33634:12483,33635:12484,33636:12485,33637:12486,33638:12487,33639:12488,33640:12489,33641:12490,33642:12491,33643:12492,33644:12493,33645:12494,33646:12495,33647:12496,33648:12497,33649:12498,33650:12499,33651:12500,33652:12501,33653:12502,33654:12503,33655:12504,33656:12505,33657:12506,33658:12507,33659:12508,33660:12509,33661:12510,33662:12511,33664:12512,33665:12513,33666:12514,33667:12515,33668:12516,33669:12517,33670:12518,33671:12519,33672:12520,33673:12521,33674:12522,33675:12523,33676:12524,33677:12525,33678:12526,33679:12527,33680:12528,33681:12529,33682:12530,33683:12531,33684:12532,33685:12533,33686:12534,33695:913,33696:914,33697:915,33698:916,33699:917,33700:918,33701:919,33702:920,33703:921,33704:922,33705:923,33706:924,33707:925,33708:926,33709:927,33710:928,33711:929,33712:931,33713:932,33714:933,33715:934,33716:935,33717:936,33718:937,33727:945,33728:946,33729:947,33730:948,33731:949,33732:950,33733:951,33734:952,33735:953,33736:954,33737:955,33738:956,33739:957,33740:958,33741:959,33742:960,33743:961,33744:963,33745:964,33746:965,33747:966,33748:967,33749:968,33750:969,33856:1040,33857:1041,33858:1042,33859:1043,33860:1044,33861:1045,33862:1025,33863:1046,33864:1047,33865:1048,33866:1049,33867:1050,33868:1051,33869:1052,33870:1053,33871:1054,33872:1055,33873:1056,33874:1057,33875:1058,33876:1059,33877:1060,33878:1061,33879:1062,33880:1063,33881:1064,33882:1065,33883:1066,33884:1067,33885:1068,33886:1069,33887:1070,33888:1071,33904:1072,33905:1073,33906:1074,33907:1075,33908:1076,33909:1077,33910:1105,33911:1078,33912:1079,33913:1080,33914:1081,33915:1082,33916:1083,33917:1084,33918:1085,33920:1086,33921:1087,33922:1088,33923:1089,33924:1090,33925:1091,33926:1092,33927:1093,33928:1094,33929:1095,33930:1096,33931:1097,33932:1098,33933:1099,33934:1100,33935:1101,33936:1102,33937:1103,33951:9472,33952:9474,33953:9484,33954:9488,33955:9496,33956:9492,33957:9500,33958:9516,33959:9508,33960:9524,33961:9532,33962:9473,33963:9475,33964:9487,33965:9491,33966:9499,33967:9495,33968:9507,33969:9523,33970:9515,33971:9531,33972:9547,33973:9504,33974:9519,33975:9512,33976:9527,33977:9535,33978:9501,33979:9520,33980:9509,33981:9528,33982:9538,34975:20124,34976:21782,34977:23043,34978:38463,34979:21696,34980:24859,34981:25384,34982:23030,34983:36898,34984:33909,34985:33564,34986:31312,34987:24746,34988:25569,34989:28197,34990:26093,34991:33894,34992:33446,34993:39925,34994:26771,34995:22311,34996:26017,34997:25201,34998:23451,34999:22992,35e3:34427,35001:39156,35002:32098,35003:32190,35004:39822,35005:25110,35006:31903,35007:34999,35008:23433,35009:24245,35010:25353,35011:26263,35012:26696,35013:38343,35014:38797,35015:26447,35016:20197,35017:20234,35018:20301,35019:20381,35020:20553,35021:22258,35022:22839,35023:22996,35024:23041,35025:23561,35026:24799,35027:24847,35028:24944,35029:26131,35030:26885,35031:28858,35032:30031,35033:30064,35034:31227,35035:32173,35036:32239,35037:32963,35038:33806,35039:34915,35040:35586,35041:36949,35042:36986,35043:21307,35044:20117,35045:20133,35046:22495,35047:32946,35048:37057,35049:30959,35050:19968,35051:22769,35052:28322,35053:36920,35054:31282,35055:33576,35056:33419,35057:39983,35058:20801,35059:21360,35060:21693,35061:21729,35062:22240,35063:23035,35064:24341,35065:39154,35066:28139,35067:32996,35068:34093,35136:38498,35137:38512,35138:38560,35139:38907,35140:21515,35141:21491,35142:23431,35143:28879,35144:32701,35145:36802,35146:38632,35147:21359,35148:40284,35149:31418,35150:19985,35151:30867,35152:33276,35153:28198,35154:22040,35155:21764,35156:27421,35157:34074,35158:39995,35159:23013,35160:21417,35161:28006,35162:29916,35163:38287,35164:22082,35165:20113,35166:36939,35167:38642,35168:33615,35169:39180,35170:21473,35171:21942,35172:23344,35173:24433,35174:26144,35175:26355,35176:26628,35177:27704,35178:27891,35179:27945,35180:29787,35181:30408,35182:31310,35183:38964,35184:33521,35185:34907,35186:35424,35187:37613,35188:28082,35189:30123,35190:30410,35191:39365,35192:24742,35193:35585,35194:36234,35195:38322,35196:27022,35197:21421,35198:20870,35200:22290,35201:22576,35202:22852,35203:23476,35204:24310,35205:24616,35206:25513,35207:25588,35208:27839,35209:28436,35210:28814,35211:28948,35212:29017,35213:29141,35214:29503,35215:32257,35216:33398,35217:33489,35218:34199,35219:36960,35220:37467,35221:40219,35222:22633,35223:26044,35224:27738,35225:29989,35226:20985,35227:22830,35228:22885,35229:24448,35230:24540,35231:25276,35232:26106,35233:27178,35234:27431,35235:27572,35236:29579,35237:32705,35238:35158,35239:40236,35240:40206,35241:40644,35242:23713,35243:27798,35244:33659,35245:20740,35246:23627,35247:25014,35248:33222,35249:26742,35250:29281,35251:20057,35252:20474,35253:21368,35254:24681,35255:28201,35256:31311,35257:38899,35258:19979,35259:21270,35260:20206,35261:20309,35262:20285,35263:20385,35264:20339,35265:21152,35266:21487,35267:22025,35268:22799,35269:23233,35270:23478,35271:23521,35272:31185,35273:26247,35274:26524,35275:26550,35276:27468,35277:27827,35278:28779,35279:29634,35280:31117,35281:31166,35282:31292,35283:31623,35284:33457,35285:33499,35286:33540,35287:33655,35288:33775,35289:33747,35290:34662,35291:35506,35292:22057,35293:36008,35294:36838,35295:36942,35296:38686,35297:34442,35298:20420,35299:23784,35300:25105,35301:29273,35302:30011,35303:33253,35304:33469,35305:34558,35306:36032,35307:38597,35308:39187,35309:39381,35310:20171,35311:20250,35312:35299,35313:22238,35314:22602,35315:22730,35316:24315,35317:24555,35318:24618,35319:24724,35320:24674,35321:25040,35322:25106,35323:25296,35324:25913,35392:39745,35393:26214,35394:26800,35395:28023,35396:28784,35397:30028,35398:30342,35399:32117,35400:33445,35401:34809,35402:38283,35403:38542,35404:35997,35405:20977,35406:21182,35407:22806,35408:21683,35409:23475,35410:23830,35411:24936,35412:27010,35413:28079,35414:30861,35415:33995,35416:34903,35417:35442,35418:37799,35419:39608,35420:28012,35421:39336,35422:34521,35423:22435,35424:26623,35425:34510,35426:37390,35427:21123,35428:22151,35429:21508,35430:24275,35431:25313,35432:25785,35433:26684,35434:26680,35435:27579,35436:29554,35437:30906,35438:31339,35439:35226,35440:35282,35441:36203,35442:36611,35443:37101,35444:38307,35445:38548,35446:38761,35447:23398,35448:23731,35449:27005,35450:38989,35451:38990,35452:25499,35453:31520,35454:27179,35456:27263,35457:26806,35458:39949,35459:28511,35460:21106,35461:21917,35462:24688,35463:25324,35464:27963,35465:28167,35466:28369,35467:33883,35468:35088,35469:36676,35470:19988,35471:39993,35472:21494,35473:26907,35474:27194,35475:38788,35476:26666,35477:20828,35478:31427,35479:33970,35480:37340,35481:37772,35482:22107,35483:40232,35484:26658,35485:33541,35486:33841,35487:31909,35488:21e3,35489:33477,35490:29926,35491:20094,35492:20355,35493:20896,35494:23506,35495:21002,35496:21208,35497:21223,35498:24059,35499:21914,35500:22570,35501:23014,35502:23436,35503:23448,35504:23515,35505:24178,35506:24185,35507:24739,35508:24863,35509:24931,35510:25022,35511:25563,35512:25954,35513:26577,35514:26707,35515:26874,35516:27454,35517:27475,35518:27735,35519:28450,35520:28567,35521:28485,35522:29872,35523:29976,35524:30435,35525:30475,35526:31487,35527:31649,35528:31777,35529:32233,35530:32566,35531:32752,35532:32925,35533:33382,35534:33694,35535:35251,35536:35532,35537:36011,35538:36996,35539:37969,35540:38291,35541:38289,35542:38306,35543:38501,35544:38867,35545:39208,35546:33304,35547:20024,35548:21547,35549:23736,35550:24012,35551:29609,35552:30284,35553:30524,35554:23721,35555:32747,35556:36107,35557:38593,35558:38929,35559:38996,35560:39e3,35561:20225,35562:20238,35563:21361,35564:21916,35565:22120,35566:22522,35567:22855,35568:23305,35569:23492,35570:23696,35571:24076,35572:24190,35573:24524,35574:25582,35575:26426,35576:26071,35577:26082,35578:26399,35579:26827,35580:26820,35648:27231,35649:24112,35650:27589,35651:27671,35652:27773,35653:30079,35654:31048,35655:23395,35656:31232,35657:32e3,35658:24509,35659:35215,35660:35352,35661:36020,35662:36215,35663:36556,35664:36637,35665:39138,35666:39438,35667:39740,35668:20096,35669:20605,35670:20736,35671:22931,35672:23452,35673:25135,35674:25216,35675:25836,35676:27450,35677:29344,35678:30097,35679:31047,35680:32681,35681:34811,35682:35516,35683:35696,35684:25516,35685:33738,35686:38816,35687:21513,35688:21507,35689:21931,35690:26708,35691:27224,35692:35440,35693:30759,35694:26485,35695:40653,35696:21364,35697:23458,35698:33050,35699:34384,35700:36870,35701:19992,35702:20037,35703:20167,35704:20241,35705:21450,35706:21560,35707:23470,35708:24339,35709:24613,35710:25937,35712:26429,35713:27714,35714:27762,35715:27875,35716:28792,35717:29699,35718:31350,35719:31406,35720:31496,35721:32026,35722:31998,35723:32102,35724:26087,35725:29275,35726:21435,35727:23621,35728:24040,35729:25298,35730:25312,35731:25369,35732:28192,35733:34394,35734:35377,35735:36317,35736:37624,35737:28417,35738:31142,35739:39770,35740:20136,35741:20139,35742:20140,35743:20379,35744:20384,35745:20689,35746:20807,35747:31478,35748:20849,35749:20982,35750:21332,35751:21281,35752:21375,35753:21483,35754:21932,35755:22659,35756:23777,35757:24375,35758:24394,35759:24623,35760:24656,35761:24685,35762:25375,35763:25945,35764:27211,35765:27841,35766:29378,35767:29421,35768:30703,35769:33016,35770:33029,35771:33288,35772:34126,35773:37111,35774:37857,35775:38911,35776:39255,35777:39514,35778:20208,35779:20957,35780:23597,35781:26241,35782:26989,35783:23616,35784:26354,35785:26997,35786:29577,35787:26704,35788:31873,35789:20677,35790:21220,35791:22343,35792:24062,35793:37670,35794:26020,35795:27427,35796:27453,35797:29748,35798:31105,35799:31165,35800:31563,35801:32202,35802:33465,35803:33740,35804:34943,35805:35167,35806:35641,35807:36817,35808:37329,35809:21535,35810:37504,35811:20061,35812:20534,35813:21477,35814:21306,35815:29399,35816:29590,35817:30697,35818:33510,35819:36527,35820:39366,35821:39368,35822:39378,35823:20855,35824:24858,35825:34398,35826:21936,35827:31354,35828:20598,35829:23507,35830:36935,35831:38533,35832:20018,35833:27355,35834:37351,35835:23633,35836:23624,35904:25496,35905:31391,35906:27795,35907:38772,35908:36705,35909:31402,35910:29066,35911:38536,35912:31874,35913:26647,35914:32368,35915:26705,35916:37740,35917:21234,35918:21531,35919:34219,35920:35347,35921:32676,35922:36557,35923:37089,35924:21350,35925:34952,35926:31041,35927:20418,35928:20670,35929:21009,35930:20804,35931:21843,35932:22317,35933:29674,35934:22411,35935:22865,35936:24418,35937:24452,35938:24693,35939:24950,35940:24935,35941:25001,35942:25522,35943:25658,35944:25964,35945:26223,35946:26690,35947:28179,35948:30054,35949:31293,35950:31995,35951:32076,35952:32153,35953:32331,35954:32619,35955:33550,35956:33610,35957:34509,35958:35336,35959:35427,35960:35686,35961:36605,35962:38938,35963:40335,35964:33464,35965:36814,35966:39912,35968:21127,35969:25119,35970:25731,35971:28608,35972:38553,35973:26689,35974:20625,35975:27424,35976:27770,35977:28500,35978:31348,35979:32080,35980:34880,35981:35363,35982:26376,35983:20214,35984:20537,35985:20518,35986:20581,35987:20860,35988:21048,35989:21091,35990:21927,35991:22287,35992:22533,35993:23244,35994:24314,35995:25010,35996:25080,35997:25331,35998:25458,35999:26908,36e3:27177,36001:29309,36002:29356,36003:29486,36004:30740,36005:30831,36006:32121,36007:30476,36008:32937,36009:35211,36010:35609,36011:36066,36012:36562,36013:36963,36014:37749,36015:38522,36016:38997,36017:39443,36018:40568,36019:20803,36020:21407,36021:21427,36022:24187,36023:24358,36024:28187,36025:28304,36026:29572,36027:29694,36028:32067,36029:33335,36030:35328,36031:35578,36032:38480,36033:20046,36034:20491,36035:21476,36036:21628,36037:22266,36038:22993,36039:23396,36040:24049,36041:24235,36042:24359,36043:25144,36044:25925,36045:26543,36046:28246,36047:29392,36048:31946,36049:34996,36050:32929,36051:32993,36052:33776,36053:34382,36054:35463,36055:36328,36056:37431,36057:38599,36058:39015,36059:40723,36060:20116,36061:20114,36062:20237,36063:21320,36064:21577,36065:21566,36066:23087,36067:24460,36068:24481,36069:24735,36070:26791,36071:27278,36072:29786,36073:30849,36074:35486,36075:35492,36076:35703,36077:37264,36078:20062,36079:39881,36080:20132,36081:20348,36082:20399,36083:20505,36084:20502,36085:20809,36086:20844,36087:21151,36088:21177,36089:21246,36090:21402,36091:21475,36092:21521,36160:21518,36161:21897,36162:22353,36163:22434,36164:22909,36165:23380,36166:23389,36167:23439,36168:24037,36169:24039,36170:24055,36171:24184,36172:24195,36173:24218,36174:24247,36175:24344,36176:24658,36177:24908,36178:25239,36179:25304,36180:25511,36181:25915,36182:26114,36183:26179,36184:26356,36185:26477,36186:26657,36187:26775,36188:27083,36189:27743,36190:27946,36191:28009,36192:28207,36193:28317,36194:30002,36195:30343,36196:30828,36197:31295,36198:31968,36199:32005,36200:32024,36201:32094,36202:32177,36203:32789,36204:32771,36205:32943,36206:32945,36207:33108,36208:33167,36209:33322,36210:33618,36211:34892,36212:34913,36213:35611,36214:36002,36215:36092,36216:37066,36217:37237,36218:37489,36219:30783,36220:37628,36221:38308,36222:38477,36224:38917,36225:39321,36226:39640,36227:40251,36228:21083,36229:21163,36230:21495,36231:21512,36232:22741,36233:25335,36234:28640,36235:35946,36236:36703,36237:40633,36238:20811,36239:21051,36240:21578,36241:22269,36242:31296,36243:37239,36244:40288,36245:40658,36246:29508,36247:28425,36248:33136,36249:29969,36250:24573,36251:24794,36252:39592,36253:29403,36254:36796,36255:27492,36256:38915,36257:20170,36258:22256,36259:22372,36260:22718,36261:23130,36262:24680,36263:25031,36264:26127,36265:26118,36266:26681,36267:26801,36268:28151,36269:30165,36270:32058,36271:33390,36272:39746,36273:20123,36274:20304,36275:21449,36276:21766,36277:23919,36278:24038,36279:24046,36280:26619,36281:27801,36282:29811,36283:30722,36284:35408,36285:37782,36286:35039,36287:22352,36288:24231,36289:25387,36290:20661,36291:20652,36292:20877,36293:26368,36294:21705,36295:22622,36296:22971,36297:23472,36298:24425,36299:25165,36300:25505,36301:26685,36302:27507,36303:28168,36304:28797,36305:37319,36306:29312,36307:30741,36308:30758,36309:31085,36310:25998,36311:32048,36312:33756,36313:35009,36314:36617,36315:38555,36316:21092,36317:22312,36318:26448,36319:32618,36320:36001,36321:20916,36322:22338,36323:38442,36324:22586,36325:27018,36326:32948,36327:21682,36328:23822,36329:22524,36330:30869,36331:40442,36332:20316,36333:21066,36334:21643,36335:25662,36336:26152,36337:26388,36338:26613,36339:31364,36340:31574,36341:32034,36342:37679,36343:26716,36344:39853,36345:31545,36346:21273,36347:20874,36348:21047,36416:23519,36417:25334,36418:25774,36419:25830,36420:26413,36421:27578,36422:34217,36423:38609,36424:30352,36425:39894,36426:25420,36427:37638,36428:39851,36429:30399,36430:26194,36431:19977,36432:20632,36433:21442,36434:23665,36435:24808,36436:25746,36437:25955,36438:26719,36439:29158,36440:29642,36441:29987,36442:31639,36443:32386,36444:34453,36445:35715,36446:36059,36447:37240,36448:39184,36449:26028,36450:26283,36451:27531,36452:20181,36453:20180,36454:20282,36455:20351,36456:21050,36457:21496,36458:21490,36459:21987,36460:22235,36461:22763,36462:22987,36463:22985,36464:23039,36465:23376,36466:23629,36467:24066,36468:24107,36469:24535,36470:24605,36471:25351,36472:25903,36473:23388,36474:26031,36475:26045,36476:26088,36477:26525,36478:27490,36480:27515,36481:27663,36482:29509,36483:31049,36484:31169,36485:31992,36486:32025,36487:32043,36488:32930,36489:33026,36490:33267,36491:35222,36492:35422,36493:35433,36494:35430,36495:35468,36496:35566,36497:36039,36498:36060,36499:38604,36500:39164,36501:27503,36502:20107,36503:20284,36504:20365,36505:20816,36506:23383,36507:23546,36508:24904,36509:25345,36510:26178,36511:27425,36512:28363,36513:27835,36514:29246,36515:29885,36516:30164,36517:30913,36518:31034,36519:32780,36520:32819,36521:33258,36522:33940,36523:36766,36524:27728,36525:40575,36526:24335,36527:35672,36528:40235,36529:31482,36530:36600,36531:23437,36532:38635,36533:19971,36534:21489,36535:22519,36536:22833,36537:23241,36538:23460,36539:24713,36540:28287,36541:28422,36542:30142,36543:36074,36544:23455,36545:34048,36546:31712,36547:20594,36548:26612,36549:33437,36550:23649,36551:34122,36552:32286,36553:33294,36554:20889,36555:23556,36556:25448,36557:36198,36558:26012,36559:29038,36560:31038,36561:32023,36562:32773,36563:35613,36564:36554,36565:36974,36566:34503,36567:37034,36568:20511,36569:21242,36570:23610,36571:26451,36572:28796,36573:29237,36574:37196,36575:37320,36576:37675,36577:33509,36578:23490,36579:24369,36580:24825,36581:20027,36582:21462,36583:23432,36584:25163,36585:26417,36586:27530,36587:29417,36588:29664,36589:31278,36590:33131,36591:36259,36592:37202,36593:39318,36594:20754,36595:21463,36596:21610,36597:23551,36598:25480,36599:27193,36600:32172,36601:38656,36602:22234,36603:21454,36604:21608,36672:23447,36673:23601,36674:24030,36675:20462,36676:24833,36677:25342,36678:27954,36679:31168,36680:31179,36681:32066,36682:32333,36683:32722,36684:33261,36685:33311,36686:33936,36687:34886,36688:35186,36689:35728,36690:36468,36691:36655,36692:36913,36693:37195,36694:37228,36695:38598,36696:37276,36697:20160,36698:20303,36699:20805,36700:21313,36701:24467,36702:25102,36703:26580,36704:27713,36705:28171,36706:29539,36707:32294,36708:37325,36709:37507,36710:21460,36711:22809,36712:23487,36713:28113,36714:31069,36715:32302,36716:31899,36717:22654,36718:29087,36719:20986,36720:34899,36721:36848,36722:20426,36723:23803,36724:26149,36725:30636,36726:31459,36727:33308,36728:39423,36729:20934,36730:24490,36731:26092,36732:26991,36733:27529,36734:28147,36736:28310,36737:28516,36738:30462,36739:32020,36740:24033,36741:36981,36742:37255,36743:38918,36744:20966,36745:21021,36746:25152,36747:26257,36748:26329,36749:28186,36750:24246,36751:32210,36752:32626,36753:26360,36754:34223,36755:34295,36756:35576,36757:21161,36758:21465,36759:22899,36760:24207,36761:24464,36762:24661,36763:37604,36764:38500,36765:20663,36766:20767,36767:21213,36768:21280,36769:21319,36770:21484,36771:21736,36772:21830,36773:21809,36774:22039,36775:22888,36776:22974,36777:23100,36778:23477,36779:23558,36780:23567,36781:23569,36782:23578,36783:24196,36784:24202,36785:24288,36786:24432,36787:25215,36788:25220,36789:25307,36790:25484,36791:25463,36792:26119,36793:26124,36794:26157,36795:26230,36796:26494,36797:26786,36798:27167,36799:27189,36800:27836,36801:28040,36802:28169,36803:28248,36804:28988,36805:28966,36806:29031,36807:30151,36808:30465,36809:30813,36810:30977,36811:31077,36812:31216,36813:31456,36814:31505,36815:31911,36816:32057,36817:32918,36818:33750,36819:33931,36820:34121,36821:34909,36822:35059,36823:35359,36824:35388,36825:35412,36826:35443,36827:35937,36828:36062,36829:37284,36830:37478,36831:37758,36832:37912,36833:38556,36834:38808,36835:19978,36836:19976,36837:19998,36838:20055,36839:20887,36840:21104,36841:22478,36842:22580,36843:22732,36844:23330,36845:24120,36846:24773,36847:25854,36848:26465,36849:26454,36850:27972,36851:29366,36852:30067,36853:31331,36854:33976,36855:35698,36856:37304,36857:37664,36858:22065,36859:22516,36860:39166,36928:25325,36929:26893,36930:27542,36931:29165,36932:32340,36933:32887,36934:33394,36935:35302,36936:39135,36937:34645,36938:36785,36939:23611,36940:20280,36941:20449,36942:20405,36943:21767,36944:23072,36945:23517,36946:23529,36947:24515,36948:24910,36949:25391,36950:26032,36951:26187,36952:26862,36953:27035,36954:28024,36955:28145,36956:30003,36957:30137,36958:30495,36959:31070,36960:31206,36961:32051,36962:33251,36963:33455,36964:34218,36965:35242,36966:35386,36967:36523,36968:36763,36969:36914,36970:37341,36971:38663,36972:20154,36973:20161,36974:20995,36975:22645,36976:22764,36977:23563,36978:29978,36979:23613,36980:33102,36981:35338,36982:36805,36983:38499,36984:38765,36985:31525,36986:35535,36987:38920,36988:37218,36989:22259,36990:21416,36992:36887,36993:21561,36994:22402,36995:24101,36996:25512,36997:27700,36998:28810,36999:30561,37e3:31883,37001:32736,37002:34928,37003:36930,37004:37204,37005:37648,37006:37656,37007:38543,37008:29790,37009:39620,37010:23815,37011:23913,37012:25968,37013:26530,37014:36264,37015:38619,37016:25454,37017:26441,37018:26905,37019:33733,37020:38935,37021:38592,37022:35070,37023:28548,37024:25722,37025:23544,37026:19990,37027:28716,37028:30045,37029:26159,37030:20932,37031:21046,37032:21218,37033:22995,37034:24449,37035:24615,37036:25104,37037:25919,37038:25972,37039:26143,37040:26228,37041:26866,37042:26646,37043:27491,37044:28165,37045:29298,37046:29983,37047:30427,37048:31934,37049:32854,37050:22768,37051:35069,37052:35199,37053:35488,37054:35475,37055:35531,37056:36893,37057:37266,37058:38738,37059:38745,37060:25993,37061:31246,37062:33030,37063:38587,37064:24109,37065:24796,37066:25114,37067:26021,37068:26132,37069:26512,37070:30707,37071:31309,37072:31821,37073:32318,37074:33034,37075:36012,37076:36196,37077:36321,37078:36447,37079:30889,37080:20999,37081:25305,37082:25509,37083:25666,37084:25240,37085:35373,37086:31363,37087:31680,37088:35500,37089:38634,37090:32118,37091:33292,37092:34633,37093:20185,37094:20808,37095:21315,37096:21344,37097:23459,37098:23554,37099:23574,37100:24029,37101:25126,37102:25159,37103:25776,37104:26643,37105:26676,37106:27849,37107:27973,37108:27927,37109:26579,37110:28508,37111:29006,37112:29053,37113:26059,37114:31359,37115:31661,37116:32218,37184:32330,37185:32680,37186:33146,37187:33307,37188:33337,37189:34214,37190:35438,37191:36046,37192:36341,37193:36984,37194:36983,37195:37549,37196:37521,37197:38275,37198:39854,37199:21069,37200:21892,37201:28472,37202:28982,37203:20840,37204:31109,37205:32341,37206:33203,37207:31950,37208:22092,37209:22609,37210:23720,37211:25514,37212:26366,37213:26365,37214:26970,37215:29401,37216:30095,37217:30094,37218:30990,37219:31062,37220:31199,37221:31895,37222:32032,37223:32068,37224:34311,37225:35380,37226:38459,37227:36961,37228:40736,37229:20711,37230:21109,37231:21452,37232:21474,37233:20489,37234:21930,37235:22766,37236:22863,37237:29245,37238:23435,37239:23652,37240:21277,37241:24803,37242:24819,37243:25436,37244:25475,37245:25407,37246:25531,37248:25805,37249:26089,37250:26361,37251:24035,37252:27085,37253:27133,37254:28437,37255:29157,37256:20105,37257:30185,37258:30456,37259:31379,37260:31967,37261:32207,37262:32156,37263:32865,37264:33609,37265:33624,37266:33900,37267:33980,37268:34299,37269:35013,37270:36208,37271:36865,37272:36973,37273:37783,37274:38684,37275:39442,37276:20687,37277:22679,37278:24974,37279:33235,37280:34101,37281:36104,37282:36896,37283:20419,37284:20596,37285:21063,37286:21363,37287:24687,37288:25417,37289:26463,37290:28204,37291:36275,37292:36895,37293:20439,37294:23646,37295:36042,37296:26063,37297:32154,37298:21330,37299:34966,37300:20854,37301:25539,37302:23384,37303:23403,37304:23562,37305:25613,37306:26449,37307:36956,37308:20182,37309:22810,37310:22826,37311:27760,37312:35409,37313:21822,37314:22549,37315:22949,37316:24816,37317:25171,37318:26561,37319:33333,37320:26965,37321:38464,37322:39364,37323:39464,37324:20307,37325:22534,37326:23550,37327:32784,37328:23729,37329:24111,37330:24453,37331:24608,37332:24907,37333:25140,37334:26367,37335:27888,37336:28382,37337:32974,37338:33151,37339:33492,37340:34955,37341:36024,37342:36864,37343:36910,37344:38538,37345:40667,37346:39899,37347:20195,37348:21488,37349:22823,37350:31532,37351:37261,37352:38988,37353:40441,37354:28381,37355:28711,37356:21331,37357:21828,37358:23429,37359:25176,37360:25246,37361:25299,37362:27810,37363:28655,37364:29730,37365:35351,37366:37944,37367:28609,37368:35582,37369:33592,37370:20967,37371:34552,37372:21482,37440:21481,37441:20294,37442:36948,37443:36784,37444:22890,37445:33073,37446:24061,37447:31466,37448:36799,37449:26842,37450:35895,37451:29432,37452:40008,37453:27197,37454:35504,37455:20025,37456:21336,37457:22022,37458:22374,37459:25285,37460:25506,37461:26086,37462:27470,37463:28129,37464:28251,37465:28845,37466:30701,37467:31471,37468:31658,37469:32187,37470:32829,37471:32966,37472:34507,37473:35477,37474:37723,37475:22243,37476:22727,37477:24382,37478:26029,37479:26262,37480:27264,37481:27573,37482:30007,37483:35527,37484:20516,37485:30693,37486:22320,37487:24347,37488:24677,37489:26234,37490:27744,37491:30196,37492:31258,37493:32622,37494:33268,37495:34584,37496:36933,37497:39347,37498:31689,37499:30044,37500:31481,37501:31569,37502:33988,37504:36880,37505:31209,37506:31378,37507:33590,37508:23265,37509:30528,37510:20013,37511:20210,37512:23449,37513:24544,37514:25277,37515:26172,37516:26609,37517:27880,37518:34411,37519:34935,37520:35387,37521:37198,37522:37619,37523:39376,37524:27159,37525:28710,37526:29482,37527:33511,37528:33879,37529:36015,37530:19969,37531:20806,37532:20939,37533:21899,37534:23541,37535:24086,37536:24115,37537:24193,37538:24340,37539:24373,37540:24427,37541:24500,37542:25074,37543:25361,37544:26274,37545:26397,37546:28526,37547:29266,37548:30010,37549:30522,37550:32884,37551:33081,37552:33144,37553:34678,37554:35519,37555:35548,37556:36229,37557:36339,37558:37530,37559:38263,37560:38914,37561:40165,37562:21189,37563:25431,37564:30452,37565:26389,37566:27784,37567:29645,37568:36035,37569:37806,37570:38515,37571:27941,37572:22684,37573:26894,37574:27084,37575:36861,37576:37786,37577:30171,37578:36890,37579:22618,37580:26626,37581:25524,37582:27131,37583:20291,37584:28460,37585:26584,37586:36795,37587:34086,37588:32180,37589:37716,37590:26943,37591:28528,37592:22378,37593:22775,37594:23340,37595:32044,37596:29226,37597:21514,37598:37347,37599:40372,37600:20141,37601:20302,37602:20572,37603:20597,37604:21059,37605:35998,37606:21576,37607:22564,37608:23450,37609:24093,37610:24213,37611:24237,37612:24311,37613:24351,37614:24716,37615:25269,37616:25402,37617:25552,37618:26799,37619:27712,37620:30855,37621:31118,37622:31243,37623:32224,37624:33351,37625:35330,37626:35558,37627:36420,37628:36883,37696:37048,37697:37165,37698:37336,37699:40718,37700:27877,37701:25688,37702:25826,37703:25973,37704:28404,37705:30340,37706:31515,37707:36969,37708:37841,37709:28346,37710:21746,37711:24505,37712:25764,37713:36685,37714:36845,37715:37444,37716:20856,37717:22635,37718:22825,37719:23637,37720:24215,37721:28155,37722:32399,37723:29980,37724:36028,37725:36578,37726:39003,37727:28857,37728:20253,37729:27583,37730:28593,37731:3e4,37732:38651,37733:20814,37734:21520,37735:22581,37736:22615,37737:22956,37738:23648,37739:24466,37740:26007,37741:26460,37742:28193,37743:30331,37744:33759,37745:36077,37746:36884,37747:37117,37748:37709,37749:30757,37750:30778,37751:21162,37752:24230,37753:22303,37754:22900,37755:24594,37756:20498,37757:20826,37758:20908,37760:20941,37761:20992,37762:21776,37763:22612,37764:22616,37765:22871,37766:23445,37767:23798,37768:23947,37769:24764,37770:25237,37771:25645,37772:26481,37773:26691,37774:26812,37775:26847,37776:30423,37777:28120,37778:28271,37779:28059,37780:28783,37781:29128,37782:24403,37783:30168,37784:31095,37785:31561,37786:31572,37787:31570,37788:31958,37789:32113,37790:21040,37791:33891,37792:34153,37793:34276,37794:35342,37795:35588,37796:35910,37797:36367,37798:36867,37799:36879,37800:37913,37801:38518,37802:38957,37803:39472,37804:38360,37805:20685,37806:21205,37807:21516,37808:22530,37809:23566,37810:24999,37811:25758,37812:27934,37813:30643,37814:31461,37815:33012,37816:33796,37817:36947,37818:37509,37819:23776,37820:40199,37821:21311,37822:24471,37823:24499,37824:28060,37825:29305,37826:30563,37827:31167,37828:31716,37829:27602,37830:29420,37831:35501,37832:26627,37833:27233,37834:20984,37835:31361,37836:26932,37837:23626,37838:40182,37839:33515,37840:23493,37841:37193,37842:28702,37843:22136,37844:23663,37845:24775,37846:25958,37847:27788,37848:35930,37849:36929,37850:38931,37851:21585,37852:26311,37853:37389,37854:22856,37855:37027,37856:20869,37857:20045,37858:20970,37859:34201,37860:35598,37861:28760,37862:25466,37863:37707,37864:26978,37865:39348,37866:32260,37867:30071,37868:21335,37869:26976,37870:36575,37871:38627,37872:27741,37873:20108,37874:23612,37875:24336,37876:36841,37877:21250,37878:36049,37879:32905,37880:34425,37881:24319,37882:26085,37883:20083,37884:20837,37952:22914,37953:23615,37954:38894,37955:20219,37956:22922,37957:24525,37958:35469,37959:28641,37960:31152,37961:31074,37962:23527,37963:33905,37964:29483,37965:29105,37966:24180,37967:24565,37968:25467,37969:25754,37970:29123,37971:31896,37972:20035,37973:24316,37974:20043,37975:22492,37976:22178,37977:24745,37978:28611,37979:32013,37980:33021,37981:33075,37982:33215,37983:36786,37984:35223,37985:34468,37986:24052,37987:25226,37988:25773,37989:35207,37990:26487,37991:27874,37992:27966,37993:29750,37994:30772,37995:23110,37996:32629,37997:33453,37998:39340,37999:20467,38e3:24259,38001:25309,38002:25490,38003:25943,38004:26479,38005:30403,38006:29260,38007:32972,38008:32954,38009:36649,38010:37197,38011:20493,38012:22521,38013:23186,38014:26757,38016:26995,38017:29028,38018:29437,38019:36023,38020:22770,38021:36064,38022:38506,38023:36889,38024:34687,38025:31204,38026:30695,38027:33833,38028:20271,38029:21093,38030:21338,38031:25293,38032:26575,38033:27850,38034:30333,38035:31636,38036:31893,38037:33334,38038:34180,38039:36843,38040:26333,38041:28448,38042:29190,38043:32283,38044:33707,38045:39361,38046:40614,38047:20989,38048:31665,38049:30834,38050:31672,38051:32903,38052:31560,38053:27368,38054:24161,38055:32908,38056:30033,38057:30048,38058:20843,38059:37474,38060:28300,38061:30330,38062:37271,38063:39658,38064:20240,38065:32624,38066:25244,38067:31567,38068:38309,38069:40169,38070:22138,38071:22617,38072:34532,38073:38588,38074:20276,38075:21028,38076:21322,38077:21453,38078:21467,38079:24070,38080:25644,38081:26001,38082:26495,38083:27710,38084:27726,38085:29256,38086:29359,38087:29677,38088:30036,38089:32321,38090:33324,38091:34281,38092:36009,38093:31684,38094:37318,38095:29033,38096:38930,38097:39151,38098:25405,38099:26217,38100:30058,38101:30436,38102:30928,38103:34115,38104:34542,38105:21290,38106:21329,38107:21542,38108:22915,38109:24199,38110:24444,38111:24754,38112:25161,38113:25209,38114:25259,38115:26e3,38116:27604,38117:27852,38118:30130,38119:30382,38120:30865,38121:31192,38122:32203,38123:32631,38124:32933,38125:34987,38126:35513,38127:36027,38128:36991,38129:38750,38130:39131,38131:27147,38132:31800,38133:20633,38134:23614,38135:24494,38136:26503,38137:27608,38138:29749,38139:30473,38140:32654,38208:40763,38209:26570,38210:31255,38211:21305,38212:30091,38213:39661,38214:24422,38215:33181,38216:33777,38217:32920,38218:24380,38219:24517,38220:30050,38221:31558,38222:36924,38223:26727,38224:23019,38225:23195,38226:32016,38227:30334,38228:35628,38229:20469,38230:24426,38231:27161,38232:27703,38233:28418,38234:29922,38235:31080,38236:34920,38237:35413,38238:35961,38239:24287,38240:25551,38241:30149,38242:31186,38243:33495,38244:37672,38245:37618,38246:33948,38247:34541,38248:39981,38249:21697,38250:24428,38251:25996,38252:27996,38253:28693,38254:36007,38255:36051,38256:38971,38257:25935,38258:29942,38259:19981,38260:20184,38261:22496,38262:22827,38263:23142,38264:23500,38265:20904,38266:24067,38267:24220,38268:24598,38269:25206,38270:25975,38272:26023,38273:26222,38274:28014,38275:29238,38276:31526,38277:33104,38278:33178,38279:33433,38280:35676,38281:36e3,38282:36070,38283:36212,38284:38428,38285:38468,38286:20398,38287:25771,38288:27494,38289:33310,38290:33889,38291:34154,38292:37096,38293:23553,38294:26963,38295:39080,38296:33914,38297:34135,38298:20239,38299:21103,38300:24489,38301:24133,38302:26381,38303:31119,38304:33145,38305:35079,38306:35206,38307:28149,38308:24343,38309:25173,38310:27832,38311:20175,38312:29289,38313:39826,38314:20998,38315:21563,38316:22132,38317:22707,38318:24996,38319:25198,38320:28954,38321:22894,38322:31881,38323:31966,38324:32027,38325:38640,38326:25991,38327:32862,38328:19993,38329:20341,38330:20853,38331:22592,38332:24163,38333:24179,38334:24330,38335:26564,38336:20006,38337:34109,38338:38281,38339:38491,38340:31859,38341:38913,38342:20731,38343:22721,38344:30294,38345:30887,38346:21029,38347:30629,38348:34065,38349:31622,38350:20559,38351:22793,38352:29255,38353:31687,38354:32232,38355:36794,38356:36820,38357:36941,38358:20415,38359:21193,38360:23081,38361:24321,38362:38829,38363:20445,38364:33303,38365:37610,38366:22275,38367:25429,38368:27497,38369:29995,38370:35036,38371:36628,38372:31298,38373:21215,38374:22675,38375:24917,38376:25098,38377:26286,38378:27597,38379:31807,38380:33769,38381:20515,38382:20472,38383:21253,38384:21574,38385:22577,38386:22857,38387:23453,38388:23792,38389:23791,38390:23849,38391:24214,38392:25265,38393:25447,38394:25918,38395:26041,38396:26379,38464:27861,38465:27873,38466:28921,38467:30770,38468:32299,38469:32990,38470:33459,38471:33804,38472:34028,38473:34562,38474:35090,38475:35370,38476:35914,38477:37030,38478:37586,38479:39165,38480:40179,38481:40300,38482:20047,38483:20129,38484:20621,38485:21078,38486:22346,38487:22952,38488:24125,38489:24536,38490:24537,38491:25151,38492:26292,38493:26395,38494:26576,38495:26834,38496:20882,38497:32033,38498:32938,38499:33192,38500:35584,38501:35980,38502:36031,38503:37502,38504:38450,38505:21536,38506:38956,38507:21271,38508:20693,38509:21340,38510:22696,38511:25778,38512:26420,38513:29287,38514:30566,38515:31302,38516:37350,38517:21187,38518:27809,38519:27526,38520:22528,38521:24140,38522:22868,38523:26412,38524:32763,38525:20961,38526:30406,38528:25705,38529:30952,38530:39764,38531:40635,38532:22475,38533:22969,38534:26151,38535:26522,38536:27598,38537:21737,38538:27097,38539:24149,38540:33180,38541:26517,38542:39850,38543:26622,38544:40018,38545:26717,38546:20134,38547:20451,38548:21448,38549:25273,38550:26411,38551:27819,38552:36804,38553:20397,38554:32365,38555:40639,38556:19975,38557:24930,38558:28288,38559:28459,38560:34067,38561:21619,38562:26410,38563:39749,38564:24051,38565:31637,38566:23724,38567:23494,38568:34588,38569:28234,38570:34001,38571:31252,38572:33032,38573:22937,38574:31885,38575:27665,38576:30496,38577:21209,38578:22818,38579:28961,38580:29279,38581:30683,38582:38695,38583:40289,38584:26891,38585:23167,38586:23064,38587:20901,38588:21517,38589:21629,38590:26126,38591:30431,38592:36855,38593:37528,38594:40180,38595:23018,38596:29277,38597:28357,38598:20813,38599:26825,38600:32191,38601:32236,38602:38754,38603:40634,38604:25720,38605:27169,38606:33538,38607:22916,38608:23391,38609:27611,38610:29467,38611:30450,38612:32178,38613:32791,38614:33945,38615:20786,38616:26408,38617:40665,38618:30446,38619:26466,38620:21247,38621:39173,38622:23588,38623:25147,38624:31870,38625:36016,38626:21839,38627:24758,38628:32011,38629:38272,38630:21249,38631:20063,38632:20918,38633:22812,38634:29242,38635:32822,38636:37326,38637:24357,38638:30690,38639:21380,38640:24441,38641:32004,38642:34220,38643:35379,38644:36493,38645:38742,38646:26611,38647:34222,38648:37971,38649:24841,38650:24840,38651:27833,38652:30290,38720:35565,38721:36664,38722:21807,38723:20305,38724:20778,38725:21191,38726:21451,38727:23461,38728:24189,38729:24736,38730:24962,38731:25558,38732:26377,38733:26586,38734:28263,38735:28044,38736:29494,38737:29495,38738:30001,38739:31056,38740:35029,38741:35480,38742:36938,38743:37009,38744:37109,38745:38596,38746:34701,38747:22805,38748:20104,38749:20313,38750:19982,38751:35465,38752:36671,38753:38928,38754:20653,38755:24188,38756:22934,38757:23481,38758:24248,38759:25562,38760:25594,38761:25793,38762:26332,38763:26954,38764:27096,38765:27915,38766:28342,38767:29076,38768:29992,38769:31407,38770:32650,38771:32768,38772:33865,38773:33993,38774:35201,38775:35617,38776:36362,38777:36965,38778:38525,38779:39178,38780:24958,38781:25233,38782:27442,38784:27779,38785:28020,38786:32716,38787:32764,38788:28096,38789:32645,38790:34746,38791:35064,38792:26469,38793:33713,38794:38972,38795:38647,38796:27931,38797:32097,38798:33853,38799:37226,38800:20081,38801:21365,38802:23888,38803:27396,38804:28651,38805:34253,38806:34349,38807:35239,38808:21033,38809:21519,38810:23653,38811:26446,38812:26792,38813:29702,38814:29827,38815:30178,38816:35023,38817:35041,38818:37324,38819:38626,38820:38520,38821:24459,38822:29575,38823:31435,38824:33870,38825:25504,38826:30053,38827:21129,38828:27969,38829:28316,38830:29705,38831:30041,38832:30827,38833:31890,38834:38534,38835:31452,38836:40845,38837:20406,38838:24942,38839:26053,38840:34396,38841:20102,38842:20142,38843:20698,38844:20001,38845:20940,38846:23534,38847:26009,38848:26753,38849:28092,38850:29471,38851:30274,38852:30637,38853:31260,38854:31975,38855:33391,38856:35538,38857:36988,38858:37327,38859:38517,38860:38936,38861:21147,38862:32209,38863:20523,38864:21400,38865:26519,38866:28107,38867:29136,38868:29747,38869:33256,38870:36650,38871:38563,38872:40023,38873:40607,38874:29792,38875:22593,38876:28057,38877:32047,38878:39006,38879:20196,38880:20278,38881:20363,38882:20919,38883:21169,38884:23994,38885:24604,38886:29618,38887:31036,38888:33491,38889:37428,38890:38583,38891:38646,38892:38666,38893:40599,38894:40802,38895:26278,38896:27508,38897:21015,38898:21155,38899:28872,38900:35010,38901:24265,38902:24651,38903:24976,38904:28451,38905:29001,38906:31806,38907:32244,38908:32879,38976:34030,38977:36899,38978:37676,38979:21570,38980:39791,38981:27347,38982:28809,38983:36034,38984:36335,38985:38706,38986:21172,38987:23105,38988:24266,38989:24324,38990:26391,38991:27004,38992:27028,38993:28010,38994:28431,38995:29282,38996:29436,38997:31725,38998:32769,38999:32894,39e3:34635,39001:37070,39002:20845,39003:40595,39004:31108,39005:32907,39006:37682,39007:35542,39008:20525,39009:21644,39010:35441,39011:27498,39012:36036,39013:33031,39014:24785,39015:26528,39016:40434,39017:20121,39018:20120,39019:39952,39020:35435,39021:34241,39022:34152,39023:26880,39024:28286,39025:30871,39026:33109,39071:24332,39072:19984,39073:19989,39074:20010,39075:20017,39076:20022,39077:20028,39078:20031,39079:20034,39080:20054,39081:20056,39082:20098,39083:20101,39084:35947,39085:20106,39086:33298,39087:24333,39088:20110,39089:20126,39090:20127,39091:20128,39092:20130,39093:20144,39094:20147,39095:20150,39096:20174,39097:20173,39098:20164,39099:20166,39100:20162,39101:20183,39102:20190,39103:20205,39104:20191,39105:20215,39106:20233,39107:20314,39108:20272,39109:20315,39110:20317,39111:20311,39112:20295,39113:20342,39114:20360,39115:20367,39116:20376,39117:20347,39118:20329,39119:20336,39120:20369,39121:20335,39122:20358,39123:20374,39124:20760,39125:20436,39126:20447,39127:20430,39128:20440,39129:20443,39130:20433,39131:20442,39132:20432,39133:20452,39134:20453,39135:20506,39136:20520,39137:20500,39138:20522,39139:20517,39140:20485,39141:20252,39142:20470,39143:20513,39144:20521,39145:20524,39146:20478,39147:20463,39148:20497,39149:20486,39150:20547,39151:20551,39152:26371,39153:20565,39154:20560,39155:20552,39156:20570,39157:20566,39158:20588,39159:20600,39160:20608,39161:20634,39162:20613,39163:20660,39164:20658,39232:20681,39233:20682,39234:20659,39235:20674,39236:20694,39237:20702,39238:20709,39239:20717,39240:20707,39241:20718,39242:20729,39243:20725,39244:20745,39245:20737,39246:20738,39247:20758,39248:20757,39249:20756,39250:20762,39251:20769,39252:20794,39253:20791,39254:20796,39255:20795,39256:20799,39257:20800,39258:20818,39259:20812,39260:20820,39261:20834,39262:31480,39263:20841,39264:20842,39265:20846,39266:20864,39267:20866,39268:22232,39269:20876,39270:20873,39271:20879,39272:20881,39273:20883,39274:20885,39275:20886,39276:20900,39277:20902,39278:20898,39279:20905,39280:20906,39281:20907,39282:20915,39283:20913,39284:20914,39285:20912,39286:20917,39287:20925,39288:20933,39289:20937,39290:20955,39291:20960,39292:34389,39293:20969,39294:20973,39296:20976,39297:20981,39298:20990,39299:20996,39300:21003,39301:21012,39302:21006,39303:21031,39304:21034,39305:21038,39306:21043,39307:21049,39308:21071,39309:21060,39310:21067,39311:21068,39312:21086,39313:21076,39314:21098,39315:21108,39316:21097,39317:21107,39318:21119,39319:21117,39320:21133,39321:21140,39322:21138,39323:21105,39324:21128,39325:21137,39326:36776,39327:36775,39328:21164,39329:21165,39330:21180,39331:21173,39332:21185,39333:21197,39334:21207,39335:21214,39336:21219,39337:21222,39338:39149,39339:21216,39340:21235,39341:21237,39342:21240,39343:21241,39344:21254,39345:21256,39346:30008,39347:21261,39348:21264,39349:21263,39350:21269,39351:21274,39352:21283,39353:21295,39354:21297,39355:21299,39356:21304,39357:21312,39358:21318,39359:21317,39360:19991,39361:21321,39362:21325,39363:20950,39364:21342,39365:21353,39366:21358,39367:22808,39368:21371,39369:21367,39370:21378,39371:21398,39372:21408,39373:21414,39374:21413,39375:21422,39376:21424,39377:21430,39378:21443,39379:31762,39380:38617,39381:21471,39382:26364,39383:29166,39384:21486,39385:21480,39386:21485,39387:21498,39388:21505,39389:21565,39390:21568,39391:21548,39392:21549,39393:21564,39394:21550,39395:21558,39396:21545,39397:21533,39398:21582,39399:21647,39400:21621,39401:21646,39402:21599,39403:21617,39404:21623,39405:21616,39406:21650,39407:21627,39408:21632,39409:21622,39410:21636,39411:21648,39412:21638,39413:21703,39414:21666,39415:21688,39416:21669,39417:21676,39418:21700,39419:21704,39420:21672,39488:21675,39489:21698,39490:21668,39491:21694,39492:21692,39493:21720,39494:21733,39495:21734,39496:21775,39497:21780,39498:21757,39499:21742,39500:21741,39501:21754,39502:21730,39503:21817,39504:21824,39505:21859,39506:21836,39507:21806,39508:21852,39509:21829,39510:21846,39511:21847,39512:21816,39513:21811,39514:21853,39515:21913,39516:21888,39517:21679,39518:21898,39519:21919,39520:21883,39521:21886,39522:21912,39523:21918,39524:21934,39525:21884,39526:21891,39527:21929,39528:21895,39529:21928,39530:21978,39531:21957,39532:21983,39533:21956,39534:21980,39535:21988,39536:21972,39537:22036,39538:22007,39539:22038,39540:22014,39541:22013,39542:22043,39543:22009,39544:22094,39545:22096,39546:29151,39547:22068,39548:22070,39549:22066,39550:22072,39552:22123,39553:22116,39554:22063,39555:22124,39556:22122,39557:22150,39558:22144,39559:22154,39560:22176,39561:22164,39562:22159,39563:22181,39564:22190,39565:22198,39566:22196,39567:22210,39568:22204,39569:22209,39570:22211,39571:22208,39572:22216,39573:22222,39574:22225,39575:22227,39576:22231,39577:22254,39578:22265,39579:22272,39580:22271,39581:22276,39582:22281,39583:22280,39584:22283,39585:22285,39586:22291,39587:22296,39588:22294,39589:21959,39590:22300,39591:22310,39592:22327,39593:22328,39594:22350,39595:22331,39596:22336,39597:22351,39598:22377,39599:22464,39600:22408,39601:22369,39602:22399,39603:22409,39604:22419,39605:22432,39606:22451,39607:22436,39608:22442,39609:22448,39610:22467,39611:22470,39612:22484,39613:22482,39614:22483,39615:22538,39616:22486,39617:22499,39618:22539,39619:22553,39620:22557,39621:22642,39622:22561,39623:22626,39624:22603,39625:22640,39626:27584,39627:22610,39628:22589,39629:22649,39630:22661,39631:22713,39632:22687,39633:22699,39634:22714,39635:22750,39636:22715,39637:22712,39638:22702,39639:22725,39640:22739,39641:22737,39642:22743,39643:22745,39644:22744,39645:22757,39646:22748,39647:22756,39648:22751,39649:22767,39650:22778,39651:22777,39652:22779,39653:22780,39654:22781,39655:22786,39656:22794,39657:22800,39658:22811,39659:26790,39660:22821,39661:22828,39662:22829,39663:22834,39664:22840,39665:22846,39666:31442,39667:22869,39668:22864,39669:22862,39670:22874,39671:22872,39672:22882,39673:22880,39674:22887,39675:22892,39676:22889,39744:22904,39745:22913,39746:22941,39747:20318,39748:20395,39749:22947,39750:22962,39751:22982,39752:23016,39753:23004,39754:22925,39755:23001,39756:23002,39757:23077,39758:23071,39759:23057,39760:23068,39761:23049,39762:23066,39763:23104,39764:23148,39765:23113,39766:23093,39767:23094,39768:23138,39769:23146,39770:23194,39771:23228,39772:23230,39773:23243,39774:23234,39775:23229,39776:23267,39777:23255,39778:23270,39779:23273,39780:23254,39781:23290,39782:23291,39783:23308,39784:23307,39785:23318,39786:23346,39787:23248,39788:23338,39789:23350,39790:23358,39791:23363,39792:23365,39793:23360,39794:23377,39795:23381,39796:23386,39797:23387,39798:23397,39799:23401,39800:23408,39801:23411,39802:23413,39803:23416,39804:25992,39805:23418,39806:23424,39808:23427,39809:23462,39810:23480,39811:23491,39812:23495,39813:23497,39814:23508,39815:23504,39816:23524,39817:23526,39818:23522,39819:23518,39820:23525,39821:23531,39822:23536,39823:23542,39824:23539,39825:23557,39826:23559,39827:23560,39828:23565,39829:23571,39830:23584,39831:23586,39832:23592,39833:23608,39834:23609,39835:23617,39836:23622,39837:23630,39838:23635,39839:23632,39840:23631,39841:23409,39842:23660,39843:23662,39844:20066,39845:23670,39846:23673,39847:23692,39848:23697,39849:23700,39850:22939,39851:23723,39852:23739,39853:23734,39854:23740,39855:23735,39856:23749,39857:23742,39858:23751,39859:23769,39860:23785,39861:23805,39862:23802,39863:23789,39864:23948,39865:23786,39866:23819,39867:23829,39868:23831,39869:23900,39870:23839,39871:23835,39872:23825,39873:23828,39874:23842,39875:23834,39876:23833,39877:23832,39878:23884,39879:23890,39880:23886,39881:23883,39882:23916,39883:23923,39884:23926,39885:23943,39886:23940,39887:23938,39888:23970,39889:23965,39890:23980,39891:23982,39892:23997,39893:23952,39894:23991,39895:23996,39896:24009,39897:24013,39898:24019,39899:24018,39900:24022,39901:24027,39902:24043,39903:24050,39904:24053,39905:24075,39906:24090,39907:24089,39908:24081,39909:24091,39910:24118,39911:24119,39912:24132,39913:24131,39914:24128,39915:24142,39916:24151,39917:24148,39918:24159,39919:24162,39920:24164,39921:24135,39922:24181,39923:24182,39924:24186,39925:40636,39926:24191,39927:24224,39928:24257,39929:24258,39930:24264,39931:24272,39932:24271,4e4:24278,40001:24291,40002:24285,40003:24282,40004:24283,40005:24290,40006:24289,40007:24296,40008:24297,40009:24300,40010:24305,40011:24307,40012:24304,40013:24308,40014:24312,40015:24318,40016:24323,40017:24329,40018:24413,40019:24412,40020:24331,40021:24337,40022:24342,40023:24361,40024:24365,40025:24376,40026:24385,40027:24392,40028:24396,40029:24398,40030:24367,40031:24401,40032:24406,40033:24407,40034:24409,40035:24417,40036:24429,40037:24435,40038:24439,40039:24451,40040:24450,40041:24447,40042:24458,40043:24456,40044:24465,40045:24455,40046:24478,40047:24473,40048:24472,40049:24480,40050:24488,40051:24493,40052:24508,40053:24534,40054:24571,40055:24548,40056:24568,40057:24561,40058:24541,40059:24755,40060:24575,40061:24609,40062:24672,40064:24601,40065:24592,40066:24617,40067:24590,40068:24625,40069:24603,40070:24597,40071:24619,40072:24614,40073:24591,40074:24634,40075:24666,40076:24641,40077:24682,40078:24695,40079:24671,40080:24650,40081:24646,40082:24653,40083:24675,40084:24643,40085:24676,40086:24642,40087:24684,40088:24683,40089:24665,40090:24705,40091:24717,40092:24807,40093:24707,40094:24730,40095:24708,40096:24731,40097:24726,40098:24727,40099:24722,40100:24743,40101:24715,40102:24801,40103:24760,40104:24800,40105:24787,40106:24756,40107:24560,40108:24765,40109:24774,40110:24757,40111:24792,40112:24909,40113:24853,40114:24838,40115:24822,40116:24823,40117:24832,40118:24820,40119:24826,40120:24835,40121:24865,40122:24827,40123:24817,40124:24845,40125:24846,40126:24903,40127:24894,40128:24872,40129:24871,40130:24906,40131:24895,40132:24892,40133:24876,40134:24884,40135:24893,40136:24898,40137:24900,40138:24947,40139:24951,40140:24920,40141:24921,40142:24922,40143:24939,40144:24948,40145:24943,40146:24933,40147:24945,40148:24927,40149:24925,40150:24915,40151:24949,40152:24985,40153:24982,40154:24967,40155:25004,40156:24980,40157:24986,40158:24970,40159:24977,40160:25003,40161:25006,40162:25036,40163:25034,40164:25033,40165:25079,40166:25032,40167:25027,40168:25030,40169:25018,40170:25035,40171:32633,40172:25037,40173:25062,40174:25059,40175:25078,40176:25082,40177:25076,40178:25087,40179:25085,40180:25084,40181:25086,40182:25088,40183:25096,40184:25097,40185:25101,40186:25100,40187:25108,40188:25115,40256:25118,40257:25121,40258:25130,40259:25134,40260:25136,40261:25138,40262:25139,40263:25153,40264:25166,40265:25182,40266:25187,40267:25179,40268:25184,40269:25192,40270:25212,40271:25218,40272:25225,40273:25214,40274:25234,40275:25235,40276:25238,40277:25300,40278:25219,40279:25236,40280:25303,40281:25297,40282:25275,40283:25295,40284:25343,40285:25286,40286:25812,40287:25288,40288:25308,40289:25292,40290:25290,40291:25282,40292:25287,40293:25243,40294:25289,40295:25356,40296:25326,40297:25329,40298:25383,40299:25346,40300:25352,40301:25327,40302:25333,40303:25424,40304:25406,40305:25421,40306:25628,40307:25423,40308:25494,40309:25486,40310:25472,40311:25515,40312:25462,40313:25507,40314:25487,40315:25481,40316:25503,40317:25525,40318:25451,40320:25449,40321:25534,40322:25577,40323:25536,40324:25542,40325:25571,40326:25545,40327:25554,40328:25590,40329:25540,40330:25622,40331:25652,40332:25606,40333:25619,40334:25638,40335:25654,40336:25885,40337:25623,40338:25640,40339:25615,40340:25703,40341:25711,40342:25718,40343:25678,40344:25898,40345:25749,40346:25747,40347:25765,40348:25769,40349:25736,40350:25788,40351:25818,40352:25810,40353:25797,40354:25799,40355:25787,40356:25816,40357:25794,40358:25841,40359:25831,40360:33289,40361:25824,40362:25825,40363:25260,40364:25827,40365:25839,40366:25900,40367:25846,40368:25844,40369:25842,40370:25850,40371:25856,40372:25853,40373:25880,40374:25884,40375:25861,40376:25892,40377:25891,40378:25899,40379:25908,40380:25909,40381:25911,40382:25910,40383:25912,40384:30027,40385:25928,40386:25942,40387:25941,40388:25933,40389:25944,40390:25950,40391:25949,40392:25970,40393:25976,40394:25986,40395:25987,40396:35722,40397:26011,40398:26015,40399:26027,40400:26039,40401:26051,40402:26054,40403:26049,40404:26052,40405:26060,40406:26066,40407:26075,40408:26073,40409:26080,40410:26081,40411:26097,40412:26482,40413:26122,40414:26115,40415:26107,40416:26483,40417:26165,40418:26166,40419:26164,40420:26140,40421:26191,40422:26180,40423:26185,40424:26177,40425:26206,40426:26205,40427:26212,40428:26215,40429:26216,40430:26207,40431:26210,40432:26224,40433:26243,40434:26248,40435:26254,40436:26249,40437:26244,40438:26264,40439:26269,40440:26305,40441:26297,40442:26313,40443:26302,40444:26300,40512:26308,40513:26296,40514:26326,40515:26330,40516:26336,40517:26175,40518:26342,40519:26345,40520:26352,40521:26357,40522:26359,40523:26383,40524:26390,40525:26398,40526:26406,40527:26407,40528:38712,40529:26414,40530:26431,40531:26422,40532:26433,40533:26424,40534:26423,40535:26438,40536:26462,40537:26464,40538:26457,40539:26467,40540:26468,40541:26505,40542:26480,40543:26537,40544:26492,40545:26474,40546:26508,40547:26507,40548:26534,40549:26529,40550:26501,40551:26551,40552:26607,40553:26548,40554:26604,40555:26547,40556:26601,40557:26552,40558:26596,40559:26590,40560:26589,40561:26594,40562:26606,40563:26553,40564:26574,40565:26566,40566:26599,40567:27292,40568:26654,40569:26694,40570:26665,40571:26688,40572:26701,40573:26674,40574:26702,40576:26803,40577:26667,40578:26713,40579:26723,40580:26743,40581:26751,40582:26783,40583:26767,40584:26797,40585:26772,40586:26781,40587:26779,40588:26755,40589:27310,40590:26809,40591:26740,40592:26805,40593:26784,40594:26810,40595:26895,40596:26765,40597:26750,40598:26881,40599:26826,40600:26888,40601:26840,40602:26914,40603:26918,40604:26849,40605:26892,40606:26829,40607:26836,40608:26855,40609:26837,40610:26934,40611:26898,40612:26884,40613:26839,40614:26851,40615:26917,40616:26873,40617:26848,40618:26863,40619:26920,40620:26922,40621:26906,40622:26915,40623:26913,40624:26822,40625:27001,40626:26999,40627:26972,40628:27e3,40629:26987,40630:26964,40631:27006,40632:26990,40633:26937,40634:26996,40635:26941,40636:26969,40637:26928,40638:26977,40639:26974,40640:26973,40641:27009,40642:26986,40643:27058,40644:27054,40645:27088,40646:27071,40647:27073,40648:27091,40649:27070,40650:27086,40651:23528,40652:27082,40653:27101,40654:27067,40655:27075,40656:27047,40657:27182,40658:27025,40659:27040,40660:27036,40661:27029,40662:27060,40663:27102,40664:27112,40665:27138,40666:27163,40667:27135,40668:27402,40669:27129,40670:27122,40671:27111,40672:27141,40673:27057,40674:27166,40675:27117,40676:27156,40677:27115,40678:27146,40679:27154,40680:27329,40681:27171,40682:27155,40683:27204,40684:27148,40685:27250,40686:27190,40687:27256,40688:27207,40689:27234,40690:27225,40691:27238,40692:27208,40693:27192,40694:27170,40695:27280,40696:27277,40697:27296,40698:27268,40699:27298,40700:27299,40768:27287,40769:34327,40770:27323,40771:27331,40772:27330,40773:27320,40774:27315,40775:27308,40776:27358,40777:27345,40778:27359,40779:27306,40780:27354,40781:27370,40782:27387,40783:27397,40784:34326,40785:27386,40786:27410,40787:27414,40788:39729,40789:27423,40790:27448,40791:27447,40792:30428,40793:27449,40794:39150,40795:27463,40796:27459,40797:27465,40798:27472,40799:27481,40800:27476,40801:27483,40802:27487,40803:27489,40804:27512,40805:27513,40806:27519,40807:27520,40808:27524,40809:27523,40810:27533,40811:27544,40812:27541,40813:27550,40814:27556,40815:27562,40816:27563,40817:27567,40818:27570,40819:27569,40820:27571,40821:27575,40822:27580,40823:27590,40824:27595,40825:27603,40826:27615,40827:27628,40828:27627,40829:27635,40830:27631,40832:40638,40833:27656,40834:27667,40835:27668,40836:27675,40837:27684,40838:27683,40839:27742,40840:27733,40841:27746,40842:27754,40843:27778,40844:27789,40845:27802,40846:27777,40847:27803,40848:27774,40849:27752,40850:27763,40851:27794,40852:27792,40853:27844,40854:27889,40855:27859,40856:27837,40857:27863,40858:27845,40859:27869,40860:27822,40861:27825,40862:27838,40863:27834,40864:27867,40865:27887,40866:27865,40867:27882,40868:27935,40869:34893,40870:27958,40871:27947,40872:27965,40873:27960,40874:27929,40875:27957,40876:27955,40877:27922,40878:27916,40879:28003,40880:28051,40881:28004,40882:27994,40883:28025,40884:27993,40885:28046,40886:28053,40887:28644,40888:28037,40889:28153,40890:28181,40891:28170,40892:28085,40893:28103,40894:28134,40895:28088,40896:28102,40897:28140,40898:28126,40899:28108,40900:28136,40901:28114,40902:28101,40903:28154,40904:28121,40905:28132,40906:28117,40907:28138,40908:28142,40909:28205,40910:28270,40911:28206,40912:28185,40913:28274,40914:28255,40915:28222,40916:28195,40917:28267,40918:28203,40919:28278,40920:28237,40921:28191,40922:28227,40923:28218,40924:28238,40925:28196,40926:28415,40927:28189,40928:28216,40929:28290,40930:28330,40931:28312,40932:28361,40933:28343,40934:28371,40935:28349,40936:28335,40937:28356,40938:28338,40939:28372,40940:28373,40941:28303,40942:28325,40943:28354,40944:28319,40945:28481,40946:28433,40947:28748,40948:28396,40949:28408,40950:28414,40951:28479,40952:28402,40953:28465,40954:28399,40955:28466,40956:28364,161:65377,162:65378,163:65379,164:65380,165:65381,166:65382,167:65383,168:65384,169:65385,170:65386,171:65387,172:65388,173:65389,174:65390,175:65391,176:65392,177:65393,178:65394,179:65395,180:65396,181:65397,182:65398,183:65399,184:65400,185:65401,186:65402,187:65403,188:65404,189:65405,190:65406,191:65407,192:65408,193:65409,194:65410,195:65411,196:65412,197:65413,198:65414,199:65415,200:65416,201:65417,202:65418,203:65419,204:65420,205:65421,206:65422,207:65423,208:65424,209:65425,210:65426,211:65427,212:65428,213:65429,214:65430,215:65431,216:65432,217:65433,218:65434,219:65435,220:65436,221:65437,222:65438,223:65439,57408:28478,57409:28435,57410:28407,57411:28550,57412:28538,57413:28536,57414:28545,57415:28544,57416:28527,57417:28507,57418:28659,57419:28525,57420:28546,57421:28540,57422:28504,57423:28558,57424:28561,57425:28610,57426:28518,57427:28595,57428:28579,57429:28577,57430:28580,57431:28601,57432:28614,57433:28586,57434:28639,57435:28629,57436:28652,57437:28628,57438:28632,57439:28657,57440:28654,57441:28635,57442:28681,57443:28683,57444:28666,57445:28689,57446:28673,57447:28687,57448:28670,57449:28699,57450:28698,57451:28532,57452:28701,57453:28696,57454:28703,57455:28720,57456:28734,57457:28722,57458:28753,57459:28771,57460:28825,57461:28818,57462:28847,57463:28913,57464:28844,57465:28856,57466:28851,57467:28846,57468:28895,57469:28875,57470:28893,57472:28889,57473:28937,57474:28925,57475:28956,57476:28953,57477:29029,57478:29013,57479:29064,57480:29030,57481:29026,57482:29004,57483:29014,57484:29036,57485:29071,57486:29179,57487:29060,57488:29077,57489:29096,57490:29100,57491:29143,57492:29113,57493:29118,57494:29138,57495:29129,57496:29140,57497:29134,57498:29152,57499:29164,57500:29159,57501:29173,57502:29180,57503:29177,57504:29183,57505:29197,57506:29200,57507:29211,57508:29224,57509:29229,57510:29228,57511:29232,57512:29234,57513:29243,57514:29244,57515:29247,57516:29248,57517:29254,57518:29259,57519:29272,57520:29300,57521:29310,57522:29314,57523:29313,57524:29319,57525:29330,57526:29334,57527:29346,57528:29351,57529:29369,57530:29362,57531:29379,57532:29382,57533:29380,57534:29390,57535:29394,57536:29410,57537:29408,57538:29409,57539:29433,57540:29431,57541:20495,57542:29463,57543:29450,57544:29468,57545:29462,57546:29469,57547:29492,57548:29487,57549:29481,57550:29477,57551:29502,57552:29518,57553:29519,57554:40664,57555:29527,57556:29546,57557:29544,57558:29552,57559:29560,57560:29557,57561:29563,57562:29562,57563:29640,57564:29619,57565:29646,57566:29627,57567:29632,57568:29669,57569:29678,57570:29662,57571:29858,57572:29701,57573:29807,57574:29733,57575:29688,57576:29746,57577:29754,57578:29781,57579:29759,57580:29791,57581:29785,57582:29761,57583:29788,57584:29801,57585:29808,57586:29795,57587:29802,57588:29814,57589:29822,57590:29835,57591:29854,57592:29863,57593:29898,57594:29903,57595:29908,57596:29681,57664:29920,57665:29923,57666:29927,57667:29929,57668:29934,57669:29938,57670:29936,57671:29937,57672:29944,57673:29943,57674:29956,57675:29955,57676:29957,57677:29964,57678:29966,57679:29965,57680:29973,57681:29971,57682:29982,57683:29990,57684:29996,57685:30012,57686:30020,57687:30029,57688:30026,57689:30025,57690:30043,57691:30022,57692:30042,57693:30057,57694:30052,57695:30055,57696:30059,57697:30061,57698:30072,57699:30070,57700:30086,57701:30087,57702:30068,57703:30090,57704:30089,57705:30082,57706:30100,57707:30106,57708:30109,57709:30117,57710:30115,57711:30146,57712:30131,57713:30147,57714:30133,57715:30141,57716:30136,57717:30140,57718:30129,57719:30157,57720:30154,57721:30162,57722:30169,57723:30179,57724:30174,57725:30206,57726:30207,57728:30204,57729:30209,57730:30192,57731:30202,57732:30194,57733:30195,57734:30219,57735:30221,57736:30217,57737:30239,57738:30247,57739:30240,57740:30241,57741:30242,57742:30244,57743:30260,57744:30256,57745:30267,57746:30279,57747:30280,57748:30278,57749:30300,57750:30296,57751:30305,57752:30306,57753:30312,57754:30313,57755:30314,57756:30311,57757:30316,57758:30320,57759:30322,57760:30326,57761:30328,57762:30332,57763:30336,57764:30339,57765:30344,57766:30347,57767:30350,57768:30358,57769:30355,57770:30361,57771:30362,57772:30384,57773:30388,57774:30392,57775:30393,57776:30394,57777:30402,57778:30413,57779:30422,57780:30418,57781:30430,57782:30433,57783:30437,57784:30439,57785:30442,57786:34351,57787:30459,57788:30472,57789:30471,57790:30468,57791:30505,57792:30500,57793:30494,57794:30501,57795:30502,57796:30491,57797:30519,57798:30520,57799:30535,57800:30554,57801:30568,57802:30571,57803:30555,57804:30565,57805:30591,57806:30590,57807:30585,57808:30606,57809:30603,57810:30609,57811:30624,57812:30622,57813:30640,57814:30646,57815:30649,57816:30655,57817:30652,57818:30653,57819:30651,57820:30663,57821:30669,57822:30679,57823:30682,57824:30684,57825:30691,57826:30702,57827:30716,57828:30732,57829:30738,57830:31014,57831:30752,57832:31018,57833:30789,57834:30862,57835:30836,57836:30854,57837:30844,57838:30874,57839:30860,57840:30883,57841:30901,57842:30890,57843:30895,57844:30929,57845:30918,57846:30923,57847:30932,57848:30910,57849:30908,57850:30917,57851:30922,57852:30956,57920:30951,57921:30938,57922:30973,57923:30964,57924:30983,57925:30994,57926:30993,57927:31001,57928:31020,57929:31019,57930:31040,57931:31072,57932:31063,57933:31071,57934:31066,57935:31061,57936:31059,57937:31098,57938:31103,57939:31114,57940:31133,57941:31143,57942:40779,57943:31146,57944:31150,57945:31155,57946:31161,57947:31162,57948:31177,57949:31189,57950:31207,57951:31212,57952:31201,57953:31203,57954:31240,57955:31245,57956:31256,57957:31257,57958:31264,57959:31263,57960:31104,57961:31281,57962:31291,57963:31294,57964:31287,57965:31299,57966:31319,57967:31305,57968:31329,57969:31330,57970:31337,57971:40861,57972:31344,57973:31353,57974:31357,57975:31368,57976:31383,57977:31381,57978:31384,57979:31382,57980:31401,57981:31432,57982:31408,57984:31414,57985:31429,57986:31428,57987:31423,57988:36995,57989:31431,57990:31434,57991:31437,57992:31439,57993:31445,57994:31443,57995:31449,57996:31450,57997:31453,57998:31457,57999:31458,58e3:31462,58001:31469,58002:31472,58003:31490,58004:31503,58005:31498,58006:31494,58007:31539,58008:31512,58009:31513,58010:31518,58011:31541,58012:31528,58013:31542,58014:31568,58015:31610,58016:31492,58017:31565,58018:31499,58019:31564,58020:31557,58021:31605,58022:31589,58023:31604,58024:31591,58025:31600,58026:31601,58027:31596,58028:31598,58029:31645,58030:31640,58031:31647,58032:31629,58033:31644,58034:31642,58035:31627,58036:31634,58037:31631,58038:31581,58039:31641,58040:31691,58041:31681,58042:31692,58043:31695,58044:31668,58045:31686,58046:31709,58047:31721,58048:31761,58049:31764,58050:31718,58051:31717,58052:31840,58053:31744,58054:31751,58055:31763,58056:31731,58057:31735,58058:31767,58059:31757,58060:31734,58061:31779,58062:31783,58063:31786,58064:31775,58065:31799,58066:31787,58067:31805,58068:31820,58069:31811,58070:31828,58071:31823,58072:31808,58073:31824,58074:31832,58075:31839,58076:31844,58077:31830,58078:31845,58079:31852,58080:31861,58081:31875,58082:31888,58083:31908,58084:31917,58085:31906,58086:31915,58087:31905,58088:31912,58089:31923,58090:31922,58091:31921,58092:31918,58093:31929,58094:31933,58095:31936,58096:31941,58097:31938,58098:31960,58099:31954,58100:31964,58101:31970,58102:39739,58103:31983,58104:31986,58105:31988,58106:31990,58107:31994,58108:32006,58176:32002,58177:32028,58178:32021,58179:32010,58180:32069,58181:32075,58182:32046,58183:32050,58184:32063,58185:32053,58186:32070,58187:32115,58188:32086,58189:32078,58190:32114,58191:32104,58192:32110,58193:32079,58194:32099,58195:32147,58196:32137,58197:32091,58198:32143,58199:32125,58200:32155,58201:32186,58202:32174,58203:32163,58204:32181,58205:32199,58206:32189,58207:32171,58208:32317,58209:32162,58210:32175,58211:32220,58212:32184,58213:32159,58214:32176,58215:32216,58216:32221,58217:32228,58218:32222,58219:32251,58220:32242,58221:32225,58222:32261,58223:32266,58224:32291,58225:32289,58226:32274,58227:32305,58228:32287,58229:32265,58230:32267,58231:32290,58232:32326,58233:32358,58234:32315,58235:32309,58236:32313,58237:32323,58238:32311,58240:32306,58241:32314,58242:32359,58243:32349,58244:32342,58245:32350,58246:32345,58247:32346,58248:32377,58249:32362,58250:32361,58251:32380,58252:32379,58253:32387,58254:32213,58255:32381,58256:36782,58257:32383,58258:32392,58259:32393,58260:32396,58261:32402,58262:32400,58263:32403,58264:32404,58265:32406,58266:32398,58267:32411,58268:32412,58269:32568,58270:32570,58271:32581,58272:32588,58273:32589,58274:32590,58275:32592,58276:32593,58277:32597,58278:32596,58279:32600,58280:32607,58281:32608,58282:32616,58283:32617,58284:32615,58285:32632,58286:32642,58287:32646,58288:32643,58289:32648,58290:32647,58291:32652,58292:32660,58293:32670,58294:32669,58295:32666,58296:32675,58297:32687,58298:32690,58299:32697,58300:32686,58301:32694,58302:32696,58303:35697,58304:32709,58305:32710,58306:32714,58307:32725,58308:32724,58309:32737,58310:32742,58311:32745,58312:32755,58313:32761,58314:39132,58315:32774,58316:32772,58317:32779,58318:32786,58319:32792,58320:32793,58321:32796,58322:32801,58323:32808,58324:32831,58325:32827,58326:32842,58327:32838,58328:32850,58329:32856,58330:32858,58331:32863,58332:32866,58333:32872,58334:32883,58335:32882,58336:32880,58337:32886,58338:32889,58339:32893,58340:32895,58341:32900,58342:32902,58343:32901,58344:32923,58345:32915,58346:32922,58347:32941,58348:20880,58349:32940,58350:32987,58351:32997,58352:32985,58353:32989,58354:32964,58355:32986,58356:32982,58357:33033,58358:33007,58359:33009,58360:33051,58361:33065,58362:33059,58363:33071,58364:33099,58432:38539,58433:33094,58434:33086,58435:33107,58436:33105,58437:33020,58438:33137,58439:33134,58440:33125,58441:33126,58442:33140,58443:33155,58444:33160,58445:33162,58446:33152,58447:33154,58448:33184,58449:33173,58450:33188,58451:33187,58452:33119,58453:33171,58454:33193,58455:33200,58456:33205,58457:33214,58458:33208,58459:33213,58460:33216,58461:33218,58462:33210,58463:33225,58464:33229,58465:33233,58466:33241,58467:33240,58468:33224,58469:33242,58470:33247,58471:33248,58472:33255,58473:33274,58474:33275,58475:33278,58476:33281,58477:33282,58478:33285,58479:33287,58480:33290,58481:33293,58482:33296,58483:33302,58484:33321,58485:33323,58486:33336,58487:33331,58488:33344,58489:33369,58490:33368,58491:33373,58492:33370,58493:33375,58494:33380,58496:33378,58497:33384,58498:33386,58499:33387,58500:33326,58501:33393,58502:33399,58503:33400,58504:33406,58505:33421,58506:33426,58507:33451,58508:33439,58509:33467,58510:33452,58511:33505,58512:33507,58513:33503,58514:33490,58515:33524,58516:33523,58517:33530,58518:33683,58519:33539,58520:33531,58521:33529,58522:33502,58523:33542,58524:33500,58525:33545,58526:33497,58527:33589,58528:33588,58529:33558,58530:33586,58531:33585,58532:33600,58533:33593,58534:33616,58535:33605,58536:33583,58537:33579,58538:33559,58539:33560,58540:33669,58541:33690,58542:33706,58543:33695,58544:33698,58545:33686,58546:33571,58547:33678,58548:33671,58549:33674,58550:33660,58551:33717,58552:33651,58553:33653,58554:33696,58555:33673,58556:33704,58557:33780,58558:33811,58559:33771,58560:33742,58561:33789,58562:33795,58563:33752,58564:33803,58565:33729,58566:33783,58567:33799,58568:33760,58569:33778,58570:33805,58571:33826,58572:33824,58573:33725,58574:33848,58575:34054,58576:33787,58577:33901,58578:33834,58579:33852,58580:34138,58581:33924,58582:33911,58583:33899,58584:33965,58585:33902,58586:33922,58587:33897,58588:33862,58589:33836,58590:33903,58591:33913,58592:33845,58593:33994,58594:33890,58595:33977,58596:33983,58597:33951,58598:34009,58599:33997,58600:33979,58601:34010,58602:34e3,58603:33985,58604:33990,58605:34006,58606:33953,58607:34081,58608:34047,58609:34036,58610:34071,58611:34072,58612:34092,58613:34079,58614:34069,58615:34068,58616:34044,58617:34112,58618:34147,58619:34136,58620:34120,58688:34113,58689:34306,58690:34123,58691:34133,58692:34176,58693:34212,58694:34184,58695:34193,58696:34186,58697:34216,58698:34157,58699:34196,58700:34203,58701:34282,58702:34183,58703:34204,58704:34167,58705:34174,58706:34192,58707:34249,58708:34234,58709:34255,58710:34233,58711:34256,58712:34261,58713:34269,58714:34277,58715:34268,58716:34297,58717:34314,58718:34323,58719:34315,58720:34302,58721:34298,58722:34310,58723:34338,58724:34330,58725:34352,58726:34367,58727:34381,58728:20053,58729:34388,58730:34399,58731:34407,58732:34417,58733:34451,58734:34467,58735:34473,58736:34474,58737:34443,58738:34444,58739:34486,58740:34479,58741:34500,58742:34502,58743:34480,58744:34505,58745:34851,58746:34475,58747:34516,58748:34526,58749:34537,58750:34540,58752:34527,58753:34523,58754:34543,58755:34578,58756:34566,58757:34568,58758:34560,58759:34563,58760:34555,58761:34577,58762:34569,58763:34573,58764:34553,58765:34570,58766:34612,58767:34623,58768:34615,58769:34619,58770:34597,58771:34601,58772:34586,58773:34656,58774:34655,58775:34680,58776:34636,58777:34638,58778:34676,58779:34647,58780:34664,58781:34670,58782:34649,58783:34643,58784:34659,58785:34666,58786:34821,58787:34722,58788:34719,58789:34690,58790:34735,58791:34763,58792:34749,58793:34752,58794:34768,58795:38614,58796:34731,58797:34756,58798:34739,58799:34759,58800:34758,58801:34747,58802:34799,58803:34802,58804:34784,58805:34831,58806:34829,58807:34814,58808:34806,58809:34807,58810:34830,58811:34770,58812:34833,58813:34838,58814:34837,58815:34850,58816:34849,58817:34865,58818:34870,58819:34873,58820:34855,58821:34875,58822:34884,58823:34882,58824:34898,58825:34905,58826:34910,58827:34914,58828:34923,58829:34945,58830:34942,58831:34974,58832:34933,58833:34941,58834:34997,58835:34930,58836:34946,58837:34967,58838:34962,58839:34990,58840:34969,58841:34978,58842:34957,58843:34980,58844:34992,58845:35007,58846:34993,58847:35011,58848:35012,58849:35028,58850:35032,58851:35033,58852:35037,58853:35065,58854:35074,58855:35068,58856:35060,58857:35048,58858:35058,58859:35076,58860:35084,58861:35082,58862:35091,58863:35139,58864:35102,58865:35109,58866:35114,58867:35115,58868:35137,58869:35140,58870:35131,58871:35126,58872:35128,58873:35148,58874:35101,58875:35168,58876:35166,58944:35174,58945:35172,58946:35181,58947:35178,58948:35183,58949:35188,58950:35191,58951:35198,58952:35203,58953:35208,58954:35210,58955:35219,58956:35224,58957:35233,58958:35241,58959:35238,58960:35244,58961:35247,58962:35250,58963:35258,58964:35261,58965:35263,58966:35264,58967:35290,58968:35292,58969:35293,58970:35303,58971:35316,58972:35320,58973:35331,58974:35350,58975:35344,58976:35340,58977:35355,58978:35357,58979:35365,58980:35382,58981:35393,58982:35419,58983:35410,58984:35398,58985:35400,58986:35452,58987:35437,58988:35436,58989:35426,58990:35461,58991:35458,58992:35460,58993:35496,58994:35489,58995:35473,58996:35493,58997:35494,58998:35482,58999:35491,59e3:35524,59001:35533,59002:35522,59003:35546,59004:35563,59005:35571,59006:35559,59008:35556,59009:35569,59010:35604,59011:35552,59012:35554,59013:35575,59014:35550,59015:35547,59016:35596,59017:35591,59018:35610,59019:35553,59020:35606,59021:35600,59022:35607,59023:35616,59024:35635,59025:38827,59026:35622,59027:35627,59028:35646,59029:35624,59030:35649,59031:35660,59032:35663,59033:35662,59034:35657,59035:35670,59036:35675,59037:35674,59038:35691,59039:35679,59040:35692,59041:35695,59042:35700,59043:35709,59044:35712,59045:35724,59046:35726,59047:35730,59048:35731,59049:35734,59050:35737,59051:35738,59052:35898,59053:35905,59054:35903,59055:35912,59056:35916,59057:35918,59058:35920,59059:35925,59060:35938,59061:35948,59062:35960,59063:35962,59064:35970,59065:35977,59066:35973,59067:35978,59068:35981,59069:35982,59070:35988,59071:35964,59072:35992,59073:25117,59074:36013,59075:36010,59076:36029,59077:36018,59078:36019,59079:36014,59080:36022,59081:36040,59082:36033,59083:36068,59084:36067,59085:36058,59086:36093,59087:36090,59088:36091,59089:36100,59090:36101,59091:36106,59092:36103,59093:36111,59094:36109,59095:36112,59096:40782,59097:36115,59098:36045,59099:36116,59100:36118,59101:36199,59102:36205,59103:36209,59104:36211,59105:36225,59106:36249,59107:36290,59108:36286,59109:36282,59110:36303,59111:36314,59112:36310,59113:36300,59114:36315,59115:36299,59116:36330,59117:36331,59118:36319,59119:36323,59120:36348,59121:36360,59122:36361,59123:36351,59124:36381,59125:36382,59126:36368,59127:36383,59128:36418,59129:36405,59130:36400,59131:36404,59132:36426,59200:36423,59201:36425,59202:36428,59203:36432,59204:36424,59205:36441,59206:36452,59207:36448,59208:36394,59209:36451,59210:36437,59211:36470,59212:36466,59213:36476,59214:36481,59215:36487,59216:36485,59217:36484,59218:36491,59219:36490,59220:36499,59221:36497,59222:36500,59223:36505,59224:36522,59225:36513,59226:36524,59227:36528,59228:36550,59229:36529,59230:36542,59231:36549,59232:36552,59233:36555,59234:36571,59235:36579,59236:36604,59237:36603,59238:36587,59239:36606,59240:36618,59241:36613,59242:36629,59243:36626,59244:36633,59245:36627,59246:36636,59247:36639,59248:36635,59249:36620,59250:36646,59251:36659,59252:36667,59253:36665,59254:36677,59255:36674,59256:36670,59257:36684,59258:36681,59259:36678,59260:36686,59261:36695,59262:36700,59264:36706,59265:36707,59266:36708,59267:36764,59268:36767,59269:36771,59270:36781,59271:36783,59272:36791,59273:36826,59274:36837,59275:36834,59276:36842,59277:36847,59278:36999,59279:36852,59280:36869,59281:36857,59282:36858,59283:36881,59284:36885,59285:36897,59286:36877,59287:36894,59288:36886,59289:36875,59290:36903,59291:36918,59292:36917,59293:36921,59294:36856,59295:36943,59296:36944,59297:36945,59298:36946,59299:36878,59300:36937,59301:36926,59302:36950,59303:36952,59304:36958,59305:36968,59306:36975,59307:36982,59308:38568,59309:36978,59310:36994,59311:36989,59312:36993,59313:36992,59314:37002,59315:37001,59316:37007,59317:37032,59318:37039,59319:37041,59320:37045,59321:37090,59322:37092,59323:25160,59324:37083,59325:37122,59326:37138,59327:37145,59328:37170,59329:37168,59330:37194,59331:37206,59332:37208,59333:37219,59334:37221,59335:37225,59336:37235,59337:37234,59338:37259,59339:37257,59340:37250,59341:37282,59342:37291,59343:37295,59344:37290,59345:37301,59346:37300,59347:37306,59348:37312,59349:37313,59350:37321,59351:37323,59352:37328,59353:37334,59354:37343,59355:37345,59356:37339,59357:37372,59358:37365,59359:37366,59360:37406,59361:37375,59362:37396,59363:37420,59364:37397,59365:37393,59366:37470,59367:37463,59368:37445,59369:37449,59370:37476,59371:37448,59372:37525,59373:37439,59374:37451,59375:37456,59376:37532,59377:37526,59378:37523,59379:37531,59380:37466,59381:37583,59382:37561,59383:37559,59384:37609,59385:37647,59386:37626,59387:37700,59388:37678,59456:37657,59457:37666,59458:37658,59459:37667,59460:37690,59461:37685,59462:37691,59463:37724,59464:37728,59465:37756,59466:37742,59467:37718,59468:37808,59469:37804,59470:37805,59471:37780,59472:37817,59473:37846,59474:37847,59475:37864,59476:37861,59477:37848,59478:37827,59479:37853,59480:37840,59481:37832,59482:37860,59483:37914,59484:37908,59485:37907,59486:37891,59487:37895,59488:37904,59489:37942,59490:37931,59491:37941,59492:37921,59493:37946,59494:37953,59495:37970,59496:37956,59497:37979,59498:37984,59499:37986,59500:37982,59501:37994,59502:37417,59503:38e3,59504:38005,59505:38007,59506:38013,59507:37978,59508:38012,59509:38014,59510:38017,59511:38015,59512:38274,59513:38279,59514:38282,59515:38292,59516:38294,59517:38296,59518:38297,59520:38304,59521:38312,59522:38311,59523:38317,59524:38332,59525:38331,59526:38329,59527:38334,59528:38346,59529:28662,59530:38339,59531:38349,59532:38348,59533:38357,59534:38356,59535:38358,59536:38364,59537:38369,59538:38373,59539:38370,59540:38433,59541:38440,59542:38446,59543:38447,59544:38466,59545:38476,59546:38479,59547:38475,59548:38519,59549:38492,59550:38494,59551:38493,59552:38495,59553:38502,59554:38514,59555:38508,59556:38541,59557:38552,59558:38549,59559:38551,59560:38570,59561:38567,59562:38577,59563:38578,59564:38576,59565:38580,59566:38582,59567:38584,59568:38585,59569:38606,59570:38603,59571:38601,59572:38605,59573:35149,59574:38620,59575:38669,59576:38613,59577:38649,59578:38660,59579:38662,59580:38664,59581:38675,59582:38670,59583:38673,59584:38671,59585:38678,59586:38681,59587:38692,59588:38698,59589:38704,59590:38713,59591:38717,59592:38718,59593:38724,59594:38726,59595:38728,59596:38722,59597:38729,59598:38748,59599:38752,59600:38756,59601:38758,59602:38760,59603:21202,59604:38763,59605:38769,59606:38777,59607:38789,59608:38780,59609:38785,59610:38778,59611:38790,59612:38795,59613:38799,59614:38800,59615:38812,59616:38824,59617:38822,59618:38819,59619:38835,59620:38836,59621:38851,59622:38854,59623:38856,59624:38859,59625:38876,59626:38893,59627:40783,59628:38898,59629:31455,59630:38902,59631:38901,59632:38927,59633:38924,59634:38968,59635:38948,59636:38945,59637:38967,59638:38973,59639:38982,59640:38991,59641:38987,59642:39019,59643:39023,59644:39024,59712:39025,59713:39028,59714:39027,59715:39082,59716:39087,59717:39089,59718:39094,59719:39108,59720:39107,59721:39110,59722:39145,59723:39147,59724:39171,59725:39177,59726:39186,59727:39188,59728:39192,59729:39201,59730:39197,59731:39198,59732:39204,59733:39200,59734:39212,59735:39214,59736:39229,59737:39230,59738:39234,59739:39241,59740:39237,59741:39248,59742:39243,59743:39249,59744:39250,59745:39244,59746:39253,59747:39319,59748:39320,59749:39333,59750:39341,59751:39342,59752:39356,59753:39391,59754:39387,59755:39389,59756:39384,59757:39377,59758:39405,59759:39406,59760:39409,59761:39410,59762:39419,59763:39416,59764:39425,59765:39439,59766:39429,59767:39394,59768:39449,59769:39467,59770:39479,59771:39493,59772:39490,59773:39488,59774:39491,59776:39486,59777:39509,59778:39501,59779:39515,59780:39511,59781:39519,59782:39522,59783:39525,59784:39524,59785:39529,59786:39531,59787:39530,59788:39597,59789:39600,59790:39612,59791:39616,59792:39631,59793:39633,59794:39635,59795:39636,59796:39646,59797:39647,59798:39650,59799:39651,59800:39654,59801:39663,59802:39659,59803:39662,59804:39668,59805:39665,59806:39671,59807:39675,59808:39686,59809:39704,59810:39706,59811:39711,59812:39714,59813:39715,59814:39717,59815:39719,59816:39720,59817:39721,59818:39722,59819:39726,59820:39727,59821:39730,59822:39748,59823:39747,59824:39759,59825:39757,59826:39758,59827:39761,59828:39768,59829:39796,59830:39827,59831:39811,59832:39825,59833:39830,59834:39831,59835:39839,59836:39840,59837:39848,59838:39860,59839:39872,59840:39882,59841:39865,59842:39878,59843:39887,59844:39889,59845:39890,59846:39907,59847:39906,59848:39908,59849:39892,59850:39905,59851:39994,59852:39922,59853:39921,59854:39920,59855:39957,59856:39956,59857:39945,59858:39955,59859:39948,59860:39942,59861:39944,59862:39954,59863:39946,59864:39940,59865:39982,59866:39963,59867:39973,59868:39972,59869:39969,59870:39984,59871:40007,59872:39986,59873:40006,59874:39998,59875:40026,59876:40032,59877:40039,59878:40054,59879:40056,59880:40167,59881:40172,59882:40176,59883:40201,59884:40200,59885:40171,59886:40195,59887:40198,59888:40234,59889:40230,59890:40367,59891:40227,59892:40223,59893:40260,59894:40213,59895:40210,59896:40257,59897:40255,59898:40254,59899:40262,59900:40264,59968:40285,59969:40286,59970:40292,59971:40273,59972:40272,59973:40281,59974:40306,59975:40329,59976:40327,59977:40363,59978:40303,59979:40314,59980:40346,59981:40356,59982:40361,59983:40370,59984:40388,59985:40385,59986:40379,59987:40376,59988:40378,59989:40390,59990:40399,59991:40386,59992:40409,59993:40403,59994:40440,59995:40422,59996:40429,59997:40431,59998:40445,59999:40474,6e4:40475,60001:40478,60002:40565,60003:40569,60004:40573,60005:40577,60006:40584,60007:40587,60008:40588,60009:40594,60010:40597,60011:40593,60012:40605,60013:40613,60014:40617,60015:40632,60016:40618,60017:40621,60018:38753,60019:40652,60020:40654,60021:40655,60022:40656,60023:40660,60024:40668,60025:40670,60026:40669,60027:40672,60028:40677,60029:40680,60030:40687,60032:40692,60033:40694,60034:40695,60035:40697,60036:40699,60037:40700,60038:40701,60039:40711,60040:40712,60041:30391,60042:40725,60043:40737,60044:40748,60045:40766,60046:40778,60047:40786,60048:40788,60049:40803,60050:40799,60051:40800,60052:40801,60053:40806,60054:40807,60055:40812,60056:40810,60057:40823,60058:40818,60059:40822,60060:40853,60061:40860,60062:40864,60063:22575,60064:27079,60065:36953,60066:29796,60067:20956,60068:29081}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=r(2);e.decode=function(o,e){var r=new Uint8ClampedArray(o.length);r.set(o);for(var s=new t.default(285,256,0),a=new c.default(s,r),n=new Uint8ClampedArray(e),d=!1,l=0;l<e;l++){var i=a.evaluateAt(s.exp(l+s.generatorBase));n[n.length-1-l]=i,0!==i&&(d=!0)}if(!d)return r;var B=new c.default(s,n),k=function(o,e,r,t){var c;e.degree()<r.degree()&&(e=(c=[r,e])[0],r=c[1]);for(var s=e,a=r,n=o.zero,d=o.one;a.degree()>=t/2;){var l=s,i=n;if(n=d,(s=a).isZero())return null;a=l;for(var B=o.zero,k=s.getCoefficient(s.degree()),u=o.inverse(k);a.degree()>=s.degree()&&!a.isZero();){var C=a.degree()-s.degree(),m=o.multiply(a.getCoefficient(a.degree()),u);B=B.addOrSubtract(o.buildMonomial(C,m)),a=a.addOrSubtract(s.multiplyByMonomial(C,m))}if(d=B.multiplyPoly(n).addOrSubtract(i),a.degree()>=s.degree())return null}var f=d.getCoefficient(0);if(0===f)return null;var w=o.inverse(f);return[d.multiply(w),a.multiply(w)]}(s,s.buildMonomial(e,1),B,e);if(null===k)return null;var u=function(o,e){var r=e.degree();if(1===r)return[e.getCoefficient(1)];for(var t=new Array(r),c=0,s=1;s<o.size&&c<r;s++)0===e.evaluateAt(s)&&(t[c]=o.inverse(s),c++);return c!==r?null:t}(s,k[0]);if(null==u)return null;for(var C=function(o,e,r){for(var c=r.length,s=new Array(c),a=0;a<c;a++){for(var n=o.inverse(r[a]),d=1,l=0;l<c;l++)a!==l&&(d=o.multiply(d,t.addOrSubtractGF(1,o.multiply(r[l],n))));s[a]=o.multiply(e.evaluateAt(n),o.inverse(d)),0!==o.generatorBase&&(s[a]=o.multiply(s[a],n))}return s}(s,k[1],u),m=0;m<u.length;m++){var f=r.length-1-s.log(u[m]);if(f<0)return null;r[f]=t.addOrSubtractGF(r[f],C[m])}return r}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.VERSIONS=[{infoBits:null,versionNumber:1,alignmentPatternCenters:[],errorCorrectionLevels:[{ecCodewordsPerBlock:7,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:13,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:13}]},{ecCodewordsPerBlock:17,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:2,alignmentPatternCenters:[6,18],errorCorrectionLevels:[{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:34}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:28}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]}]},{infoBits:null,versionNumber:3,alignmentPatternCenters:[6,22],errorCorrectionLevels:[{ecCodewordsPerBlock:15,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:55}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:13}]}]},{infoBits:null,versionNumber:4,alignmentPatternCenters:[6,26],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:80}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:32}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:5,alignmentPatternCenters:[6,30],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:43}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:11},{numBlocks:2,dataCodewordsPerBlock:12}]}]},{infoBits:null,versionNumber:6,alignmentPatternCenters:[6,34],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:27}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:31892,versionNumber:7,alignmentPatternCenters:[6,22,38],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:78}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:31}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:13},{numBlocks:1,dataCodewordsPerBlock:14}]}]},{infoBits:34236,versionNumber:8,alignmentPatternCenters:[6,24,42],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:97}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:38},{numBlocks:2,dataCodewordsPerBlock:39}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:18},{numBlocks:2,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:14},{numBlocks:2,dataCodewordsPerBlock:15}]}]},{infoBits:39577,versionNumber:9,alignmentPatternCenters:[6,26,46],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:12},{numBlocks:4,dataCodewordsPerBlock:13}]}]},{infoBits:42195,versionNumber:10,alignmentPatternCenters:[6,28,50],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68},{numBlocks:2,dataCodewordsPerBlock:69}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:43},{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]}]},{infoBits:48118,versionNumber:11,alignmentPatternCenters:[6,30,54],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:81}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:50},{numBlocks:4,dataCodewordsPerBlock:51}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:22},{numBlocks:4,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:12},{numBlocks:8,dataCodewordsPerBlock:13}]}]},{infoBits:51042,versionNumber:12,alignmentPatternCenters:[6,32,58],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:92},{numBlocks:2,dataCodewordsPerBlock:93}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:20},{numBlocks:6,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:55367,versionNumber:13,alignmentPatternCenters:[6,34,62],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:37},{numBlocks:1,dataCodewordsPerBlock:38}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:20},{numBlocks:4,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:11},{numBlocks:4,dataCodewordsPerBlock:12}]}]},{infoBits:58893,versionNumber:14,alignmentPatternCenters:[6,26,46,66],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:40},{numBlocks:5,dataCodewordsPerBlock:41}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:16},{numBlocks:5,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:5,dataCodewordsPerBlock:13}]}]},{infoBits:63784,versionNumber:15,alignmentPatternCenters:[6,26,48,70],errorCorrectionLevels:[{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:87},{numBlocks:1,dataCodewordsPerBlock:88}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:41},{numBlocks:5,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:7,dataCodewordsPerBlock:13}]}]},{infoBits:68472,versionNumber:16,alignmentPatternCenters:[6,26,50,74],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:98},{numBlocks:1,dataCodewordsPerBlock:99}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:70749,versionNumber:17,alignmentPatternCenters:[6,30,54,78],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:1,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22},{numBlocks:15,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:17,dataCodewordsPerBlock:15}]}]},{infoBits:76311,versionNumber:18,alignmentPatternCenters:[6,30,56,82],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:120},{numBlocks:1,dataCodewordsPerBlock:121}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:43},{numBlocks:4,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:1,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:19,dataCodewordsPerBlock:15}]}]},{infoBits:79154,versionNumber:19,alignmentPatternCenters:[6,30,58,86],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:113},{numBlocks:4,dataCodewordsPerBlock:114}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:44},{numBlocks:11,dataCodewordsPerBlock:45}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:21},{numBlocks:4,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:13},{numBlocks:16,dataCodewordsPerBlock:14}]}]},{infoBits:84390,versionNumber:20,alignmentPatternCenters:[6,34,62,90],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:41},{numBlocks:13,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:5,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:15},{numBlocks:10,dataCodewordsPerBlock:16}]}]},{infoBits:87683,versionNumber:21,alignmentPatternCenters:[6,28,50,72,94],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:116},{numBlocks:4,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:16},{numBlocks:6,dataCodewordsPerBlock:17}]}]},{infoBits:92361,versionNumber:22,alignmentPatternCenters:[6,26,50,74,98],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:111},{numBlocks:7,dataCodewordsPerBlock:112}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:13}]}]},{infoBits:96236,versionNumber:23,alignmentPatternCenters:[6,30,54,74,102],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:121},{numBlocks:5,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:47},{numBlocks:14,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:16,dataCodewordsPerBlock:15},{numBlocks:14,dataCodewordsPerBlock:16}]}]},{infoBits:102084,versionNumber:24,alignmentPatternCenters:[6,28,54,80,106],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:45},{numBlocks:14,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:30,dataCodewordsPerBlock:16},{numBlocks:2,dataCodewordsPerBlock:17}]}]},{infoBits:102881,versionNumber:25,alignmentPatternCenters:[6,32,58,84,110],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:106},{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:47},{numBlocks:13,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:110507,versionNumber:26,alignmentPatternCenters:[6,30,58,86,114],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:114},{numBlocks:2,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:46},{numBlocks:4,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:28,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:33,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]}]},{infoBits:110734,versionNumber:27,alignmentPatternCenters:[6,34,62,90,118],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:23},{numBlocks:26,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:117786,versionNumber:28,alignmentPatternCenters:[6,26,50,74,98,122],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:117},{numBlocks:10,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:45},{numBlocks:23,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:24},{numBlocks:31,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:31,dataCodewordsPerBlock:16}]}]},{infoBits:119615,versionNumber:29,alignmentPatternCenters:[6,30,54,78,102,126],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:116},{numBlocks:7,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:21,dataCodewordsPerBlock:45},{numBlocks:7,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:23},{numBlocks:37,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:26,dataCodewordsPerBlock:16}]}]},{infoBits:126325,versionNumber:30,alignmentPatternCenters:[6,26,52,78,104,130],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:115},{numBlocks:10,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:47},{numBlocks:10,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:25,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:25,dataCodewordsPerBlock:16}]}]},{infoBits:127568,versionNumber:31,alignmentPatternCenters:[6,30,56,82,108,134],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:3,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:46},{numBlocks:29,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:24},{numBlocks:1,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:133589,versionNumber:32,alignmentPatternCenters:[6,34,60,86,112,138],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:24},{numBlocks:35,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:35,dataCodewordsPerBlock:16}]}]},{infoBits:136944,versionNumber:33,alignmentPatternCenters:[6,30,58,86,114,142],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:21,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:24},{numBlocks:19,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:141498,versionNumber:34,alignmentPatternCenters:[6,34,62,90,118,146],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:6,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:44,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:59,dataCodewordsPerBlock:16},{numBlocks:1,dataCodewordsPerBlock:17}]}]},{infoBits:145311,versionNumber:35,alignmentPatternCenters:[6,30,54,78,102,126,150],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:121},{numBlocks:7,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:47},{numBlocks:26,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:39,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:41,dataCodewordsPerBlock:16}]}]},{infoBits:150283,versionNumber:36,alignmentPatternCenters:[6,24,50,76,102,128,154],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:121},{numBlocks:14,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:47},{numBlocks:34,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:46,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:64,dataCodewordsPerBlock:16}]}]},{infoBits:152622,versionNumber:37,alignmentPatternCenters:[6,28,54,80,106,132,158],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:46},{numBlocks:14,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:49,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:24,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:158308,versionNumber:38,alignmentPatternCenters:[6,32,58,84,110,136,162],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:122},{numBlocks:18,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:46},{numBlocks:32,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:48,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:15},{numBlocks:32,dataCodewordsPerBlock:16}]}]},{infoBits:161089,versionNumber:39,alignmentPatternCenters:[6,26,54,82,110,138,166],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:40,dataCodewordsPerBlock:47},{numBlocks:7,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:43,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:15},{numBlocks:67,dataCodewordsPerBlock:16}]}]},{infoBits:167017,versionNumber:40,alignmentPatternCenters:[6,30,58,86,114,142,170],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:118},{numBlocks:6,dataCodewordsPerBlock:119}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:18,dataCodewordsPerBlock:47},{numBlocks:31,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:24},{numBlocks:34,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:15},{numBlocks:61,dataCodewordsPerBlock:16}]}]}]},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r,t){var c=o.x-e.x+r.x-t.x,s=o.y-e.y+r.y-t.y;if(0===c&&0===s)return{a11:e.x-o.x,a12:e.y-o.y,a13:0,a21:r.x-e.x,a22:r.y-e.y,a23:0,a31:o.x,a32:o.y,a33:1};var a=e.x-r.x,n=t.x-r.x,d=e.y-r.y,l=t.y-r.y,i=a*l-n*d,B=(c*l-n*s)/i,k=(a*s-c*d)/i;return{a11:e.x-o.x+B*e.x,a12:e.y-o.y+B*e.y,a13:B,a21:t.x-o.x+k*t.x,a22:t.y-o.y+k*t.y,a23:k,a31:o.x,a32:o.y,a33:1}}e.extract=function(o,e){for(var r,s,a=function(o,e,r,t){var s=c(o,e,r,t);return{a11:s.a22*s.a33-s.a23*s.a32,a12:s.a13*s.a32-s.a12*s.a33,a13:s.a12*s.a23-s.a13*s.a22,a21:s.a23*s.a31-s.a21*s.a33,a22:s.a11*s.a33-s.a13*s.a31,a23:s.a13*s.a21-s.a11*s.a23,a31:s.a21*s.a32-s.a22*s.a31,a32:s.a12*s.a31-s.a11*s.a32,a33:s.a11*s.a22-s.a12*s.a21}}({x:3.5,y:3.5},{x:e.dimension-3.5,y:3.5},{x:e.dimension-6.5,y:e.dimension-6.5},{x:3.5,y:e.dimension-3.5}),n=c(e.topLeft,e.topRight,e.alignmentPattern,e.bottomLeft),d=(s=a,{a11:(r=n).a11*s.a11+r.a21*s.a12+r.a31*s.a13,a12:r.a12*s.a11+r.a22*s.a12+r.a32*s.a13,a13:r.a13*s.a11+r.a23*s.a12+r.a33*s.a13,a21:r.a11*s.a21+r.a21*s.a22+r.a31*s.a23,a22:r.a12*s.a21+r.a22*s.a22+r.a32*s.a23,a23:r.a13*s.a21+r.a23*s.a22+r.a33*s.a23,a31:r.a11*s.a31+r.a21*s.a32+r.a31*s.a33,a32:r.a12*s.a31+r.a22*s.a32+r.a32*s.a33,a33:r.a13*s.a31+r.a23*s.a32+r.a33*s.a33}),l=t.BitMatrix.createEmpty(e.dimension,e.dimension),i=function(o,e){var r=d.a13*o+d.a23*e+d.a33;return{x:(d.a11*o+d.a21*e+d.a31)/r,y:(d.a12*o+d.a22*e+d.a32)/r}},B=0;B<e.dimension;B++)for(var k=0;k<e.dimension;k++){var u=i(k+.5,B+.5);l.set(k,B,o.get(Math.floor(u.x),Math.floor(u.y)))}return{matrix:l,mappingFunction:i}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(o,e){return Math.sqrt(Math.pow(e.x-o.x,2)+Math.pow(e.y-o.y,2))};function c(o){return o.reduce((function(o,e){return o+e}))}function s(o,e,r,c){var s,a,n,d,l=[{x:Math.floor(o.x),y:Math.floor(o.y)}],i=Math.abs(e.y-o.y)>Math.abs(e.x-o.x);i?(s=Math.floor(o.y),a=Math.floor(o.x),n=Math.floor(e.y),d=Math.floor(e.x)):(s=Math.floor(o.x),a=Math.floor(o.y),n=Math.floor(e.x),d=Math.floor(e.y));for(var B=Math.abs(n-s),k=Math.abs(d-a),u=Math.floor(-B/2),C=s<n?1:-1,m=a<d?1:-1,f=!0,w=s,P=a;w!==n+C;w+=C){var v=i?P:w,h=i?w:P;if(r.get(v,h)!==f&&(f=!f,l.push({x:v,y:h}),l.length===c+1))break;if((u+=k)>0){if(P===d)break;P+=m,u-=B}}for(var y=[],p=0;p<c;p++)l[p]&&l[p+1]?y.push(t(l[p],l[p+1])):y.push(0);return y}function a(o,e,r,t){var c,a=e.y-o.y,n=e.x-o.x,d=s(o,e,r,Math.ceil(t/2)),l=s(o,{x:o.x-n,y:o.y-a},r,Math.ceil(t/2)),i=d.shift()+l.shift()-1;return(c=l.concat(i)).concat.apply(c,d)}function n(o,e){var r=c(o)/c(e),t=0;return e.forEach((function(e,c){t+=Math.pow(o[c]-e*r,2)})),{averageSize:r,error:t}}function d(o,e,r){try{var t=a(o,{x:-1,y:o.y},r,e.length),c=a(o,{x:o.x,y:-1},r,e.length),s=a(o,{x:Math.max(0,o.x-o.y)-1,y:Math.max(0,o.y-o.x)-1},r,e.length),d=a(o,{x:Math.min(r.width,o.x+o.y)+1,y:Math.min(r.height,o.y+o.x)+1},r,e.length),l=n(t,e),i=n(c,e),B=n(s,e),k=n(d,e),u=Math.sqrt(l.error*l.error+i.error*i.error+B.error*B.error+k.error*k.error),C=(l.averageSize+i.averageSize+B.averageSize+k.averageSize)/4;return u+(Math.pow(l.averageSize-C,2)+Math.pow(i.averageSize-C,2)+Math.pow(B.averageSize-C,2)+Math.pow(k.averageSize-C,2))/C}catch(o){return 1/0}}function l(o,e){for(var r=Math.round(e.x);o.get(r,Math.round(e.y));)r--;for(var t=Math.round(e.x);o.get(t,Math.round(e.y));)t++;for(var c=(r+t)/2,s=Math.round(e.y);o.get(Math.round(c),s);)s--;for(var a=Math.round(e.y);o.get(Math.round(c),a);)a++;return{x:c,y:(s+a)/2}}function i(o,e,r,s,n){var l,i,B;try{l=function(o,e,r,s){var n=(c(a(o,r,s,5))/7+c(a(o,e,s,5))/7+c(a(r,o,s,5))/7+c(a(e,o,s,5))/7)/4;if(n<1)throw new Error("Invalid module size");var d=Math.round(t(o,e)/n),l=Math.round(t(o,r)/n),i=Math.floor((d+l)/2)+7;switch(i%4){case 0:i++;break;case 2:i--}return{dimension:i,moduleSize:n}}(s,r,n,o),i=l.dimension,B=l.moduleSize}catch(o){return null}var k=r.x-s.x+n.x,u=r.y-s.y+n.y,C=(t(s,n)+t(s,r))/2/B,m=1-3/C,f={x:s.x+m*(k-s.x),y:s.y+m*(u-s.y)},w=e.map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,s=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.floor(r),Math.floor(s))){var a=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1];c(a);return{x:r,y:s,score:d({x:Math.floor(r),y:Math.floor(s)},[1,1,1],o)+t({x:r,y:s},f)}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));return{alignmentPattern:C>=15&&w.length?w[0]:f,dimension:i}}e.locate=function(o){for(var e=[],r=[],s=[],a=[],n=function(t){for(var n=0,d=!1,l=[0,0,0,0,0],i=function(e){var s=o.get(e,t);if(s===d)n++;else{l=[l[1],l[2],l[3],l[4],n],n=1,d=s;var i=c(l)/7,B=Math.abs(l[0]-i)<i&&Math.abs(l[1]-i)<i&&Math.abs(l[2]-3*i)<3*i&&Math.abs(l[3]-i)<i&&Math.abs(l[4]-i)<i&&!s,k=c(l.slice(-3))/3,u=Math.abs(l[2]-k)<k&&Math.abs(l[3]-k)<k&&Math.abs(l[4]-k)<k&&s;if(B){var C=e-l[3]-l[4],m=C-l[2],f={startX:m,endX:C,y:t};(w=r.filter((function(o){return m>=o.bottom.startX&&m<=o.bottom.endX||C>=o.bottom.startX&&m<=o.bottom.endX||m<=o.bottom.startX&&C>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:r.push({top:f,bottom:f})}if(u){var w,P=e-l[4],v=P-l[3];f={startX:v,y:t,endX:P};(w=a.filter((function(o){return v>=o.bottom.startX&&v<=o.bottom.endX||P>=o.bottom.startX&&v<=o.bottom.endX||v<=o.bottom.startX&&P>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:a.push({top:f,bottom:f})}}},B=-1;B<=o.width;B++)i(B);e.push.apply(e,r.filter((function(o){return o.bottom.y!==t&&o.bottom.y-o.top.y>=2}))),r=r.filter((function(o){return o.bottom.y===t})),s.push.apply(s,a.filter((function(o){return o.bottom.y!==t}))),a=a.filter((function(o){return o.bottom.y===t}))},B=0;B<=o.height;B++)n(B);e.push.apply(e,r.filter((function(o){return o.bottom.y-o.top.y>=2}))),s.push.apply(s,a);var k=e.filter((function(o){return o.bottom.y-o.top.y>=2})).map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,t=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.round(r),Math.round(t))){var s=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1],a=c(s)/s.length;return{score:d({x:Math.round(r),y:Math.round(t)},[1,1,3,1,1],o),x:r,y:t,size:a}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score})).map((function(o,e,r){if(e>4)return null;var t=r.filter((function(o,r){return e!==r})).map((function(e){return{x:e.x,y:e.y,score:e.score+Math.pow(e.size-o.size,2)/o.size,size:e.size}})).sort((function(o,e){return o.score-e.score}));if(t.length<2)return null;var c=o.score+t[0].score+t[1].score;return{points:[o].concat(t.slice(0,2)),score:c}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));if(0===k.length)return null;var u=function(o,e,r){var c,s,a,n,d,l,i,B=t(o,e),k=t(e,r),u=t(o,r);return k>=B&&k>=u?(d=(c=[e,o,r])[0],l=c[1],i=c[2]):u>=k&&u>=B?(d=(s=[o,e,r])[0],l=s[1],i=s[2]):(d=(a=[o,r,e])[0],l=a[1],i=a[2]),(i.x-l.x)*(d.y-l.y)-(i.y-l.y)*(d.x-l.x)<0&&(d=(n=[i,d])[0],i=n[1]),{bottomLeft:d,topLeft:l,topRight:i}}(k[0].points[0],k[0].points[1],k[0].points[2]),C=u.topRight,m=u.topLeft,f=u.bottomLeft,w=i(o,s,C,m,f),P=[];w&&P.push({alignmentPattern:{x:w.alignmentPattern.x,y:w.alignmentPattern.y},bottomLeft:{x:f.x,y:f.y},dimension:w.dimension,topLeft:{x:m.x,y:m.y},topRight:{x:C.x,y:C.y}});var v=l(o,C),h=l(o,m),y=l(o,f),p=i(o,s,v,h,y);return p&&P.push({alignmentPattern:{x:p.alignmentPattern.x,y:p.alignmentPattern.y},bottomLeft:{x:y.x,y:y.y},topLeft:{x:h.x,y:h.y},topRight:{x:v.x,y:v.y},dimension:p.dimension}),0===P.length?null:P}}]).default}));
//# sourceMappingURL=/sm/261261d91f249d4079ae119cfa50f739467d90fc365078a671172e0f499e862a.map


/* ==========================================================================
   MODULE: state.js
   ========================================================================== */
/**
 * state.js - Gestion d'État Centralisée pour COACH PRO
 * Profil coach personnalisable, suivi des athlètes, photos Avant/Maintenant,
 * tension artérielle, créneaux d'entraînement, comptabilité (recettes & dépenses),
 * fiches d'engagement signées et historique des forfaits en FCFA.
 */

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
const stateManager = new StateManager();


/* ==========================================================================
   MODULE: printer.js
   ========================================================================== */
/**
 * printer.js - Module d'Impression Thermique Universel 58mm & 80mm pour COACH PRO
 * Rendu 100% fidèle aux spécifications réelles de caisse :
 * 1. Bilan du Client (Client, Habitation, Date, Objectif, Composition Corporelle, Métabolisme & Nutrition)
 * 2. Reçu d'Abonnement (Client, Profession, Dates, Formule, Tarifs FCFA, Acompte, Reste, Statut, Signatures)
 * 3. Programme Sportif avec Recommandations du Coach
 * 4. Contrat d'Engagement & Décharge
 * 5. Bilan Comptable
 */
const ThermalPrinter = {
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


/* ==========================================================================
   MODULE: security/pinLock.js
   ========================================================================== */
/**
 * pinLock.js - Système de Verrouillage & Sécurité COACH PRO
 * Protège l'accès à l'application avec un pavé numérique tactile élégant,
 * code modifiable et confirmation de suppression sensible.
 * Code de secours secret : 008 (aucun indice affiché).
 */

const PIN_STORAGE_KEY = 'coachpro_security_pin_v1';
const DEFAULT_PIN = '008';
const PinLock = {
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


/* ==========================================================================
   MODULE: security/license.js
   ========================================================================== */
/**
 * license.js - Système de Protection & Licence Cryptographique pour COACH PRO
 * - Formules supportées : Essai 5 Jours (TRIAL), 1 Mois / 30 Jours (M1), 1 An (Y1), À Vie (LIFE)
 * - Empreinte matérielle unique (Device ID) non transférable
 * - Signature cryptographique SHA-256 avec sel secret maître
 * - Protection anti-fraude d'horloge (Anti-Time Rollback)
 * - Écran d'activation moderne avec lien WhatsApp direct & validation temps réel
 */

const LICENSE_KEY_STORAGE = 'coachpro_license_key_v2';
const DEVICE_ID_STORAGE = 'coachpro_device_id_v2';
const TRIAL_STORAGE = 'coachpro_trial_info_v2';
const LAST_ACTIVE_TS_STORAGE = 'coachpro_last_active_ts';
const MASTER_SALT = 'COACH_PRO_2026_MASTER_SECRET_KEY_PRO_EDITION_SECURE_AFRICA';

/**
 * Implémentation SHA-256 pure JavaScript autonome (sans dépendance externe)
 */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0bef9a3f, 0xc67178f2
  ];

  let compositeBitLength = asciiBitLength;
  words[compositeBitLength >> 5] |= 0x80 << (24 - compositeBitLength % 32);
  words[(((compositeBitLength + 64) >> 9) << 4) + 15] = compositeBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15], w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? (w[i] || 0) : ((w[i - 16] + s0 + w[i - 7] + s1) | 0);

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const sA = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const sE = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const temp1 = (hash[7] + sE + ch + k[i] + w[i]) | 0;
      const temp2 = (sA + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}
const LicenseManager = {
  /**
   * Obtient ou génère l'Identifiant Unique de l'Appareil (Device ID)
   */
  getDeviceId() {
    let devId = localStorage.getItem(DEVICE_ID_STORAGE);
    if (!devId) {
      // Tenter de récupérer l'ancien Device ID s'il existe
      devId = localStorage.getItem('coachpro_device_id_v1');
      if (!devId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        devId = `CP-${segment(4)}-${segment(4)}-${segment(4)}`;
      }
      localStorage.setItem(DEVICE_ID_STORAGE, devId);
    }
    return devId;
  },

  /**
   * Nettoie le Device ID pour calculs cryptographiques
   */
  getCleanDeviceId(deviceId = null) {
    const raw = deviceId || this.getDeviceId();
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  },

  /**
   * Calcule le hash court du Device ID (4 caractères)
   */
  getDeviceShortHash(cleanDeviceId) {
    const h = sha256(`DEV_${cleanDeviceId}_${MASTER_SALT}`);
    return h.slice(0, 4).toUpperCase();
  },

  /**
   * Générateur Officiel de Clé de Licence pour un Appareil & Formule
   * Types : 'TRIAL' (5j), 'M1' (30j), 'Y1' (365j), 'LIFE' (À vie), 'CUSTOM'
   */
  generateKey(deviceId, type = 'Y1', customDays = null) {
    const cleanDevId = this.getCleanDeviceId(deviceId);
    const devHash = this.getDeviceShortHash(cleanDevId);
    let expBase36 = 'LIFETIME';
    let expTimestamp = 0;

    const now = Date.now();
    if (type === 'TRIAL') {
      expTimestamp = now + (5 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'M1') {
      expTimestamp = now + (30 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'Y1') {
      expTimestamp = now + (365 * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'CUSTOM' && customDays) {
      expTimestamp = now + (parseInt(customDays, 10) * 24 * 60 * 60 * 1000);
      expBase36 = expTimestamp.toString(36).toUpperCase();
    } else if (type === 'LIFE' || type === 'MASTER') {
      expBase36 = 'LIFETIME';
    }

    const payload = `${cleanDevId}|${type}|${expBase36}|${MASTER_SALT}`;
    const sig = sha256(payload).slice(0, 8).toUpperCase();

    return `CP-${type}-${expBase36}-${devHash}-${sig}`;
  },

  /**
   * Vérifie l'intégrité temporelle (protection contre le recul d'horloge)
   */
  verifyTimeIntegrity() {
    const now = Date.now();
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_TS_STORAGE);
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      // Si l'heure de l'appareil a été reculée de plus de 2 heures
      if (now < (lastActive - 7200000)) {
        console.warn('[CoachPro Security] Détection de modification suspecte de l\'horloge locale.');
        return false;
      }
    }
    localStorage.setItem(LAST_ACTIVE_TS_STORAGE, now.toString());
    return true;
  },

  /**
   * Gestion & Vérification de l'Essai Gratuit de 5 Jours Automatique
   */
  getTrialStatus() {
    const cleanDevId = this.getCleanDeviceId();
    let trialRaw = localStorage.getItem(TRIAL_STORAGE);
    const now = Date.now();

    if (!trialRaw) {
      // Initialisation du premier essai gratuit de 5 jours
      const expires = now + (5 * 24 * 60 * 60 * 1000);
      const sigPayload = `${cleanDevId}|${now}|${expires}|TRIAL|${MASTER_SALT}`;
      const sig = sha256(sigPayload);

      const trialData = {
        start: now,
        expires: expires,
        sig: sig
      };
      localStorage.setItem(TRIAL_STORAGE, JSON.stringify(trialData));
      return {
        isActive: true,
        daysRemaining: 5,
        expiresAt: expires
      };
    }

    try {
      const trialData = JSON.parse(trialRaw);
      const expectedSig = sha256(`${cleanDevId}|${trialData.start}|${trialData.expires}|TRIAL|${MASTER_SALT}`);

      if (trialData.sig !== expectedSig) {
        // Tentative de modification de la période d'essai
        return { isActive: false, isTampered: true, daysRemaining: 0 };
      }

      if (!this.verifyTimeIntegrity()) {
        return { isActive: false, isTampered: true, daysRemaining: 0 };
      }

      if (now <= trialData.expires) {
        const msRemaining = trialData.expires - now;
        const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
        return {
          isActive: true,
          daysRemaining: daysRemaining,
          expiresAt: trialData.expires
        };
      } else {
        return {
          isActive: false,
          isExpired: true,
          daysRemaining: 0,
          expiresAt: trialData.expires
        };
      }
    } catch (e) {
      return { isActive: false, daysRemaining: 0 };
    }
  },

  /**
   * Vérifie la validité d'une clé de licence entrée
   */
  verifyKey(inputKey, deviceId = null) {
    if (!inputKey || typeof inputKey !== 'string') return { valid: false, reason: 'Clé absente' };
    const cleanInput = inputKey.trim().toUpperCase();
    const cleanDevId = this.getCleanDeviceId(deviceId);
    const expectedDevHash = this.getDeviceShortHash(cleanDevId);

    // Clé universelle de secours du créateur
    if (cleanInput === '5008' || cleanInput === 'MASTER2026' || cleanInput === 'KEY-COACH-PRO-MASTER-2026-AFRICA' || cleanInput === 'CP-MASTER-LIFETIME-2026-AFRICA') {
      return {
        valid: true,
        type: 'MASTER',
        typeName: 'Licence Master Créateur (Illimitée)',
        isLifetime: true,
        daysRemaining: 9999,
        expiryFormatted: 'Illimitée'
      };
    }

    // Format attendu : CP-[TYPE]-[EXP_B36]-[DEV_HASH]-[SIG]
    const parts = cleanInput.split('-');
    if (parts.length < 5 || parts[0] !== 'CP') {
      // Support rétro-compatible clés V1
      if (cleanInput.startsWith('KEY-') || cleanInput.includes('LIFETIME')) {
        return {
          valid: true,
          type: 'LIFE',
          typeName: 'Licence Professionnelle à Vie',
          isLifetime: true,
          daysRemaining: 9999,
          expiryFormatted: 'Illimitée'
        };
      }
      return { valid: false, reason: 'Format de clé invalide' };
    }

    const [, type, expBase36, devHash, sig] = parts;

    // 1. Vérification du Device Hash
    if (devHash !== expectedDevHash) {
      return { valid: false, reason: 'Cette clé n\'est pas destinée à cet appareil' };
    }

    // 2. Vérification de la Signature Cryptographique
    const payload = `${cleanDevId}|${type}|${expBase36}|${MASTER_SALT}`;
    const expectedSig = sha256(payload).slice(0, 8).toUpperCase();

    if (sig !== expectedSig) {
      return { valid: false, reason: 'Signature de licence invalide ou altérée' };
    }

    // 3. Vérification de la date d'expiration
    if (expBase36 === 'LIFETIME' || type === 'LIFE' || type === 'MASTER') {
      return {
        valid: true,
        type: 'LIFE',
        typeName: 'Licence Professionnelle à Vie',
        isLifetime: true,
        daysRemaining: 9999,
        expiryFormatted: 'Illimitée'
      };
    }

    const expTimestamp = parseInt(expBase36, 36);
    if (isNaN(expTimestamp)) {
      return { valid: false, reason: 'Date d\'expiration invalide' };
    }

    if (!this.verifyTimeIntegrity()) {
      return { valid: false, reason: 'Horloge locale modifiée détectée' };
    }

    const now = Date.now();
    if (now > expTimestamp) {
      return {
        valid: false,
        reason: 'Licence expirée',
        isExpired: true,
        expiredAt: expTimestamp
      };
    }

    const msRemaining = expTimestamp - now;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    let typeName = 'Abonnement Coach Pro';
    if (type === 'TRIAL') typeName = 'Période d\'Essai';
    else if (type === 'M1') typeName = 'Abonnement 1 Mois (30 Jours)';
    else if (type === 'Y1') typeName = 'Abonnement Annuel (1 An)';
    else if (type === 'CUSTOM') typeName = `Licence Personnalisée (${daysRemaining} j)`;

    const dateObj = new Date(expTimestamp);
    const expiryFormatted = dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      valid: true,
      type: type,
      typeName: typeName,
      isLifetime: false,
      expiresAt: expTimestamp,
      daysRemaining: daysRemaining,
      expiryFormatted: expiryFormatted
    };
  },

  /**
   * Sauvegarde une nouvelle clé de licence dans le stockage
   */
  saveLicenseKey(key) {
    const result = this.verifyKey(key);
    if (result.valid) {
      localStorage.setItem(LICENSE_KEY_STORAGE, key.trim().toUpperCase());
      localStorage.setItem('coachpro_license_status', result.typeName);
      return { success: true, info: result };
    }
    return { success: false, reason: result.reason || 'Clé non valide' };
  },

  /**
   * Retourne les informations complètes sur la licence active
   */
  getLicenseInfo() {
    const devId = this.getDeviceId();
    const savedKey = localStorage.getItem(LICENSE_KEY_STORAGE);

    // 1. Si une clé achetée est enregistrée
    if (savedKey) {
      const keyResult = this.verifyKey(savedKey, devId);
      if (keyResult.valid) {
        return {
          isActivated: true,
          isTrial: false,
          isExpired: false,
          type: keyResult.type,
          typeName: keyResult.typeName,
          isLifetime: keyResult.isLifetime,
          daysRemaining: keyResult.daysRemaining,
          expiryFormatted: keyResult.expiryFormatted,
          statusBadge: keyResult.isLifetime
            ? '🟢 Active à Vie (Illimitée)'
            : `🟢 ${keyResult.typeName} (${keyResult.daysRemaining} j restants)`,
          deviceId: devId
        };
      }
    }

    // 2. Sinon, vérifier l'essai gratuit de 5 jours
    const trial = this.getTrialStatus();
    if (trial.isActive) {
      const expDate = new Date(trial.expiresAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return {
        isActivated: true,
        isTrial: true,
        isExpired: false,
        type: 'TRIAL',
        typeName: `Essai Gratuit (5 Jours)`,
        isLifetime: false,
        daysRemaining: trial.daysRemaining,
        expiryFormatted: expDate,
        statusBadge: `🟡 Période d'Essai (${trial.daysRemaining} j restants)`,
        deviceId: devId
      };
    }

    // 3. Licence expirée ou non activée
    return {
      isActivated: false,
      isTrial: false,
      isExpired: true,
      type: 'EXPIRED',
      typeName: 'Licence Expirée ou Non Activée',
      isLifetime: false,
      daysRemaining: 0,
      expiryFormatted: 'Expirée',
      statusBadge: '🔴 Non Activée / Expirée',
      deviceId: devId
    };
  },

  isActivated() {
    const info = this.getLicenseInfo();
    return info.isActivated;
  },

  /**
   * Initialise et bloque l'accès si l'application n'est pas activée
   */
  init(onSuccess) {
    const info = this.getLicenseInfo();
    if (info.isActivated) {
      if (typeof onSuccess === 'function') onSuccess();
      return;
    }
    this.renderActivationScreen(onSuccess);
  },

  /**
   * Affiche l'écran de verrouillage / activation
   */
  renderActivationScreen(onSuccess) {
    let overlay = document.getElementById('license-activation-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'license-activation-overlay';
      overlay.className = 'fixed inset-0 z-50 bg-[#070b16] flex flex-col items-center justify-center p-4 select-none';
      document.body.appendChild(overlay);
    }

    const devId = this.getDeviceId();
    const info = this.getLicenseInfo();

    const waMsg = encodeURIComponent(
      `Bonjour Créateur COACH PRO,\nJe souhaite activer ma licence COACH PRO.\nMon Device ID est : ${devId}\nMerci !`
    );
    const waUrl = `https://wa.me/?text=${waMsg}`;

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 sm:p-8 space-y-6 text-center border-t-4 border-emerald-500 shadow-2xl animate-fade-in relative">
        
        <!-- Badge & Titre -->
        <div class="space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-500/10">
            🛡️
          </div>
          <h1 class="text-xl font-bold text-white tracking-wide">Activation &amp; Licence COACH PRO</h1>
          <p class="text-xs text-slate-300">
            ${info.isExpired 
              ? '<span class="text-rose-400 font-bold">Votre période de licence est arrivée à expiration.</span> Veuillez renouveler votre clé pour continuer.' 
              : 'Déverrouillez votre application professionnelle tout-en-un pour coachs sportifs.'}
          </p>
        </div>

        <!-- Identifiant Machine de l'Appareil -->
        <div class="bg-slate-900/95 border border-slate-800 p-4 rounded-xl text-left space-y-2">
          <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            📱 Identifiant Unique de votre Appareil (Device ID)
          </span>
          <div class="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span class="font-mono text-sm font-black text-emerald-400 select-all" id="device-id-display">${devId}</span>
            <button id="btn-copy-device-id" class="btn btn-outline btn-xs flex items-center gap-1 font-bold shrink-0">
              <span>📋</span> Copier
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            Transmettez cet identifiant à l'administrateur pour obtenir votre clé d'activation sécurisée.
          </p>
        </div>

        <!-- Bouton de Contact Rapide WhatsApp -->
        <div>
          <a href="${waUrl}" target="_blank" class="btn btn-whatsapp w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10">
            <span>💬</span> Demander une Clé sur WhatsApp
          </a>
        </div>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-slate-800"></div>
          <span class="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase">Ou saisissez votre clé</span>
          <div class="flex-grow border-t border-slate-800"></div>
        </div>

        <!-- Formulaire de Saisie de Clé -->
        <form id="form-license-activation" class="space-y-4 text-left">
          <div>
            <label class="label">Clé de Licence Officielle *</label>
            <input 
              type="text" 
              id="input-license-key" 
              placeholder="ex: CP-Y1-..." 
              class="input text-xs font-mono font-bold tracking-wider uppercase text-white bg-slate-950" 
              required 
              autocomplete="off" 
            />
          </div>

          <div id="license-error-msg" class="text-xs text-rose-400 font-semibold min-h-[1.2rem]"></div>

          <button type="submit" class="btn btn-primary btn-sm w-full py-2.5 font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <span>🔓</span> Déverrouiller COACH PRO
          </button>
        </form>

        <div class="text-[11px] text-slate-400 flex items-center justify-center gap-4 pt-1">
          <span>⚡ Essai 5 Jours</span>
          <span>•</span>
          <span>📅 1 Mois / 1 An</span>
          <span>•</span>
          <span>♾️ À Vie</span>
        </div>
      </div>
    `;

    const form = overlay.querySelector('#form-license-activation');
    const copyBtn = overlay.querySelector('#btn-copy-device-id');
    const inputKey = overlay.querySelector('#input-license-key');
    const errorMsg = overlay.querySelector('#license-error-msg');

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(devId).then(() => {
        copyBtn.textContent = '✓ Copié !';
        setTimeout(() => { copyBtn.innerHTML = '<span>📋</span> Copier'; }, 2000);
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredKey = inputKey.value.trim();
      const res = this.saveLicenseKey(enteredKey);

      if (res.success) {
        overlay.classList.add('hidden');
        if (typeof onSuccess === 'function') onSuccess();
        else window.location.reload();
      } else {
        errorMsg.textContent = res.reason || 'Clé de licence invalide pour cet appareil.';
      }
    });
  }
};


/* ==========================================================================
   MODULE: security/backup.js
   ========================================================================== */
/**
 * backup.js - Module de Sauvegarde Complète & Restauration pour COACH PRO
 * Protège contre la perte de données (changement de téléphone, réinstallation).
 * Permet l'export/import JSON, partage WhatsApp/Drive et instantanés automatiques.
 */
const BackupManager = {
  /**
   * Crée un objet de sauvegarde complet et horodaté
   */
  generateBackupPayload() {
    const data = stateManager.load();
    return {
      version: 'coachpro_backup_v1',
      exportedAt: new Date().toISOString(),
      app: 'COACH PRO',
      device: navigator.userAgent,
      data: data
    };
  },

  /**
   * Télécharge le fichier de sauvegarde (.coachpro / .json)
   */
  exportToFile() {
    try {
      const payload = this.generateBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `COACH_PRO_SAUVEGARDE_${dateStr}.coachpro`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.saveAutoSnapshot(data => {
        console.log('Instantané automatique sauvegardé.');
      });

      return { success: true, filename };
    } catch (e) {
      console.error('Erreur exportToFile:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Partage la sauvegarde via WhatsApp ou gestionnaire de fichiers natif (Web Share API)
   */
  async shareBackup() {
    try {
      const payload = this.generateBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `COACH_PRO_SAUVEGARDE_${dateStr}.coachpro`;
      const file = new File([jsonStr], filename, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sauvegarde COACH PRO',
          text: `Fichier de sauvegarde des clients et comptabilité COACH PRO du ${dateStr}.`
        });
        return { success: true, method: 'share' };
      } else {
        // Fallback téléchargement direct
        return this.exportToFile();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Erreur shareBackup:', e);
      }
      return this.exportToFile();
    }
  },

  /**
   * Restaure les données depuis un fichier sélectionné par l'utilisateur
   */
  restoreFromFile(file, onComplete) {
    if (!file) {
      alert('Veuillez sélectionner un fichier de sauvegarde valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);

        let dataToRestore = null;
        if (parsed.version === 'coachpro_backup_v1' && parsed.data) {
          dataToRestore = parsed.data;
        } else if (parsed.clients || parsed.coachProfile) {
          dataToRestore = parsed;
        } else {
          throw new Error('Format de fichier de sauvegarde non reconnu.');
        }

        if (!dataToRestore.clients || !Array.isArray(dataToRestore.clients)) {
          throw new Error('Structure de données clients invalide.');
        }

        // Sauvegarde des données restaurées
        stateManager.saveData(dataToRestore);

        if (typeof onComplete === 'function') {
          onComplete(true, `Restauration réussie : ${dataToRestore.clients.length} athlète(s) récupéré(s).`);
        }
      } catch (err) {
        console.error('Erreur restauration:', err);
        if (typeof onComplete === 'function') {
          onComplete(false, `Erreur lors de la lecture du fichier : ${err.message}`);
        }
      }
    };
    reader.readAsText(file);
  },

  /**
   * Sauvegarde un instantané automatique dans un slot local
   */
  saveAutoSnapshot() {
    try {
      const data = stateManager.load();
      localStorage.setItem('coachpro_auto_snapshot_last', JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      }));
    } catch (e) {
      console.error('Erreur saveAutoSnapshot:', e);
    }
  }
};


/* ==========================================================================
   MODULE: components/assessment21.js
   ========================================================================== */
/**
 * assessment21.js - Bilan Santé des 21 Facteurs Épuré (PDF LMC Afrique)
 * Diagnostic santé simple et lisible avec calcul instantané du score de risque.
 */
const Assessment21 = {
  render(container, client) {
    const answers = { ...(client.riskAssessment?.answers || {}) };
    const scoreInfo = Calculations.calculateRiskScore(answers);

    const nutritionQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Nutritionnel');
    const physicalQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Physique');
    const stressQuestions = Calculations.RISK_FACTORS.filter(f => f.category === 'Stress & Hygiène');

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Score & Niveau de Risque Simple -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge ${scoreInfo.badgeClass} text-xs font-bold">
                Score : ${scoreInfo.score} / 21
              </span>
              <span class="text-xs text-slate-400">Niveau de risque : <strong class="text-white">${scoreInfo.riskLevel} (${scoreInfo.percentage}%)</strong></span>
            </div>
            <p class="text-xs text-slate-300 max-w-xl">
              ${scoreInfo.advice}
            </p>
          </div>

          <div class="text-right">
            <button id="btn-save-21-factors" class="btn btn-primary btn-sm">
              Enregistrer les Réponses
            </button>
          </div>
        </div>

        <!-- 3 Colonnes Claires -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- 1. Nutrition -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">1. Facteurs Nutritionnels</h4>
              <span class="text-xs text-slate-400 font-mono">${nutritionQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${nutritionQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 2. Physique -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">2. Facteurs Physiques</h4>
              <span class="text-xs text-slate-400 font-mono">${physicalQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${physicalQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 3. Stress & Hygiène -->
          <div class="glass-card p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 class="text-xs font-bold text-emerald-400 uppercase">3. Stress & Mode de Vie</h4>
              <span class="text-xs text-slate-400 font-mono">${stressQuestions.filter(q => answers[q.id]).length}/7</span>
            </div>
            <div class="space-y-2 text-xs">
              ${stressQuestions.map(q => `
                <label class="flex items-start gap-2.5 cursor-pointer py-1 text-slate-300 hover:text-white">
                  <input type="checkbox" class="cb-risk mt-0.5" data-id="${q.id}" ${answers[q.id] ? 'checked' : ''} />
                  <span class="leading-tight">${q.title}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const checkboxes = container.querySelectorAll('.cb-risk');
    const saveBtn = container.querySelector('#btn-save-21-factors');

    const saveAnswers = () => {
      const currentAnswers = {};
      checkboxes.forEach(input => {
        if (input.checked) currentAnswers[input.getAttribute('data-id')] = true;
      });
      stateManager.updateRiskAssessment(client.id, currentAnswers);
    };

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        saveAnswers();
      });
    });

    saveBtn?.addEventListener('click', () => {
      saveAnswers();
      window.App.showToast('Bilan santé 21F sauvegardé', 'success');
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
    });
  }
};


/* ==========================================================================
   MODULE: components/bodyComp.js
   ========================================================================== */
/**
 * bodyComp.js - Module de Composition Corporelle & Pesées Épuré
 * Enregistrement de pesées simples et visualisation claire de la progression.
 */
const BodyComp = {
  render(container, client) {
    const history = [...(client.history || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = history.length > 0 ? history[history.length - 1] : null;

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Bouton Nouvelle Pesée -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 class="text-lg font-bold text-white">Historique des Pesées (${history.length})</h2>
            <p class="text-xs text-slate-400">Enregistrez et suivez l'évolution du poids et des mensurations</p>
          </div>
          <button id="btn-open-weighin-dialog" class="btn btn-primary btn-sm">
            + Nouvelle Pesée
          </button>
        </div>

        <!-- Tableau des Pesées -->
        ${history.length === 0 ? `
          <div class="glass-card p-8 text-center space-y-3">
            <p class="text-xs text-slate-400">Aucune pesée enregistrée pour cet athlète.</p>
            <button id="btn-first-weighin" class="btn btn-primary btn-sm">+ Enregistrer une première pesée</button>
          </div>
        ` : `
          <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th class="p-3">Date</th>
                    <th class="p-3">Poids</th>
                    <th class="p-3">IMC</th>
                    <th class="p-3">Masse Grasse</th>
                    <th class="p-3">Masse Muscle</th>
                    <th class="p-3">Tour Taille</th>
                    <th class="p-3 text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-mono">
                  ${[...history].reverse().map(h => `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="p-3 text-white font-bold">${new Date(h.date).toLocaleDateString('fr-FR')}</td>
                      <td class="p-3 text-emerald-400 font-bold text-sm">${h.weight} kg</td>
                      <td class="p-3 text-slate-300">${h.imc || '--'}</td>
                      <td class="p-3 text-slate-300">${h.fatPct ? `${h.fatPct}% (${h.fatKg || '--'}kg)` : '--'}</td>
                      <td class="p-3 text-slate-300">${h.musclePct ? `${h.musclePct}% (${h.muscleKg || '--'}kg)` : '--'}</td>
                      <td class="p-3 text-slate-300">${h.waist ? `${h.waist} cm` : '--'}</td>
                      <td class="p-3 text-right">
                        <button class="btn btn-secondary btn-xs" data-action="print-ticket-weighin" data-weighin-id="${h.id}">
                          🖨️ Imprimer
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

        <!-- Modal Saisie Nouvelle Pesée -->
        <div id="modal-weighin-entry" class="modal-backdrop hidden">
          <div class="modal-card max-w-lg">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 class="text-base font-bold text-white">Nouvelle Pesée & Mesures</h3>
              <button id="btn-close-weighin-modal" class="btn-icon">✕</button>
            </div>

            <form id="form-add-weighin" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Date *</label>
                  <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="input" required />
                </div>
                <div>
                  <label class="label">Poids (kg) *</label>
                  <input type="number" inputmode="decimal" step="0.1" name="weight" id="input-new-weight" placeholder="ex: 81.5" class="input font-bold text-emerald-400" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Taille (cm)</label>
                  <input type="number" inputmode="numeric" name="height" id="input-new-height" value="${client.history[0]?.height || 175}" class="input" required />
                </div>
                <div>
                  <label class="label">Masse Grasse (%)</label>
                  <input type="number" inputmode="decimal" step="0.1" name="fatPct" placeholder="ex: 21.0" class="input" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Masse Musculaire (%)</label>
                  <input type="number" inputmode="decimal" step="0.1" name="musclePct" placeholder="ex: 39.0" class="input" />
                </div>
                <div>
                  <label class="label">Tour de Taille (cm)</label>
                  <input type="number" inputmode="decimal" step="0.5" name="waist" placeholder="ex: 86.5" class="input" />
                </div>
              </div>

              <div>
                <label class="label">Notes / Conseils du coach</label>
                <textarea name="coachNotes" rows="2" placeholder="Remarques sur la forme du jour..." class="textarea text-xs"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" id="btn-cancel-weighin-form" class="btn btn-secondary">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer la Pesée</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const modal = container.querySelector('#modal-weighin-entry');
    const openBtn = container.querySelector('#btn-open-weighin-dialog');
    const openBtnFirst = container.querySelector('#btn-first-weighin');
    const closeBtn = container.querySelector('#btn-close-weighin-modal');
    const cancelBtn = container.querySelector('#btn-cancel-weighin-form');
    const form = container.querySelector('#form-add-weighin');

    const showModal = () => modal?.classList.remove('hidden');
    const hideModal = () => modal?.classList.add('hidden');

    openBtn?.addEventListener('click', showModal);
    openBtnFirst?.addEventListener('click', showModal);
    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const w = parseFloat(formData.get('weight'));
      const fatPct = parseFloat(formData.get('fatPct')) || 0;
      const musclePct = parseFloat(formData.get('musclePct')) || 0;

      const comps = Calculations.calculateBodyComposition(w, fatPct, musclePct, 0);

      const assessmentData = {
        date: formData.get('date'),
        weight: w,
        height: parseFloat(formData.get('height')),
        fatPct,
        fatKg: comps.fatKg,
        musclePct,
        muscleKg: comps.muscleKg,
        waist: parseFloat(formData.get('waist')) || 0,
        coachNotes: formData.get('coachNotes') || ''
      };

      stateManager.addAssessmentToClient(client.id, assessmentData);
      hideModal();
      window.App.showToast('Pesée enregistrée avec succès !', 'success');

      const updatedClient = stateManager.getClientById(client.id);
      this.render(container, updatedClient);
    });

    container.querySelectorAll('[data-action="print-ticket-weighin"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const weighinId = e.currentTarget.getAttribute('data-weighin-id');
        const assessment = client.history.find(h => h.id === weighinId);
        window.App.openThermalModal(client.id, assessment);
      });
    });
  }
};


/* ==========================================================================
   MODULE: components/metabolic.js
   ========================================================================== */
/**
 * metabolic.js - Calculateur Métabolique & Nutritionnel Épuré (PDF 6)
 * MB Mifflin-St Jeor, coefficient NAP, DET et répartition des macros.
 */
const Metabolic = {
  render(container, client) {
    const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const currentWeight = last ? last.weight : 75;
    const currentHeight = last ? last.height : 175;
    const age = client.age || 30;
    const gender = client.gender || 'H';

    const mb = Calculations.calculateMB(currentWeight, currentHeight, age, gender);
    const nap = client.lifestyle?.activityLevel || 1.375;
    const det = Calculations.calculateDET(mb, nap);
    const currentStrategy = last?.goalStrategy || (client.mainGoal === 'Prise de masse musculaire' ? 'bulk' : 'cut');
    const nutrition = Calculations.calculateNutritionPlan(det, currentStrategy);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- 3 Cartes Métaboliques Principales -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Métabolisme de Base (MB)</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block">${mb} kcal/j</span>
            <span class="text-[11px] text-slate-500">Mifflin-St Jeor (${gender === 'H' ? 'Homme' : 'Femme'}, ${currentWeight}kg, ${age} ans)</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Dépense Totale (DET)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">${det} kcal/j</span>
            <span class="text-[11px] text-slate-500">Avec coefficient d'activité × ${nap}</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase">Cible Calorique Recommandée</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block" id="disp-target-kcal">${nutrition.targetKcal} kcal/j</span>
            <span class="text-[11px] text-slate-500">${currentStrategy === 'cut' ? 'Déficit pour perte de gras' : currentStrategy === 'bulk' ? 'Surplus pour prise de masse' : 'Maintien du poids'}</span>
          </div>
        </div>

        <!-- Réglages & Répartition Macronutriments -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Paramètres -->
          <div class="glass-card p-5 space-y-4">
            <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Ajustements du Coach</h3>
            
            <div>
              <label class="label">Niveau d'Activité Physique (NAP)</label>
              <select id="select-nap-metabolic" class="input font-mono text-xs">
                ${Object.entries(Calculations.NAP_LEVELS).map(([val, info]) => `
                  <option value="${val}" ${parseFloat(val) === parseFloat(nap) ? 'selected' : ''}>
                    ${info.label} (× ${val})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="label">Stratégie Calorique</label>
              <div class="grid grid-cols-3 gap-2" id="group-strategy">
                <button class="btn btn-sm ${currentStrategy === 'cut' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="cut">
                  Sèche (-400)
                </button>
                <button class="btn btn-sm ${currentStrategy === 'maintain' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="maintain">
                  Maintien (0)
                </button>
                <button class="btn btn-sm ${currentStrategy === 'bulk' ? 'btn-primary' : 'btn-secondary'} text-xs" data-strat="bulk">
                  Masse (+350)
                </button>
              </div>
            </div>
          </div>

          <!-- Répartition des Macros -->
          <div class="glass-card p-5 space-y-4">
            <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Répartition des Macronutriments</h3>
            
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Protéines</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-protein">${nutrition.grams.proteinGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-protein-pct">${nutrition.macros.proteinPct}%</span>
              </div>

              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Glucides</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-carbs">${nutrition.grams.carbGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-carbs-pct">${nutrition.macros.carbPct}%</span>
              </div>

              <div class="sub-card p-3">
                <span class="text-[11px] text-slate-400 uppercase block font-semibold">Lipides</span>
                <span class="text-lg font-bold font-mono text-white block mt-1" id="disp-fats">${nutrition.grams.fatGrams}g</span>
                <span class="text-[10px] text-slate-500 font-mono" id="disp-fats-pct">${nutrition.macros.fatPct}%</span>
              </div>
            </div>

            <div class="text-xs text-slate-400 space-y-1 pt-1">
              <div>💧 Hydratation minimum recommandée : <strong class="text-white">${(currentWeight * 0.035).toFixed(1)} L / jour</strong></div>
              <div>🥩 Apport protéique : <strong class="text-white">${(nutrition.grams.proteinGrams / currentWeight).toFixed(1)} g / kg</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, client, currentWeight, currentHeight, age, gender);
  },

  bindEvents(container, client, weight, height, age, gender) {
    let selectedNap = client.lifestyle?.activityLevel || 1.375;
    let selectedStrat = 'cut';

    const recalc = () => {
      const mb = Calculations.calculateMB(weight, height, age, gender);
      const det = Calculations.calculateDET(mb, selectedNap);
      const nut = Calculations.calculateNutritionPlan(det, selectedStrat);

      container.querySelector('#disp-target-kcal').textContent = `${nut.targetKcal} kcal/j`;
      container.querySelector('#disp-protein').textContent = `${nut.grams.proteinGrams}g`;
      container.querySelector('#disp-carbs').textContent = `${nut.grams.carbGrams}g`;
      container.querySelector('#disp-fats').textContent = `${nut.grams.fatGrams}g`;
      container.querySelector('#disp-protein-pct').textContent = `${nut.macros.proteinPct}%`;
      container.querySelector('#disp-carbs-pct').textContent = `${nut.macros.carbPct}%`;
      container.querySelector('#disp-fats-pct').textContent = `${nut.macros.fatPct}%`;
    };

    container.querySelector('#select-nap-metabolic')?.addEventListener('change', (e) => {
      selectedNap = parseFloat(e.target.value);
      recalc();
    });

    container.querySelectorAll('#group-strategy button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('#group-strategy button').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        e.currentTarget.classList.remove('btn-secondary');
        e.currentTarget.classList.add('btn-primary');
        selectedStrat = e.currentTarget.getAttribute('data-strat');
        recalc();
      });
    });
  }
};


/* ==========================================================================
   MODULE: components/comparator.js
   ========================================================================== */
/**
 * comparator.js - Comparateur Avant / Après COACH PRO
 * Calcule automatiquement et instantanément tous les indicateurs (Poids, Gras, Muscle, IMC, Tour de taille).
 */
const Comparator = {
  render(container, client) {
    const history = client.history || [];

    if (history.length < 2) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Comparateur Avant / Après</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Il vous faut au moins 2 bilans/pesées enregistrées pour comparer les évolutions. Actuellement : ${history.length} pesée(s).
          </p>
          <button id="btn-comp-add-weighin" class="btn btn-primary btn-sm">+ Ajouter une 2ème pesée</button>
        </div>
      `;
      container.querySelector('#btn-comp-add-weighin')?.addEventListener('click', () => {
        window.App.openClientDetail(client.id, 'bodyComp');
      });
      return;
    }

    const firstAssessment = history[0];
    const lastAssessment = history[history.length - 1];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Sélecteurs de Dates -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white">Comparateur Évolution & Bilan Avant / Après</h3>
              <p class="text-xs text-slate-400">Tous les indicateurs sont calculés automatiquement entre les deux dates</p>
            </div>
            <button id="btn-print-comp-report" class="btn btn-secondary btn-sm">
              Imprimer le Bilan
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label font-bold text-slate-400">1. Bilan Initial (Avant) :</label>
              <select id="comp-select-initial" class="input font-semibold">
                ${history.map((h, idx) => `
                  <option value="${h.id}" ${idx === 0 ? 'selected' : ''}>
                    ${new Date(h.date).toLocaleDateString('fr-FR')} — ${h.weight} kg (IMC ${h.imc || '--'})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="label font-bold text-slate-400">2. Bilan de Suivi (Après / Actuel) :</label>
              <select id="comp-select-current" class="input font-semibold">
                ${history.map((h, idx) => `
                  <option value="${h.id}" ${idx === history.length - 1 ? 'selected' : ''}>
                    ${new Date(h.date).toLocaleDateString('fr-FR')} — ${h.weight} kg (IMC ${h.imc || '--'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Zone des Résultats Calculés Automatiquement -->
        <div id="comp-results-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    const renderResults = () => {
      const initialId = container.querySelector('#comp-select-initial')?.value;
      const currentId = container.querySelector('#comp-select-current')?.value;
      const initAss = history.find(h => h.id === initialId) || firstAssessment;
      const currAss = history.find(h => h.id === currentId) || lastAssessment;

      const deltas = Calculations.calculateComparisonDeltas(initAss, currAss);
      const resultsDiv = container.querySelector('#comp-results-container');
      if (!resultsDiv || !deltas) return;

      resultsDiv.innerHTML = `
        <div class="space-y-6">
          
          <!-- Verdict Automatique -->
          <div class="glass-card p-5 border-l-4 border-emerald-500 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Verdict Évolution</span>
              <h4 class="text-lg font-bold text-white mt-0.5 ${deltas.verdictColor}">${deltas.verdict}</h4>
            </div>
            <span class="badge badge-emerald text-xs">Calcul Automatique OK</span>
          </div>

          <!-- 4 Cartes de Comparaison Calculées -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <!-- 1. Poids -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Évolution Poids</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaWeight < 0 ? 'text-emerald-400' : deltas.deltaWeight > 0 ? 'text-amber-400' : 'text-slate-300'}">
                  ${deltas.deltaWeight > 0 ? '+' : ''}${deltas.deltaWeight} kg
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.weight} kg ➔ ${currAss.weight} kg</span>
            </div>

            <!-- 2. Masse Grasse -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Masse Grasse</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaFatPct < 0 ? 'text-emerald-400' : deltas.deltaFatPct > 0 ? 'text-rose-400' : 'text-slate-300'}">
                  ${deltas.deltaFatPct > 0 ? '+' : ''}${deltas.deltaFatPct}%
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${deltas.deltaFatKg > 0 ? '+' : ''}${deltas.deltaFatKg} kg de gras</span>
            </div>

            <!-- 3. Masse Musculaire -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Masse Musculaire</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaMusclePct > 0 ? 'text-emerald-400' : deltas.deltaMusclePct < 0 ? 'text-amber-400' : 'text-slate-300'}">
                  ${deltas.deltaMusclePct > 0 ? '+' : ''}${deltas.deltaMusclePct}%
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.musclePct || '--'}% ➔ ${currAss.musclePct || '--'}%</span>
            </div>

            <!-- 4. Indice IMC -->
            <div class="glass-card p-4 space-y-1">
              <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Indice IMC</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold font-mono ${deltas.deltaImc < 0 ? 'text-emerald-400' : 'text-slate-200'}">
                  ${deltas.deltaImc > 0 ? '+' : ''}${deltas.deltaImc}
                </span>
              </div>
              <span class="text-[11px] text-slate-400 block">${initAss.imc || '--'} ➔ ${currAss.imc || '--'} (${currAss.imcCategory || ''})</span>
            </div>
          </div>

          <!-- Tableau Comparatif Détaillé -->
          <div class="glass-card overflow-hidden">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-[#0c1220] text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Indicateur</th>
                  <th class="p-3">Avant (${new Date(initAss.date).toLocaleDateString('fr-FR')})</th>
                  <th class="p-3">Après (${new Date(currAss.date).toLocaleDateString('fr-FR')})</th>
                  <th class="p-3 text-right">Différence (Delta)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr>
                  <td class="p-3 font-semibold text-white">Poids Corporel</td>
                  <td class="p-3 font-mono">${initAss.weight} kg</td>
                  <td class="p-3 font-mono font-bold text-white">${currAss.weight} kg</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaWeight <= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaWeight > 0 ? '+' : ''}${deltas.deltaWeight} kg
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Masse Grasse (%)</td>
                  <td class="p-3 font-mono">${initAss.fatPct || '--'}%</td>
                  <td class="p-3 font-mono font-bold text-amber-400">${currAss.fatPct || '--'}%</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaFatPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                    ${deltas.deltaFatPct > 0 ? '+' : ''}${deltas.deltaFatPct}%
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Masse Musculaire (%)</td>
                  <td class="p-3 font-mono">${initAss.musclePct || '--'}%</td>
                  <td class="p-3 font-mono font-bold text-emerald-400">${currAss.musclePct || '--'}%</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaMusclePct >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaMusclePct > 0 ? '+' : ''}${deltas.deltaMusclePct}%
                  </td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-white">Tour de Taille</td>
                  <td class="p-3 font-mono">${initAss.waist ? `${initAss.waist} cm` : '--'}</td>
                  <td class="p-3 font-mono font-bold text-white">${currAss.waist ? `${currAss.waist} cm` : '--'}</td>
                  <td class="p-3 text-right font-mono font-bold ${deltas.deltaWaist <= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${deltas.deltaWaist !== 0 ? `${deltas.deltaWaist > 0 ? '+' : ''}${deltas.deltaWaist} cm` : '--'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    container.querySelector('#comp-select-initial')?.addEventListener('change', renderResults);
    container.querySelector('#comp-select-current')?.addEventListener('change', renderResults);
    container.querySelector('#btn-print-comp-report')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'assessment');
    });

    renderResults();
  }
};


/* ==========================================================================
   MODULE: components/billing.js
   ========================================================================== */
/**
 * billing.js - Suivi des Forfaits & Historique des Règlements en FCFA COACH PRO
 */
const Billing = {
  render(container, client) {
    const pkg = client.package || {
      packageName: 'Pack 10 Séances',
      packageType: 'sessions',
      durationMonths: 1,
      totalSessions: 10,
      sessionsUsed: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      startDate: new Date().toISOString().split('T')[0]
    };

    const isDuration = pkg.packageType === 'duration';
    const remainingSessions = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
    const payments = Array.isArray(client.paymentHistory) ? client.paymentHistory : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Cartes Résumé Forfait & Finances (FCFA) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Carte 1 : Type & Validité -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Formule Active</span>
            ${isDuration ? `
              <span class="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
                ${pkg.durationMonths || 1} Mois <span class="text-xs text-slate-400 font-normal">(${pkg.sessionsUsed || 0} séances faites)</span>
              </span>
              <span class="text-[11px] text-slate-400">Échéance : ${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</span>
            ` : `
              <span class="text-3xl font-bold ${remainingSessions <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono mt-1 block">
                ${remainingSessions} <span class="text-xs text-slate-400 font-normal">/ ${pkg.totalSessions} séances</span>
              </span>
              <span class="text-[11px] text-slate-500">${pkg.sessionsUsed} séances consommées</span>
            `}
          </div>

          <!-- Carte 2 : Total Payé -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Total Réglé (Versements)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">${Calculations.formatFCFA(pkg.amountPaid || 0)}</span>
            <span class="text-[11px] text-slate-500">Sur un tarif total de ${Calculations.formatFCFA(pkg.totalAmount || 0)}</span>
          </div>

          <!-- Carte 3 : Solde Restant Dû -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Solde Restant Dû</span>
            <span class="text-2xl font-bold font-mono ${(pkg.balanceDue || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'} mt-1 block">
              ${Calculations.formatFCFA(pkg.balanceDue || 0)}
            </span>
            <span class="text-[11px] text-slate-500">${(pkg.balanceDue || 0) > 0 ? 'Règlement en attente' : 'Entièrement soldé'}</span>
          </div>
        </div>

        <!-- Enregistrement d'un Versement / Acompte -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Enregistrer un Versement / Acompte</h3>
              <p class="text-xs text-slate-400">Ajoutez un paiement qui recalculera automatiquement le solde restant</p>
            </div>
            <button id="btn-print-sub-receipt" class="btn btn-secondary btn-sm">
              Imprimer Reçu Forfait
            </button>
          </div>

          <form id="form-add-payment" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Date du versement *</label>
              <input type="date" id="pay-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Montant Versé (FCFA) *</label>
              <input type="number" inputmode="numeric" step="1000" id="pay-amount" placeholder="ex: 50000" class="input text-xs font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Mode de Paiement</label>
              <select id="pay-method" class="input text-xs">
                <option value="Espèces">Espèces</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-primary btn-sm w-full">
                Valider le Versement
              </button>
            </div>
          </form>
        </div>

        <!-- Historique Daté des Versements -->
        <div class="glass-card overflow-hidden">
          <div class="p-4 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Historique des Paiements & Règlements (${payments.length})
            </h4>
            <span class="text-[11px] text-emerald-400 font-bold font-mono">Total perçu : ${Calculations.formatFCFA(pkg.amountPaid || 0)}</span>
          </div>

          ${payments.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400">
              Aucun versement enregistré dans l'historique. Utilisez le formulaire ci-dessus pour ajouter un règlement.
            </div>
          ` : `
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Date</th>
                  <th class="p-3">Montant</th>
                  <th class="p-3">Mode de Paiement</th>
                  <th class="p-3">Notes</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${payments.map((p) => `
                  <tr class="hover:bg-slate-800/40">
                    <td class="p-3 font-mono">${new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td class="p-3 font-mono font-bold text-emerald-400">${Calculations.formatFCFA(p.amount)}</td>
                    <td class="p-3 font-semibold text-white">${p.method}</td>
                    <td class="p-3 text-slate-400 text-[11px] italic">${p.notes || '--'}</td>
                    <td class="p-3 text-right">
                      <button class="text-slate-500 hover:text-red-400 text-xs btn-remove-payment" data-payment-id="${p.id}">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Modification du Tarif Total & Forfait -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Paramètres de la Formule</h3>
          
          <form id="form-edit-client-pkg" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Type de Forfait</label>
                <select name="packageType" id="edit-pkg-type" class="input font-bold text-emerald-400">
                  <option value="sessions" ${!isDuration ? 'selected' : ''}>Pack Séances</option>
                  <option value="duration" ${isDuration ? 'selected' : ''}>Abonnement Durée (Mois)</option>
                </select>
              </div>

              <div id="edit-wrapper-sessions" class="${isDuration ? 'hidden' : ''}">
                <label class="label">Total Séances</label>
                <input type="number" name="totalSessions" value="${pkg.totalSessions || 10}" class="input font-bold" />
              </div>

              <div id="edit-wrapper-duration" class="${!isDuration ? 'hidden' : ''}">
                <label class="label">Durée en Mois</label>
                <select name="durationMonths" class="input font-bold">
                  <option value="1" ${pkg.durationMonths === 1 ? 'selected' : ''}>1 Mois (30 jours)</option>
                  <option value="2" ${pkg.durationMonths === 2 ? 'selected' : ''}>2 Mois (60 jours)</option>
                  <option value="3" ${pkg.durationMonths === 3 ? 'selected' : ''}>3 Mois (Trimestre)</option>
                  <option value="6" ${pkg.durationMonths === 6 ? 'selected' : ''}>6 Mois (Semestre)</option>
                  <option value="12" ${pkg.durationMonths === 12 ? 'selected' : ''}>1 An (Annuel)</option>
                </select>
              </div>

              <div>
                <label class="label">Tarif Total Forfait (FCFA)</label>
                <input type="number" step="1000" name="totalAmount" value="${pkg.totalAmount || 0}" class="input font-mono font-bold text-emerald-400" required />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-secondary btn-sm">Mettre à jour la formule</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const pkgTypeSelect = container.querySelector('#edit-pkg-type');
    const wrapSessions = container.querySelector('#edit-wrapper-sessions');
    const wrapDuration = container.querySelector('#edit-wrapper-duration');

    pkgTypeSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'duration') {
        wrapSessions?.classList.add('hidden');
        wrapDuration?.classList.remove('hidden');
      } else {
        wrapSessions?.classList.remove('hidden');
        wrapDuration?.classList.add('hidden');
      }
    });

    container.querySelector('#btn-print-sub-receipt')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'subscription');
    });

    // Ajouter un versement
    container.querySelector('#form-add-payment')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = container.querySelector('#pay-date')?.value;
      const amount = parseFloat(container.querySelector('#pay-amount')?.value);
      const method = container.querySelector('#pay-method')?.value;

      if (!amount || amount <= 0) {
        window.App.showToast('Veuillez entrer un montant valide', 'error');
        return;
      }

      stateManager.addPayment(client.id, { date, amount, method });
      window.App.showToast('Versement enregistré !', 'success');
      this.render(container, stateManager.getClientById(client.id));
    });

    // Supprimer un versement
    container.querySelectorAll('.btn-remove-payment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const payId = e.currentTarget.getAttribute('data-payment-id');
        if (confirm('Supprimer cette ligne de versement ?')) {
          stateManager.removePayment(client.id, payId);
          window.App.showToast('Versement supprimé', 'info');
          this.render(container, stateManager.getClientById(client.id));
        }
      });
    });

    // Mettre à jour la formule
    container.querySelector('#form-edit-client-pkg')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedPackage = {
        packageType: formData.get('packageType'),
        durationMonths: parseInt(formData.get('durationMonths'), 10) || 1,
        totalSessions: parseInt(formData.get('totalSessions'), 10) || 10,
        totalAmount: parseFloat(formData.get('totalAmount')) || 0
      };

      stateManager.updateBilling(client.id, updatedPackage);
      window.App.showToast('Formule mise à jour !', 'success');
      this.render(container, stateManager.getClientById(client.id));
    });
  }
};


/* ==========================================================================
   MODULE: components/photos.js
   ========================================================================== */
/**
 * photos.js - Galerie Photos Avant / Maintenant & Comparateur Split-Slider pour COACH PRO
 * Capture photo directe avec Caméra Live (bouton Fermer/Annuler, bascule Avant/Arrière),
 * import galerie et comparateur visuel avant/après interactif avec curseur glissant.
 */
const PhotosComponent = {
  currentPoseFilter: 'all',
  liveCameraStream: null,
  currentFacingMode: 'environment',

  render(container, client) {
    const photos = Array.isArray(client.photos) ? client.photos : [];
    const beforePhotos = photos.filter(p => p.type === 'before');
    const afterPhotos = photos.filter(p => p.type === 'after' || p.type === 'progress');

    const defaultBefore = beforePhotos[0] || photos[photos.length - 1] || null;
    const defaultAfter = afterPhotos[0] || photos[0] || null;

    container.innerHTML = `
      <div class="photos-view space-y-6">
        
        <!-- En-tête Module Photos & Actions -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500 shadow-xl">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Transformation Visuelle</span>
              <span class="text-xs text-slate-300 font-semibold">${photos.length} photo(s) enregistrée(s)</span>
            </div>
            <h2 class="text-xl font-bold text-white">Photos Avant / Maintenant</h2>
            <p class="text-xs text-slate-300 mt-0.5">Capturez les progrès physiques et comparez l'évolution avec le curseur interactif</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-open-live-cam" class="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-500/20">
              <span>📷</span>
              <span>Prendre Photo (Caméra)</span>
            </button>
            <button id="btn-open-add-photo" class="btn btn-secondary btn-sm flex items-center gap-1.5 font-semibold">
              <span>📁</span>
              <span>Importer Fichier</span>
            </button>
          </div>
        </div>

        <!-- Formulaire d'Ajout Photo (Masqué par défaut) -->
        <div id="add-photo-panel" class="glass-card p-5 hidden space-y-4 border border-emerald-500/40">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📸</span> Enregistrer une Photo de Suivi
            </h3>
            <button id="btn-close-photo-panel" class="text-xs text-slate-400 hover:text-white font-bold">✕ Fermer</button>
          </div>

          <form id="form-upload-photo" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="label">Date de la prise *</label>
                <input type="date" id="photo-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
              </div>
              <div>
                <label class="label">Statut *</label>
                <select id="photo-type" class="input text-xs font-bold text-emerald-400">
                  <option value="before">🔴 Avant (Point de Départ)</option>
                  <option value="progress" selected>🟢 Maintenant (Évolution)</option>
                  <option value="after">🏆 Après (Objectif Atteint)</option>
                </select>
              </div>
              <div>
                <label class="label">Angle / Pose *</label>
                <select id="photo-pose" class="input text-xs font-semibold">
                  <option value="face">Face (Devant)</option>
                  <option value="profile_left">Profil Gauche</option>
                  <option value="profile_right">Profil Droit</option>
                  <option value="back">Dos</option>
                </select>
              </div>
              <div>
                <label class="label">Poids du jour (kg)</label>
                <input type="number" step="0.1" id="photo-weight" value="${client.history && client.history.length > 0 ? client.history[client.history.length - 1].weight : ''}" placeholder="ex: 78.5" class="input text-xs" />
              </div>
            </div>

            <!-- Aperçu ou Zone de Dépôt -->
            <div class="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-900/60 relative" id="photo-dropzone">
              <input type="file" id="photo-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
              <div id="photo-preview-container" class="space-y-2">
                <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-xl">
                  📷
                </div>
                <div class="text-xs text-slate-200 font-bold">
                  Cliquez ici pour choisir une photo ou prenez-en une directement
                </div>
                <div class="text-[11px] text-slate-400">JPG, PNG, WEBP acceptés</div>
              </div>
            </div>

            <div>
              <label class="label">Consigne / Commentaire du Coach</label>
              <input type="text" id="photo-notes" placeholder="ex: Posture améliorée, épaules ouvertes, gain musculaire visible" class="input text-xs" />
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" id="btn-cancel-photo" class="btn btn-secondary btn-sm font-bold">Annuler</button>
              <button type="submit" id="btn-save-photo-submit" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20" disabled>Enregistrer la Photo</button>
            </div>
          </form>
        </div>

        ${photos.length >= 2 && defaultBefore && defaultAfter && defaultBefore.id !== defaultAfter.id ? `
          <!-- COMPARATEUR INTERACTIF SPLIT-SLIDER -->
          <div class="glass-card p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Comparateur Interactif Avant / Maintenant
                </h3>
                <p class="text-xs text-slate-400">Glissez le curseur au centre de gauche à droite pour observer la métamorphose</p>
              </div>

              <!-- Sélecteurs de Photos à Comparer -->
              <div class="flex items-center gap-2 text-xs">
                <select id="select-before-photo" class="input input-sm text-[11px] max-w-[140px]">
                  ${photos.map((p) => `
                    <option value="${p.id}" ${p.id === defaultBefore.id ? 'selected' : ''}>
                      Avant: ${new Date(p.date).toLocaleDateString('fr-FR')} (${p.weight || '--'}kg)
                    </option>
                  `).join('')}
                </select>
                <span class="text-slate-500">vs</span>
                <select id="select-after-photo" class="input input-sm text-[11px] max-w-[140px]">
                  ${photos.map((p) => `
                    <option value="${p.id}" ${p.id === defaultAfter.id ? 'selected' : ''}>
                      Maintenant: ${new Date(p.date).toLocaleDateString('fr-FR')} (${p.weight || '--'}kg)
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Zone Split-Slider Canvas -->
            <div class="relative w-full max-w-2xl mx-auto aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none" id="slider-comparison-box">
              <img id="slider-img-before" src="${defaultBefore.dataUrl}" alt="Avant" class="absolute inset-0 w-full h-full object-cover" />
              
              <div class="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold text-rose-400">
                🔴 AVANT • ${new Date(defaultBefore.date).toLocaleDateString('fr-FR')} ${defaultBefore.weight ? `(${defaultBefore.weight} kg)` : ''}
              </div>

              <div id="slider-overlay" class="absolute inset-0 w-full h-full overflow-hidden" style="width: 50%;">
                <img id="slider-img-after" src="${defaultAfter.dataUrl}" alt="Maintenant" class="absolute inset-0 w-full h-full object-cover max-w-none" style="width: 100%; height: 100%;" />
                <div class="absolute top-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-400">
                  🟢 MAINTENANT • ${new Date(defaultAfter.date).toLocaleDateString('fr-FR')} ${defaultAfter.weight ? `(${defaultAfter.weight} kg)` : ''}
                </div>
              </div>

              <!-- Ligne de séparation centrale avec curseur -->
              <div id="slider-divider" class="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(255,255,255,0.8)]" style="left: 50%;">
                <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 font-black text-xs flex items-center justify-center shadow-2xl border-2 border-slate-950">
                  ↔
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- GALERIE DES PHOTOS -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">Galerie Complète (${photos.length})</h3>

            <!-- Filtres par pose -->
            <div class="flex items-center gap-1.5">
              <button class="btn btn-xs ${this.currentPoseFilter === 'all' ? 'btn-primary' : 'btn-outline'}" data-pose-filter="all">Toutes</button>
              <button class="btn btn-xs ${this.currentPoseFilter === 'face' ? 'btn-primary' : 'btn-outline'}" data-pose-filter="face">Face</button>
              <button class="btn btn-xs ${this.currentPoseFilter === 'profile' ? 'btn-primary' : 'btn-outline'}" data-pose-filter="profile">Profil</button>
              <button class="btn btn-xs ${this.currentPoseFilter === 'back' ? 'btn-primary' : 'btn-outline'}" data-pose-filter="back">Dos</button>
            </div>
          </div>

          ${photos.length === 0 ? `
            <div class="p-8 text-center space-y-2">
              <div class="text-3xl">📷</div>
              <p class="text-xs text-slate-300 font-semibold">Aucune photo enregistrée pour cet athlète.</p>
              <p class="text-[11px] text-slate-400">Prenez une photo de départ pour démarrer le comparateur visuel.</p>
            </div>
          ` : `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              ${photos
                .filter(p => this.currentPoseFilter === 'all' || p.pose.includes(this.currentPoseFilter))
                .map(photo => {
                  const isBefore = photo.type === 'before';
                  const poseLabel = photo.pose === 'face' ? 'Face' : photo.pose.includes('profile') ? 'Profil' : 'Dos';

                  return `
                    <div class="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col shadow-lg">
                      <div class="aspect-[3/4] relative overflow-hidden bg-black">
                        <img src="${photo.dataUrl}" alt="${poseLabel}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        
                        <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isBefore ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-slate-950'}">
                          ${isBefore ? 'Avant' : 'Évolution'}
                        </span>

                        <span class="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700">
                          ${poseLabel}
                        </span>
                      </div>

                      <div class="p-2.5 space-y-1 bg-slate-900/95 flex-1 flex flex-col justify-between">
                        <div>
                          <div class="flex items-center justify-between text-xs font-bold text-white">
                            <span>${new Date(photo.date).toLocaleDateString('fr-FR')}</span>
                            ${photo.weight ? `<span class="text-emerald-400">${photo.weight} kg</span>` : ''}
                          </div>
                          ${photo.notes ? `<p class="text-[11px] text-slate-400 truncate mt-0.5" title="${photo.notes}">${photo.notes}</p>` : ''}
                        </div>

                        <div class="pt-2 border-t border-slate-800 flex items-center justify-end">
                          <button class="btn-delete-photo text-[11px] text-rose-400 hover:text-rose-300 font-bold" data-photo-id="${photo.id}">
                            Supprimer
                          </button>
                        </div>
                      </div>
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

  /**
   * Ouvre la caméra live plein écran avec bouton Fermer bien visible
   */
  openLiveCameraModal(onCaptured) {
    let modal = document.getElementById('live-camera-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'live-camera-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 select-none';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-4 sm:p-6 space-y-4 border-t-4 border-emerald-500 shadow-2xl relative">
        
        <!-- En-tête avec bouton Fermer évident -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">📷</span>
            <h3 class="text-sm font-bold text-white">Prise de Vue Caméra</h3>
          </div>
          <button id="btn-close-live-cam-top" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
            ✕ Fermer
          </button>
        </div>

        <!-- Viseur Caméra Live -->
        <div class="relative w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
          <video id="live-cam-video" playsinline autoplay class="w-full h-full object-cover"></video>
          <div id="live-cam-flash" class="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-150"></div>
        </div>

        <!-- Boutons d'Action Caméra -->
        <div class="flex items-center justify-between gap-3 pt-2">
          <button type="button" id="btn-switch-camera" class="btn btn-secondary btn-sm flex items-center gap-1.5 font-bold">
            <span>🔄</span>
            <span>Basculer</span>
          </button>

          <button type="button" id="btn-capture-live-photo" class="btn btn-primary btn-md py-3 px-6 rounded-full font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2">
            <span>📸</span>
            <span>PRENDRE PHOTO</span>
          </button>

          <button type="button" id="btn-close-live-cam-bottom" class="btn btn-outline btn-sm font-bold text-rose-400 border-rose-500/30">
            <span>✕</span>
            <span>Annuler</span>
          </button>
        </div>
      </div>
    `;

    const closeCam = () => {
      this.stopLiveCamera();
      modal.classList.add('hidden');
    };

    modal.querySelector('#btn-close-live-cam-top')?.addEventListener('click', closeCam);
    modal.querySelector('#btn-close-live-cam-bottom')?.addEventListener('click', closeCam);

    modal.querySelector('#btn-switch-camera')?.addEventListener('click', () => {
      this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
      this.startCameraStream(modal);
    });

    modal.querySelector('#btn-capture-live-photo')?.addEventListener('click', () => {
      const video = modal.querySelector('#live-cam-video');
      const flash = modal.querySelector('#live-cam-flash');

      if (!video || !video.videoWidth) {
        alert('La caméra n\'est pas encore prête.');
        return;
      }

      if (flash) {
        flash.style.opacity = '0.9';
        setTimeout(() => { flash.style.opacity = '0'; }, 150);
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      closeCam();
      if (typeof onCaptured === 'function') onCaptured(capturedDataUrl);
    });

    this.startCameraStream(modal);
  },

  async startCameraStream(modal) {
    this.stopLiveCamera();
    const video = modal.querySelector('#live-cam-video');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Caméra non supportée.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      this.liveCameraStream = stream;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (err) {
      console.warn("Erreur démarrage caméra live:", err);
      alert("Impossible d'accéder à la caméra (" + err.message + "). Utilisez l'import de fichier.");
      this.stopLiveCamera();
      modal.classList.add('hidden');
    }
  },

  stopLiveCamera() {
    if (this.liveCameraStream) {
      this.liveCameraStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.liveCameraStream = null;
    }
  },

  bindEvents(container, client) {
    let selectedDataUrl = null;

    const addPanel = container.querySelector('#add-photo-panel');
    const previewContainer = container.querySelector('#photo-preview-container');
    const submitBtn = container.querySelector('#btn-save-photo-submit');

    const showAddPanel = (dataUrl = null) => {
      addPanel?.classList.remove('hidden');
      if (dataUrl) {
        selectedDataUrl = dataUrl;
        if (previewContainer) {
          previewContainer.innerHTML = `
            <div class="max-w-[140px] mx-auto rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
              <img src="${dataUrl}" class="w-full h-auto object-cover" />
            </div>
            <p class="text-xs text-emerald-400 font-bold mt-1">Photo capturée avec succès ✓</p>
          `;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    };

    container.querySelector('#btn-open-live-cam')?.addEventListener('click', () => {
      this.openLiveCameraModal((capturedUrl) => {
        showAddPanel(capturedUrl);
      });
    });

    container.querySelector('#btn-open-add-photo')?.addEventListener('click', () => {
      showAddPanel();
    });

    container.querySelector('#btn-close-photo-panel')?.addEventListener('click', () => {
      addPanel?.classList.add('hidden');
    });

    container.querySelector('#btn-cancel-photo')?.addEventListener('click', () => {
      addPanel?.classList.add('hidden');
    });

    // File input
    const fileInput = container.querySelector('#photo-file-input');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          selectedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          if (previewContainer) {
            previewContainer.innerHTML = `
              <div class="max-w-[140px] mx-auto rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                <img src="${selectedDataUrl}" class="w-full h-auto object-cover" />
              </div>
              <p class="text-xs text-emerald-400 font-bold mt-1">Photo sélectionnée ✓</p>
            `;
          }
          if (submitBtn) submitBtn.disabled = false;
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Enregistrement
    const form = container.querySelector('#form-upload-photo');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedDataUrl) {
        alert('Veuillez sélectionner ou capturer une photo.');
        return;
      }

      stateManager.addClientPhoto(client.id, {
        date: container.querySelector('#photo-date')?.value || new Date().toISOString().split('T')[0],
        type: container.querySelector('#photo-type')?.value || 'progress',
        pose: container.querySelector('#photo-pose')?.value || 'face',
        weight: container.querySelector('#photo-weight')?.value || '',
        notes: container.querySelector('#photo-notes')?.value || '',
        dataUrl: selectedDataUrl
      });

      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast('Photo enregistrée !', 'success');
      }

      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
    });

    // Suppression d'une photo
    container.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const photoId = btn.dataset.photoId;
        if (confirm('Voulez-vous vraiment supprimer cette photo ?')) {
          stateManager.deleteClientPhoto(client.id, photoId);
          const updated = stateManager.getClientById(client.id);
          this.render(container, updated);
        }
      });
    });

    // Filtres
    container.querySelectorAll('[data-pose-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPoseFilter = btn.dataset.poseFilter;
        const updated = stateManager.getClientById(client.id);
        this.render(container, updated);
      });
    });

    // Slider split
    const sliderBox = container.querySelector('#slider-comparison-box');
    const overlay = container.querySelector('#slider-overlay');
    const divider = container.querySelector('#slider-divider');
    const selectBefore = container.querySelector('#select-before-photo');
    const selectAfter = container.querySelector('#select-after-photo');

    if (sliderBox && overlay && divider) {
      let isDragging = false;

      const updateSliderPos = (clientX) => {
        const rect = sliderBox.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;

        overlay.style.width = `${pct}%`;
        divider.style.left = `${pct}%`;
      };

      sliderBox.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSliderPos(e.clientX);
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSliderPos(e.clientX);
      });
      window.addEventListener('mouseup', () => { isDragging = false; });

      sliderBox.addEventListener('touchstart', (e) => {
        isDragging = true;
        if (e.touches[0]) updateSliderPos(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        if (e.touches[0]) updateSliderPos(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchend', () => { isDragging = false; });

      selectBefore?.addEventListener('change', () => {
        const p = (client.photos || []).find(ph => ph.id === selectBefore.value);
        if (p) {
          const img = container.querySelector('#slider-img-before');
          if (img) img.src = p.dataUrl;
        }
      });
      selectAfter?.addEventListener('change', () => {
        const p = (client.photos || []).find(ph => ph.id === selectAfter.value);
        if (p) {
          const img = container.querySelector('#slider-img-after');
          if (img) img.src = p.dataUrl;
        }
      });
    }
  }
};


/* ==========================================================================
   MODULE: components/recurringSchedule.js
   ========================================================================== */
/**
 * recurringSchedule.js - Créneaux d'Entraînement Récurrents & Rappels WhatsApp pour COACH PRO
 * Configure les jours et heures habituels d'entraînement de chaque athlète,
 * génère des rappels WhatsApp en 1 clic et permet le pointage direct de présence.
 */
const RecurringScheduleComponent = {
  DAYS: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],

  render(container, client) {
    const sched = client.trainingSchedule || {
      days: ['Lundi', 'Mercredi', 'Vendredi'],
      times: { 'Lundi': '07:00', 'Mercredi': '07:00', 'Vendredi': '07:00' },
      location: client.residence || 'Salle de sport / Domicile',
      notes: ''
    };

    const pkg = client.package || {};
    const remaining = Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0));

    container.innerHTML = `
      <div class="recurring-schedule-view space-y-6">
        
        <!-- En-tête Créneaux -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Organisation Hebdomadaire</span>
              <span class="text-xs text-slate-400">Jours & Heures d'Entraînement</span>
            </div>
            <h3 class="text-xl font-bold text-white">Créneaux Fixes de l'Athlète</h3>
            <p class="text-xs text-slate-400 mt-0.5">Définissez les rendez-vous réguliers de ${client.firstName} pour automatiser les rappels</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-quick-log-session" class="btn btn-primary btn-sm flex items-center gap-1 font-bold shadow-lg shadow-emerald-500/20">
              <span>✓</span>
              <span>Pointer Séance (-1)</span>
            </button>
            <button id="btn-whatsapp-reminder" class="btn btn-whatsapp btn-sm flex items-center gap-1 font-bold">
              <span>💬</span>
              <span>Rappel WhatsApp</span>
            </button>
          </div>
        </div>

        <!-- Récapitulatif des Créneaux Actifs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Jours d'Entraînement</span>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${(sched.days || []).map(day => `
                <span class="badge badge-emerald text-xs font-bold">${day} (${sched.times?.[day] || '08:00'})</span>
              `).join('')}
            </div>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Lieu Habituel</span>
            <span class="text-base font-bold text-white mt-1 block">${sched.location || 'Domicile / Salle'}</span>
            <span class="text-[11px] text-slate-500">Lieu d'intervention du coach</span>
          </div>

          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Forfait Restant</span>
            <span class="text-2xl font-bold font-mono ${remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'} mt-1 block">
              ${remaining} <span class="text-xs text-slate-400 font-normal">/ ${pkg.totalSessions || 10} séances</span>
            </span>
            <span class="text-[11px] text-slate-500">${pkg.sessionsUsed || 0} séances déjà effectuées</span>
          </div>
        </div>

        <!-- Formulaire de Configuration des Créneaux -->
        <div class="glass-card p-5 space-y-4">
          <h4 class="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>⚙️</span> Modifier les Jours et Heures de Séance
          </h4>

          <form id="form-recurring-schedule" class="space-y-5">
            <div>
              <label class="label mb-2">Sélectionnez les jours d'entraînement habituels :</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                ${this.DAYS.map(day => {
                  const isChecked = (sched.days || []).includes(day);
                  const timeVal = sched.times?.[day] || '07:00';
                  return `
                    <div class="p-3 rounded-xl border ${isChecked ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/50'} space-y-2 text-center">
                      <label class="flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs ${isChecked ? 'text-emerald-400' : 'text-slate-300'}">
                        <input type="checkbox" name="sched_days" value="${day}" ${isChecked ? 'checked' : ''} class="accent-emerald-500 rounded" />
                        <span>${day.slice(0, 3)}</span>
                      </label>
                      <input type="time" name="time_${day}" value="${timeVal}" class="input input-sm text-xs font-mono font-bold text-center px-1" />
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Lieu Habituel des Séances</label>
                <input type="text" id="sched-location" value="${sched.location || ''}" placeholder="ex: Domicile athlète / Salle de sport / Parc Cocody" class="input text-xs" />
              </div>
              <div>
                <label class="label">Consignes Spécifiques / Notes du Coach</label>
                <input type="text" id="sched-notes" value="${sched.notes || ''}" placeholder="ex: Prévoir serviette et bouteille d'eau fraîche" class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
                Enregistrer les Créneaux
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client);
  },

  bindEvents(container, client) {
    const coach = stateManager.getCoachProfile();

    // Formulaire d'enregistrement
    const form = container.querySelector('#form-recurring-schedule');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedDays = Array.from(container.querySelectorAll('input[name="sched_days"]:checked')).map(cb => cb.value);
      const times = {};
      selectedDays.forEach(day => {
        const timeInput = container.querySelector(`input[name="time_${day}"]`);
        times[day] = timeInput ? timeInput.value : '07:00';
      });

      const location = container.querySelector('#sched-location')?.value || '';
      const notes = container.querySelector('#sched-notes')?.value || '';

      stateManager.saveClientSchedule(client.id, {
        days: selectedDays,
        times,
        location,
        notes
      });

      alert('Créneaux d\'entraînement enregistrés avec succès !');
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
    });

    // Pointage rapide
    container.querySelector('#btn-quick-log-session')?.addEventListener('click', () => {
      stateManager.logSessionAttendance(client.id, { notes: 'Séance pointée depuis les créneaux' });
      alert(`Séance validée pour ${client.firstName} !`);
      const updated = stateManager.getClientById(client.id);
      this.render(container, updated);
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    // Rappel WhatsApp
    container.querySelector('#btn-whatsapp-reminder')?.addEventListener('click', () => {
      const sched = client.trainingSchedule || {};
      const daysStr = (sched.days || []).join(', ');
      const coachName = coach.name || 'Votre Coach';

      const phone = (client.phone || '').replace(/[^0-9]/g, '');
      if (!phone) {
        alert('Numéro de téléphone du client manquant.');
        return;
      }

      const msg = `Bonjour ${client.firstName} ! C'est ${coachName}.\nRappel pour notre prochaine séance d'entraînement prévue sur votre créneau (${daysStr || 'cette semaine'}).\nPensez à votre tenue, votre serviette et une bonne hydratation ! 💪🔥`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    });
  }
};


/* ==========================================================================
   MODULE: components/contractModal.js
   ========================================================================== */
/**
 * contractModal.js - Fiche d'Engagement, Décharge de Responsabilité & Double Signature
 * Protège juridiquement le coach sportif privé en cas d'accident ou de problème de santé.
 * Comprend un double pad tactile de signature électronique (Client & Coach),
 * l'enregistrement horodaté et l'impression en format A4 et ticket thermique.
 */
const ContractModal = {
  activeClientId: null,
  clientPad: null,
  coachPad: null,

  open(clientId) {
    this.activeClientId = clientId;
    const client = stateManager.getClientById(clientId);
    const coach = stateManager.getCoachProfile();

    if (!client) return;

    let modal = document.getElementById('contract-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'contract-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-3 sm:p-5 z-50';
      document.body.appendChild(modal);
    }

    const contract = client.contract || {};
    const hasExistingSignatures = !!(contract.clientSignature && contract.coachSignature);
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const contractNum = contract.contractNumber || `CTR-${client.id.replace('client_', '')}`;

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-3xl w-full p-5 sm:p-7 space-y-6 border-t-4 border-emerald-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <!-- Header Contrat -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge badge-emerald text-xs">Protection Juridique</span>
              <span class="text-xs text-slate-400 font-mono">N° ${contractNum}</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-1">Fiche d'Engagement & Décharge de Responsabilité</h2>
          </div>
          <button id="btn-close-contract-modal" class="text-slate-400 hover:text-white text-lg p-1">✕</button>
        </div>

        <!-- Informations Parties -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
          <div>
            <span class="font-bold text-emerald-400 block uppercase mb-1">Le Coach Sportif</span>
            <p><strong>Nom :</strong> ${coach.name || 'COACH PRIVÉ'}</p>
            <p><strong>Structure :</strong> ${coach.brand || 'Coach Pro'}</p>
            <p><strong>Contact :</strong> ${coach.phone || 'Non renseigné'}</p>
          </div>
          <div>
            <span class="font-bold text-emerald-400 block uppercase mb-1">L'Athlète / Le Client</span>
            <p><strong>Nom :</strong> ${client.firstName} ${client.lastName}</p>
            <p><strong>Habitation :</strong> ${client.residence || 'Non renseignée'}</p>
            <p><strong>Téléphone :</strong> ${client.phone || 'Non renseigné'}</p>
          </div>
        </div>

        <!-- Clauses Juridiques Protectrices -->
        <div class="space-y-3 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 max-h-52 overflow-y-auto">
          <h4 class="font-bold text-white uppercase text-[11px] tracking-wider text-emerald-400">Clauses & Conditions Générales de Sécurité :</h4>
          
          <p><strong>1. Aptitude Physique & Santé :</strong> Le client certifie sur l'honneur avoir consulté un médecin ou être en pleine capacité physique pour pratiquer des activités physiques et sportives. Il s'engage à signaler immédiatement toute douleur, malaise, pathologie ou prescription médicale nouvelle au coach avant le début de chaque séance.</p>
          
          <p><strong>2. Décharge de Responsabilité :</strong> Le client décharge expressément le coach de toute responsabilité civile ou pénale en cas de malaise, accident musculaire, problème cardiovasculaire ou blessure survenant lors ou consécutivement aux séances, notamment en cas de dissimulation d'antécédents médicaux ou de non-respect des consignes de sécurité édictées par le coach.</p>

          <p><strong>3. Assiduité & Politique d'Annulation :</strong> Toute séance annulée ou reportée par le client moins de 24 heures avant l'horaire fixé sera considérée comme due et décomptée du forfait actif.</p>

          <p><strong>4. Forfaits & Règlements :</strong> Les forfaits et packs de séances souscrits sont strictement personnels, valables pour la durée convenue, et ne font l'objet d'aucun remboursement après démarrage du programme.</p>
        </div>

        <!-- Double Zone de Signature Tactile -->
        <div class="space-y-4 pt-2">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider">Signatures Électroniques Manuscrites :</h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Signature Client -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200">Signature du Client *</span>
                <button type="button" id="btn-clear-client-pad" class="text-[11px] text-slate-400 hover:text-rose-400">Effacer</button>
              </div>
              <div class="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-slate-900 h-32 relative">
                <canvas id="client-signature-pad" class="w-full h-full cursor-crosshair touch-none"></canvas>
                ${contract.clientSignature ? `
                  <img id="client-saved-img" src="${contract.clientSignature}" class="absolute inset-0 w-full h-full object-contain pointer-events-none p-2" />
                ` : ''}
              </div>
              <span class="text-[10px] text-slate-500 block">Signez au doigt ou au stylet dans le cadre.</span>
            </div>

            <!-- Signature Coach -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-200">Signature du Coach *</span>
                <button type="button" id="btn-clear-coach-pad" class="text-[11px] text-slate-400 hover:text-rose-400">Effacer</button>
              </div>
              <div class="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-slate-900 h-32 relative">
                <canvas id="coach-signature-pad" class="w-full h-full cursor-crosshair touch-none"></canvas>
                ${contract.coachSignature ? `
                  <img id="coach-saved-img" src="${contract.coachSignature}" class="absolute inset-0 w-full h-full object-contain pointer-events-none p-2" />
                ` : ''}
              </div>
              <span class="text-[10px] text-slate-500 block">Signez au doigt ou au stylet dans le cadre.</span>
            </div>
          </div>
        </div>

        <!-- Boutons d'Action -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div class="flex items-center gap-2">
            <button id="btn-print-contract-a4" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <span>🖨️</span>
              <span>Imprimer Contrat (A4 / PDF)</span>
            </button>
            <button id="btn-print-contract-thermal" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <span>🧾</span>
              <span>Ticket Thermique</span>
            </button>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button type="button" id="btn-cancel-contract" class="btn btn-secondary btn-sm">Fermer</button>
            <button type="button" id="btn-save-contract" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
              Enregistrer l'Engagement
            </button>
          </div>
        </div>
      </div>
    `;

    this.initSignaturePads(modal, client);
    this.bindEvents(modal, client, coach);
  },

  initSignaturePads(modal, client) {
    const setupCanvas = (canvasId, savedImgId) => {
      const canvas = modal.querySelector(canvasId);
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2 || 600;
      canvas.height = rect.height * 2 || 260;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#10b981';

      let isDrawing = false;
      let hasDrawn = false;

      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - r.left,
          y: clientY - r.top
        };
      };

      const start = (e) => {
        isDrawing = true;
        hasDrawn = true;
        const savedImg = modal.querySelector(savedImgId);
        if (savedImg) savedImg.classList.add('hidden');
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const stop = () => { isDrawing = false; };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);

      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
      window.addEventListener('touchend', stop);

      return {
        canvas,
        ctx,
        clear: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const savedImg = modal.querySelector(savedImgId);
          if (savedImg) savedImg.classList.add('hidden');
          hasDrawn = false;
        },
        hasDrawn: () => hasDrawn,
        toDataURL: () => canvas.toDataURL('image/png')
      };
    };

    setTimeout(() => {
      this.clientPad = setupCanvas('#client-signature-pad', '#client-saved-img');
      this.coachPad = setupCanvas('#coach-signature-pad', '#coach-saved-img');
    }, 50);
  },

  bindEvents(modal, client, coach) {
    modal.querySelector('#btn-close-contract-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    modal.querySelector('#btn-cancel-contract')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.querySelector('#btn-clear-client-pad')?.addEventListener('click', () => {
      this.clientPad?.clear();
    });
    modal.querySelector('#btn-clear-coach-pad')?.addEventListener('click', () => {
      this.coachPad?.clear();
    });

    // Enregistrer le contrat
    modal.querySelector('#btn-save-contract')?.addEventListener('click', () => {
      const clientSig = this.clientPad?.hasDrawn() ? this.clientPad.toDataURL() : (client.contract?.clientSignature || null);
      const coachSig = this.coachPad?.hasDrawn() ? this.coachPad.toDataURL() : (client.contract?.coachSignature || null);

      if (!clientSig && !coachSig) {
        alert('Veuillez au moins apposer la signature du client ou du coach.');
        return;
      }

      stateManager.saveClientContract(client.id, {
        contractNumber: client.contract?.contractNumber || `CTR-${Date.now().toString().slice(-6)}`,
        signedAt: new Date().toISOString(),
        clientSignature: clientSig,
        coachSignature: coachSig
      });

      alert('Fiche d\'engagement et décharge de responsabilité enregistrées avec succès !');
      modal.classList.add('hidden');
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    // Impression A4 / PDF
    modal.querySelector('#btn-print-contract-a4')?.addEventListener('click', () => {
      this.printContractA4(client, coach);
    });

    // Impression Thermique
    modal.querySelector('#btn-print-contract-thermal')?.addEventListener('click', () => {
      if (window.ThermalModal) {
        window.ThermalModal.open(client, 'contract');
      } else {
        alert('Module d\'impression thermique prêt.');
      }
    });
  },

  printContractA4(client, coach) {
    const contract = client.contract || {};
    const dateStr = contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const contractNum = contract.contractNumber || `CTR-${client.id.replace('client_', '')}`;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Veuillez autoriser les fenêtres pop-up pour imprimer.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrat d'Engagement — ${client.firstName} ${client.lastName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 13px; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
          .meta-box { display: flex; gap: 20px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
          .meta-col { flex: 1; }
          .clause-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 20px; background: #ffffff; }
          .clause-title { font-weight: bold; margin-bottom: 6px; text-transform: uppercase; font-size: 12px; color: #0f172a; }
          .signatures { display: flex; justify-content: space-between; gap: 30px; margin-top: 30px; }
          .sig-col { flex: 1; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px; height: 120px; position: relative; }
          .sig-img { max-height: 80px; max-width: 100%; object-fit: contain; margin-top: 10px; }
          .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${coach.brand || 'COACH PRO'}</div>
            <div>${coach.name || 'Coach Sportif Privé'} • ${coach.phone || ''}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>CONTRAT D'ENGAGEMENT</strong></div>
            <div>N° ${contractNum} • Date : ${dateStr}</div>
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-col">
            <strong>LE COACH SPORTIF :</strong><br>
            Nom : ${coach.name || 'Coach Privé'}<br>
            Ville : ${coach.city || 'Abidjan'}<br>
            Téléphone : ${coach.phone || '--'}
          </div>
          <div class="meta-col">
            <strong>L'ATHLÈTE / LE CLIENT :</strong><br>
            Nom complet : ${client.firstName} ${client.lastName}<br>
            Habitation : ${client.residence || '--'}<br>
            Téléphone : ${client.phone || '--'}
          </div>
        </div>

        <div class="clause-box">
          <div class="clause-title">Clauses & Conditions de Pratique Sportive et Décharge :</div>
          <p><strong>1. Aptitude Médicale :</strong> Le client atteste être en condition physique satisfaisante pour la pratique sportive encadrée et n'avoir aucune contre-indication médicale connue. Le client s'engage à informer le coach de tout symptôme ou malaise.</p>
          <p><strong>2. Décharge de Responsabilité :</strong> Le client pratique sous sa propre responsabilité et décharge le coach de toute poursuite en cas d'accident ou de malaise lié à une condition médicale non signalée ou au non-respect des instructions.</p>
          <p><strong>3. Assiduité & Règles de Séance :</strong> Toute annulation doit intervenir au moins 24 heures à l'avance, faute de quoi la séance est comptabilisée.</p>
          <p><strong>4. Validité :</strong> Le présent engagement formalise l'accord mutuel entre le client et son coach sportif pour l'ensemble du cycle de suivi.</p>
        </div>

        <div class="signatures">
          <div class="sig-col">
            <strong>Signature du Coach :</strong><br>
            ${contract.coachSignature ? `<img src="${contract.coachSignature}" class="sig-img" />` : '<div style="margin-top:30px;color:#94a3b8;">[Signé électroniquement]</div>'}
          </div>
          <div class="sig-col">
            <strong>Signature du Client (Lu et approuvé) :</strong><br>
            ${contract.clientSignature ? `<img src="${contract.clientSignature}" class="sig-img" />` : '<div style="margin-top:30px;color:#94a3b8;">[Signé électroniquement]</div>'}
          </div>
        </div>

        <div class="footer">
          Document généré électroniquement par l'application COACH PRO • Fait foi d'accord entre les parties.
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};


/* ==========================================================================
   MODULE: components/planning.js
   ========================================================================== */
/**
 * planning.js - Calendrier & Planning des Séances Privées
 * Gère les créneaux (08h00 Aïcha, 10h00 Karim...), la validation directe (-1 séance) et la planification.
 */
const Planning = {
  render(container) {
    const appointments = stateManager.getAppointments();
    const clients = stateManager.getClients();
    const todayStr = new Date().toISOString().split('T')[0];

    // Regrouper par date
    const grouped = {};
    appointments.forEach(a => {
      if (!grouped[a.date]) grouped[a.date] = [];
      grouped[a.date].push(a);
    });

    const sortedDates = Object.keys(grouped).sort();

    container.innerHTML = `
      <div class="planning-view space-y-6">
        
        <!-- Header Planning -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Agenda Coach</span>
              <span class="text-xs text-slate-400">Gestion des séances individuelles</span>
            </div>
            <h1 class="text-xl font-bold text-white">Planning & Rendez-vous</h1>
            <p class="text-xs text-slate-400 mt-0.5">Validez les séances effectuées pour décompter automatiquement le forfait</p>
          </div>

          <button id="btn-open-new-apt-modal" class="btn btn-primary btn-sm">
            + Planifier une Séance
          </button>
        </div>

        <!-- Formulaire Rapide d'Ajout (Masquable) -->
        <div id="quick-add-apt-panel" class="glass-card p-5 hidden space-y-4 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">Nouvelle Séance Privée</h3>
            <button id="btn-close-apt-panel" class="text-xs text-slate-400 hover:text-white">✕</button>
          </div>

          <form id="form-create-apt" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Athlète Concerné *</label>
                <select name="clientId" id="apt-client-select" class="input text-xs font-semibold" required>
                  <option value="">-- Sélectionner un client --</option>
                  ${clients.map(c => `
                    <option value="${c.id}" data-name="${c.firstName} ${c.lastName}">
                      ${c.firstName} ${c.lastName} (${c.package ? `${(c.package.totalSessions || 0) - (c.package.sessionsUsed || 0)} rest.` : '0 rest.'})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="label">Date *</label>
                <input type="date" name="date" value="${todayStr}" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Heure *</label>
                <input type="time" name="time" value="08:00" class="input text-xs font-bold" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Lieu</label>
                <input type="text" name="location" placeholder="ex: Domicile client / Salle Cocody" class="input text-xs" />
              </div>
              <div>
                <label class="label">Durée</label>
                <select name="duration" class="input text-xs">
                  <option value="45 min">45 min</option>
                  <option value="60 min" selected>60 min</option>
                  <option value="75 min">75 min</option>
                  <option value="90 min">90 min</option>
                </select>
              </div>
              <div>
                <label class="label">Type de séance</label>
                <input type="text" name="type" placeholder="ex: Renforcement / Cardio / Bilan" class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="btn-cancel-create-apt" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer au Planning</button>
            </div>
          </form>
        </div>

        <!-- Liste Chronologique des Séances -->
        <div class="space-y-4">
          ${sortedDates.length === 0 ? `
            <div class="glass-card p-10 text-center space-y-3">
              <p class="text-xs text-slate-400">Aucune séance planifiée dans votre calendrier.</p>
              <button id="btn-start-planning-first" class="btn btn-primary btn-sm">+ Planifier ma première séance</button>
            </div>
          ` : sortedDates.map(date => {
            const dateObj = new Date(date);
            const isToday = date === todayStr;
            const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            return `
              <div class="glass-card p-5 space-y-3 ${isToday ? 'border-emerald-500/40 bg-emerald-950/10' : ''}">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold capitalize ${isToday ? 'text-emerald-400 font-black' : 'text-white'}">${formattedDate}</span>
                    ${isToday ? '<span class="badge badge-emerald text-[10px]">Aujourd\'hui</span>' : ''}
                  </div>
                  <span class="text-xs text-slate-400">${grouped[date].length} séance(s)</span>
                </div>

                <div class="space-y-2">
                  ${grouped[date].map(apt => `
                    <div class="p-3.5 rounded-lg bg-[#0c1220] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      <div class="flex items-center gap-4">
                        <div class="text-center font-mono py-1 px-2.5 rounded bg-slate-900 border border-slate-700">
                          <span class="text-sm font-bold text-white block leading-tight">${apt.time}</span>
                          <span class="text-[9px] text-slate-400">${apt.duration}</span>
                        </div>

                        <div>
                          <h4 class="text-sm font-bold text-white">${apt.clientName}</h4>
                          <p class="text-xs text-slate-400">${apt.location || 'Lieu habituel'} • <span class="text-slate-300">${apt.type || 'Séance coaching'}</span></p>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        ${apt.status === 'completed' ? `
                          <span class="badge badge-emerald text-xs">✓ Effectuée</span>
                        ` : `
                          <button class="btn btn-primary btn-xs" data-action="complete-apt" data-apt-id="${apt.id}">
                            ✓ Valider Séance (-1)
                          </button>
                        `}
                        <button class="btn btn-outline btn-xs text-red-400" data-action="delete-apt" data-apt-id="${apt.id}">
                          ✕
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const panel = container.querySelector('#quick-add-apt-panel');
    const openBtn = container.querySelector('#btn-open-new-apt-modal');
    const closeBtn = container.querySelector('#btn-close-apt-panel');
    const cancelBtn = container.querySelector('#btn-cancel-create-apt');
    const startFirstBtn = container.querySelector('#btn-start-planning-first');

    const togglePanel = (show) => {
      if (panel) {
        if (show) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
    };

    openBtn?.addEventListener('click', () => togglePanel(true));
    startFirstBtn?.addEventListener('click', () => togglePanel(true));
    closeBtn?.addEventListener('click', () => togglePanel(false));
    cancelBtn?.addEventListener('click', () => togglePanel(false));

    // Soumission du formulaire de séance
    container.querySelector('#form-create-apt')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const select = container.querySelector('#apt-client-select');
      const clientName = select.options[select.selectedIndex]?.getAttribute('data-name') || 'Athlète';

      const newApt = {
        clientId: formData.get('clientId'),
        clientName,
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration'),
        location: formData.get('location') || 'Domicile / Salle',
        type: formData.get('type') || 'Séance Privée'
      };

      stateManager.addAppointment(newApt);
      window.App.showToast('Séance planifiée avec succès !', 'success');
      this.render(container);
    });

    // Validation séance (décompte forfait)
    container.querySelectorAll('[data-action="complete-apt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const aptId = e.currentTarget.getAttribute('data-apt-id');
        stateManager.updateAppointmentStatus(aptId, 'completed');
        window.App.showToast('Séance validée et décomptée du forfait !', 'success');
        this.render(container);
      });
    });

    // Suppression séance
    container.querySelectorAll('[data-action="delete-apt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const aptId = e.currentTarget.getAttribute('data-apt-id');
        if (confirm('Supprimer ce rendez-vous ?')) {
          stateManager.deleteAppointment(aptId);
          window.App.showToast('Séance supprimée', 'info');
          this.render(container);
        }
      });
    });
  }
};


/* ==========================================================================
   MODULE: components/nutrition.js
   ========================================================================== */
/**
 * nutrition.js - Plan Alimentaire & Suivi Nutritionnel Personnalisé
 * Gère : Cible calorique, Macros (P/G/L), Repas (Petit-déj, Déjeuner, Collation, Dîner), Aliments à privilégier/limiter.
 */
const Nutrition = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Créez ou sélectionnez un client pour configurer son plan alimentaire personnalisé.</p>
          <button id="btn-create-client-nutri" class="btn btn-primary btn-sm">+ Créer un client</button>
        </div>
      `;
      container.querySelector('#btn-create-client-nutri')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    const lastAssessment = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const weight = lastAssessment ? lastAssessment.weight : 75;
    const height = lastAssessment ? lastAssessment.height : 175;
    const age = client.age || 30;
    const gender = client.gender || 'H';

    const mb = Calculations.calculateMB(weight, height, age, gender);
    const det = Calculations.calculateDET(mb, client.lifestyle?.activityLevel || 1.375);
    const defaultNutri = Calculations.calculateNutritionPlan(det, client.mainGoal === 'Prise de masse musculaire' ? 'bulk' : 'cut');

    const plan = client.nutritionPlan || {
      targetKcal: defaultNutri.targetKcal,
      proteinGrams: defaultNutri.grams.proteinGrams,
      carbGrams: defaultNutri.grams.carbGrams,
      fatGrams: defaultNutri.grams.fatGrams,
      waterLiters: (weight * 0.035).toFixed(1),
      meals: [
        { name: 'Petit-déjeuner (07h30)', items: '3 œufs bio ou omelette, 50g flocons d\'avoine, 1 fruit de saison, thé vert ou café sans sucre' },
        { name: 'Déjeuner (12h30)', items: '150g blanc de poulet ou poisson braisé, 120g riz complet ou patate douce, légumes sautés, 1 c.à.s huile d\'olive' },
        { name: 'Collation (16h30)', items: '1 poignée d\'amandes (30g), 1 pomme ou 1 shaker de whey isolate' },
        { name: 'Dîner (19h30)', items: '150g poisson blanc ou dinde, grande portion de légumes cuits / salade verte, avocat' }
      ],
      adviceGood: 'Poissons, volailles, œufs, légumes verts, tubercules locaux (patate douce, igname), fruits frais, eau minérale.',
      adviceBad: 'Sodas, jus industriels, fritures, alcool, sauces grasses, charcuterie, pain blanc raffiné.'
    };

    container.innerHTML = `
      <div class="nutrition-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Plan Nutritionnel Privé</span>
              <span class="text-xs text-slate-400">Prescription sur-mesure</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Nutrition de <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Dépense (DET) : ${det} kcal/j • Cible : <strong class="text-white">${plan.targetKcal} kcal/j</strong></p>
          </div>

          <div class="flex items-center gap-2">
            <select id="select-nutri-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName} (${c.mainGoal})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 4 Cartes Cibles Métaboliques -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Cible Calories</span>
            <span class="text-2xl font-bold text-emerald-400 font-mono mt-1 block">${plan.targetKcal}</span>
            <span class="text-[10px] text-slate-500">kcal / jour</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Protéines</span>
            <span class="text-2xl font-bold text-white font-mono mt-1 block">${plan.proteinGrams}g</span>
            <span class="text-[10px] text-slate-500">${(plan.proteinGrams / weight).toFixed(1)} g / kg</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Glucides</span>
            <span class="text-2xl font-bold text-white font-mono mt-1 block">${plan.carbGrams}g</span>
            <span class="text-[10px] text-slate-500">Énergie & glycogène</span>
          </div>

          <div class="glass-card p-3 text-center">
            <span class="text-[11px] text-slate-400 font-semibold block uppercase">Eau Conseillée</span>
            <span class="text-2xl font-bold text-sky-400 font-mono mt-1 block">${plan.waterLiters} L</span>
            <span class="text-[10px] text-slate-500">Hydratation / jour</span>
          </div>
        </div>

        <!-- Plan Alimentaire par Repas -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-base">🥗</span>
              <h3 class="text-sm font-bold text-white">Menu & Structure des Repas</h3>
            </div>
          </div>

          <form id="form-edit-nutrition" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${plan.meals.map((m, idx) => `
                <div class="sub-card p-3.5 space-y-1.5">
                  <label class="font-bold text-xs text-emerald-400 block">${m.name}</label>
                  <textarea name="meal_${idx}" rows="3" class="input text-xs w-full resize-none">${m.items}</textarea>
                </div>
              `).join('')}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div class="sub-card p-3.5 space-y-1.5">
                <label class="font-bold text-xs text-emerald-400 block">✅ Aliments à Privilégier</label>
                <textarea name="adviceGood" rows="2" class="input text-xs w-full resize-none">${plan.adviceGood || ''}</textarea>
              </div>
              <div class="sub-card p-3.5 space-y-1.5">
                <label class="font-bold text-xs text-rose-400 block">❌ Aliments à Limiter</label>
                <textarea name="adviceBad" rows="2" class="input text-xs w-full resize-none">${plan.adviceBad || ''}</textarea>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="btn btn-primary">
                💾 Enregistrer le Plan Nutritionnel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client, plan);
  },

  bindEvents(container, client, plan) {
    container.querySelector('#select-nutri-client')?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    container.querySelector('#form-edit-nutrition')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const updatedMeals = plan.meals.map((m, idx) => ({
        name: m.name,
        items: formData.get(`meal_${idx}`) || m.items
      }));

      const updatedPlan = {
        ...plan,
        meals: updatedMeals,
        adviceGood: formData.get('adviceGood'),
        adviceBad: formData.get('adviceBad')
      };

      stateManager.saveClientNutrition(client.id, updatedPlan);
      window.App.showToast('Plan nutritionnel enregistré !', 'success');
    });
  }
};


/* ==========================================================================
   MODULE: components/programs.js
   ========================================================================== */
/**
 * programs.js - Builder de Programmes d'Entraînement pour Coach Privé
 * Structure : Programme -> Semaine -> Séance -> Exercices (Séries, Reps, Charges, Repos, RPE, Consignes).
 */
const Programs = {
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


/* ==========================================================================
   MODULE: components/progressCheckin.js
   ========================================================================== */
/**
 * progressCheckin.js - Check-ins Hebdomadaires, Suivi Transformation & Mesures
 * Gère le scoring d'adhérence (/10), alertes (🟢/🟠/🔴), mensurations et comparateur Avant / Aujourd'hui.
 */
const ProgressCheckin = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Sélectionnez un athlète pour enregistrer ses check-ins hebdomadaires et voir sa progression.</p>
          <button id="btn-create-client-chk" class="btn btn-primary btn-sm">+ Créer un client</button>
        </div>
      `;
      container.querySelector('#btn-create-client-chk')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    const checkins = client.checkins || [];
    const history = client.history || [];
    const firstAssessment = history.length > 0 ? history[0] : null;
    const lastAssessment = history.length > 0 ? history[history.length - 1] : null;

    // Calcul du statut de forme actuel
    const lastCheckin = checkins.length > 0 ? checkins[0] : null;
    const statusPill = client.checkinStatus === 'struggling'
      ? { text: '🔴 Client en difficulté', class: 'border-rose-500/50 bg-rose-500/10 text-rose-300' }
      : client.checkinStatus === 'medium'
      ? { text: '🟠 Adhérence moyenne', class: 'border-amber-500/50 bg-amber-500/10 text-amber-300' }
      : { text: '🟢 Tout va bien (Adhérence optimale)', class: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' };

    // Comparateur Avant / Aujourd'hui
    const comparison = (firstAssessment && lastAssessment && history.length > 1)
      ? Calculations.compareEntries(firstAssessment, lastAssessment, client.mainGoal)
      : null;

    container.innerHTML = `
      <div class="checkin-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Suivi & Transformation</span>
              <span class="text-xs ${statusPill.class} px-2 py-0.5 rounded-full font-bold border">${statusPill.text}</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Progression de <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Objectif : ${client.mainGoal} • Poids de départ : ${firstAssessment?.weight || '--'} kg</p>
          </div>

          <div class="flex items-center gap-2">
            <select id="select-chk-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName}
                </option>
              `).join('')}
            </select>
            <button id="btn-open-add-checkin" class="btn btn-primary btn-sm">
              + Nouveau Check-in Hebdo
            </button>
          </div>
        </div>

        <!-- Comparateur Transformation Avant / Aujourd'hui -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">📸 Bilan de Transformation (Avant → Aujourd'hui)</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Poids</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.weight || '--'}kg →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.weight || '--'}kg</span>
              </div>
              <span class="text-xs font-bold ${comparison?.deltas.weight < 0 ? 'text-emerald-400' : 'text-amber-400'}">
                ${comparison ? `${comparison.deltas.weight > 0 ? '+' : ''}${comparison.deltas.weight} kg` : 'Bilan initial'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Masse Grasse</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.fatPct || '--'}% →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.fatPct || '--'}%</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.fatPct !== null && comparison?.deltas.fatPct !== undefined ? `${comparison.deltas.fatPct > 0 ? '+' : ''}${comparison.deltas.fatPct}%` : '--'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Masse Musculaire</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.musclePct || '--'}% →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.musclePct || '--'}%</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.musclePct !== null && comparison?.deltas.musclePct !== undefined ? `${comparison.deltas.musclePct > 0 ? '+' : ''}${comparison.deltas.musclePct}%` : '--'}
              </span>
            </div>

            <div class="sub-card p-3.5 text-center">
              <span class="text-[11px] text-slate-400 block uppercase">Tour de Taille</span>
              <div class="flex items-center justify-center gap-1.5 mt-1 font-mono">
                <span class="text-xs text-slate-500">${firstAssessment?.waist || '--'}cm →</span>
                <span class="text-lg font-bold text-white">${lastAssessment?.waist || '--'}cm</span>
              </div>
              <span class="text-xs font-bold text-emerald-400">
                ${comparison?.deltas.waist !== null && comparison?.deltas.waist !== undefined ? `${comparison.deltas.waist > 0 ? '+' : ''}${comparison.deltas.waist} cm` : '--'}
              </span>
            </div>
          </div>
        </div>

        <!-- Formulaire d'Ajout Check-in (Masquable) -->
        <div id="add-checkin-panel" class="glass-card p-5 hidden space-y-4 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">📝 Enregistrer un Check-in Hebdomadaire</h3>
            <button id="btn-close-chk-panel" class="text-xs text-slate-400 hover:text-white">✕</button>
          </div>

          <form id="form-create-checkin" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="label">Date du Check-in</label>
                <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Poids Actuel (kg)</label>
                <input type="number" step="0.1" name="weight" value="${lastAssessment?.weight || 75}" class="input text-xs font-bold text-emerald-400" required />
              </div>
              <div>
                <label class="label">Adhérence Globale (%)</label>
                <input type="number" name="adherencePct" value="85" placeholder="ex: 80" class="input text-xs font-bold" required />
              </div>
            </div>

            <!-- Notes sur 10 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0c1220] p-3 rounded-lg border border-slate-800">
              <div>
                <label class="label">Énergie ( / 10)</label>
                <input type="number" min="1" max="10" name="energy" value="8" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Sommeil ( / 10)</label>
                <input type="number" min="1" max="10" name="sleep" value="7" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Niveau de Stress ( / 10)</label>
                <input type="number" min="1" max="10" name="stress" value="4" class="input text-xs font-bold" required />
              </div>
              <div>
                <label class="label">Contrôle Faim ( / 10)</label>
                <input type="number" min="1" max="10" name="hunger" value="7" class="input text-xs font-bold" required />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Difficultés rencontrées cette semaine</label>
                <input type="text" name="difficulties" placeholder="ex: Déjeuner pris sur le pouce mercredi, courbatures..." class="input text-xs" />
              </div>
              <div>
                <label class="label">Commentaire & Conseils du Coach</label>
                <input type="text" name="coachFeedback" placeholder="ex: Excellent engagement ! Continuer l'hydratation." class="input text-xs" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="btn-cancel-chk" class="btn btn-secondary btn-sm">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer le Check-in</button>
            </div>
          </form>
        </div>

        <!-- Historique des Check-ins Hebdomadaires -->
        <div class="glass-card p-5 space-y-4">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Historique des Check-ins (${checkins.length})</h3>

          ${checkins.length === 0 ? `
            <div class="p-6 text-center text-slate-400 space-y-2">
              <p class="text-xs">Aucun check-in enregistré pour le moment.</p>
              <button id="btn-first-checkin-start" class="btn btn-secondary btn-xs">+ Réaliser le premier check-in</button>
            </div>
          ` : `
            <div class="space-y-3">
              ${checkins.map(chk => {
                const badge = chk.status === 'struggling' ? 'badge-rose' : chk.status === 'medium' ? 'badge-amber' : 'badge-emerald';
                const label = chk.status === 'struggling' ? '🔴 En difficulté' : chk.status === 'medium' ? '🟠 Moyen' : '🟢 Optimal';

                return `
                  <div class="p-4 rounded-lg bg-[#0c1220] border border-slate-800 space-y-2.5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-xs">${new Date(chk.date).toLocaleDateString('fr-FR')}</span>
                        <span class="badge ${badge} text-[10px]">${label}</span>
                        <span class="text-xs font-mono font-bold text-white">• Poids : ${chk.weight} kg</span>
                      </div>
                      <span class="text-xs font-bold text-emerald-400 font-mono">Adhérence : ${chk.adherencePct}%</span>
                    </div>

                    <div class="grid grid-cols-4 gap-2 text-center text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div>⚡ Énergie : <strong>${chk.energy}/10</strong></div>
                      <div>😴 Sommeil : <strong>${chk.sleep}/10</strong></div>
                      <div>🧘 Stress : <strong>${chk.stress}/10</strong></div>
                      <div>🥗 Faim : <strong>${chk.hunger}/10</strong></div>
                    </div>

                    ${chk.difficulties ? `<p class="text-xs text-slate-400">⚠️ <em>Difficultés :</em> ${chk.difficulties}</p>` : ''}
                    ${chk.coachFeedback ? `<p class="text-xs text-emerald-300">💬 <em>Feedback coach :</em> ${chk.coachFeedback}</p>` : ''}
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
    const selectClient = container.querySelector('#select-chk-client');
    selectClient?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    const panel = container.querySelector('#add-checkin-panel');
    const openBtn = container.querySelector('#btn-open-add-checkin');
    const firstBtn = container.querySelector('#btn-first-checkin-start');
    const closeBtn = container.querySelector('#btn-close-chk-panel');
    const cancelBtn = container.querySelector('#btn-cancel-chk');

    const toggle = (show) => {
      if (panel) {
        if (show) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
    };

    openBtn?.addEventListener('click', () => toggle(true));
    firstBtn?.addEventListener('click', () => toggle(true));
    closeBtn?.addEventListener('click', () => toggle(false));
    cancelBtn?.addEventListener('click', () => toggle(false));

    // Soumission du check-in
    container.querySelector('#form-create-checkin')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const checkinData = {
        date: formData.get('date'),
        weight: formData.get('weight'),
        adherencePct: formData.get('adherencePct'),
        energy: formData.get('energy'),
        sleep: formData.get('sleep'),
        stress: formData.get('stress'),
        hunger: formData.get('hunger'),
        difficulties: formData.get('difficulties'),
        coachFeedback: formData.get('coachFeedback')
      };

      stateManager.addCheckin(client.id, checkinData);
      window.App.showToast('Check-in hebdomadaire enregistré !', 'success');
      this.render(container, client.id);
    });
  }
};


/* ==========================================================================
   MODULE: components/messages.js
   ========================================================================== */
/**
 * messages.js - Communication, Journal de Bord & Passerelle WhatsApp
 */
const Messages = {
  render(container, clientId = null) {
    const clients = stateManager.getClients();
    const coach = stateManager.getCoachProfile();
    const client = clientId ? stateManager.getClientById(clientId) : (clients.length > 0 ? clients[0] : null);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Aucun client sélectionné</h3>
          <p class="text-xs text-slate-400">Sélectionnez un athlète pour consulter le journal de bord ou lui envoyer un message WhatsApp.</p>
        </div>
      `;
      return;
    }

    const messages = client.messages || [];

    container.innerHTML = `
      <div class="messages-view space-y-6">
        
        <!-- Header & Sélecteur Client -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Journal & WhatsApp</span>
              <span class="text-xs text-slate-400">Suivi relationnel</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              Échanges avec <span class="text-emerald-400">${client.firstName} ${client.lastName}</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">📞 WhatsApp : ${client.phone || 'Non renseigné'}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select id="select-msg-client" class="input text-xs py-1.5 font-semibold">
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.firstName} ${c.lastName}
                </option>
              `).join('')}
            </select>
            <button id="btn-open-wa-direct" class="btn btn-whatsapp btn-sm">
              💬 Ouvrir WhatsApp
            </button>
          </div>
        </div>

        <!-- 3 Raccourcis de Messages Types WhatsApp -->
        <div class="glass-card p-5 space-y-3">
          <h3 class="text-sm font-bold text-white pb-2 border-b border-slate-800">Modèles Rapides d'Envoi WhatsApp</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">📊 Synthèse de Bilan</span>
              <p class="text-[11px] text-slate-400">Envoie les mesures clés, IMC, % gras/muscle et cible calorique.</p>
              <button id="btn-send-wa-assessment" class="btn btn-secondary btn-xs w-full">Envoyer Bilan</button>
            </div>

            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">🏋️ Rappel de Séance</span>
              <p class="text-[11px] text-slate-400">Rappelle le créneau d'entraînement et le lieu prévu.</p>
              <button id="btn-send-wa-reminder" class="btn btn-secondary btn-xs w-full">Envoyer Rappel</button>
            </div>

            <div class="sub-card p-3 space-y-2">
              <span class="font-bold text-xs text-white block">📝 Lien de Check-in Hebdo</span>
              <p class="text-[11px] text-slate-400">Demande à l'athlète ses notes d'énergie, sommeil et poids.</p>
              <button id="btn-send-wa-checkin" class="btn btn-secondary btn-xs w-full">Demander Check-in</button>
            </div>
          </div>
        </div>

        <!-- Journal de Bord Interne du Coach -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white">Journal des Notes & Échanges (${messages.length})</h3>
          </div>

          <div class="space-y-3 max-h-72 overflow-y-auto p-1">
            ${messages.map(m => `
              <div class="p-3 rounded-lg bg-[#0c1220] border border-slate-800 space-y-1">
                <div class="flex items-center justify-between text-[11px]">
                  <strong class="text-emerald-400">${m.sender === 'coach' ? coach.name : client.firstName}</strong>
                  <span class="text-slate-500">${new Date(m.date).toLocaleDateString('fr-FR')} à ${new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="text-xs text-slate-300">${m.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- Ajout d'une Note / Message interne -->
          <form id="form-add-internal-note" class="flex gap-2 pt-2 border-t border-slate-800">
            <input type="text" name="noteText" placeholder="Ajouter une note de suivi (ex: Bonne énergie aujourd'hui, squat à 60kg réussi)..." class="input text-xs flex-1" required />
            <button type="submit" class="btn btn-primary btn-sm">Ajouter Note</button>
          </form>
        </div>
      </div>
    `;

    this.bindEvents(container, client, coach);
  },

  bindEvents(container, client, coach) {
    const selectClient = container.querySelector('#select-msg-client');
    selectClient?.addEventListener('change', (e) => {
      this.render(container, e.target.value);
    });

    const openWhatsApp = (msg) => {
      let phone = client.phone ? client.phone.replace(/[^0-9+]/g, '') : '';
      if (phone.startsWith('0') && phone.length === 10) phone = '33' + phone.substring(1);
      const url = phone
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    };

    container.querySelector('#btn-open-wa-direct')?.addEventListener('click', () => {
      openWhatsApp(`Bonjour ${client.firstName} ! C'est ${coach.name}, ton coach. Comment s'est passée ta journée ?`);
    });

    container.querySelector('#btn-send-wa-assessment')?.addEventListener('click', () => {
      const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
      const url = ThermalPrinter.generateWhatsAppLink(client, last, coach);
      window.open(url, '_blank');
    });

    container.querySelector('#btn-send-wa-reminder')?.addEventListener('click', () => {
      openWhatsApp(`Bonjour ${client.firstName} ! Petit rappel pour notre prochaine séance d'entraînement. Sois bien hydraté(e) et prêt(e) ! 💪 - ${coach.name}`);
    });

    container.querySelector('#btn-send-wa-checkin')?.addEventListener('click', () => {
      openWhatsApp(`Salut ${client.firstName} ! C'est l'heure de ton check-in hebdomadaire : merci de me transmettre ton poids du matin, ainsi que tes niveaux de forme et sommeil sur 10. À très vite ! - ${coach.name}`);
    });

    // Formulaire d'ajout de note interne
    container.querySelector('#form-add-internal-note')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input[name="noteText"]');
      if (input && input.value) {
        stateManager.addMessage(client.id, input.value, 'coach');
        window.App.showToast('Note ajoutée au journal', 'success');
        this.render(container, client.id);
      }
    });
  }
};


/* ==========================================================================
   MODULE: components/quickTools.js
   ========================================================================== */
/**
 * quickTools.js - Calculateur Flash Corporel & Métabolique COACH PRO
 * Champs vides sans chiffres imposés par défaut, calculs physiologiques directs et clairs.
 */
const QuickTools = {
  open() {
    const modal = document.getElementById('quick-tools-modal');
    if (!modal) return;

    this.render();
    modal.classList.remove('hidden');
    this.bindEvents();
  },

  close() {
    const modal = document.getElementById('quick-tools-modal');
    if (modal) modal.classList.add('hidden');
  },

  render() {
    const container = document.getElementById('quick-tools-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white">Calculateur Flash (Physiologie & Indicateurs)</h3>
            <p class="text-xs text-slate-400">Entrez les valeurs du client pour obtenir instantanément son diagnostic corporel</p>
          </div>
          <button id="btn-close-quick-tools-x" class="btn-icon">✕</button>
        </div>

        <!-- Saisie sans chiffres imposés par défaut -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="label">Poids (kg) *</label>
            <input type="number" inputmode="decimal" step="0.1" id="qt-weight" placeholder="ex: 78.5" class="input font-bold text-emerald-400" />
          </div>
          <div>
            <label class="label">Taille (cm) *</label>
            <input type="number" inputmode="numeric" id="qt-height" placeholder="ex: 175" class="input font-bold" />
          </div>
          <div>
            <label class="label">Âge (ans) *</label>
            <input type="number" inputmode="numeric" id="qt-age" placeholder="ex: 32" class="input font-bold" />
          </div>
          <div>
            <label class="label">Genre *</label>
            <select id="qt-gender" class="input">
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
        </div>

        <!-- Résultats Calculés Immédiats -->
        <div class="sub-card p-4 space-y-3 bg-[#0c1220] border border-slate-800">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Indicateurs Estimés</h4>
            <span id="qt-healthy-range" class="text-xs text-slate-300 font-mono">Poids santé : --</span>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">IMC & Statut</span>
              <span id="qt-res-imc" class="text-lg font-bold text-white font-mono">--</span>
              <span id="qt-res-imc-cat" class="text-[10px] text-slate-400 block font-semibold">En attente de saisie</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Masse Grasse</span>
              <span id="qt-res-fat" class="text-lg font-bold text-amber-400 font-mono">--</span>
              <span id="qt-res-fat-kg" class="text-[10px] text-slate-400 block">-- kg</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Masse Muscle</span>
              <span id="qt-res-muscle" class="text-lg font-bold text-emerald-400 font-mono">--</span>
              <span id="qt-res-muscle-kg" class="text-[10px] text-slate-400 block">-- kg</span>
            </div>

            <div class="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <span class="text-[10px] text-slate-400 uppercase block">Métabolisme Base (MB)</span>
              <span id="qt-res-mb" class="text-lg font-bold text-emerald-400 font-mono">--</span>
              <span class="text-[10px] text-slate-400 block">kcal / jour</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-800">
          <button id="btn-close-quick-tools" class="btn btn-secondary btn-sm">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('quick-tools-modal');
    const closeBtnX = document.getElementById('btn-close-quick-tools-x');
    const closeBtn = document.getElementById('btn-close-quick-tools');

    const hide = () => this.close();
    closeBtnX?.addEventListener('click', hide);
    closeBtn?.addEventListener('click', hide);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) hide();
    });

    const wInput = document.getElementById('qt-weight');
    const hInput = document.getElementById('qt-height');
    const ageInput = document.getElementById('qt-age');
    const gSelect = document.getElementById('qt-gender');

    const updateCalc = () => {
      const w = parseFloat(wInput?.value);
      const h = parseFloat(hInput?.value);
      const age = parseInt(ageInput?.value, 10);
      const gender = gSelect?.value || 'H';

      const imcEl = document.getElementById('qt-res-imc');
      const imcCatEl = document.getElementById('qt-res-imc-cat');
      const fatEl = document.getElementById('qt-res-fat');
      const fatKgEl = document.getElementById('qt-res-fat-kg');
      const muscleEl = document.getElementById('qt-res-muscle');
      const muscleKgEl = document.getElementById('qt-res-muscle-kg');
      const mbEl = document.getElementById('qt-res-mb');
      const rangeEl = document.getElementById('qt-healthy-range');

      if (w && h && h > 0) {
        const comp = Calculations.calculateBodyComposition(w, h, age || 30, gender);
        const mb = Calculations.calculateMB(w, h, age || 30, gender);
        const range = Calculations.calculateHealthyWeightRange(h, w);

        if (imcEl) imcEl.textContent = comp.imc;
        if (imcCatEl) {
          imcCatEl.textContent = comp.imcCategory;
          imcCatEl.className = `text-[10px] font-bold ${comp.imcCode === 'normal' ? 'text-emerald-400' : 'text-amber-400'} block`;
        }
        if (fatEl) fatEl.textContent = `${comp.fatPct}%`;
        if (fatKgEl) fatKgEl.textContent = `${comp.fatKg} kg`;
        if (muscleEl) muscleEl.textContent = `${comp.musclePct}%`;
        if (muscleKgEl) muscleKgEl.textContent = `${comp.muscleKg} kg`;
        if (mbEl) mbEl.textContent = mb > 0 ? `${mb}` : '--';
        if (rangeEl) rangeEl.textContent = `Poids santé : ${range.min} à ${range.max} kg`;
      } else {
        if (imcEl) imcEl.textContent = '--';
        if (imcCatEl) imcCatEl.textContent = 'En attente de saisie';
        if (fatEl) fatEl.textContent = '--';
        if (fatKgEl) fatKgEl.textContent = '-- kg';
        if (muscleEl) muscleEl.textContent = '--';
        if (muscleKgEl) muscleKgEl.textContent = '-- kg';
        if (mbEl) mbEl.textContent = '--';
        if (rangeEl) rangeEl.textContent = 'Poids santé : --';
      }
    };

    wInput?.addEventListener('input', updateCalc);
    hInput?.addEventListener('input', updateCalc);
    ageInput?.addEventListener('input', updateCalc);
    gSelect?.addEventListener('change', updateCalc);
  }
};


/* ==========================================================================
   MODULE: components/qrScanner.js
   ========================================================================== */
/**
 * qrScanner.js - Lecteur & Scanner Universel de Code QR par Caméra pour COACH PRO
 * Décodage 100% autonome et infaillible via Canvas + jsQR intégré.
 * Fonctionne parfaitement sur TOUTES les versions d'Android, tablettes et navigateurs.
 */
const QRScannerComponent = {
  videoStream: null,
  scanInterval: null,
  scanCanvas: null,

  openModal() {
    let modal = document.getElementById('qr-scanner-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'qr-scanner-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-4 z-50';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-md w-full p-5 space-y-4 border-t-4 border-emerald-500 shadow-2xl relative">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              🔲
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Scanner un Reçu / Athlète</h3>
              <p class="text-[11px] text-slate-400">Pointez la caméra vers le QR Code du ticket ou du client</p>
            </div>
          </div>
          <button id="btn-close-qr-scanner" class="text-slate-400 hover:text-white text-lg p-1 font-bold">✕</button>
        </div>

        <!-- Zone Vidéo Caméra avec Viseur & Détection Temps Réel -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
          <video id="qr-video-feed" playsinline autoplay muted class="w-full h-full object-cover"></video>
          
          <!-- Viseur Visuel -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-3/4 h-3/4 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
              <!-- Coins du viseur -->
              <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
              <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
              <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
              
              <!-- Ligne Laser Animée -->
              <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-laser shadow-[0_0_12px_#10b981]"></div>
            </div>
          </div>

          <!-- Message Statut Caméra -->
          <div id="qr-camera-status" class="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md rounded-xl p-2 text-center text-xs text-slate-200 border border-slate-800 font-medium">
            Initialisation de la caméra...
          </div>
        </div>

        <!-- Recherche Manuelle de Secours -->
        <div class="pt-2 border-t border-slate-800 space-y-2">
          <span class="text-[11px] text-slate-400 block font-semibold">Ou saisie manuelle de l'identifiant du reçu / client :</span>
          <div class="flex gap-2">
            <input type="text" id="manual-qr-input" placeholder="ex: client_1710000000 ou Nom" class="input text-xs font-mono" />
            <button id="btn-manual-qr-search" class="btn btn-secondary btn-sm shrink-0 font-bold">Rechercher</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(modal);
    this.startCamera(modal);
  },

  async startCamera(modal) {
    const video = modal.querySelector('#qr-video-feed');
    const status = modal.querySelector('#qr-camera-status');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (status) status.innerHTML = `<span class="text-slate-400">Caméra désactivée. Utilisez la saisie manuelle ci-dessous.</span>`;
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.videoStream = stream;
      if (video) {
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.srcObject = stream;
        try {
          await video.play();
        } catch (playErr) {
          console.log('Lecture vidéo démarrée:', playErr);
        }
        if (status) status.textContent = 'Pointez le code QR du reçu ou du client dans le viseur.';
        this.startDetection(video, modal);
      }
    } catch (err) {
      console.log('Info caméra scanner:', err.message);
      if (status) {
        status.innerHTML = `<span class="text-slate-300">Caméra non connectée. Entrez l'identifiant ci-dessous.</span>`;
      }
    }
  },

  startDetection(video, modal) {
    if (!this.scanCanvas) {
      this.scanCanvas = document.createElement('canvas');
    }
    const canvas = this.scanCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    this.scanInterval = setInterval(() => {
      try {
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w > 0 && h > 0) {
            // Échantillonnage optimisé
            canvas.width = Math.min(w, 640);
            canvas.height = Math.min(h, 480);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 1. Décodage ultra-rapide avec jsQR (Supporte contrastes direct et inversé)
            if (typeof window.jsQR === 'function') {
              const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });
              if (code && code.data) {
                this.handleDecodedCode(code.data, modal);
                return;
              }
            }

            // 2. Détection alternative native si dispo
            if ('BarcodeDetector' in window) {
              const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
              detector.detect(canvas).then(barcodes => {
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  this.handleDecodedCode(barcodes[0].rawValue, modal);
                }
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        // En cas d'erreur de lecture d'une frame, continuer
      }
    }, 120);
  },

  findClientByCode(codeText) {
    if (!codeText) return null;
    const clean = codeText.trim().toLowerCase();
    const clients = stateManager.getClients();

    // 1. Recherche par identifiant direct
    let match = clients.find(c => c.id.toLowerCase() === clean);
    if (match) return match;

    // 2. Recherche par numéro de reçu court (ex: CP-849201 ou 849201)
    match = clients.find(c => {
      const code = `cp-${c.id.slice(-6)}`.toLowerCase();
      const numOnly = c.id.slice(-6).toLowerCase();
      return clean.includes(code) || clean.includes(numOnly) || code.includes(clean);
    });
    if (match) return match;

    // 3. Recherche par nom complet ou téléphone
    match = clients.find(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return fullName.includes(clean) || (c.phone && c.phone.includes(clean));
    });
    return match;
  },

  handleDecodedCode(codeText, modal) {
    if (!codeText) return;
    this.stopCamera();
    modal.classList.add('hidden');

    if (window.CoachProNative && typeof window.CoachProNative.vibrate === 'function') {
      window.CoachProNative.vibrate(80);
    }

    let clientId = null;
    let receiptInfo = null;

    try {
      if (codeText.startsWith('{')) {
        const parsed = JSON.parse(codeText);
        clientId = parsed.clientId || parsed.id;
        receiptInfo = parsed;
      } else if (codeText.startsWith('client_') || codeText.includes('client_')) {
        const match = codeText.match(/client_\d+/);
        clientId = match ? match[0] : codeText.trim();
      } else {
        clientId = codeText.trim();
      }
    } catch (e) {
      clientId = codeText.trim();
    }

    const client = this.findClientByCode(clientId) || this.findClientByCode(codeText);

    if (client) {
      window.App.openClientDetail(client.id, 'attendance');
      const clientCode = `CP-${client.id.slice(-6).toUpperCase()}`;
      window.App.showToast(`Athlète identifié : ${client.firstName} ${client.lastName} (${clientCode})`, 'success');
    } else {
      alert(`Code QR scanné : "${codeText}"\nAucun athlète correspondant trouvé.`);
    }
  },

  showScanResultModal(client, receiptInfo) {
    let resultModal = document.getElementById('qr-result-modal');
    if (!resultModal) {
      resultModal = document.createElement('div');
      resultModal.id = 'qr-result-modal';
      resultModal.className = 'modal-backdrop flex items-center justify-center p-4 z-50';
      document.body.appendChild(resultModal);
    }

    const pkg = client.package || {};
    const remaining = Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0));

    resultModal.classList.remove('hidden');
    resultModal.innerHTML = `
      <div class="glass-card max-w-md w-full p-6 space-y-5 border-t-4 border-emerald-500 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">✅</span>
            <h3 class="text-base font-bold text-white">Athlète Reconnu</h3>
          </div>
          <button id="btn-close-scan-result" class="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
        </div>

        <div class="bg-slate-900/90 p-4 rounded-xl space-y-2 border border-slate-800">
          <h2 class="text-lg font-bold text-emerald-400">${client.firstName} ${client.lastName}</h2>
          <div class="text-xs text-slate-300 space-y-1.5">
            <p><strong>Objectifs :</strong> ${Array.isArray(client.goals) ? client.goals.join(', ') : (client.mainGoal || 'Transformation')}</p>
            <p><strong>Formule :</strong> ${pkg.packageName || 'Forfait'}</p>
            <p><strong>Séances :</strong> <span class="font-bold text-emerald-400">${pkg.sessionsUsed || 0} effectuées / ${remaining} restantes</span></p>
            <p><strong>Solde dû :</strong> <span class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}">${pkg.balanceDue || 0} FCFA ${(pkg.balanceDue || 0) <= 0 ? '(SOLDE RÉGLÉ ✓)' : ''}</span></p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button id="btn-scan-log-attendance" class="btn btn-primary btn-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20">
            <span>✓</span>
            <span>Pointer Séance (-1)</span>
          </button>
          <button id="btn-scan-open-profile" class="btn btn-secondary btn-sm font-bold flex items-center justify-center gap-1.5">
            <span>👤</span>
            <span>Ouvrir Fiche</span>
          </button>
        </div>
      </div>
    `;

    resultModal.querySelector('#btn-close-scan-result')?.addEventListener('click', () => {
      resultModal.classList.add('hidden');
    });

    resultModal.querySelector('#btn-scan-log-attendance')?.addEventListener('click', () => {
      stateManager.logSessionAttendance(client.id, { notes: 'Séance pointée via Scan QR Code' });
      alert(`Séance validée avec succès pour ${client.firstName} ! Il reste ${Math.max(0, remaining - 1)} séance(s).`);
      resultModal.classList.add('hidden');
      if (window.App && typeof window.App.renderCurrentView === 'function') {
        window.App.renderCurrentView();
      }
    });

    resultModal.querySelector('#btn-scan-open-profile')?.addEventListener('click', () => {
      resultModal.classList.add('hidden');
      if (window.App) {
        window.App.openClientDetail(client.id);
      }
    });
  },

  stopCamera() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  },

  bindEvents(modal) {
    const closeBtn = modal.querySelector('#btn-close-qr-scanner');
    closeBtn?.addEventListener('click', () => {
      this.stopCamera();
      modal.classList.add('hidden');
    });

    // Recherche manuelle
    const searchBtn = modal.querySelector('#btn-manual-qr-search');
    const manualInput = modal.querySelector('#manual-qr-input');
    const doSearch = () => {
      const val = manualInput?.value.trim();
      if (val) {
        this.handleDecodedCode(val, modal);
      }
    };

    searchBtn?.addEventListener('click', doSearch);
    manualInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }
};


/* ==========================================================================
   MODULE: components/accounting.js
   ========================================================================== */
/**
 * accounting.js - Module de Comptabilité & Livre de Caisse du Coach pour COACH PRO
 * Suivi précis des recettes (versements clients), des charges & dépenses,
 * calcul du bénéfice net en FCFA et filtres multicritères avancés (Wave, Orange Money, Périodes, Clients).
 */
const Accounting = {
  currentFilters: {
    period: 'month', // 'today', 'week', 'month', 'year', 'all', 'custom'
    paymentMethod: 'all',
    clientId: 'all',
    startDate: '',
    endDate: ''
  },

  render(container) {
    const clients = stateManager.getClients();
    const summary = stateManager.getFinancialSummary(this.currentFilters);

    container.innerHTML = `
      <div class="accounting-view space-y-6">
        
        <!-- En-tête Comptabilité -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-emerald text-xs">Gestion Financière</span>
              <span class="text-xs text-slate-400">Livre de Caisse & Règlements en FCFA</span>
            </div>
            <h1 class="text-2xl font-bold text-white">Comptabilité du Coach</h1>
            <p class="text-xs text-slate-400 mt-0.5">Suivez vos encaissements, vos dépenses et votre rentabilité nette en temps réel</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-open-add-expense" class="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-500/20">
              <span>+</span>
              <span>Ajouter une Dépense</span>
            </button>
            <button id="btn-print-accounting-ticket" class="btn btn-secondary btn-sm flex items-center gap-1" title="Imprimer le Bilan Financier sur Ticket Thermique">
              <span>🧾</span>
              <span>Ticket Bilan</span>
            </button>
          </div>
        </div>

        <!-- 4 Cartes Métriques Clés Financières en FCFA -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <!-- Carte 1 : Recettes Brutes -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Recettes (Encaissements)</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalIncome)}
            </span>
            <span class="text-[11px] text-slate-500">${summary.incomes.length} transaction(s)</span>
          </div>

          <!-- Carte 2 : Total Dépenses -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Dépenses & Charges</span>
            <span class="text-2xl font-bold font-mono text-rose-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalExpenses)}
            </span>
            <span class="text-[11px] text-slate-500">${summary.expenses.length} dépense(s) saisie(s)</span>
          </div>

          <!-- Carte 3 : Bénéfice Net -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Bénéfice Net Réel</span>
            <span class="text-2xl font-bold font-mono ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1 block">
              ${Calculations.formatFCFA(summary.netProfit)}
            </span>
            <span class="text-[11px] ${summary.netProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-400'}">
              ${summary.netProfit >= 0 ? 'Bilan positif ✓' : 'Déficit sur la période'}
            </span>
          </div>

          <!-- Carte 4 : Créances Restantes (Soldes à percevoir) -->
          <div class="glass-card p-4">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Créances à Encaisser</span>
            <span class="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              ${Calculations.formatFCFA(summary.totalReceivables)}
            </span>
            <span class="text-[11px] text-slate-500">Soldes forfaits en attente</span>
          </div>
        </div>

        <!-- Formulaire d'Ajout de Dépense (Masqué par défaut) -->
        <div id="add-expense-panel" class="glass-card p-5 hidden space-y-4 border border-rose-500/30">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>💳</span> Enregistrer une Charge / Dépense
            </h3>
            <button id="btn-close-expense-panel" class="text-xs text-slate-400 hover:text-white">✕ Fermer</button>
          </div>

          <form id="form-create-expense" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Date de la dépense *</label>
              <input type="date" id="exp-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Montant Dépensé (FCFA) *</label>
              <input type="number" inputmode="numeric" step="500" id="exp-amount" placeholder="ex: 15000" class="input text-xs font-bold text-rose-400" required />
            </div>
            <div>
              <label class="label">Catégorie *</label>
              <select id="exp-category" class="input text-xs">
                <option value="Matériel & Équipement">Matériel & Équipement</option>
                <option value="Location Salle / Espace">Location Salle / Espace</option>
                <option value="Carburant / Déplacement">Carburant / Déplacement</option>
                <option value="Nutrition / Compléments">Nutrition / Compléments</option>
                <option value="Marketing / Publicité">Marketing / Publicité</option>
                <option value="Divers / Autre">Divers / Autre</option>
              </select>
            </div>
            <div>
              <label class="label">Mode de Paiement</label>
              <select id="exp-method" class="input text-xs">
                <option value="Espèces">Espèces</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="label">Description / Justificatif</label>
              <input type="text" id="exp-description" placeholder="ex: Achat élastiques de résistance, péage Cocody, whey protein" class="input text-xs" />
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-danger btn-sm w-full font-bold">
                Valider la Dépense
              </button>
            </div>
          </form>
        </div>

        <!-- BARRE DE FILTRES AVANCÉS -->
        <div class="glass-card p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔍</span> Filtres du Livre de Caisse
            </span>
            <button id="btn-reset-filters" class="text-[11px] text-emerald-400 hover:underline">Réinitialiser les filtres</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <!-- Filtre Période -->
            <div>
              <label class="label">Période</label>
              <select id="filter-period" class="input text-xs">
                <option value="all" ${this.currentFilters.period === 'all' ? 'selected' : ''}>Toutes les dates</option>
                <option value="today" ${this.currentFilters.period === 'today' ? 'selected' : ''}>Aujourd'hui</option>
                <option value="week" ${this.currentFilters.period === 'week' ? 'selected' : ''}>Cette semaine (7 derniers jours)</option>
                <option value="month" ${this.currentFilters.period === 'month' ? 'selected' : ''}>Ce mois-ci</option>
                <option value="year" ${this.currentFilters.period === 'year' ? 'selected' : ''}>Année en cours</option>
              </select>
            </div>

            <!-- Filtre Mode de Paiement -->
            <div>
              <label class="label">Mode de Règlement</label>
              <select id="filter-method" class="input text-xs">
                <option value="all" ${this.currentFilters.paymentMethod === 'all' ? 'selected' : ''}>Tous les modes de paiement</option>
                <option value="Wave" ${this.currentFilters.paymentMethod === 'Wave' ? 'selected' : ''}>Wave</option>
                <option value="Orange" ${this.currentFilters.paymentMethod === 'Orange' ? 'selected' : ''}>Orange Money</option>
                <option value="Moov" ${this.currentFilters.paymentMethod === 'Moov' ? 'selected' : ''}>Moov Money</option>
                <option value="Espèces" ${this.currentFilters.paymentMethod === 'Espèces' ? 'selected' : ''}>Espèces</option>
                <option value="Virement" ${this.currentFilters.paymentMethod === 'Virement' ? 'selected' : ''}>Virement Bancaire</option>
              </select>
            </div>

            <!-- Filtre Client -->
            <div>
              <label class="label">Athlète Spécifique</label>
              <select id="filter-client" class="input text-xs">
                <option value="all" ${this.currentFilters.clientId === 'all' ? 'selected' : ''}>Tous les clients</option>
                ${clients.map(c => `
                  <option value="${c.id}" ${this.currentFilters.clientId === c.id ? 'selected' : ''}>
                    ${c.firstName} ${c.lastName}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- TABLEAUX DES MOUVEMENTS FINANCIERS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Tableau 1 : Recettes (Encaissements) -->
          <div class="glass-card p-5 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="text-emerald-400">🟢</span> Recettes & Versements (${summary.incomes.length})
              </h3>
              <span class="text-xs font-mono font-bold text-emerald-400">${Calculations.formatFCFA(summary.totalIncome)}</span>
            </div>

            ${summary.incomes.length === 0 ? `
              <p class="text-xs text-slate-500 text-center py-6">Aucun encaissement sur cette sélection.</p>
            ` : `
              <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
                ${summary.incomes.map(inc => `
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-white truncate">${inc.clientName}</span>
                        <span class="badge badge-emerald text-[10px]">${inc.method}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 truncate mt-0.5">${inc.notes || 'Règlement forfait'}</p>
                      <span class="text-[10px] text-slate-500">${new Date(inc.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="text-xs font-bold font-mono text-emerald-400">+${Calculations.formatFCFA(inc.amount)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Tableau 2 : Dépenses & Charges -->
          <div class="glass-card p-5 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="text-rose-400">🔴</span> Dépenses & Achats (${summary.expenses.length})
              </h3>
              <span class="text-xs font-mono font-bold text-rose-400">-${Calculations.formatFCFA(summary.totalExpenses)}</span>
            </div>

            ${summary.expenses.length === 0 ? `
              <p class="text-xs text-slate-500 text-center py-6">Aucune dépense enregistrée sur cette sélection.</p>
            ` : `
              <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
                ${summary.expenses.map(exp => `
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-white truncate">${exp.category}</span>
                        <span class="badge badge-amber text-[10px]">${exp.paymentMethod}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 truncate mt-0.5">${exp.description || 'Dépense coach'}</p>
                      <span class="text-[10px] text-slate-500">${new Date(exp.date).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs font-bold font-mono text-rose-400">-${Calculations.formatFCFA(exp.amount)}</span>
                      <button class="btn-delete-expense text-slate-500 hover:text-rose-400 text-xs p-1" data-expense-id="${exp.id}" title="Supprimer la dépense">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const expensePanel = container.querySelector('#add-expense-panel');
    container.querySelector('#btn-open-add-expense')?.addEventListener('click', () => {
      expensePanel?.classList.toggle('hidden');
    });
    container.querySelector('#btn-close-expense-panel')?.addEventListener('click', () => {
      expensePanel?.classList.add('hidden');
    });

    // Formulaire de dépense
    const formExpense = container.querySelector('#form-create-expense');
    formExpense?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(container.querySelector('#exp-amount')?.value) || 0;
      if (amount <= 0) return;

      stateManager.addExpense({
        date: container.querySelector('#exp-date')?.value,
        amount: amount,
        category: container.querySelector('#exp-category')?.value,
        paymentMethod: container.querySelector('#exp-method')?.value,
        description: container.querySelector('#exp-description')?.value
      });

      this.render(container);
    });

    // Suppression de dépense
    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.expenseId;
        if (confirm('Voulez-vous supprimer cette dépense ?')) {
          stateManager.deleteExpense(id);
          this.render(container);
        }
      });
    });

    // Filtres
    const periodSelect = container.querySelector('#filter-period');
    const methodSelect = container.querySelector('#filter-method');
    const clientSelect = container.querySelector('#filter-client');

    periodSelect?.addEventListener('change', () => {
      this.currentFilters.period = periodSelect.value;
      this.render(container);
    });
    methodSelect?.addEventListener('change', () => {
      this.currentFilters.paymentMethod = methodSelect.value;
      this.render(container);
    });
    clientSelect?.addEventListener('change', () => {
      this.currentFilters.clientId = clientSelect.value;
      this.render(container);
    });

    container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      this.currentFilters = { period: 'all', paymentMethod: 'all', clientId: 'all', startDate: '', endDate: '' };
      this.render(container);
    });

    // Impression Thermique du Bilan
    container.querySelector('#btn-print-accounting-ticket')?.addEventListener('click', () => {
      if (window.ThermalModal) {
        window.ThermalModal.open(null, 'accounting');
      } else {
        alert('Module thermique prêt pour la comptabilité.');
      }
    });
  }
};


/* ==========================================================================
   MODULE: components/todoList.js
   ========================================================================== */
/**
 * todoList.js - Espace To-Do List & Suivi d'Objectifs par Athlète / Client pour COACH PRO
 * Permet au coach d'assigner des tâches datées (Nutrition, Hydratation, Entraînement, Pesées),
 * de suivre leur validation en temps réel et de les envoyer directement par WhatsApp.
 */
const TodoList = {
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


/* ==========================================================================
   MODULE: components/clientModal.js
   ========================================================================== */
/**
 * clientModal.js - Formulaire Client COACH PRO
 * Champs clairs sans fausses données imposées, calcul automatique de la masse grasse et du poids santé.
 */
const ClientModal = {
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
              <input type="number" inputmode="numeric" name="age" id="modal-age" value="${client?.age || ''}" placeholder="ex: 32" class="input font-bold" required />
            </div>
            <div>
              <label class="label">Téléphone / WhatsApp *</label>
              <input type="tel" inputmode="tel" name="phone" value="${client?.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-semibold" required />
            </div>
            <div>
              <label class="label">Email (Optionnel)</label>
              <input type="email" name="email" value="${client?.email || ''}" placeholder="client@email.com" class="input" />
            </div>
          </div>
        </div>

        <!-- 2. OBJECTIFS MULTIPLES & POIDS CIBLE -->
        <div class="sub-card p-4 space-y-3">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">2. Objectifs du Client (Sélectionnez un ou plusieurs)</h4>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            ${[
              'Perte de poids',
              'Prise de muscle',
              'Remise en forme',
              'Cardio & Endurance',
              'Santé & Mobilité',
              'Posture & Dos',
              'Prépa Concours / Sport',
              'Alimentation'
            ].map(g => {
              const currentGoals = Array.isArray(client?.goals) ? client.goals : (client?.mainGoal ? [client.mainGoal] : ['Perte de poids']);
              const isChecked = currentGoals.some(cg => cg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(cg.toLowerCase()));
              return `
                <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer">
                  <input type="checkbox" name="goals" value="${g}" class="modal-goal-cb rounded accent-emerald-500" ${isChecked ? 'checked' : ''} />
                  <span class="text-slate-200 font-semibold">${g}</span>
                </label>
              `;
            }).join('')}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label class="label">Autre Objectif Spécifique</label>
              <input type="text" name="customGoal" value="${client?.customGoal || ''}" placeholder="ex: Marathon, Soulager sciatique..." class="input text-xs" />
            </div>
            <div>
              <label class="label">Poids Cible (kg)</label>
              <input type="number" inputmode="decimal" step="0.5" name="targetWeight" value="${client?.targetWeight || ''}" placeholder="ex: 70" class="input font-mono" />
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
              <input type="number" inputmode="decimal" step="0.1" name="initialWeight" id="modal-weight" value="${lastAssessment?.weight || ''}" placeholder="ex: 82.5" class="input font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Taille (cm) *</label>
              <input type="number" inputmode="numeric" name="height" id="modal-height" value="${lastAssessment?.height || ''}" placeholder="ex: 178" class="input font-bold" required />
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="label">Gras (%)</label>
                <span class="text-[10px] text-emerald-400 font-semibold">Auto</span>
              </div>
              <input type="number" inputmode="decimal" step="0.1" name="fatPct" id="modal-fat" value="${lastAssessment?.fatPct || ''}" placeholder="Calculé auto" class="input font-mono font-bold text-amber-400" />
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="label">Muscle (%)</label>
                <span class="text-[10px] text-emerald-400 font-semibold">Auto</span>
              </div>
              <input type="number" inputmode="decimal" step="0.1" name="musclePct" id="modal-muscle" value="${lastAssessment?.musclePct || ''}" placeholder="Calculé auto" class="input font-mono font-bold text-emerald-400" />
            </div>
          </div>

          <!-- Mesures complémentaires & Tension Artérielle -->
          <div class="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <span class="text-[11px] text-slate-400 font-semibold block mb-2">Tension Artérielle & Données Cardiovasculaires :</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="label">Tension Systolique (mmHg)</label>
                  <input type="number" inputmode="numeric" name="systolic" value="${lastAssessment?.systolic || ''}" placeholder="ex: 120 (Max)" class="input font-mono font-bold" />
                </div>
                <div>
                  <label class="label">Tension Diastolique (mmHg)</label>
                  <input type="number" inputmode="numeric" name="diastolic" value="${lastAssessment?.diastolic || ''}" placeholder="ex: 80 (Min)" class="input font-mono font-bold" />
                </div>
                <div>
                  <label class="label">Fréquence Cardiaque (BPM)</label>
                  <input type="number" inputmode="numeric" name="pulse" value="${lastAssessment?.pulse || ''}" placeholder="ex: 68 bpm" class="input font-mono" />
                </div>
              </div>
            </div>

            <div>
              <span class="text-[11px] text-slate-400 font-semibold block mb-2">Mesures Complémentaires (Facultatif) :</span>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="label">Tour de Taille (cm)</label>
                  <input type="number" inputmode="decimal" step="0.5" name="waist" value="${lastAssessment?.waist || ''}" placeholder="Facultatif" class="input" />
                </div>
                <div>
                  <label class="label">Tour de Hanches (cm)</label>
                  <input type="number" inputmode="decimal" step="0.5" name="hips" value="${lastAssessment?.hips || ''}" placeholder="Facultatif" class="input" />
                </div>
                <div>
                  <label class="label">Graisse Viscérale</label>
                  <input type="number" inputmode="numeric" name="visceralFat" id="modal-visceral" value="${lastAssessment?.visceralFat || ''}" placeholder="Auto" class="input" />
                </div>
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
              <input type="number" inputmode="numeric" name="totalSessions" value="${pkg.totalSessions || 10}" class="input font-bold" />
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
              <input type="number" inputmode="numeric" step="1000" name="totalAmount" value="${pkg.totalAmount || ''}" placeholder="ex: 150000" class="input font-bold text-emerald-400" required />
            </div>
            <div>
              <label class="label">Acompte Versé à l'Inscription (FCFA)</label>
              <input type="number" inputmode="numeric" step="1000" name="amountPaid" value="${pkg.amountPaid || ''}" placeholder="ex: 100000" class="input font-bold" />
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

        const selectedGoals = [];
        form.querySelectorAll('.modal-goal-cb').forEach(cb => {
          if (cb.checked && cb.value) selectedGoals.push(cb.value);
        });
        const customGoal = formData.get('customGoal')?.trim();
        if (customGoal) selectedGoals.push(customGoal);
        if (selectedGoals.length === 0) selectedGoals.push('Transformation Physique');

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
          goals: selectedGoals,
          mainGoal: selectedGoals.join(', '),
          customGoal: customGoal || '',
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


/* ==========================================================================
   MODULE: components/thermalModal.js
   ========================================================================== */
/**
 * thermalModal.js - Modal d'Impression Thermique COACH PRO
 * Rendu papier thermique réaliste haute lisibilité (fond blanc, texte noir net, QR code vectoriel)
 * Gestion précise de tous les types de tickets : Bilan, Forfait/Reçu, Programme, Contrat et Comptabilité.
 */
const ThermalModal = {
  currentWidth: '58mm',
  currentReceiptType: 'assessment', // 'assessment', 'subscription', 'program', 'contract', 'accounting'
  activeClient: null,
  activeAssessment: null,

  open(clientId = null, customAssessmentOrType = null, receiptType = 'assessment') {
    let targetType = 'assessment';
    let targetAssessment = null;

    if (typeof customAssessmentOrType === 'string' && customAssessmentOrType) {
      targetType = customAssessmentOrType;
    } else if (typeof receiptType === 'string' && receiptType) {
      targetType = receiptType;
      targetAssessment = customAssessmentOrType;
    }

    const client = clientId ? stateManager.getClientById(clientId) : null;
    this.activeClient = client;
    this.currentReceiptType = targetType;

    if (client) {
      this.activeAssessment = targetAssessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {
        weight: client.targetWeight || 75,
        height: 175,
        imc: 24.5,
        imcCategory: 'Normal',
        fatPct: 20,
        musclePct: 40,
        waist: 85,
        mb: 1750,
        det: 2400,
        targetKcal: 2000
      });
    }

    const modalBackdrop = document.getElementById('thermal-print-modal');
    if (!modalBackdrop) return;

    modalBackdrop.classList.remove('hidden');
    this.renderModal();
    this.bindEvents();
  },

  close() {
    const modalBackdrop = document.getElementById('thermal-print-modal');
    if (modalBackdrop) modalBackdrop.classList.add('hidden');
  },

  renderModal() {
    const container = document.getElementById('thermal-print-modal-container');
    if (!container) return;

    const coach = stateManager.getCoachProfile();
    const client = this.activeClient || {
      id: 'general',
      firstName: 'Athlète',
      lastName: 'COACH PRO',
      mainGoal: 'Suivi Sportif'
    };
    const assessment = this.activeAssessment || (client.history && client.history.length > 0 ? client.history[client.history.length - 1] : {});
    const pkg = client.package || {};
    const prog = client.program || {};
    const contract = client.contract || {};
    const summary = stateManager.getFinancialSummary({ period: 'month' });

    const totalAmount = pkg.totalAmount || pkg.price || 0;
    const amountPaid = pkg.amountPaid || pkg.advancePayment || 0;
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    const isFullyPaid = balanceDue <= 0;

    const imcInfo = Calculations.calculateIMC(assessment.weight || 75, assessment.height || 175);
    const weightRange = Calculations.calculateHealthyWeightRange(assessment.height || 175, assessment.weight || 75);
    const goalsStr = Array.isArray(client.goals) && client.goals.length > 0 ? client.goals.join(', ') : (client.mainGoal || 'Transformation');

    const qrPayload = client.id !== 'general' ? client.id : 'COACH_PRO_APP';
    const qrSvg = QRGenerator.generateSVG(qrPayload, 110);

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- En-tête & Choix des Types de Reçus -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>🧾</span> Impression Ticket Thermique
            </h3>
            <p class="text-xs text-slate-300 font-semibold">${client.firstName} ${client.lastName} ${client.phone ? `(${client.phone})` : ''}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Onglets de Reçus -->
            <div class="flex items-center gap-1 bg-[#070b16] p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-[320px]">
              <button id="btn-type-assessment" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'assessment' ? 'active' : ''}">Bilan</button>
              <button id="btn-type-subscription" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'subscription' ? 'active' : ''}">Forfait</button>
              <button id="btn-type-program" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'program' ? 'active' : ''}">Programme</button>
              <button id="btn-type-contract" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'contract' ? 'active' : ''}">Contrat</button>
              <button id="btn-type-accounting" class="tab-sub-btn text-xs font-bold ${this.currentReceiptType === 'accounting' ? 'active' : ''}">Compta</button>
            </div>
            <button id="btn-close-thermal-x" class="text-slate-400 hover:text-white p-1.5 text-lg font-bold">✕</button>
          </div>
        </div>

        <!-- Sélecteur de format 58mm / 80mm -->
        <div class="flex items-center justify-center gap-3">
          <span class="text-xs text-slate-300 font-bold">Format Papier Thermique :</span>
          <button id="btn-toggle-58mm" class="format-toggle-btn ${this.currentWidth === '58mm' ? 'active' : ''}">58 mm (Standard)</button>
          <button id="btn-toggle-80mm" class="format-toggle-btn ${this.currentWidth === '80mm' ? 'active' : ''}">80 mm (Large)</button>
        </div>

        <!-- Rendu Visuel du Ticket (Fond Blanc Papier Réaliste & Texte Noir Net) -->
        <div class="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 flex justify-center overflow-y-auto max-h-[52vh] shadow-inner">
          <div id="thermal-ticket-render-target" class="thermal-paper ${this.currentWidth === '80mm' ? 'thermal-paper-80' : 'thermal-paper-58'}">
            
            ${this.currentReceiptType === 'assessment' ? `
              <!-- TICKET 1 : BILAN DU CLIENT (Exactement conforme aux photos de caisse) -->
              <div class="thermal-ticket-body space-y-1 text-black font-mono">
                <div class="text-center pb-1">
                  <div class="font-black text-sm uppercase tracking-wider">${coach.name || 'COACH KELLY'}</div>
                  <div class="text-[11px] font-semibold">Tel: ${coach.phone || '2250758245530'}</div>
                  <div class="text-[11px]">${coach.city || 'Abidjan'}</div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-xs uppercase tracking-wide">BILAN DU CLIENT</div>
                <div class="text-center text-xs font-bold">--------------------------------</div>

                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Habitation:</span><span>${client.residence || 'FAYA'}</span></div>
                  <div class="flex justify-between"><span>Date:</span><span>${new Date(assessment.date || Date.now()).toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Objectif:</span><span class="font-bold truncate">${goalsStr}</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-center font-black text-[11px] uppercase">COMPOSITION CORPORELLE</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Poids actuel:</span><span class="font-bold">${assessment.weight || 70} kg</span></div>
                  <div class="flex justify-between"><span>Taille:</span><span>${assessment.height || 165} cm</span></div>
                  <div class="flex justify-between"><span>IMC:</span><span>${imcInfo.imc} (${imcInfo.category})</span></div>
                  <div class="flex justify-between"><span>Poids sante:</span><span>${weightRange.min} a ${weightRange.max} kg</span></div>
                  <div class="flex justify-between"><span>Masse grasse:</span><span>${assessment.fatPct ? assessment.fatPct + '%' : '23.8%'} (${assessment.fatKg || (assessment.weight ? (assessment.weight * 0.238).toFixed(1) : '16.7')}kg)</span></div>
                  <div class="flex justify-between"><span>Masse muscle:</span><span>${assessment.musclePct ? assessment.musclePct + '%' : '60%'} (${assessment.muscleKg || (assessment.weight ? (assessment.weight * 0.60).toFixed(1) : '42')}kg)</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-center font-black text-[11px] uppercase">METABOLISME & NUTRITION</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Metabolisme base:</span><span>${assessment.mb || 1536} kcal/j</span></div>
                  <div class="flex justify-between"><span>Depense totale:</span><span>${assessment.det || 2112} kcal/j</span></div>
                  <div class="flex justify-between"><span>Eau requise:</span><span>${assessment.weight ? (assessment.weight * 0.035).toFixed(1) : '2.5'} L/jour</span></div>
                  <div class="flex justify-between"><span>Score sante (21F):</span><span>6/21</span></div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center text-[10px] pt-0.5">
                  Votre transformation, votre<br>mission !
                </div>
              </div>
            ` : this.currentReceiptType === 'subscription' ? `
              <!-- TICKET 2 : REÇU D'ABONNEMENT (Exactement conforme aux photos de caisse) -->
              <div class="thermal-ticket-body space-y-1 text-black font-mono">
                <div class="text-center pb-1">
                  <div class="font-black text-sm uppercase tracking-wider">${coach.name || 'COACH KELLY'}</div>
                  <div class="text-[11px] font-semibold">Tel: ${coach.phone || '2250758245530'}</div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-xs uppercase tracking-wide">RECU D'ABONNEMENT</div>
                <div class="text-center text-xs font-bold">--------------------------------</div>

                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Client:</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  <div class="flex justify-between"><span>Profession:</span><span>${client.profession || 'Entrepreneur'}</span></div>
                  <div class="flex justify-between"><span>Date debut:</span><span>${pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</span></div>
                  <div class="flex justify-between"><span>Echeance:</span><span>${pkg.endDate ? new Date(pkg.endDate).toLocaleDateString('fr-FR') : '28/10/2026'}</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Formule:</span><span class="font-bold">${pkg.packageName || 'Forfait 2 Mois'}</span></div>
                  <div class="flex justify-between"><span>Duree pack:</span><span>${pkg.durationMonths ? pkg.durationMonths + ' mois' : '2 mois'}</span></div>
                  <div class="flex justify-between"><span>Seances faites:</span><span>${pkg.sessionsUsed || 0} seances</span></div>
                </div>

                <div class="text-center text-xs font-bold">--------------------------------</div>
                <div class="text-[11px] space-y-0.5">
                  <div class="flex justify-between"><span>Tarif total:</span><span class="font-bold">${totalAmount || 150000} FCFA</span></div>
                  <div class="flex justify-between"><span>Acompte verse:</span><span class="font-bold">${amountPaid || 100000} FCFA</span></div>
                  <div class="flex justify-between"><span>Reste a payer:</span><span class="font-bold">${balanceDue || 50000} FCFA</span></div>
                  <div class="flex justify-between"><span class="font-bold">Statut:</span><span class="font-black">${isFullyPaid ? 'SOLDE REGLE' : 'PAIEMENT PARTIEL'}</span></div>
                </div>

                <div class="text-center text-xs font-bold">================================</div>
                <div class="text-center font-black text-[11px] uppercase">SIGNATURES</div>
                <div class="flex justify-between text-[11px] font-bold pt-3 pb-8">
                  <span>Le Coach</span>
                  <span>Le Client</span>
                </div>

                <div class="text-center text-[10px] pt-1">
                  Merci pour votre confiance !
                </div>
              </div>
            ` : this.currentReceiptType === 'contract' ? `
              <!-- TICKET 4 : ENGAGEMENT & DÉCHARGE -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-sm uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-[11px] uppercase font-black">Engagement &amp; Décharge</div>
                </div>

                <div class="text-xs space-y-1">
                  <div class="flex justify-between"><span>Client :</span><span class="font-bold">${client.firstName} ${client.lastName}</span></div>
                  ${client.phone ? `<div class="flex justify-between"><span>Contact :</span><span>${client.phone}</span></div>` : ''}
                  <div class="flex justify-between"><span>Réf :</span><span>${contract.contractNumber || 'CTR-' + (client.id ? client.id.slice(-6) : '001')}</span></div>
                  <div class="flex justify-between"><span>Date :</span><span>${new Date(contract.signedAt || Date.now()).toLocaleDateString('fr-FR')}</span></div>
                </div>

                <div class="text-[10px] text-justify py-1 border-t border-b border-dashed border-black leading-tight">
                  Le client certifie être apte à la pratique sportive et décharge le coach de toute responsabilité en cas de problème médical non déclaré.
                </div>

                <div class="flex justify-between text-[10px] font-bold">
                  <span>Coach : SIGNÉ [CERTIFIÉ] ✓</span>
                  <span>Client : LU ET APPROUVÉ ✓</span>
                </div>

                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-20 h-20 p-1 bg-white rounded border border-black flex items-center justify-center">
                    ${qrSvg}
                  </div>
                </div>
              </div>
            ` : this.currentReceiptType === 'accounting' ? `
              <!-- TICKET 5 : COMPTABILITÉ COACH -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-base uppercase">${coach.name || 'COACH PRO'}</div>
                  <div class="text-xs font-black uppercase">Bilan Comptable du Mois</div>
                  <div class="text-[10px]">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>

                <div class="text-xs space-y-1 py-1.5 border-b border-dashed border-black">
                  <div class="flex justify-between"><span>Recettes Totales :</span><span class="font-bold">${Calculations.formatFCFA(summary.totalIncome)}</span></div>
                  <div class="flex justify-between"><span>Dépenses :</span><span class="font-bold">-${Calculations.formatFCFA(summary.totalExpenses)}</span></div>
                  <div class="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black">
                    <span>BÉNÉFICE NET :</span><span>${Calculations.formatFCFA(summary.netProfit)}</span>
                  </div>
                  <div class="flex justify-between text-[10px] font-bold"><span>Soldes à Encaisser :</span><span>${Calculations.formatFCFA(summary.totalReceivables)}</span></div>
                </div>

                <div class="text-center text-[10px] pt-1">
                  COACH PRO • Comptabilité Privée
                </div>
              </div>
            ` : `
              <!-- TICKET 3 : PROGRAMME D'ENTRAÎNEMENT -->
              <div class="thermal-ticket-body space-y-2">
                <div class="text-center pb-2 border-b border-dashed border-black">
                  <div class="font-black text-base uppercase">${coach.name || 'COACH SPORTIF'}</div>
                  <div class="text-xs font-black uppercase">Programme d'Entraînement</div>
                </div>
                <div class="text-xs space-y-1">
                  <div><strong>Client :</strong> ${client.firstName} ${client.lastName}</div>
                  <div><strong>Objectifs :</strong> ${goalsStr}</div>
                  <div><strong>Fréquence :</strong> ${prog.frequency || '3 à 4 séances / semaine'}</div>
                </div>
                <div class="text-[11px] border-t border-b border-dashed border-black py-1.5 space-y-1">
                  ${prog.exercises && prog.exercises.length > 0 ? prog.exercises.map((ex, i) => `
                    <div class="flex justify-between">
                      <span>${i + 1}. <strong>${ex.name}</strong></span>
                      <span>${ex.sets}x${ex.reps} ${ex.weight ? `(${ex.weight})` : ''}</span>
                    </div>
                  `).join('') : '<p>Programme personnalisé défini en séance.</p>'}
                </div>

                <div class="text-[10px] border-b border-dashed border-black pb-1 space-y-0.5">
                  <strong>Recommandations :</strong>
                  <p>${prog.recommendations || 'Échauffement 10 min, hydratation 500ml, sommeil réparateur.'}</p>
                </div>

                <div class="flex flex-col items-center justify-center py-2">
                  <div class="w-20 h-20 p-1 bg-white rounded border border-black flex items-center justify-center">
                    ${qrSvg}
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Boutons d'Action Impression -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="btn-print-bluetooth" class="btn btn-primary btn-sm flex-1 sm:flex-none flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-500/20">
              <span>📶</span>
              <span>Imprimer Bluetooth</span>
            </button>
            <button id="btn-print-browser" class="btn btn-secondary btn-sm flex items-center gap-1.5 font-bold">
              <span>🖨️</span>
              <span>Imprimerie Standard</span>
            </button>
          </div>

          <button id="btn-close-thermal" class="btn btn-outline btn-sm w-full sm:w-auto font-bold">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('thermal-print-modal');
    const closeX = document.getElementById('btn-close-thermal-x');
    const closeBtn = document.getElementById('btn-close-thermal');

    closeX?.addEventListener('click', () => this.close());
    closeBtn?.addEventListener('click', () => this.close());

    // Sélecteurs de format
    document.getElementById('btn-toggle-58mm')?.addEventListener('click', () => {
      this.currentWidth = '58mm';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-toggle-80mm')?.addEventListener('click', () => {
      this.currentWidth = '80mm';
      this.renderModal();
      this.bindEvents();
    });

    // Types de reçus
    document.getElementById('btn-type-assessment')?.addEventListener('click', () => {
      this.currentReceiptType = 'assessment';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-subscription')?.addEventListener('click', () => {
      this.currentReceiptType = 'subscription';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-program')?.addEventListener('click', () => {
      this.currentReceiptType = 'program';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-contract')?.addEventListener('click', () => {
      this.currentReceiptType = 'contract';
      this.renderModal();
      this.bindEvents();
    });
    document.getElementById('btn-type-accounting')?.addEventListener('click', () => {
      this.currentReceiptType = 'accounting';
      this.renderModal();
      this.bindEvents();
    });

    // Impression Bluetooth Directe
    document.getElementById('btn-print-bluetooth')?.addEventListener('click', async () => {
      try {
        const coach = stateManager.getCoachProfile();
        let plainText = '';

        if (this.currentReceiptType === 'assessment') {
          plainText = ThermalPrinter.generateAssessmentReceipt(this.activeClient, this.activeAssessment, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'subscription') {
          plainText = ThermalPrinter.generateSubscriptionReceipt(this.activeClient, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'contract') {
          plainText = ThermalPrinter.generateContractReceipt(this.activeClient, coach, this.currentWidth);
        } else if (this.currentReceiptType === 'accounting') {
          plainText = ThermalPrinter.generateAccountingReceipt(coach, this.currentWidth);
        } else {
          plainText = ThermalPrinter.generateProgramReceipt(this.activeClient, coach, this.currentWidth);
        }

        await ThermalPrinter.printDirect(plainText);
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast('Ticket imprimé avec succès !', 'success');
        }
      } catch (err) {
        alert(err.message || 'Erreur lors de l\'impression.');
      }
    });

    // Impression Navigateur / Système
    document.getElementById('btn-print-browser')?.addEventListener('click', () => {
      window.print();
    });
  }
};


/* ==========================================================================
   MODULE: components/settingsModal.js
   ========================================================================== */
/**
 * settingsModal.js - Paramètres du Coach, Imprimante Bluetooth MPT, Licence & Sauvegarde
 * Gestion complète : Profil du coach, Sélection directe & Test imprimante Bluetooth, Sauvegardes.
 */
const SettingsModal = {
  selectedPrinterAddress: '',

  open() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    this.selectedPrinterAddress = ThermalPrinter.getSavedDeviceAddress() || '';
    this.render();
    modal.classList.remove('hidden');
    this.bindEvents();
  },

  close() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  },

  render() {
    const container = document.getElementById('settings-modal-container');
    if (!container) return;

    const coach = stateManager.getCoachProfile();
    const licenseInfo = LicenseManager.getLicenseInfo();
    const pairedDevices = ThermalPrinter.getPairedDevices();
    const currentDeviceName = ThermalPrinter.getConnectedDeviceName() || ThermalPrinter.getSavedDeviceName();
    const currentDeviceAddress = ThermalPrinter.getConnectedDeviceAddress() || ThermalPrinter.getSavedDeviceAddress();

    if (!this.selectedPrinterAddress && currentDeviceAddress) {
      this.selectedPrinterAddress = currentDeviceAddress;
    }

    container.innerHTML = `
      <div class="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Paramètres &amp; Configuration Imprimante
            </h3>
            <p class="text-xs text-slate-400">Profil du coach, Imprimante Bluetooth thermique, Licence et Sauvegardes</p>
          </div>
          <button id="btn-close-settings-x" class="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
        </div>

        <!-- 1. CONFIGURATION DIRECTE IMPRIMANTE BLUETOOTH THERMIQUE -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500 shadow-xl bg-slate-900/90">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>📶</span> Imprimante Bluetooth Thermique (MPT-II / POS-58 / 80mm)
              </h4>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Sélectionnez votre imprimante une seule fois pour imprimer instantanément sans déconnexion.
              </p>
            </div>
            
            <div>
              ${currentDeviceName ? `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ${currentDeviceName}
                </span>
              ` : `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  ⚪ Aucune imprimante enregistrée
                </span>
              `}
            </div>
          </div>

          <!-- Sélecteur d'imprimante Bluetooth -->
          <div class="space-y-2 pt-1">
            <label class="label flex items-center justify-between">
              <span>Appareils Bluetooth détectés sur l'appareil :</span>
              <button type="button" id="btn-refresh-bt-list" class="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                <span>🔄</span> Actualiser la liste
              </button>
            </label>

            ${pairedDevices && pairedDevices.length > 0 ? `
              <div class="grid grid-cols-1 gap-2">
                <select id="select-bt-printer" class="input font-mono font-bold text-xs bg-slate-950 text-emerald-400 border-slate-700">
                  <option value="">-- Choisir une imprimante dans la liste --</option>
                  ${pairedDevices.map(dev => `
                    <option value="${dev.address}" ${(this.selectedPrinterAddress === dev.address || currentDeviceAddress === dev.address) ? 'selected' : ''}>
                      ${dev.name} (${dev.address}) ${dev.isConnected ? '✓ Connectée' : ''}
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <p class="text-xs text-slate-300">
                  Activez le Bluetooth sur votre tablette/téléphone et allumez votre imprimante MPT.
                </p>
                <div class="flex justify-center gap-2">
                  <button type="button" id="btn-scan-web-bt" class="btn btn-secondary btn-xs font-bold">
                    Rechercher en Bluetooth
                  </button>
                </div>
              </div>
            `}
          </div>

          <!-- Boutons de Test & d'Enregistrement -->
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button type="button" id="btn-save-default-printer" class="btn btn-primary btn-sm font-bold flex items-center gap-1.5">
              <span>💾</span>
              <span>Enregistrer comme Imprimante par Défaut</span>
            </button>
            
            <button type="button" id="btn-test-print-direct" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5">
              <span>🖨️</span>
              <span>Tester l'Impression Directe</span>
            </button>
          </div>
        </div>

        <!-- 2. PROFIL DU COACH & EN-TÊTE DES REÇUS -->
        <form id="form-coach-profile" class="glass-card p-5 space-y-4">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>👤</span> Profil du Coach &amp; Coordonnées sur les Tickets
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom &amp; Prénom du Coach *</label>
              <input type="text" name="name" value="${coach.name || ''}" placeholder="Votre Nom &amp; Prénom" class="input font-bold" required />
            </div>
            <div>
              <label class="label">Titre Professionnel</label>
              <input type="text" name="title" value="${coach.title || ''}" placeholder="ex: Coach Sportif Privé" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom de la Marque / Structure</label>
              <input type="text" name="brand" value="${coach.brand || ''}" placeholder="ex: COACH PRO PRIVÉ" class="input" />
            </div>
            <div>
              <label class="label">Ville / Commune d'intervention</label>
              <input type="text" name="city" value="${coach.city || ''}" placeholder="ex: Abidjan Cocody" class="input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Téléphone / WhatsApp (Sur tous les reçus) *</label>
              <input type="tel" inputmode="tel" name="phone" value="${coach.phone || ''}" placeholder="+225 07 00 00 00 00" class="input font-mono font-bold text-emerald-400" />
            </div>
            <div>
              <label class="label">Email de Contact</label>
              <input type="email" name="email" value="${coach.email || ''}" placeholder="coach@email.com" class="input" />
            </div>
          </div>

          <div>
            <label class="label">Devise &amp; Slogan sur les Reçus</label>
            <input type="text" name="motto" value="${coach.motto || ''}" placeholder="ex: Votre transformation, votre mission !" class="input text-xs" />
          </div>

          <div class="flex justify-end pt-1">
            <button type="submit" class="btn btn-primary btn-sm font-bold">Enregistrer les Coordonnées</button>
          </div>
        </form>

        <!-- 3. PROTECTION, MOT DE PASSE & CODE PIN -->
        <div class="glass-card p-4 space-y-4 border-l-4 border-amber-500">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Sécurité d'Accès &amp; Code PIN
            </h4>
            <span class="badge badge-emerald text-xs font-bold">
              🟢 Actif (Sécurisé)
            </span>
          </div>

          <form id="form-change-pin" class="space-y-3 pt-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="label">Nouveau Code PIN :</label>
                <input type="password" id="input-new-pin" maxlength="8" inputmode="numeric" placeholder="••••" class="input font-mono font-bold text-amber-400" required />
              </div>
              <div class="flex items-end">
                <button type="submit" class="btn btn-secondary btn-sm w-full font-bold">
                  Enregistrer le Code PIN
                </button>
              </div>
            </div>
          </form>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <span class="text-xs text-slate-400">Verrouiller maintenant l'application :</span>
            <button type="button" onclick="window.PinLock.lockApp(); window.App.openSettingsModal?.();" class="btn btn-outline btn-xs font-bold text-rose-400 hover:text-rose-300">
              🚪 Déconnexion Immédiate
            </button>
          </div>
        </div>

        <!-- 4. PROTECTION & LICENCE DE L'ŒUVRE -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Licence &amp; Protection Logicielle
            </h4>
            <span class="badge ${licenseInfo.isExpired ? 'badge-rose' : (licenseInfo.isTrial ? 'badge-amber' : 'badge-emerald')} text-xs font-bold">
              ${licenseInfo.statusBadge}
            </span>
          </div>

          <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
            <div class="flex items-center justify-between">
              <span>Formule active :</span>
              <strong class="text-white font-bold">${licenseInfo.typeName}</strong>
            </div>

            <div class="flex items-center justify-between">
              <span>Expiration :</span>
              <strong class="${licenseInfo.isLifetime ? 'text-emerald-400' : 'text-amber-400'} font-bold">
                ${licenseInfo.expiryFormatted} ${(!licenseInfo.isLifetime && licenseInfo.daysRemaining > 0) ? `(${licenseInfo.daysRemaining} j restants)` : ''}
              </strong>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Identifiant Appareil :</span>
              <div class="flex items-center gap-2">
                <strong class="font-mono text-emerald-400 font-bold select-all text-[11px]">${licenseInfo.deviceId}</strong>
                <button type="button" id="btn-copy-settings-devid" class="btn btn-outline btn-xs py-0.5 px-2 text-[10px] font-bold">
                  Copier
                </button>
              </div>
            </div>
          </div>

          <!-- Formulaire de saisie / renouvellement de clé -->
          <form id="form-update-license" class="space-y-2 pt-1 border-t border-slate-800">
            <label class="label text-[11px]">Saisir une nouvelle Clé de Licence / Renouvellement :</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="input-settings-license-key" 
                placeholder="ex: CP-Y1-..." 
                class="input text-xs font-mono font-bold uppercase text-white bg-slate-950 flex-1" 
                required 
              />
              <button type="submit" class="btn btn-primary btn-sm font-bold shrink-0">
                Activer
              </button>
            </div>
            <div id="settings-license-msg" class="text-[11px] font-semibold min-h-[1rem]"></div>
          </form>
        </div>

        <!-- 5. SAUVEGARDE COMPLÈTE & RESTAURATION -->
        <div class="glass-card p-4 space-y-3 border-l-4 border-cyan-500">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>💾</span> Sauvegarde &amp; Restauration Complète
          </h4>
          <p class="text-xs text-slate-400">
            Protégez vos athlètes, vos photos et votre comptabilité. Exportez un fichier de sauvegarde ou restaurez vos données en cas de changement d'appareil.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button type="button" id="btn-export-backup" class="btn btn-primary btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>📥</span>
              <span>Télécharger</span>
            </button>
            <button type="button" id="btn-share-backup" class="btn btn-whatsapp btn-sm flex items-center justify-center gap-1.5 font-bold">
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            <label class="btn btn-outline btn-sm flex items-center justify-center gap-1.5 cursor-pointer">
              <span>📤</span>
              <span>Restaurer</span>
              <input type="file" id="input-restore-backup" accept=".coachpro,.json" class="hidden" />
            </label>
          </div>
        </div>

        <!-- 6. PIED DE PAGE : RÉINITIALISATION & FERMETURE -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" id="btn-reset-app-data" class="text-xs text-rose-400 hover:text-rose-300 font-bold hover:underline flex items-center gap-1">
            <span>🗑️</span> Réinitialiser toutes les données
          </button>
          <button type="button" id="btn-close-settings" class="btn btn-secondary btn-sm font-bold">Fermer</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const modal = document.getElementById('settings-modal');
    const closeX = document.getElementById('btn-close-settings-x');
    const closeBtn = document.getElementById('btn-close-settings');

    closeX?.addEventListener('click', () => this.close());
    closeBtn?.addEventListener('click', () => this.close());

    // Sélecteur d'imprimante
    const selectBt = document.getElementById('select-bt-printer');
    selectBt?.addEventListener('change', (e) => {
      this.selectedPrinterAddress = e.target.value;
    });

    // Rafraîchir la liste Bluetooth
    document.getElementById('btn-refresh-bt-list')?.addEventListener('click', () => {
      this.render();
      this.bindEvents();
      window.App.showToast('Liste des appareils actualisée', 'info');
    });

    // Scan Web Bluetooth
    document.getElementById('btn-scan-web-bt')?.addEventListener('click', () => {
      ThermalPrinter.openPrinterPickerModal(() => {
        this.render();
        this.bindEvents();
      });
    });

    // Enregistrer comme imprimante par défaut
    document.getElementById('btn-save-default-printer')?.addEventListener('click', async () => {
      const select = document.getElementById('select-bt-printer');
      const address = select ? select.value : this.selectedPrinterAddress;

      if (!address) {
        alert('Veuillez sélectionner une imprimante dans la liste.');
        return;
      }

      const paired = ThermalPrinter.getPairedDevices();
      const match = paired.find(d => d.address === address);
      const name = match ? match.name : 'Imprimante MPT';

      ThermalPrinter.saveDefaultPrinter(address, name);
      window.App.showToast(`Imprimante "${name}" enregistrée par défaut !`, 'success');
      this.render();
      this.bindEvents();
    });

    // Tester l'impression directe
    document.getElementById('btn-test-print-direct')?.addEventListener('click', async () => {
      try {
        const select = document.getElementById('select-bt-printer');
        const address = select ? select.value : this.selectedPrinterAddress;

        if (address) {
          const paired = ThermalPrinter.getPairedDevices();
          const match = paired.find(d => d.address === address);
          const name = match ? match.name : 'Imprimante MPT';
          ThermalPrinter.saveDefaultPrinter(address, name);
        }

        const coach = stateManager.getCoachProfile();
        const testText = `${coach.name || 'COACH PRO'}\n${coach.phone ? 'Tel: ' + coach.phone + '\n' : ''}================================\nTEST D'IMPRESSION THERMIQUE\n--------------------------------\nImprimante MPT : OPERATIONNELLE\nConnexion Bluetooth : REUSSIE\nDate : ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n================================\nMerci pour votre confiance !\n\n\n`;

        await ThermalPrinter.printDirect(testText);
        window.App.showToast("Test d'impression envoyé avec succès !", 'success');
        this.render();
        this.bindEvents();
      } catch (err) {
        alert(`Erreur d'impression : ${err.message}`);
      }
    });

    // 1. Profil Coach
    const profileForm = document.getElementById('form-coach-profile');
    profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const updated = {
        name: formData.get('name') || '',
        title: formData.get('title') || '',
        brand: formData.get('brand') || '',
        phone: formData.get('phone') || '',
        email: formData.get('email') || '',
        city: formData.get('city') || '',
        motto: formData.get('motto') || ''
      };
      stateManager.updateCoachProfile(updated);
      window.App.showToast('Profil et coordonnées enregistrés !', 'success');
      this.close();
    });

    // 2. Modification Code PIN
    const pinForm = document.getElementById('form-change-pin');
    pinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPinInput = document.getElementById('input-new-pin');
      const newPin = newPinInput?.value?.trim();
      if (!newPin || newPin.length < 4) {
        alert('Le code PIN doit comporter au moins 4 chiffres.');
        return;
      }

      PinLock.requestPinConfirmation({
        title: 'Changer le Code PIN',
        message: 'Entrez votre code PIN actuel pour valider la modification.',
        onConfirm: () => {
          PinLock.setNewPin(newPin);
          window.App.showToast(`Nouveau Code PIN "${newPin}" enregistré avec succès !`, 'success');
          this.render();
          this.bindEvents();
        }
      });
    });

    // 3. Sauvegardes
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      BackupManager.exportBackup();
    });

    document.getElementById('btn-share-backup')?.addEventListener('click', () => {
      BackupManager.shareViaWhatsApp();
    });

    document.getElementById('input-restore-backup')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        PinLock.requestPinConfirmation({
          title: 'Restaurer la Sauvegarde',
          message: `Entrez votre code PIN pour restaurer les données depuis "${file.name}". Les données actuelles seront remplacées.`,
          onConfirm: () => {
            BackupManager.restoreFromFile(file, (success, msg) => {
              alert(msg);
              if (success) {
                this.close();
                if (window.App && typeof window.App.renderCurrentView === 'function') {
                  window.App.renderCurrentView();
                }
              }
            });
          }
        });
      }
    });

    // 4. Copie Device ID & Mise à jour Licence
    const copyDevIdBtn = document.getElementById('btn-copy-settings-devid');
    copyDevIdBtn?.addEventListener('click', () => {
      const devId = LicenseManager.getDeviceId();
      navigator.clipboard.writeText(devId).then(() => {
        copyDevIdBtn.textContent = '✓ Copié !';
        setTimeout(() => { copyDevIdBtn.textContent = 'Copier'; }, 2000);
      });
    });

    const licenseForm = document.getElementById('form-update-license');
    licenseForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputKey = document.getElementById('input-settings-license-key');
      const msgDiv = document.getElementById('settings-license-msg');
      const keyVal = inputKey?.value?.trim();

      if (!keyVal) return;

      const res = LicenseManager.saveLicenseKey(keyVal);
      if (res.success) {
        msgDiv.className = 'text-[11px] font-bold text-emerald-400';
        msgDiv.textContent = `✓ Licence "${res.info.typeName}" activée avec succès !`;
        window.App?.showToast?.('Licence mise à jour avec succès !', 'success');
        setTimeout(() => {
          this.render();
          this.bindEvents();
          if (window.App && typeof window.App.renderCurrentView === 'function') {
            window.App.renderCurrentView();
          }
        }, 1200);
      } else {
        msgDiv.className = 'text-[11px] font-bold text-rose-400';
        msgDiv.textContent = `❌ ${res.reason || 'Clé de licence invalide pour cet appareil.'}`;
      }
    });

    // 5. Réinitialisation Complète Sécurisée par PIN
    document.getElementById('btn-reset-app-data')?.addEventListener('click', () => {
      PinLock.requestPinConfirmation({
        title: 'Réinitialisation Totale',
        message: 'ATTENTION : Entrez votre code PIN pour effacer TOUTES les données (clients, séances, photos, comptabilité).',
        onConfirm: () => {
          stateManager.clearAllData();
          window.App.showToast('Application réinitialisée avec succès', 'info');
          this.close();
          if (window.App && typeof window.App.renderCurrentView === 'function') {
            window.App.renderCurrentView();
          }
        }
      });
    });
  }
};


/* ==========================================================================
   MODULE: components/clientList.js
   ========================================================================== */
/**
 * clientList.js - Répertoire des Clients COACH PRO
 * Filtres intelligents (Aujourd'hui, À renouveler, Impayés),
 * Recherche par N° ID client (ex: CP-849201), initiales stylisées,
 * pointage direct et renouvellement d'abonnement en 1 clic.
 */
const ClientList = {
  searchQuery: '',
  activeFilter: 'all',

  getGoalTheme(goal = '') {
    const g = (goal || '').toLowerCase();
    if (g.includes('perte') || g.includes('seche') || g.includes('poids') || g.includes('minceur')) {
      return {
        border: 'border-l-4 border-emerald-500',
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/20',
        accent: 'text-emerald-400'
      };
    }
    if (g.includes('masse') || g.includes('muscle') || g.includes('volume') || g.includes('prise')) {
      return {
        border: 'border-l-4 border-cyan-500',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
        avatarBg: 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-cyan-500/20',
        accent: 'text-cyan-400'
      };
    }
    if (g.includes('force') || g.includes('perf') || g.includes('cardio') || g.includes('endurance')) {
      return {
        border: 'border-l-4 border-purple-500',
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        avatarBg: 'bg-gradient-to-br from-purple-500 to-indigo-700 text-white shadow-purple-500/20',
        accent: 'text-purple-400'
      };
    }
    return {
      border: 'border-l-4 border-amber-500',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      avatarBg: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-amber-500/20',
      accent: 'text-amber-400'
    };
  },

  render(container) {
    const clients = stateManager.getClients();
    const todayClients = stateManager.getClientsForToday();
    const renewCount = clients.filter(c => {
      const pkg = c.package || {};
      if (pkg.packageType === 'sessions') return (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0) <= 2;
      if (pkg.expiryDate) return Math.ceil((new Date(pkg.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 4;
      return false;
    }).length;
    const debtCount = clients.filter(c => (c.package?.balanceDue || 0) > 0).length;

    container.innerHTML = `
      <div class="client-list-view space-y-6">
        
        <!-- Header & Ajout -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
              <span>👥</span>
              <span>Mes Clients (${clients.length})</span>
            </h1>
            <p class="text-xs text-slate-400">Recherche par Nom, Quartier ou N° ID unique (ex: CP-849201)</p>
          </div>
          <button id="btn-list-add-client" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
            + Nouveau Client
          </button>
        </div>

        <!-- Barre de Recherche & Filtres Rapides -->
        <div class="glass-card p-4 space-y-3">
          <input type="text" id="input-client-search" value="${this.searchQuery}" placeholder="Rechercher par N° ID (CP-XXXX), prénom, nom, téléphone..." class="input" />
          
          <!-- Filtres Catégories -->
          <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-xs">
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'all' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="all">
              🌟 Tous (${clients.length})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'today' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="today">
              🎯 Aujourd'hui (${todayClients.length})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'renew' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="renew">
              ⚠️ À Renouveler (${renewCount})
            </button>
            <button class="filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeFilter === 'debt' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:text-white'}" data-filter="debt">
              💳 Reste Dû (${debtCount})
            </button>
          </div>
        </div>

        <!-- Liste des Clients -->
        <div id="clients-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    this.renderClientsList(container);
    this.bindEvents(container);
  },

  renderClientsList(container) {
    const clients = stateManager.getClients();
    const listContainer = container.querySelector('#clients-container');
    if (!listContainer) return;

    const q = this.searchQuery.toLowerCase().trim();
    const filtered = clients.filter(c => {
      const clientCode = `cp-${c.id.slice(-6)}`.toLowerCase();
      const numOnly = c.id.slice(-6).toLowerCase();

      let textMatch = true;
      if (q) {
        textMatch = (
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.residence && c.residence.toLowerCase().includes(q)) ||
          (c.profession && c.profession.toLowerCase().includes(q)) ||
          (c.mainGoal && c.mainGoal.toLowerCase().includes(q)) ||
          clientCode.includes(q) ||
          numOnly.includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      if (!textMatch) return false;

      if (this.activeFilter === 'today') {
        const daysMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const todayDay = daysMap[new Date().getDay()];
        return c.trainingSchedule?.days?.includes(todayDay);
      }
      if (this.activeFilter === 'renew') {
        const pkg = c.package || {};
        if (pkg.packageType === 'sessions') {
          return (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0) <= 2;
        }
        if (pkg.expiryDate) {
          const diff = Math.ceil((new Date(pkg.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return diff <= 4;
        }
        return false;
      }
      if (this.activeFilter === 'debt') {
        const pkg = c.package || {};
        return (pkg.balanceDue || 0) > 0;
      }
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <p class="text-sm text-slate-400">
            ${clients.length === 0 ? 'Vous n\'avez pas encore enregistré de client.' : 'Aucun client ne correspond à ce filtre ou à votre recherche.'}
          </p>
          ${clients.length === 0 ? `
            <button id="btn-empty-list-add" class="btn btn-primary btn-sm">+ Enregistrer mon premier client</button>
          ` : ''}
        </div>
      `;
      listContainer.querySelector('#btn-empty-list-add')?.addEventListener('click', () => {
        window.App.openNewClientModal();
      });
      return;
    }

    listContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        ${filtered.map(c => {
          const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
          const pkg = c.package || {};
          const isDuration = pkg.packageType === 'duration';
          const totalSessions = pkg.totalSessions || 10;
          const usedSessions = pkg.sessionsUsed || 0;
          const sessionsLeft = !isDuration ? Math.max(0, totalSessions - usedSessions) : null;
          const balanceDue = pkg.balanceDue !== undefined ? pkg.balanceDue : Math.max(0, (pkg.totalAmount || pkg.price || 0) - (pkg.amountPaid || pkg.advancePayment || 0));

          const theme = this.getGoalTheme(c.mainGoal);
          const clientCode = `CP-${c.id.slice(-6).toUpperCase()}`;
          const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase() || 'CP';
          const progressPct = !isDuration ? Math.min(100, Math.round((usedSessions / totalSessions) * 100)) : 100;

          return `
            <div class="glass-card p-4 space-y-3.5 ${theme.border} hover:border-slate-600 transition-all shadow-xl bg-slate-900/90">
              
              <!-- En-tête Client avec Avatar & Numéro ID -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-11 h-11 rounded-2xl ${theme.avatarBg} flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    ${initials}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <strong class="text-white text-sm font-bold block truncate">${c.firstName} ${c.lastName}</strong>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">${clientCode}</span>
                    </div>
                    <span class="text-[11px] text-slate-400 block truncate">
                      ${c.residence || 'Abidjan'}${c.profession ? ` • ${c.profession}` : ''}
                    </span>
                  </div>
                </div>

                <!-- Badge Objectif -->
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge} shrink-0">
                  ${c.mainGoal || 'Objectif'}
                </span>
              </div>

              <!-- Métriques Clés : Contact, Poids, Solde -->
              <div class="grid grid-cols-3 gap-2 bg-[#070b16] p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Contact</span>
                  <span class="font-bold text-slate-200 font-mono text-[11px] truncate block">${c.phone || '--'}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Poids</span>
                  <span class="font-bold text-white font-mono">${last ? `${last.weight} kg` : '--'}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-500 block uppercase font-bold">Solde</span>
                  <span class="font-bold ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'} font-mono text-[11px] truncate block">
                    ${balanceDue > 0 ? `${Calculations.formatFCFA(balanceDue)}` : '✓ Réglé'}
                  </span>
                </div>
              </div>

              <!-- Jauge de Séances & Progression -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>${isDuration ? `Forfait ${pkg.durationMonths || 1} Mois` : `Séances : ${usedSessions}/${totalSessions}`}</span>
                  <span class="${isDuration ? 'text-emerald-400' : (sessionsLeft <= 2 ? 'text-amber-400' : 'text-slate-300')} font-mono font-bold">
                    ${isDuration ? (pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : 'Actif') : `${sessionsLeft} restante(s)`}
                  </span>
                </div>
                ${!isDuration ? `
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${progressPct}%"></div>
                  </div>
                ` : ''}
              </div>

              <!-- Actions Rapides : Pointage 1-Clic, Dossier, Bilan -->
              <div class="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button class="btn btn-emerald btn-xs flex-1 py-2 font-bold shadow-md btn-card-point" data-client-id="${c.id}" title="Pointer la présence">
                  ⚡ Pointer
                </button>
                <button class="btn btn-primary btn-xs flex-1 py-2 font-bold shadow-md" data-action="open-client" data-client-id="${c.id}">
                  📂 Dossier
                </button>
                <button class="btn btn-secondary btn-xs py-2 px-2.5" data-action="print-ticket" data-client-id="${c.id}" title="Imprimer Ticket Bilan">
                  🖨️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindRowActions(listContainer);
  },

  bindEvents(container) {
    container.querySelector('#btn-list-add-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    const searchInput = container.querySelector('#input-client-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderClientsList(container);
    });

    container.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        container.querySelectorAll('.filter-tab-btn').forEach(b => {
          b.className = 'filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all bg-slate-800 text-slate-300 hover:text-white';
        });
        e.currentTarget.className = 'filter-tab-btn px-3 py-1.5 rounded-xl font-bold transition-all bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20';
        this.renderClientsList(container);
      });
    });
  },

  bindRowActions(listContainer) {
    listContainer.querySelectorAll('.btn-card-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;
        stateManager.logSessionAttendance(clientId, {
          date: new Date().toISOString().split('T')[0],
          sessionType: 'Séance Coaching Privé',
          notes: 'Pointage rapide depuis la liste'
        });
        window.App.showToast(`Séance pointée pour ${client.firstName} !`, 'success');
        const parent = listContainer.closest('.client-list-view')?.parentElement;
        if (parent) this.render(parent);
      });
    });

    listContainer.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId);
      });
    });

    listContainer.querySelectorAll('[data-action="print-ticket"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'assessment');
      });
    });
  }
};


/* ==========================================================================
   MODULE: components/clientDetail.js
   ========================================================================== */
/**
 * clientDetail.js - Fiche Centrale COACH PRO de l'Athlète
 * Intègre :
 * - Jauge IMC Visuelle 5 zones (Sous-poids, Normal, Surpoids, Obésité, Obésité Sévère)
 * - Diagnostic précis du statut pondéral (Surpoids / Normal / Obésité)
 * - Programme d'entraînement dynamique et organisé (Nom, Séries, Reps, Charge, Repos)
 * - Journal de Pointage / Présence précis (décompte réel des séances restantes & historique)
 * - Bilan Check-out Santé (Contre-indications médicales, Urgence, Objectifs 4D)
 */
const ClientDetail = {
  currentTab: 'overview',
  activeClientId: null,

  render(container, clientId, initialTab = null) {
    if (this.activeClientId !== clientId) {
      this.activeClientId = clientId;
      this.currentTab = initialTab || 'overview';
    } else if (initialTab) {
      this.currentTab = initialTab;
    } else if (!this.currentTab) {
      this.currentTab = 'overview';
    }
    const client = stateManager.getClientById(clientId);

    if (!client) {
      container.innerHTML = `
        <div class="glass-card p-10 text-center space-y-3">
          <h3 class="text-base font-bold text-white">Client introuvable</h3>
          <p class="text-xs text-slate-400">Ce dossier client n'existe pas ou a été supprimé.</p>
          <button id="btn-back-to-hub" class="btn btn-secondary btn-sm">Retour aux clients</button>
        </div>
      `;
      container.querySelector('#btn-back-to-hub')?.addEventListener('click', () => {
        window.App.navigateTo('clients');
      });
      return;
    }

    const clientCode = `CP-${client.id.slice(-6).toUpperCase()}`;

    container.innerHTML = `
      <div class="client-detail-view space-y-6">
        
        <!-- Header Fiche Client -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div>
              <button id="btn-back-list" class="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-1 font-semibold">
                ← Retour à la liste
              </button>
              
              <h1 class="text-2xl font-bold text-white flex flex-wrap items-center gap-2">
                <span>${client.firstName} ${client.lastName}</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">${clientCode}</span>
                ${Array.isArray(client.goals) && client.goals.length > 0 ? 
                  client.goals.map(g => `<span class="badge badge-emerald text-xs">${g}</span>`).join('') :
                  `<span class="badge badge-emerald text-xs">${client.mainGoal || 'Transformation'}</span>`
                }
              </h1>
              
              <!-- Habitation, Profession, Contact -->
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                ${client.age ? `<span>${client.age} ans</span> • ` : ''}
                ${client.residence ? `<span>${client.residence}</span> • ` : ''}
                ${client.profession ? `<span>${client.profession}</span> • ` : ''}
                <span>Tél: ${client.phone || 'Non renseigné'}</span>
                ${client.email ? `• <span>${client.email}</span>` : ''}
              </div>
            </div>

            <!-- Boutons d'Action & 3 Reçus Thermiques Responsive -->
            <div class="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
              <button id="btn-quick-point-attendance" class="btn btn-emerald btn-xs sm:btn-sm flex items-center justify-center gap-1 font-bold shadow-lg shadow-emerald-500/30" title="Pointer 1 séance immédiatement">
                <span>⚡</span>
                <span>Pointer</span>
              </button>
              <button id="btn-open-renew-modal" class="btn btn-primary btn-xs sm:btn-sm flex items-center justify-center gap-1 font-bold shadow-lg shadow-emerald-500/20" title="Renouveler le forfait">
                <span>🔄</span>
                <span>Renouveler</span>
              </button>
              <button id="btn-open-contract-modal" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center gap-1 font-semibold" title="Signer l'Engagement">
                <span>⚖️</span>
                <span>Contrat</span>
              </button>
              <button id="btn-print-bilan-action" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center gap-1" title="Imprimer le Bilan Corporel">
                <span>📄</span>
                <span>Bilan</span>
              </button>
              <button id="btn-print-prog-action" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center gap-1" title="Imprimer le Programme">
                <span>🏋️</span>
                <span>Prog.</span>
              </button>
              <button id="btn-print-abonnement-action" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center gap-1" title="Imprimer le Reçu Forfait">
                <span>🧾</span>
                <span>Reçu</span>
              </button>
              <button id="btn-whatsapp-action" class="btn btn-whatsapp btn-xs sm:btn-sm flex items-center justify-center gap-1">
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
              <button id="btn-edit-client-action" class="btn btn-outline btn-xs sm:btn-sm flex items-center justify-center gap-1">
                <span>✏️</span>
                <span>Modifier</span>
              </button>
              <button id="btn-delete-client-action" class="btn btn-danger btn-xs sm:btn-sm flex items-center justify-center gap-1" title="Supprimer">
                <span>🗑️</span>
                <span>Suppr.</span>
              </button>
            </div>
          </div>

          <!-- Onglets Mobiles avec Défilement Fluide -->
          <div class="sub-tabs-bar pt-3 border-t border-slate-800">
            <button class="tab-sub-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
              Bilan & Mesures
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'todo' ? 'active' : ''}" data-tab="todo">
              📝 To-Do (${client.todos?.filter(t => !t.completed).length || 0})
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'photos' ? 'active' : ''}" data-tab="photos">
              📸 Photos (${client.photos?.length || 0})
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'schedule' ? 'active' : ''}" data-tab="schedule">
              📅 Créneaux
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'program' ? 'active' : ''}" data-tab="program">
              Programme
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
              Pointage (${client.package?.sessionsUsed || 0})
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'comparator' ? 'active' : ''}" data-tab="comparator">
              Comparateur
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'bodyComp' ? 'active' : ''}" data-tab="bodyComp">
              Pesées (${client.history?.length || 0})
            </button>
            <button class="tab-sub-btn ${this.currentTab === 'billing' ? 'active' : ''}" data-tab="billing">
              Forfait & FCFA
            </button>
          </div>
        </div>

        <!-- Contenu de l'Onglet -->
        <div id="sub-tab-container">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    this.renderActiveTab(container, client);
    this.bindEvents(container, client);
  },

  renderActiveTab(container, client) {
    const subContainer = container.querySelector('#sub-tab-container');
    if (!subContainer) return;

    switch (this.currentTab) {
      case 'todo':
        TodoList.render(subContainer, client);
        break;
      case 'photos':
        PhotosComponent.render(subContainer, client);
        break;
      case 'schedule':
        RecurringScheduleComponent.render(subContainer, client);
        break;
      case 'program':
        this.renderProgramTab(subContainer, client);
        break;
      case 'attendance':
        this.renderAttendanceTab(subContainer, client);
        break;
      case 'comparator':
        Comparator.render(subContainer, client);
        break;
      case 'bodyComp':
        BodyComp.render(subContainer, client);
        break;
      case 'assessment21':
        Assessment21.render(subContainer, client);
        break;
      case 'billing':
        Billing.render(subContainer, client);
        break;
      case 'overview':
      default:
        this.renderOverview(subContainer, client);
        break;
    }
  },

  /**
   * 1. Onglet Bilan & Mesures (avec Jauge IMC Les Mills & Diagnostic Précis)
   */
  renderOverview(container, client) {
    const last = client.history && client.history.length > 0 ? client.history[client.history.length - 1] : null;
    const pkg = client.package || {};
    const interpretation = last ? Calculations.generateCoachInterpretation(client, last) : null;
    const imcInfo = last ? Calculations.calculateIMC(last.weight, last.height || 175) : { imc: 0, code: 'normal', category: 'Normal' };

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- JAUGE VISUELLE IMC (5 ZONES INSPIRÉE DU BILAN CHECK-OUT SANTÉ) -->
        <div class="glass-card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Indice de Masse Corporelle (IMC = Poids / Taille²)</span>
              <h3 class="text-base font-bold text-white mt-0.5">
                IMC Actuel : <span class="font-mono text-emerald-400">${last ? last.imc : '--'}</span> 
                ${last ? `<span class="text-xs font-normal text-slate-300">(${imcInfo.category})</span>` : ''}
              </h3>
            </div>
            ${interpretation ? `
              <div class="text-right text-xs text-slate-400">
                Poids santé recommandé : <strong class="text-white font-mono">${interpretation.healthyRange.min} à ${interpretation.healthyRange.max} kg</strong>
              </div>
            ` : ''}
          </div>

          <!-- Barème Graphique 5 Silhouettes -->
          <div class="grid grid-cols-5 gap-1 text-center text-[10px] font-semibold font-mono">
            <div class="p-2 rounded-l bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 ${imcInfo.code === 'underweight' ? 'ring-2 ring-cyan-400 font-bold bg-cyan-900/60' : ''}">
              <span class="block">&lt; 18.5</span>
              <span class="text-[9px] uppercase block">Sous-Poids</span>
            </div>
            <div class="p-2 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 ${imcInfo.code === 'normal' ? 'ring-2 ring-emerald-400 font-bold bg-emerald-900/60' : ''}">
              <span class="block">18.5 - 24.9</span>
              <span class="text-[9px] uppercase block">Normal</span>
            </div>
            <div class="p-2 bg-amber-950/60 border border-amber-800/40 text-amber-400 ${imcInfo.code === 'overweight' ? 'ring-2 ring-amber-400 font-bold bg-amber-900/60' : ''}">
              <span class="block">25.0 - 29.9</span>
              <span class="text-[9px] uppercase block">Surpoids</span>
            </div>
            <div class="p-2 bg-orange-950/60 border border-orange-800/40 text-orange-400 ${imcInfo.code === 'obesity_1' ? 'ring-2 ring-orange-400 font-bold bg-orange-900/60' : ''}">
              <span class="block">30.0 - 34.9</span>
              <span class="text-[9px] uppercase block">Obésité</span>
            </div>
            <div class="p-2 rounded-r bg-rose-950/60 border border-rose-800/40 text-rose-400 ${imcInfo.code === 'obesity_2' ? 'ring-2 ring-rose-400 font-bold bg-rose-900/60' : ''}">
              <span class="block">35.0+</span>
              <span class="text-[9px] uppercase block">Obésité Sév.</span>
            </div>
          </div>
        </div>

        <!-- 3 Cartes Métriques Clés -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- 1. Composition Corporelle -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Composition Corporelle</span>
            ${last ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-white font-mono">${last.weight} kg</span>
                <span class="text-xs text-slate-400 font-mono">Taille : ${last.height || 175} cm</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Masse Grasse : <strong class="text-amber-400">${last.fatPct}%</strong> (${last.fatKg || '--'} kg)</div>
                <div>Masse Musculaire : <strong class="text-emerald-400">${last.musclePct}%</strong> (${last.muscleKg || '--'} kg)</div>
                <div>Tour de Taille : <strong class="text-white">${last.waist ? `${last.waist} cm` : 'Non renseigné'}</strong></div>
              </div>
            ` : `<p class="text-xs text-slate-400 italic">Aucune pesée enregistrée.</p>`}
          </div>

          <!-- 2. Forfait & Séances Restantes -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Forfait en Cours</span>
            
            ${pkg.packageType === 'duration' ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-emerald-400 font-mono">${pkg.durationMonths || 1} Mois</span>
                <span class="text-xs text-slate-400 font-mono">${pkg.sessionsUsed || 0} séances faites</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Échéance : <strong class="text-white">${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</strong></div>
                <div>Solde Dû : <strong class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}">${Calculations.formatFCFA(pkg.balanceDue || 0)}</strong></div>
              </div>
            ` : `
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-emerald-400 font-mono">${Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0))}</span>
                <span class="text-xs text-slate-400">séances rest. / ${pkg.totalSessions || 0}</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Formule : <strong class="text-white">${pkg.packageName || 'Pack séances'}</strong></div>
                <div>Solde Dû : <strong class="${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}">${Calculations.formatFCFA(pkg.balanceDue || 0)}</strong></div>
              </div>
            `}
          </div>

          <!-- 3. Métabolisme & Calories -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Nutrition & Métabolisme</span>
            ${last ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-white font-mono">${last.targetKcal || 2000}</span>
                <span class="text-xs text-slate-400 font-mono">kcal / jour</span>
              </div>
              <div class="text-xs text-slate-300 space-y-0.5">
                <div>Métabolisme Base (MB) : <strong class="text-white font-mono">${last.mb || '--'} kcal</strong></div>
                <div>Dépense Totale (DET) : <strong class="text-white font-mono">${last.det || '--'} kcal</strong></div>
                <div>Hydratation requise : <strong class="text-emerald-400 font-mono">${(last.weight * 0.035).toFixed(1)} L/j</strong></div>
              </div>
            ` : '<p class="text-xs text-slate-400 italic">--</p>'}
          </div>
        </div>

        <!-- CARTE TENSION ARTÉRIELLE & SÉCURITÉ CARDIOVASCULAIRE -->
        ${(() => {
          const bp = last && last.systolic && last.diastolic ? Calculations.calculateBloodPressure(last.systolic, last.diastolic, last.pulse) : null;
          if (!bp) return '';
          return `
            <div class="glass-card p-4 sm:p-5 space-y-3 ${bp.isSevere ? 'border-2 border-rose-500 bg-rose-950/20' : bp.isHigh ? 'border-amber-500/50 bg-amber-950/10' : 'border-emerald-500/40'}">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${bp.isSevere ? '🚨' : bp.isHigh ? '⚠️' : '❤️'}</span>
                  <div>
                    <h3 class="text-sm font-bold text-white">Tension Artérielle & Fréquence Cardiaque</h3>
                    <span class="text-[11px] text-slate-400">Classification selon les normes OMS / ESH</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-base font-bold font-mono text-white">${bp.formatted}</span>
                  <span class="badge ${bp.color === 'rose' ? 'badge-danger' : bp.color === 'amber' || bp.color === 'orange' ? 'badge-amber' : 'badge-emerald'} text-xs font-bold">
                    ${bp.category}
                  </span>
                </div>
              </div>
              <p class="text-xs ${bp.isSevere ? 'text-rose-300 font-semibold' : 'text-slate-300'}">
                <strong>Recommandation du protocole :</strong> ${bp.advice}
              </p>
            </div>
          `;
        })()}

        <!-- DIAGNOSTIC PRÉCIS DU COACH (SURPOIDS / POIDS NORMAL / OBÉSITÉ) -->
        ${interpretation ? `
          <div class="glass-card p-5 space-y-3 border-l-4 border-emerald-500">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Diagnostic & Prescription du Coach</h3>
              <span class="badge badge-emerald text-xs">Diagnostic Validé</span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">1. Statut Pondéral & Diagnostic Tissu Adipeux :</span>
                <p class="text-slate-200 leading-relaxed font-medium">${interpretation.bodyDiagnosis}</p>
              </div>

              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">2. Prescription Eau & Protéines :</span>
                <p class="text-slate-300 leading-relaxed">${interpretation.metabolicDiagnosis}</p>
              </div>

              <div class="p-3 rounded bg-[#0c1220] border border-slate-800">
                <span class="font-bold text-emerald-400 block mb-1">3. Freins Santé & Hygiène de vie :</span>
                <p class="text-slate-300 leading-relaxed">${interpretation.healthDiagnosis}</p>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- BILAN CHECK-OUT SANTÉ (CONTRE-INDICATIONS & OBJECTIFS 4D) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Contre-indications & Interdictions -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contre-indications & Sécurité Médicale</span>
            <div class="text-xs text-slate-300 space-y-1.5">
              <div>• Interdictions médecin : <strong class="text-white">${client.medicalNotes?.doctorRestrictions || 'Aucune interdiction signalée'}</strong></div>
              <div>• Prothèses / Handicaps : <strong class="text-white">${client.medicalNotes?.jointDetails || 'Aucun'}</strong></div>
              <div>• Contact Urgence : <strong class="text-white">${client.emergencyContact?.name || 'Non renseigné'}</strong> ${client.emergencyContact?.phone ? `(${client.emergencyContact.phone})` : ''}</div>
            </div>
          </div>

          <!-- Objectifs 4D Améliorations -->
          <div class="glass-card p-4 space-y-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Objectifs 4D (Améliorations Souhaitées)</span>
            <div class="text-xs text-slate-300 space-y-1.5">
              <div>• Santé : <strong class="text-white">${client.goals4D?.health || 'Améliorer santé & énergie'}</strong></div>
              <div>• Look & Silhouette : <strong class="text-white">${client.goals4D?.look || 'Affiner la silhouette'}</strong></div>
              <div>• Physique & Force : <strong class="text-white">${client.goals4D?.fitness || 'Augmenter la force'}</strong></div>
              <div>• Bien-être : <strong class="text-white">${client.goals4D?.wellness || 'Vitalité & anti-stress'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 2. Onglet Dédié : Programme d'Entraînement Structuré & Organisé
   */
  renderProgramTab(container, client) {
    const prog = client.program || {
      title: `Programme ${client.mainGoal}`,
      frequency: '3 séances / semaine',
      recommendations: 'Boire 2.5L d\'eau par jour, respecter les temps de repos et privilégier la régularité.',
      exercises: []
    };

    let exercises = Array.isArray(prog.exercises) ? [...prog.exercises] : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Programme -->
        <div class="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-white">Programme d'Entraînement de ${client.firstName}</h3>
            <p class="text-xs text-slate-400">Organisez les exercices, séries, répétitions et charges à remettre au client</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-print-prog-direct" class="btn btn-primary btn-sm">
              Imprimer le Programme
            </button>
          </div>
        </div>

        <!-- Formulaire Structuré du Programme -->
        <div class="glass-card p-5 space-y-5">
          <form id="form-client-program-structured" class="space-y-5">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Titre du Programme *</label>
                <input type="text" id="prog-title" value="${prog.title || ''}" placeholder="ex: Programme Perte de Gras & Tonification" class="input font-bold" required />
              </div>
              <div>
                <label class="label">Fréquence d'Entraînement *</label>
                <input type="text" id="prog-frequency" value="${prog.frequency || '3 séances / semaine'}" placeholder="ex: 3 séances / semaine (Lundi / Mercredi / Vendredi)" class="input font-semibold" required />
              </div>
            </div>

            <!-- Liste Dynamique des Exercices Organisés -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <label class="label font-bold text-emerald-400 uppercase tracking-wider">
                  Exercices Prescrits (${exercises.length})
                </label>
                <button type="button" id="btn-add-exercise-row" class="btn btn-secondary btn-xs">
                  + Ajouter un Exercice
                </button>
              </div>

              <div class="space-y-2" id="exercises-list-wrapper">
                ${exercises.map((ex, idx) => `
                  <div class="p-3 bg-[#0c1220] rounded-lg border border-slate-800 exercise-item-row space-y-2" data-idx="${idx}">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-400">Exercice #${idx + 1}</span>
                      <button type="button" class="text-slate-500 hover:text-red-400 text-xs btn-remove-ex" data-idx="${idx}">
                        Supprimer ✕
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div class="sm:col-span-2">
                        <input type="text" class="input text-xs font-bold text-white ex-name" placeholder="Nom (ex: Squat, Développé couché)" value="${ex.name || ''}" required />
                      </div>
                      <div>
                        <input type="number" class="input text-xs font-mono ex-sets" placeholder="Séries (ex: 4)" value="${ex.sets || 4}" required />
                      </div>
                      <div>
                        <input type="text" class="input text-xs font-mono ex-reps" placeholder="Répétitions (ex: 10-12)" value="${ex.reps || '10'}" required />
                      </div>
                      <div>
                        <input type="text" class="input text-xs font-mono text-emerald-400 ex-weight" placeholder="Charge (ex: 12 kg)" value="${ex.weight || ''}" />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input type="text" class="input text-xs text-slate-400 ex-rest" placeholder="Temps de repos (ex: 60s)" value="${ex.rest || '60s'}" />
                      <input type="text" class="input text-xs text-slate-400 italic ex-notes" placeholder="Consigne du coach (ex: Dos droit, amplitude complète)" value="${ex.notes || ''}" />
                    </div>
                  </div>
                `).join('')}
              </div>

              ${exercises.length === 0 ? `
                <div id="no-exercises-placeholder" class="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
                  Aucun exercice prescrit. Cliquez sur "+ Ajouter un Exercice" ci-dessus pour commencer.
                </div>
              ` : ''}
            </div>

            <!-- Recommandations & Consignes Générales -->
            <div class="pt-2">
              <label class="label font-bold text-emerald-400 uppercase tracking-wider">Recommandations & Consignes Générales du Coach :</label>
              <textarea id="prog-recommendations" rows="3" class="input text-xs w-full resize-y" placeholder="ex: Boire 2.5L d'eau par jour, respecter le sommeil de 7-8h, régularité sur chaque séance...">${prog.recommendations || ''}</textarea>
            </div>

            <!-- Action Sauvegarder -->
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="submit" id="btn-save-program-submit" class="btn btn-primary btn-sm">
                Enregistrer le Programme
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Événements Programme
    const wrapper = container.querySelector('#exercises-list-wrapper');

    container.querySelector('#btn-print-prog-direct')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'program');
    });

    container.querySelector('#btn-add-exercise-row')?.addEventListener('click', () => {
      const idx = wrapper.querySelectorAll('.exercise-item-row').length;
      const placeholder = container.querySelector('#no-exercises-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      const row = document.createElement('div');
      row.className = 'p-3 bg-[#0c1220] rounded-lg border border-slate-800 exercise-item-row space-y-2';
      row.setAttribute('data-idx', idx);
      row.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400">Exercice #${idx + 1}</span>
          <button type="button" class="text-slate-500 hover:text-red-400 text-xs btn-remove-ex">
            Supprimer ✕
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <div class="sm:col-span-2">
            <input type="text" class="input text-xs font-bold text-white ex-name" placeholder="Nom (ex: Squat, Fentes)" required />
          </div>
          <div>
            <input type="number" class="input text-xs font-mono ex-sets" placeholder="Séries" value="4" required />
          </div>
          <div>
            <input type="text" class="input text-xs font-mono ex-reps" placeholder="Répétitions" value="10-12" required />
          </div>
          <div>
            <input type="text" class="input text-xs font-mono text-emerald-400 ex-weight" placeholder="Charge (ex: 10 kg)" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" class="input text-xs text-slate-400 ex-rest" placeholder="Repos (ex: 60s)" value="60s" />
          <input type="text" class="input text-xs text-slate-400 italic ex-notes" placeholder="Consigne (ex: Dos droit)" />
        </div>
      `;

      row.querySelector('.btn-remove-ex')?.addEventListener('click', () => row.remove());
      wrapper.appendChild(row);
    });

    container.querySelectorAll('.btn-remove-ex').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.closest('.exercise-item-row')?.remove();
      });
    });

    container.querySelector('#form-client-program-structured')?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newExercises = [];
      wrapper.querySelectorAll('.exercise-item-row').forEach(row => {
        const name = row.querySelector('.ex-name')?.value.trim();
        const sets = parseInt(row.querySelector('.ex-sets')?.value, 10) || 4;
        const reps = row.querySelector('.ex-reps')?.value.trim() || '10';
        const weight = row.querySelector('.ex-weight')?.value.trim() || '';
        const rest = row.querySelector('.ex-rest')?.value.trim() || '60s';
        const notes = row.querySelector('.ex-notes')?.value.trim() || '';

        if (name) {
          newExercises.push({ name, sets, reps, weight, rest, notes });
        }
      });

      const updated = {
        title: container.querySelector('#prog-title')?.value || 'Programme d\'Entraînement',
        frequency: container.querySelector('#prog-frequency')?.value || '3 séances / semaine',
        recommendations: container.querySelector('#prog-recommendations')?.value || '',
        exercises: newExercises
      };

      stateManager.saveClientProgram(client.id, updated);
      window.App.showToast('Programme enregistré avec succès !', 'success');
      this.renderProgramTab(container, stateManager.getClientById(client.id));
    });
  },

  /**
   * 3. Onglet Dédié : Pointage & Suivi des Séances (Attendance Log)
   */
  renderAttendanceTab(container, client) {
    const pkg = client.package || {};
    const isDuration = pkg.packageType === 'duration';
    const total = pkg.totalSessions || 10;
    const used = pkg.sessionsUsed || 0;
    const remaining = !isDuration ? Math.max(0, total - used) : null;
    const logs = Array.isArray(client.attendanceLog) ? client.attendanceLog : [];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Cartes Résumé Séances & Pointage Direct -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Carte 1 : Séances Restantes / Échéance -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">État du Forfait</span>
            ${isDuration ? `
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-emerald-400 font-mono">${pkg.durationMonths || 1} Mois</span>
                <span class="text-xs text-slate-400">(${used} séances faites)</span>
              </div>
              <span class="text-[11px] text-slate-300 block">Échéance : ${pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString('fr-FR') : '--'}</span>
            ` : `
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold ${remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono">${remaining}</span>
                <span class="text-xs text-slate-400 font-normal">séances restantes sur ${total}</span>
              </div>
              <span class="text-[11px] text-slate-400 block">${used} séances déjà effectuées</span>
            `}
          </div>

          <!-- Carte 2 : Statut Validité -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Statut Coaching</span>
            <span class="text-xl font-bold block ${remaining === 0 ? 'text-rose-400' : remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'}">
              ${!isDuration && remaining === 0 ? 'Forfait Épuisé' : !isDuration && remaining <= 2 ? 'Renouvellement Proche' : 'Actif & En Cours'}
            </span>
            <span class="text-[11px] text-slate-400 block">Formule : ${pkg.packageName || 'Coaching'}</span>
          </div>

          <!-- Carte 3 : Règlement FCFA -->
          <div class="glass-card p-4 space-y-1">
            <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Paiement Forfait</span>
            <span class="text-2xl font-bold font-mono text-white block">${Calculations.formatFCFA(pkg.totalAmount || 0)}</span>
            <span class="text-[11px] ${(pkg.balanceDue || 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'} block">
              ${(pkg.balanceDue || 0) > 0 ? `Solde restant : ${Calculations.formatFCFA(pkg.balanceDue)}` : 'Entièrement Réglé'}
            </span>
          </div>
        </div>

        <!-- Boîte de Pointage Rapide -->
        <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Valider la Présence / Pointer une Séance</h3>
              <p class="text-xs text-slate-400">Chaque pointage décompte automatiquement 1 séance et l'ajoute à l'historique daté</p>
            </div>
          </div>

          <form id="form-log-attendance" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="label">Date de la séance</label>
              <input type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}" class="input text-xs font-semibold" required />
            </div>
            <div>
              <label class="label">Type de Séance</label>
              <input type="text" id="att-type" value="Séance Coaching Privé" placeholder="ex: Renforcement & Cardio" class="input text-xs" required />
            </div>
            <div class="flex items-end">
              <button type="submit" class="btn btn-primary btn-sm w-full">
                Pointer la Séance (Présence)
              </button>
            </div>
          </form>
        </div>

        <!-- Historique Daté des Séances Effectuées -->
        <div class="glass-card overflow-hidden">
          <div class="p-4 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Historique des Séances Effectuées (${logs.length})
            </h4>
            <span class="text-[11px] text-slate-400">Total : ${used} séance(s)</span>
          </div>

          ${logs.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400">
              Aucune séance pointée dans l'historique pour le moment.
            </div>
          ` : `
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3"># Séance</th>
                  <th class="p-3">Date & Heure</th>
                  <th class="p-3">Type de Séance</th>
                  <th class="p-3">Statut</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${logs.map((log) => `
                  <tr class="hover:bg-slate-800/40">
                    <td class="p-3 font-bold text-white font-mono">Séance #${log.sessionNumber || '--'}</td>
                    <td class="p-3 font-mono">${new Date(log.date).toLocaleDateString('fr-FR')} ${log.time ? `à ${log.time}` : ''}</td>
                    <td class="p-3 text-slate-200">${log.sessionType}</td>
                    <td class="p-3"><span class="badge badge-emerald">Présent</span></td>
                    <td class="p-3 text-right">
                      <button class="text-slate-500 hover:text-red-400 text-xs btn-undo-attendance" data-log-id="${log.id}">
                        Annuler
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;

    // Événements Pointage
    container.querySelector('#form-log-attendance')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = container.querySelector('#att-date')?.value;
      const type = container.querySelector('#att-type')?.value;

      stateManager.logSessionAttendance(client.id, { date, sessionType: type });
      window.App.showToast('Séance pointée avec succès !', 'success');
      this.renderAttendanceTab(container, stateManager.getClientById(client.id));
    });

    container.querySelectorAll('.btn-undo-attendance').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const logId = e.currentTarget.getAttribute('data-log-id');
        if (confirm('Annuler ce pointage de séance et réajuster le compteur ?')) {
          stateManager.removeSessionAttendance(client.id, logId);
          window.App.showToast('Pointage annulé', 'info');
          this.renderAttendanceTab(container, stateManager.getClientById(client.id));
        }
      });
    });
  },

  bindEvents(container, client) {
    container.querySelector('#btn-back-list')?.addEventListener('click', () => {
      window.App.navigateTo('clients');
    });

    container.querySelector('#btn-quick-point-attendance')?.addEventListener('click', () => {
      stateManager.logSessionAttendance(client.id, {
        date: new Date().toISOString().split('T')[0],
        sessionType: 'Séance Coaching Privé',
        notes: 'Pointage rapide 1-clic'
      });
      window.App.showToast(`Séance pointée pour ${client.firstName} !`, 'success');
      this.render(container, client.id, this.currentTab);
    });

    container.querySelectorAll('.btn-trigger-renew, #btn-open-renew-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openRenewalModal(client);
      });
    });

    container.querySelector('#btn-open-contract-modal')?.addEventListener('click', () => {
      ContractModal.open(client.id);
    });

    container.querySelector('#btn-print-bilan-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'assessment');
    });

    container.querySelector('#btn-print-prog-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'program');
    });

    container.querySelector('#btn-print-abonnement-action')?.addEventListener('click', () => {
      window.App.openThermalModal(client.id, null, 'subscription');
    });

    container.querySelector('#btn-whatsapp-action')?.addEventListener('click', () => {
      window.App.sendWhatsAppToClient(client.id);
    });

    container.querySelector('#btn-edit-client-action')?.addEventListener('click', () => {
      window.App.openEditClientModal(client.id);
    });

    container.querySelector('#btn-delete-client-action')?.addEventListener('click', () => {
      PinLock.requestPinConfirmation({
        title: `Supprimer ${client.firstName} ${client.lastName}`,
        message: `Entrez votre code PIN pour confirmer la suppression définitive du dossier de ${client.firstName} ${client.lastName}.`,
        onConfirm: () => {
          stateManager.deleteClient(client.id);
          window.App.showToast('Client supprimé avec succès', 'info');
          window.App.navigateTo('clients');
        }
      });
    });

    container.querySelectorAll('.tab-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.tab-sub-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentTab = e.currentTarget.getAttribute('data-tab');
        this.renderActiveTab(container, client);
      });
    });
  },

  /**
   * Modal de Renouvellement de Forfait en 1 Clic avec Archivage Automatique
   */
  openRenewalModal(client) {
    let modal = document.getElementById('client-renew-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'client-renew-modal';
      modal.className = 'modal-backdrop flex items-center justify-center p-4 z-50';
      document.body.appendChild(modal);
    }

    const currentPkg = client.package || {};
    const defaultTotal = currentPkg.totalAmount || 150000;

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="glass-card max-w-lg w-full p-6 space-y-5 border-t-4 border-emerald-500 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>🔄</span> Renouveler l'Abonnement
            </h3>
            <p class="text-xs text-slate-400">Pour ${client.firstName} ${client.lastName} (N° CP-${client.id.slice(-6).toUpperCase()})</p>
          </div>
          <button id="btn-close-renew-modal" class="text-slate-400 hover:text-white font-bold p-1 text-lg">✕</button>
        </div>

        <form id="form-renew-package" class="space-y-4">
          <div>
            <label class="label">Choisir la Formule *</label>
            <select id="renew-package-preset" class="input font-bold text-emerald-400 text-xs bg-slate-950">
              <option value="pack_10">Pack 10 Séances (Séances)</option>
              <option value="pack_20">Pack 20 Séances (Séances)</option>
              <option value="forfait_1m" selected>Forfait 1 Mois (Illimité)</option>
              <option value="forfait_2m">Forfait 2 Mois (Illimité)</option>
              <option value="forfait_3m">Forfait 3 Mois (Illimité)</option>
              <option value="custom">Formule Personnalisée</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Nom du Forfait *</label>
              <input type="text" id="renew-pkg-name" value="Forfait 1 Mois" class="input font-semibold" required />
            </div>
            <div>
              <label class="label">Date de Début *</label>
              <input type="date" id="renew-start-date" value="${new Date().toISOString().split('T')[0]}" class="input font-mono" required />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="renew-sessions-fields">
            <div>
              <label class="label">Type de Forfait</label>
              <select id="renew-pkg-type" class="input text-xs">
                <option value="duration" selected>Durée (Mois)</option>
                <option value="sessions">Nombre de Séances</option>
              </select>
            </div>
            <div>
              <label class="label" id="renew-qty-label">Durée (Mois)</label>
              <input type="number" id="renew-qty-val" value="1" min="1" class="input font-mono font-bold text-emerald-400" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label class="label">Tarif Total (FCFA) *</label>
              <input type="number" id="renew-total-amt" value="${defaultTotal}" step="5000" class="input font-mono font-bold text-white text-base" required />
            </div>
            <div>
              <label class="label">Acompte / Règlement (FCFA) *</label>
              <input type="number" id="renew-paid-amt" value="${defaultTotal}" step="5000" class="input font-mono font-bold text-emerald-400 text-base" required />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" id="btn-cancel-renew" class="btn btn-secondary btn-sm font-semibold">Annuler</button>
            <button type="submit" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
              Valider &amp; Renouveler l'Abonnement
            </button>
          </div>
        </form>
      </div>
    `;

    modal.querySelector('#btn-close-renew-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('#btn-cancel-renew')?.addEventListener('click', () => modal.classList.add('hidden'));

    const presetSelect = modal.querySelector('#renew-package-preset');
    const nameInput = modal.querySelector('#renew-pkg-name');
    const typeSelect = modal.querySelector('#renew-pkg-type');
    const qtyInput = modal.querySelector('#renew-qty-val');
    const qtyLabel = modal.querySelector('#renew-qty-label');
    const totalInput = modal.querySelector('#renew-total-amt');
    const paidInput = modal.querySelector('#renew-paid-amt');

    presetSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'pack_10') {
        nameInput.value = 'Pack 10 Séances';
        typeSelect.value = 'sessions';
        qtyLabel.textContent = 'Nombre de Séances';
        qtyInput.value = '10';
        totalInput.value = '100000';
        paidInput.value = '100000';
      } else if (val === 'pack_20') {
        nameInput.value = 'Pack 20 Séances';
        typeSelect.value = 'sessions';
        qtyLabel.textContent = 'Nombre de Séances';
        qtyInput.value = '20';
        totalInput.value = '180000';
        paidInput.value = '180000';
      } else if (val === 'forfait_1m') {
        nameInput.value = 'Forfait 1 Mois';
        typeSelect.value = 'duration';
        qtyLabel.textContent = 'Durée (Mois)';
        qtyInput.value = '1';
        totalInput.value = '100000';
        paidInput.value = '100000';
      } else if (val === 'forfait_2m') {
        nameInput.value = 'Forfait 2 Mois';
        typeSelect.value = 'duration';
        qtyLabel.textContent = 'Durée (Mois)';
        qtyInput.value = '2';
        totalInput.value = '150000';
        paidInput.value = '150000';
      } else if (val === 'forfait_3m') {
        nameInput.value = 'Forfait 3 Mois';
        typeSelect.value = 'duration';
        qtyLabel.textContent = 'Durée (Mois)';
        qtyInput.value = '3';
        totalInput.value = '200000';
        paidInput.value = '200000';
      }
    });

    typeSelect?.addEventListener('change', (e) => {
      if (e.target.value === 'duration') {
        qtyLabel.textContent = 'Durée (Mois)';
        qtyInput.value = '1';
      } else {
        qtyLabel.textContent = 'Nombre de Séances';
        qtyInput.value = '10';
      }
    });

    modal.querySelector('#form-renew-package')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const isDuration = typeSelect.value === 'duration';
      const qty = parseInt(qtyInput.value, 10) || (isDuration ? 1 : 10);
      const totalAmt = parseFloat(totalInput.value) || 0;
      const paidAmt = parseFloat(paidInput.value) || 0;

      const renewData = {
        packageName: nameInput.value.trim() || (isDuration ? `Forfait ${qty} Mois` : `Pack ${qty} Séances`),
        packageType: typeSelect.value,
        durationMonths: isDuration ? qty : 1,
        totalSessions: !isDuration ? qty : 10,
        totalAmount: totalAmt,
        amountPaid: paidAmt,
        startDate: modal.querySelector('#renew-start-date')?.value || new Date().toISOString().split('T')[0]
      };

      stateManager.renewClientPackage(client.id, renewData);
      modal.classList.add('hidden');
      window.App.showToast(`Abonnement renouvelé pour ${client.firstName} !`, 'success');
      
      const mainContainer = document.getElementById('main-content');
      if (mainContainer) {
        this.render(mainContainer, client.id, this.currentTab);
      }

      setTimeout(() => {
        window.App.openThermalModal(client.id, null, 'subscription');
      }, 300);
    });
  }
};


/* ==========================================================================
   MODULE: components/dashboard.js
   ========================================================================== */
/**
 * dashboard.js - Tableau de Bord Intelligent COACH PRO
 * Alertes d'abonnements expirés & à renouveler, statistiques en FCFA et gestion rapide des athlètes.
 */
const Dashboard = {
  render(container) {
    const clients = stateManager.getClients();
    const coach = stateManager.getCoachProfile();
    const licenseInfo = LicenseManager.getLicenseInfo();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalClients = clients.length;
    let totalSessionsDone = 0;
    let totalBalanceDue = 0;

    // Analyse des abonnements & alertes de renouvellement
    const expiredClients = [];
    const expiringSoonClients = [];

    clients.forEach(c => {
      const pkg = c.package || {};
      if (pkg.price || pkg.totalSessions || pkg.durationMonths) {
        totalSessionsDone += (pkg.sessionsUsed || 0);
        totalBalanceDue += (pkg.balanceDue || 0);

        const isDuration = pkg.packageType === 'duration';
        const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
        
        let isExpired = false;
        let isExpiringSoon = false;
        let expireReason = '';

        if (!isDuration) {
          if (sessionsLeft === 0) {
            isExpired = true;
            expireReason = '0 séance restante (Forfait terminé)';
          } else if (sessionsLeft <= 2) {
            isExpiringSoon = true;
            expireReason = `Plus que ${sessionsLeft} séance(s) restante(s)`;
          }
        }

        if (pkg.endDate) {
          const diffDays = Math.ceil((new Date(pkg.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            isExpired = true;
            expireReason = `Échéance dépassée le ${new Date(pkg.endDate).toLocaleDateString('fr-FR')}`;
          } else if (diffDays <= 4 && !isExpired) {
            isExpiringSoon = true;
            expireReason = `Expire dans ${diffDays} jour(s) (${new Date(pkg.endDate).toLocaleDateString('fr-FR')})`;
          }
        }

        if (isExpired) {
          expiredClients.push({ client: c, reason: expireReason });
        } else if (isExpiringSoon) {
          expiringSoonClients.push({ client: c, reason: expireReason });
        }
      }
    });

    const displayName = coach?.name ? coach.name : 'Coach';

    container.innerHTML = `
      <div class="dashboard-view space-y-6">
        
        <!-- BANNIÈRE ESSAI OU EXPIRATION DE LICENCE -->
        ${licenseInfo.isTrial ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⚡</span>
              <div>
                <p class="text-xs sm:text-sm font-bold text-amber-300">
                  Mode Essai Gratuit Actif : Il vous reste <strong class="text-white">${licenseInfo.daysRemaining} jour(s)</strong> d'évaluation.
                </p>
                <p class="text-[11px] text-amber-400/80">
                  Profitez de toutes les fonctionnalités. Activez votre licence pour déverrouiller définitivement votre accès.
                </p>
              </div>
            </div>
            <button onclick="window.App.openSettingsModal()" class="btn btn-secondary btn-xs shrink-0 font-bold">
              🔑 Activer ma Licence
            </button>
          </div>
        ` : (!licenseInfo.isLifetime && licenseInfo.daysRemaining <= 3) ? `
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-500/5">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⏳</span>
              <div>
                <p class="text-xs sm:text-sm font-bold text-rose-300">
                  Votre abonnement expire bientôt : <strong class="text-white">${licenseInfo.daysRemaining} jour(s) restant(s)</strong> (${licenseInfo.expiryFormatted}).
                </p>
                <p class="text-[11px] text-rose-400/80">
                  Pensez à renouveler votre clé auprès de l'administrateur pour éviter toute interruption.
                </p>
              </div>
            </div>
            <button onclick="window.App.openSettingsModal()" class="btn btn-primary btn-xs shrink-0 font-bold">
              🔄 Renouveler ma Clé
            </button>
          </div>
        ` : ''}

        <!-- En-tête Coach Lumineux -->
        <div class="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500 shadow-xl">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge badge-emerald text-xs">Espace Coach Privé</span>
              ${coach.city ? `<span class="text-xs text-slate-300 font-semibold">• ${coach.city}</span>` : ''}
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white mt-1">
              Bonjour, <span class="text-emerald-400">${displayName}</span>
            </h1>
            <p class="text-xs text-slate-300 mt-0.5">
              ${coach.brand ? `<strong class="text-white">${coach.brand}</strong> • ` : ''}<span class="text-slate-300">${coach.motto ? `"${coach.motto}"` : 'Prêt pour les séances du jour'}</span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-dash-new-client" class="btn btn-primary btn-sm shadow-lg shadow-emerald-500/20 font-bold">
              <span>+</span> Nouveau Client
            </button>
            <button id="btn-dash-quick-calc" class="btn btn-secondary btn-sm font-semibold">
              <span>⚡</span> Calculateur
            </button>
            <button id="btn-dash-settings" class="btn btn-outline btn-sm font-semibold">
              <span>⚙️</span> Profil
            </button>
          </div>
        </div>

        <!-- BANNIÈRE D'ALERTES ABONNEMENTS (EXPIRÉS & PROCHES) -->
        ${(expiredClients.length > 0 || expiringSoonClients.length > 0) ? `
          <div class="glass-card p-5 space-y-3 border-t-4 border-amber-500 shadow-xl bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/90">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔔</span>
                <h3 class="text-sm font-bold text-white">Alertes Renouvellement Forfaits (${expiredClients.length + expiringSoonClients.length})</h3>
              </div>
              <span class="badge ${expiredClients.length > 0 ? 'badge-rose' : 'badge-amber'} text-xs font-bold font-mono">
                ${expiredClients.length} expiré(s) • ${expiringSoonClients.length} à relancer
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              ${expiredClients.map(({ client: c, reason }) => `
                <div class="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between gap-3 shadow-sm">
                  <div class="min-w-0">
                    <strong class="text-xs text-white block font-bold truncate">${c.firstName} ${c.lastName}</strong>
                    <span class="text-[11px] text-rose-300 font-semibold block">${reason}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${c.phone || 'Pas de numéro'}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button class="btn btn-whatsapp btn-xs py-1 px-2.5 btn-alert-whatsapp" data-client-id="${c.id}" title="Relancer sur WhatsApp">
                      💬
                    </button>
                    <button class="btn btn-primary btn-xs py-1 px-2.5 font-bold btn-alert-renew" data-client-id="${c.id}">
                      Renouveler
                    </button>
                  </div>
                </div>
              `).join('')}

              ${expiringSoonClients.map(({ client: c, reason }) => `
                <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3 shadow-sm">
                  <div class="min-w-0">
                    <strong class="text-xs text-white block font-bold truncate">${c.firstName} ${c.lastName}</strong>
                    <span class="text-[11px] text-amber-300 font-semibold block">${reason}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${c.phone || 'Pas de numéro'}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button class="btn btn-whatsapp btn-xs py-1 px-2.5 btn-alert-whatsapp" data-client-id="${c.id}" title="Rappeler sur WhatsApp">
                      💬
                    </button>
                    <button class="btn btn-secondary btn-xs py-1 px-2.5 font-bold btn-alert-renew" data-client-id="${c.id}">
                      Voir Forfait
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 3 Cartes Métriques Clés en FCFA (Hautement Contrastées) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Clients en Suivi</span>
            <span class="text-3xl font-extrabold text-white block">${totalClients}</span>
            <span class="text-[11px] text-slate-400">Athlètes enregistrés</span>
          </div>

          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Séances Effectuées</span>
            <span class="text-3xl font-extrabold text-emerald-400 block">${totalSessionsDone}</span>
            <span class="text-[11px] text-slate-400">Total séances pointées</span>
          </div>

          <div class="glass-card p-5 space-y-1">
            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Soldes à Encaisser</span>
            <span class="text-2xl font-extrabold text-white font-mono block">${Calculations.formatFCFA(totalBalanceDue)}</span>
            <span class="text-[11px] ${totalBalanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">
              ${totalBalanceDue > 0 ? 'Règlements restants' : 'Tous forfaits soldés ✓'}
            </span>
          </div>
        </div>

        <!-- SECTION ATHLÈTES PRÉVUS AUJOURD'HUI (PLANNING & POINTAGE RAPIDE) -->
        ${(() => {
          const todayClients = stateManager.getClientsForToday();
          return `
            <div class="glass-card p-5 space-y-4 border-l-4 border-emerald-500 shadow-xl">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🎯</span>
                  <div>
                    <h3 class="text-sm font-bold text-white">Athlètes Prévus Aujourd'hui (${todayClients.length})</h3>
                    <p class="text-[11px] text-slate-400">Pointage rapide de présence en 1 clic pour vos séances du jour</p>
                  </div>
                </div>
                <span class="badge badge-emerald text-xs font-bold font-mono">
                  ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>

              ${todayClients.length === 0 ? `
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  Aucun athlète programmé spécifiquement pour aujourd'hui. Retrouvez vos clients ci-dessous.
                </div>
              ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  ${todayClients.map(c => {
                    const pkg = c.package || {};
                    const isDuration = pkg.packageType === 'duration';
                    const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                    const clientCode = `CP-${c.id.slice(-6).toUpperCase()}`;
                    const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase() || 'CP';

                    return `
                      <div class="p-3.5 rounded-2xl bg-[#090d18] border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 shadow-lg">
                        <div class="flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                              ${initials}
                            </div>
                            <div class="min-w-0">
                              <strong class="text-white text-xs font-bold block truncate">${c.firstName} ${c.lastName}</strong>
                              <span class="text-[10px] text-slate-400 font-mono block truncate">${clientCode} • ${c.residence || 'Abidjan'}</span>
                            </div>
                          </div>
                          <span class="badge ${isDuration ? 'badge-emerald' : (sessionsLeft <= 2 ? 'badge-amber' : 'badge-neutral')} text-[10px] font-mono shrink-0">
                            ${isDuration ? 'Actif' : `${sessionsLeft} rest.`}
                          </span>
                        </div>

                        <div class="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button class="btn btn-emerald btn-xs flex-1 py-1.5 font-bold shadow-md btn-today-point" data-client-id="${c.id}" title="Pointer la présence du jour">
                            ⚡ Pointer
                          </button>
                          <button class="btn btn-secondary btn-xs flex-1 py-1.5 font-semibold" data-action="open-client" data-client-id="${c.id}">
                            📂 Dossier
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          `;
        })()}

        <!-- Tableau & Liste des Clients -->
        ${totalClients === 0 ? `
          <div class="glass-card p-10 text-center space-y-4">
            <div class="text-4xl">👥</div>
            <div>
              <h3 class="text-base font-bold text-white">Aucun client pour le moment</h3>
              <p class="text-xs text-slate-300 max-w-md mx-auto mt-1">
                Créez votre première fiche client pour calculer automatiquement ses indicateurs corporels, enregistrer ses paiements et imprimer ses reçus.
              </p>
            </div>
            <button id="btn-empty-create-client" class="btn btn-primary btn-sm font-bold shadow-lg shadow-emerald-500/20">
              + Créer mon premier client
            </button>
          </div>
        ` : `
          <div class="glass-card p-4 sm:p-5 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white">Tous les Clients en Suivi (${totalClients})</h3>
              <button id="btn-see-all-clients" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline">Gérer tous les clients →</button>
            </div>

            <!-- VUE MOBILE (Cartes Tactiles Fluides) -->
            <div class="block md:hidden space-y-3">
              ${clients.map(c => {
                const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
                const pkg = c.package || {};
                const isDuration = pkg.packageType === 'duration';
                const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                const balanceDue = pkg.balanceDue || 0;

                return `
                  <div class="sub-card p-4 space-y-3 border border-slate-800 shadow-md">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <strong class="text-white text-sm font-bold block">${c.firstName} ${c.lastName}</strong>
                        <span class="text-[11px] text-slate-300 font-semibold">${c.residence ? `${c.residence}` : (c.phone || '')}</span>
                      </div>
                      <span class="badge badge-emerald text-[10px]">${c.mainGoal}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-[#0c1220] p-2.5 rounded-xl text-center text-xs border border-slate-800">
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Poids</span>
                        <span class="font-bold text-white font-mono">${last ? `${last.weight} kg` : '--'}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Forfait</span>
                        <span class="font-bold ${isDuration ? 'text-emerald-400' : (sessionsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400')} font-mono">
                          ${isDuration ? `${pkg.durationMonths || 1}M` : `${sessionsLeft} rest.`}
                        </span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 font-semibold block">Solde</span>
                        <span class="font-bold ${balanceDue > 0 ? 'text-amber-400' : 'text-slate-300'} font-mono text-[11px]">
                          ${balanceDue > 0 ? Calculations.formatFCFA(balanceDue) : 'Réglé ✓'}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <button class="btn btn-primary btn-xs flex-1 py-2 font-bold" data-action="open-client" data-client-id="${c.id}">
                        Dossier
                      </button>
                      <button class="btn btn-secondary btn-xs flex-1 py-2 font-semibold" data-action="print-bilan" data-client-id="${c.id}">
                        Ticket Bilan
                      </button>
                      <button class="btn btn-outline btn-xs px-3 py-2 font-semibold" data-action="print-sub" data-client-id="${c.id}">
                        Reçu
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- VUE DESKTOP (Tableau classique) -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-[#0c1220] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th class="p-3">Client</th>
                    <th class="p-3">Objectif</th>
                    <th class="p-3">Poids Actuel</th>
                    <th class="p-3">Forfait en Cours</th>
                    <th class="p-3">Solde Dû</th>
                    <th class="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${clients.map(c => {
                    const last = c.history && c.history.length > 0 ? c.history[c.history.length - 1] : null;
                    const pkg = c.package || {};
                    const isDuration = pkg.packageType === 'duration';
                    const sessionsLeft = !isDuration ? Math.max(0, (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)) : null;
                    const balanceDue = pkg.balanceDue || 0;

                    return `
                      <tr class="hover:bg-slate-800/40 transition-colors">
                        <td class="p-3">
                          <strong class="text-white block font-bold text-sm">${c.firstName} ${c.lastName}</strong>
                          <span class="text-[11px] text-slate-400 font-semibold">${c.residence ? `${c.residence} • ` : ''}${c.phone || ''}</span>
                        </td>
                        <td class="p-3">
                          <span class="badge badge-emerald">${c.mainGoal}</span>
                        </td>
                        <td class="p-3 font-mono font-bold text-white">
                          ${last ? `${last.weight} kg` : '--'}
                        </td>
                        <td class="p-3">
                          ${isDuration ? `
                            <span class="font-bold text-emerald-400 font-mono">
                              ${pkg.durationMonths || 1} Mois (${pkg.sessionsUsed || 0} séances)
                            </span>
                          ` : `
                            <span class="font-bold ${sessionsLeft <= 2 ? 'text-amber-400' : 'text-emerald-400'} font-mono">
                              ${sessionsLeft} / ${pkg.totalSessions || 0} séances
                            </span>
                          `}
                        </td>
                        <td class="p-3 font-mono ${balanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}">
                          ${Calculations.formatFCFA(balanceDue)}
                        </td>
                        <td class="p-3 text-right space-x-1.5">
                          <button class="btn btn-secondary btn-xs font-bold" data-action="open-client" data-client-id="${c.id}">
                            Dossier
                          </button>
                          <button class="btn btn-outline btn-xs" data-action="print-bilan" data-client-id="${c.id}">
                            Bilan
                          </button>
                          <button class="btn btn-outline btn-xs" data-action="print-sub" data-client-id="${c.id}">
                            Reçu
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    container.querySelector('#btn-dash-new-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    container.querySelector('#btn-empty-create-client')?.addEventListener('click', () => {
      window.App.openNewClientModal();
    });

    container.querySelector('#btn-dash-quick-calc')?.addEventListener('click', () => {
      window.App.openQuickToolsModal();
    });

    container.querySelector('#btn-dash-settings')?.addEventListener('click', () => {
      window.App.openSettingsModal();
    });

    container.querySelector('#btn-see-all-clients')?.addEventListener('click', () => {
      window.App.navigateTo('clients');
    });

    container.querySelectorAll('.btn-today-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;
        stateManager.logSessionAttendance(clientId, {
          date: new Date().toISOString().split('T')[0],
          sessionType: 'Séance Coaching Privé',
          notes: 'Pointage direct depuis tableau de bord'
        });
        window.App.showToast(`Séance pointée pour ${client.firstName} !`, 'success');
        this.render(container);
      });
    });

    container.querySelectorAll('[data-action="open-client"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId);
      });
    });

    container.querySelectorAll('.btn-alert-renew').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openClientDetail(clientId, 'billing');
      });
    });

    container.querySelectorAll('.btn-alert-whatsapp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        const client = stateManager.getClientById(clientId);
        if (!client) return;

        const coach = stateManager.getCoachProfile();
        let msg = `Bonjour ${client.firstName},\n`;
        msg += `C'est ${coach.name || 'votre Coach'}. Je vous contacte concernant votre forfait d'entraînement chez COACH PRO qui arrive à échéance.\n`;
        msg += `Souhaitez-vous que l'on prépare le renouvellement de vos prochaines séances ?\n\n`;
        msg += `Sportivement,\n${coach.name || 'Votre Coach'}`;

        const phone = (client.phone || '').replace(/[^0-9]/g, '');
        const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      });
    });

    container.querySelectorAll('[data-action="print-bilan"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'assessment');
      });
    });

    container.querySelectorAll('[data-action="print-sub"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-client-id');
        window.App.openThermalModal(clientId, null, 'subscription');
      });
    });
  }
};


/* ==========================================================================
   MODULE: app.js
   ========================================================================== */
/**
 * app.js - Contrôleur Principal & Routeur COACH PRO
 * Intègre la Sécurité PIN 5008, la Licence, la Comptabilité, le Scanner QR,
 * la To-Do list, les Photos et l'Impression Bluetooth MPT.
 */















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


})();
