/**
 * photos.js - Galerie Photos Avant / Maintenant & Comparateur Split-Slider pour COACH PRO
 * Capture photo directe avec Caméra Live (bouton Fermer/Annuler, bascule Avant/Arrière),
 * import galerie et comparateur visuel avant/après interactif avec curseur glissant.
 */

import { stateManager } from '../state.js';
import { Calculations } from '../calculations.js';

export const PhotosComponent = {
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
