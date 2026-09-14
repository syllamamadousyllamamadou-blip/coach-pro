/**
 * backup.js - Module de Sauvegarde Complète & Restauration pour COACH PRO
 * Protège contre la perte de données (changement de téléphone, réinstallation).
 * Permet l'export/import JSON, partage WhatsApp/Drive et instantanés automatiques.
 */

import { stateManager } from '../state.js';

export const BackupManager = {
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
