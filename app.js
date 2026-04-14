// =======================
// GUARDIAN SOS - PWA REBUILD TIPO LESHO
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
const androidInstallTip = document.getElementById("androidInstallTip");
const iosInstallTip = document.getElementById("iosInstallTip");
const desktopWarning = document.getElementById("desktopWarning");

// ---------- ESTADO ----------
let deferredPrompt = null;
let isSilentMode = false;
let currentLocation = null;
let watchId = null;
let holdTimer = null;

const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

// ---------- STORAGE ----------
const STORAGE_KEYS = {
  settings: "guardian_sos_settings_v2",
  theme: "guardian_sos_theme_v2",
  silent: "guardian_sos_silent_v2"
};

// ---------- HELPERS ----------
function showToast(message = "Acción completada") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
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
  return !!(settings && settings.contact1 && settings.callContact);
}

function collectFormData() {
  return {
    contact1: sanitizePhone(contact1Input?.value || ""),
    contact2: sanitizePhone(contact2Input?.value || ""),
    callContact: sanitizePhone(callContactInput?.value || ""),
    customMessage: (customMessageInput?.value || "").trim()
  };
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

function updatePreview() {
  const settings = collectFormData();
  if (messagePreview) {
    messagePreview.textContent = buildEmergencyMessage(settings, currentLocation);
  }
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
    const next = body.classList.contains("light") ? "dark" : "light";
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

if (settingsBtn) settingsBtn.addEventListener("click", () => openSettings(false));
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);
if (setupNowBtn) setupNowBtn.addEventListener("click", () => openSettings(true));

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
  if (locationText) locationText.textContent = text;
}

function handleLocationSuccess(position) {
  const lat = Number(position.coords.latitude).toFixed(6);
  const lng = Number(position.coords.longitude).toFixed(6);

  currentLocation = { lat, lng };
  updateLocationUI(`Lat: ${lat}, Lng: ${lng}`);
  updatePreview();
}

function handleLocationError() {
  currentLocation = null;
  updateLocationUI("No se pudo obtener la ubicación en este momento.");
  updatePreview();
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

// ---------- ACCIONES ----------
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

  const separator = isIOS ? "&" : "?";
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

  window.location.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

if (callBtn) callBtn.addEventListener("click", openCall);
if (smsBtn) smsBtn.addEventListener("click", openSMS);
if (waBtn) waBtn.addEventListener("click", openWhatsApp);

// ---------- SOS ----------
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
  }, 700);
}

function startHold() {
  if (sosBtn?.disabled) return;

  sosBtn.classList.add("holding");

  holdTimer = setTimeout(() => {
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

// ---------- PWA TIPO LESHO ----------
function initPWA() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  // PC
  if (!isMobile) {
    if (desktopWarning) desktopWarning.classList.remove("hidden");
    if (installBtn) installBtn.classList.add("hidden");
    return;
  }

  // Ya instalada
  if (isStandalone) {
    if (installBtn) installBtn.classList.add("hidden");
    return;
  }

  // iPhone
  if (isIOS) {
    if (installBtn) installBtn.classList.remove("hidden");
    if (iosInstallTip) iosInstallTip.classList.remove("hidden");
  }

  // Android
  if (isAndroid) {
    if (installBtn) installBtn.classList.remove("hidden");
  }

  // Registrar SW
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("SW registrado");
      })
      .catch((err) => {
        console.error("Error SW:", err);
      });
  }

  // Evento real de instalación
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBtn) installBtn.classList.remove("hidden");

    if (androidInstallTip) {
      androidInstallTip.classList.add("hidden");
    }

    console.log("Prompt de instalación disponible");
  });

  // Click del botón instalar
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      if (installed) {
        showToast("Guardian SOS ya está instalada");
        return;
      }

      // iPhone
      if (isIOS) {
        showToast("En iPhone usa Compartir > Añadir a pantalla de inicio");
        if (iosInstallTip) iosInstallTip.classList.remove("hidden");
        return;
      }

      // Android con prompt
      if (deferredPrompt) {
        deferredPrompt.prompt();

        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
          showToast("Instalando Guardian SOS...");
        } else {
          showToast("Instalación cancelada");
        }

        deferredPrompt = null;
        return;
      }

      // Android sin prompt todavía
      if (isAndroid) {
        showToast("Abre el menú ⋮ de Chrome y toca 'Instalar app' o 'Añadir a pantalla principal'.");
        if (androidInstallTip) androidInstallTip.classList.remove("hidden");
      }
    });
  }

  window.addEventListener("appinstalled", () => {
    showToast("Guardian SOS instalada correctamente 💜");
    if (installBtn) installBtn.classList.add("hidden");
    if (androidInstallTip) androidInstallTip.classList.add("hidden");
    if (iosInstallTip) iosInstallTip.classList.add("hidden");
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