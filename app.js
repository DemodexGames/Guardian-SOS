// =======================
// GUARDIAN SOS - FINAL DEFINITIVO MÓVIL
// =======================

// ---------- ELEMENTOS ----------
const body = document.body;

const settingsBtn = document.getElementById("settingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsForm = document.getElementById("settingsForm");

const setupBanner = document.getElementById("setupBanner");
const setupNowBtn = document.getElementById("setupNowBtn");
const onboardingNote = document.getElementById("onboardingNote");

const themeToggle = document.getElementById("themeToggle");
const silentToggle = document.getElementById("silentToggle");

const sosBtn = document.getElementById("sosBtn");
const sosSubText = document.getElementById("sosSubText");

const callBtn = document.getElementById("callBtn");
const smsBtn = document.getElementById("smsBtn");
const waBtn = document.getElementById("waBtn");

const locationText = document.getElementById("locationText");
const statusBadge = document.getElementById("statusBadge");
const toast = document.getElementById("toast");
const messagePreview = document.getElementById("messagePreview");

const contact1Input = document.getElementById("contact1");
const contact2Input = document.getElementById("contact2");
const callContactInput = document.getElementById("callContact");
const customMessageInput = document.getElementById("customMessage");

const installBtn = document.getElementById("installBtn");
const iosInstallTip = document.getElementById("iosInstallTip");
const desktopWarning = document.getElementById("desktopWarning");

// Compatibilidad con elementos que aún existen
const countdownPanel = document.getElementById("countdownPanel");
const countdownNumber = document.getElementById("countdownNumber");
const cancelBtn = document.getElementById("cancelBtn");

// ---------- ESTADO ----------
let deferredPrompt = null;
let isSilentMode = false;
let currentLocation = null;
let watchId = null;
let holdTimer = null;
let holdTriggered = false;

const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// ---------- STORAGE KEYS ----------
const STORAGE_KEYS = {
  settings: "guardian_sos_settings_v1",
  theme: "guardian_sos_theme_v1",
  silent: "guardian_sos_silent_v1"
};

// ---------- HELPERS ----------
function showToast(message = "Acción completada") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function sanitizePhone(value = "") {
  return value.replace(/[^\d]/g, "");
}

function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSettings(data) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data));
}

function hasValidSetup(settings) {
  if (!settings) return false;
  return !!(settings.contact1 && settings.callContact);
}

function updatePreview() {
  const settings = collectFormData();
  const message = buildEmergencyMessage(settings, currentLocation);
  if (messagePreview) {
    messagePreview.textContent = message;
  }
}

function collectFormData() {
  return {
    contact1: sanitizePhone(contact1Input?.value || ""),
    contact2: sanitizePhone(contact2Input?.value || ""),
    callContact: sanitizePhone(callContactInput?.value || ""),
    customMessage: (customMessageInput?.value || "").trim()
  };
}

function populateForm(settings) {
  if (!settings) return;
  if (contact1Input) contact1Input.value = settings.contact1 || "";
  if (contact2Input) contact2Input.value = settings.contact2 || "";
  if (callContactInput) callContactInput.value = settings.callContact || "";
  if (customMessageInput) {
    customMessageInput.value =
      settings.customMessage ||
      "🚨 ALERTA DE EMERGENCIA: Estoy en una situación de riesgo y necesito ayuda inmediata.";
  }
  updatePreview();
}

function buildEmergencyMessage(settings, location) {
  const base =
    settings?.customMessage?.trim() ||
    "🚨 ALERTA DE EMERGENCIA: Estoy en una situación de riesgo y necesito ayuda inmediata.";

  if (location?.lat && location?.lng) {
    const mapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    return `${base}\n\n📍 Mi ubicación actual:\nLat: ${location.lat}, Lng: ${location.lng}\n🗺️ ${mapsLink}`;
  }

  return `${base}\n\n📍 No se pudo obtener ubicación exacta en este momento.`;
}

function setButtonsState(enabled) {
  [sosBtn, callBtn, smsBtn, waBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("disabled", !enabled);
    btn.disabled = !enabled;
  });
}

