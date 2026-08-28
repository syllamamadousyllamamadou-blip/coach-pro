/**
 * calculations.js - Moteur Physiologique & Métabolique COACH PRO
 * Formules rigoureuses, sanitisation de la taille et calculs de poids santé exacts.
 */

export const Calculations = {
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

  formatFCFA(amount) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0)) + ' FCFA';
  }
};