function updateSetupUI() {
  const settings = getSettings();
  const ready = hasValidSetup(settings);

  if (setupBanner) {
    setupBanner.classList.toggle("hidden", ready);
  }

  setButtonsState(ready);

  if (statusBadge) {
    statusBadge.textContent = ready ? "🟢 Protección activa" : "🟡 Configuración pendiente";
  }

  updatePreview();
}

// ---------- TEMA ----------
function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light");
    if (themeToggle) themeToggle.textContent = "☀️";
  } else {
    body.classList.remove("light");
    if (themeToggle) themeToggle.textContent = "🌙";
  }
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  applyTheme(saved);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = body.classList.contains("light");
    const next = isLight ? "dark" : "light";
    localStorage.setItem(STORAGE_KEYS.theme, next);
    applyTheme(next);
  });
}

// ---------- MODO SILENCIOSO ----------
function applySilentMode(value) {
  isSilentMode = value;
  if (silentToggle) {
    silentToggle.textContent = value ? "🔕" : "🔇";
  }
}

function initSilentMode() {
  const saved = localStorage.getItem(STORAGE_KEYS.silent) === "true";
  applySilentMode(saved);
}

if (silentToggle) {
  silentToggle.addEventListener("click", () => {
    const next = !isSilentMode;
    localStorage.setItem(STORAGE_KEYS.silent, String(next));
    applySilentMode(next);
    showToast(next ? "Modo silencioso activado" : "Modo silencioso desactivado");
  });
}

// ---------- MODAL ----------
function openSettings(showOnboarding = false) {
  if (!settingsModal) return;
  settingsModal.classList.remove("hidden");

  if (onboardingNote) {
    onboardingNote.classList.toggle("hidden", !showOnboarding);
  }
}

function closeSettings() {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => openSettings(false));
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", closeSettings);
}

if (setupNowBtn) {
  setupNowBtn.addEventListener("click", () => openSettings(true));
}

if (settingsModal) {
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });
}

[contact1Input, contact2Input, callContactInput, customMessageInput].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", updatePreview);
});

if (settingsForm) {
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = collectFormData();

    if (!data.contact1 || !data.callContact) {
      showToast("Completa al menos contacto principal y llamada rápida");
      return;
    }

    saveSettings(data);
    updateSetupUI();
    closeSettings();
    showToast("Configuración guardada correctamente");
  });
}

// ---------- GEOLOCALIZACIÓN ----------
function updateLocationUI(text) {
  if (locationText) {
    locationText.textContent = text;
  }
}

function handleLocationSuccess(position) {
  const lat = Number(position.coords.latitude).toFixed(6);
  const lng = Number(position.coords.longitude).toFixed(6);

  currentLocation = { lat, lng };

  updateLocationUI(`Lat: ${lat}, Lng: ${lng}`);
}

function handleLocationError() {
  currentLocation = null;
  updateLocationUI("No se pudo obtener la ubicación en este momento.");
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    updateLocationUI("Tu navegador no soporta geolocalización.");
    return;
  }

  updateLocationUI("Intentando obtener ubicación automáticamente...");

  navigator.geolocation.getCurrentPosition(
    handleLocationSuccess,
    handleLocationError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function startLocationWatch() {
  if (!("geolocation" in navigator)) return;

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  watchId = navigator.geolocation.watchPosition(
    handleLocationSuccess,
    () => {},
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    }
  );
}

// ---------- ACCIONES RÁPIDAS ----------
function openCall() {
  const settings = getSettings();
  if (!hasValidSetup(settings)) {
    showToast("Configura primero tus contactos");
    openSettings(true);
    return;
  }

  const number = sanitizePhone(settings.callContact);
  if (!number) {
    showToast("Número de llamada inválido");
    return;
  }

  window.location.href = `tel:${number}`;
}

function openSMS() {
  const settings = getSettings();
  if (!hasValidSetup(settings)) {
    showToast("Configura primero tus contactos");
    openSettings(true);
    return;
  }

  const number = sanitizePhone(settings.contact1);
  const message = buildEmergencyMessage(settings, currentLocation);

  if (!number) {
    showToast("Número principal inválido");
    return;
  }

  const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const separator = isIOSDevice ? "&" : "?";

  window.location.href = `sms:${number}${separator}body=${encodeURIComponent(message)}`;
}

function openWhatsApp() {
  const settings = getSettings();
  if (!hasValidSetup(settings)) {
    showToast("Configura primero tus contactos");
    openSettings(true);
    return;
  }

  const number = sanitizePhone(settings.contact1);
  const message = buildEmergencyMessage(settings, currentLocation);

  if (!number) {
    showToast("Número principal inválido");
    return;
  }

  // Mantener como está: abrir WhatsApp del teléfono / web según dispositivo
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.location.href = waUrl;
}

if (callBtn) callBtn.addEventListener("click", openCall);
if (smsBtn) smsBtn.addEventListener("click", openSMS);
if (waBtn) waBtn.addEventListener("click", openWhatsApp);

// ---------- BOTÓN SOS (mantener 1 segundo) ----------
function triggerSOS() {
  const settings = getSettings();

  if (!hasValidSetup(settings)) {
    showToast("Configura primero tus contactos");
    openSettings(true);
    return;
  }

  sosBtn?.classList.remove("holding");
  if (sosSubText) sosSubText.textContent = "Enviando alerta...";

  requestLocation();

  setTimeout(() => {
    openWhatsApp();

    setTimeout(() => {
      if (sosSubText) sosSubText.textContent = "Mantén 1 segundo";
    }, 1500);
  }, 800);
}

function startHold() {
  if (sosBtn?.disabled) return;

  holdTriggered = false;
  sosBtn?.classList.add("holding");

  holdTimer = setTimeout(() => {
    holdTriggered = true;
    triggerSOS();
  }, 1000);
}

function endHold() {
  sosBtn?.classList.remove("holding");

  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
}

if (sosBtn) {
  sosBtn.addEventListener("mousedown", startHold);
  sosBtn.addEventListener("mouseup", endHold);
  sosBtn.addEventListener("mouseleave", endHold);

  sosBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startHold();
  }, { passive: false });

  sosBtn.addEventListener("touchend", endHold);
  sosBtn.addEventListener("touchcancel", endHold);
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    if (countdownPanel) countdownPanel.classList.add("hidden");
    if (sosSubText) sosSubText.textContent = "Mantén 1 segundo";
    showToast("Alerta cancelada");
  });
}

// ---------- PWA / INSTALACIÓN ----------
function initPWA() {
  // Aviso desktop
  if (!isMobile && desktopWarning) {
    desktopWarning.classList.remove("hidden");
  }

  // Registrar Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then(() => {
          console.log("Service Worker registrado correctamente");
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker:", error);
        });
    });
  }

  // Android / navegadores compatibles
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (isMobile && installBtn) {
      installBtn.classList.remove("hidden");
    }
  });

  // iPhone / iPad
  window.addEventListener("load", () => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isIOS && !isStandalone && iosInstallTip) {
      iosInstallTip.classList.remove("hidden");
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) {
        if (isIOS) {
          showToast("En iPhone usa Compartir > Añadir a pantalla de inicio");
        } else {
          showToast("La instalación aún no está disponible en este navegador");
        }
        return;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        showToast("Instalando Guardian SOS...");
      } else {
        showToast("Instalación cancelada");
      }

      deferredPrompt = null;
      installBtn.classList.add("hidden");
    });
  }

  window.addEventListener("appinstalled", () => {
    showToast("Guardian SOS instalada correctamente 💜");
    if (installBtn) {
      installBtn.classList.add("hidden");
    }
  });
}

// ---------- INICIO ----------
function initApp() {
  initTheme();
  initSilentMode();

  const savedSettings = getSettings();

  if (savedSettings) {
    populateForm(savedSettings);
  } else if (customMessageInput) {
    customMessageInput.value =
      "🚨 ALERTA DE EMERGENCIA: Estoy en una situación de riesgo y necesito ayuda inmediata.";
    updatePreview();
  }

  updateSetupUI();
  requestLocation();
  startLocationWatch();
  initPWA();
}

document.addEventListener("DOMContentLoaded", initApp);