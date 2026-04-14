const settingsBtn = document.getElementById("settingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsForm = document.getElementById("settingsForm");

const themeToggle = document.getElementById("themeToggle");
const silentToggle = document.getElementById("silentToggle");

const sosBtn = document.getElementById("sosBtn");
const sosSubText = document.getElementById("sosSubText");
const cancelBtn = document.getElementById("cancelBtn");
const countdownPanel = document.getElementById("countdownPanel");

const callBtn = document.getElementById("callBtn");
const smsBtn = document.getElementById("smsBtn");
const waBtn = document.getElementById("waBtn");

const statusBadge = document.getElementById("statusBadge");
const locationText = document.getElementById("locationText");
const messagePreview = document.getElementById("messagePreview");
const toast = document.getElementById("toast");

const setupBanner = document.getElementById("setupBanner");
const setupNowBtn = document.getElementById("setupNowBtn");
const modalTitle = document.getElementById("modalTitle");
const onboardingNote = document.getElementById("onboardingNote");

// PWA
const installBtn = document.getElementById("installBtn");
const iosInstallTip = document.getElementById("iosInstallTip");

let currentLocation = null;
let holdTimer = null;
let sosArmed = false;
let isSendingSOS = false;
let deferredPrompt = null;

let isSilent = JSON.parse(localStorage.getItem("guardianLiteSilentPWA1")) || false;

let config = JSON.parse(localStorage.getItem("guardianLiteConfigPWA1")) || {
  contact1: "",
  contact2: "",
  callContact: "",
  customMessage:
    "🚨 ALERTA DE EMERGENCIA: Estoy en una situación de riesgo y necesito ayuda inmediata. Si puedes, llámame ahora o comparte mi ubicación con alguien de confianza."
};

// =======================
// UTILIDADES
// =======================
function showToast(message, duration = 2200) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function saveConfig() {
  localStorage.setItem("guardianLiteConfigPWA1", JSON.stringify(config));
}

function isConfigured() {
  return Boolean(sanitizePhone(config.contact1) && sanitizePhone(config.callContact));
}

function updateSilentUI() {
  silentToggle.textContent = isSilent ? "🔕" : "🔇";
  localStorage.setItem("guardianLiteSilentPWA1", JSON.stringify(isSilent));
}

function getDefaultSOSMessage() {
  return "🚨 ALERTA DE EMERGENCIA: Estoy en una situación de riesgo y necesito ayuda inmediata. Si puedes, llámame ahora o comparte mi ubicación con alguien de confianza.";
}

function buildSOSMessage() {
  const base = config.customMessage || getDefaultSOSMessage();

  let locationPart = "\n📍 Ubicación: Intentando obtener ubicación...";
  if (currentLocation) {
    const mapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
    locationPart = `\n📍 Mi ubicación actual:\n${mapsLink}`;
  }

  return `${base}${locationPart}`;
}

function updatePreview() {
  messagePreview.textContent = buildSOSMessage();
}

function loadForm() {
  document.getElementById("contact1").value = config.contact1 || "";
  document.getElementById("contact2").value = config.contact2 || "";
  document.getElementById("callContact").value = config.callContact || "";
  document.getElementById("customMessage").value = config.customMessage || "";
}

function setReadyStatus() {
  if (!isConfigured()) {
    statusBadge.textContent = "🟡 Configuración requerida";
    return;
  }

  if (currentLocation) {
    statusBadge.textContent = "🟢 Protección activa";
  } else {
    statusBadge.textContent = "🟠 Protección activa (sin ubicación exacta)";
  }
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// =======================
// UI DE CONFIGURACIÓN / ONBOARDING
// =======================
function updateSetupState() {
  const configured = isConfigured();

  if (!configured) {
    setupBanner.classList.remove("hidden");
    sosBtn.classList.add("disabled");
    smsBtn.classList.add("disabled");
    waBtn.classList.add("disabled");

    sosSubText.textContent = "Primero configura tu protección";
    statusBadge.textContent = "🟡 Configuración requerida";
  } else {
    setupBanner.classList.add("hidden");
    sosBtn.classList.remove("disabled");
    smsBtn.classList.remove("disabled");
    waBtn.classList.remove("disabled");

    sosSubText.textContent = "Mantén 1 segundo";
    setReadyStatus();
  }
}

function openSettingsModal(forceOnboarding = false) {
  settingsModal.classList.remove("hidden");

  if (forceOnboarding && !isConfigured()) {
    modalTitle.textContent = "🛡️ Configuración inicial";
    onboardingNote.classList.remove("hidden");
    closeSettingsBtn.classList.add("hidden");
  } else {
    modalTitle.textContent = "⚙️ Ajustes rápidos";
    onboardingNote.classList.add("hidden");
    closeSettingsBtn.classList.remove("hidden");
  }
}

function closeSettingsModalSafe() {
  if (!isConfigured()) {
    showToast("Primero guarda la configuración mínima");
    return;
  }

  settingsModal.classList.add("hidden");
  closeSettingsBtn.classList.remove("hidden");
  onboardingNote.classList.add("hidden");
  modalTitle.textContent = "⚙️ Ajustes rápidos";
}

// =======================
// TEMA
// =======================
function loadTheme() {
  const savedTheme = localStorage.getItem("guardianLiteThemePWA1");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeToggle.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("guardianLiteThemePWA1", isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "☀️" : "🌙";
});

// =======================
// MODAL AJUSTES
// =======================
settingsBtn.addEventListener("click", () => {
  openSettingsModal(false);
});

setupNowBtn.addEventListener("click", () => {
  openSettingsModal(true);
});

closeSettingsBtn.addEventListener("click", closeSettingsModalSafe);

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    closeSettingsModalSafe();
  }
});

settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  config = {
    contact1: document.getElementById("contact1").value.trim(),
    contact2: document.getElementById("contact2").value.trim(),
    callContact: document.getElementById("callContact").value.trim(),
    customMessage:
      document.getElementById("customMessage").value.trim() || getDefaultSOSMessage()
  };

  saveConfig();
  updatePreview();
  updateSetupState();

  settingsModal.classList.add("hidden");
  closeSettingsBtn.classList.remove("hidden");
  onboardingNote.classList.add("hidden");
  modalTitle.textContent = "⚙️ Ajustes rápidos";

  showToast("Protección configurada correctamente");

  setTimeout(() => {
    getLocation();
  }, 250);
});

// =======================
// SILENCIOSO
// =======================
silentToggle.addEventListener("click", () => {
  isSilent = !isSilent;
  updateSilentUI();
  showToast(isSilent ? "Modo silencioso activado" : "Modo silencioso desactivado");
});

// =======================
// UBICACIÓN
// =======================
function getLocation(callback) {
  if (!navigator.geolocation) {
    locationText.textContent = "Tu navegador no soporta geolocalización";
    if (isConfigured()) {
      statusBadge.textContent = "🟠 Protección activa (sin ubicación exacta)";
    }
    updatePreview();
    if (callback) callback(false);
    return;
  }

  locationText.textContent = "Obteniendo ubicación...";
  if (isConfigured()) {
    statusBadge.textContent = "🟡 Obteniendo ubicación...";
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      currentLocation = { lat, lng };
      locationText.textContent = `Lat: ${lat}, Lng: ${lng}`;
      updatePreview();
      setReadyStatus();

      if (callback) callback(true);
    },
    () => {
      locationText.textContent = "No se pudo obtener la ubicación";
      if (isConfigured()) {
        statusBadge.textContent = "🟠 Protección activa (sin ubicación exacta)";
      }
      updatePreview();

      if (callback) callback(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 15000
    }
  );
}

// =======================
// FEEDBACK
// =======================
function triggerFeedback() {
  if (isSilent) return;

  if (navigator.vibrate) {
    navigator.vibrate([180, 80, 180]);
  }

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 220);
  } catch (e) {}
}

// =======================
// ACCIONES RÁPIDAS
// =======================
function callEmergency() {
  const phone = sanitizePhone(config.callContact);

  if (!phone) {
    showToast("Configura el número de llamada rápida");
    openSettingsModal(true);
    return;
  }

  window.location.href = `tel:${phone}`;
}

function sendSMS(target) {
  const phone = sanitizePhone(target || config.contact1);

  if (!phone) return false;

  const message = buildSOSMessage();
  window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  return true;
}

function sendWhatsApp(target) {
  const phone = sanitizePhone(target || config.contact1);

  if (!phone) return false;

  const message = buildSOSMessage();
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

callBtn.addEventListener("click", callEmergency);

smsBtn.addEventListener("click", () => {
  if (!isConfigured()) {
    showToast("Primero configura tu protección");
    openSettingsModal(true);
    return;
  }

  getLocation(() => {});
  sendSMS(config.contact1);
});

waBtn.addEventListener("click", () => {
  if (!isConfigured()) {
    showToast("Primero configura tu protección");
    openSettingsModal(true);
    return;
  }

  getLocation(() => {});
  sendWhatsApp(config.contact1);
});

// =======================
// SOS FLOW (SIN COUNTDOWN)
// =======================
function startHold() {
  if (!isConfigured()) {
    showToast("Primero configura tu protección");
    openSettingsModal(true);
    return;
  }

  if (sosArmed || isSendingSOS) return;

  statusBadge.textContent = "🔴 Mantén presionado...";
  sosBtn.classList.add("holding");

  holdTimer = setTimeout(() => {
    activateSOS();
  }, 1000);
}

function cancelHold() {
  if (isSendingSOS) return;

  clearTimeout(holdTimer);
  sosBtn.classList.remove("holding");

  if (!sosArmed) {
    setReadyStatus();
  }
}

function cancelCountdown() {
  clearTimeout(holdTimer);
  sosBtn.classList.remove("holding");
  countdownPanel.classList.add("hidden");
  sosArmed = false;
  isSendingSOS = false;
  statusBadge.textContent = "🟢 Alerta cancelada";
  showToast("Alerta cancelada");

  setTimeout(() => {
    setReadyStatus();
  }, 1200);
}

function activateSOS() {
  if (!isConfigured()) {
    showToast("Primero configura tu protección");
    openSettingsModal(true);
    return;
  }

  if (isSendingSOS) return;

  clearTimeout(holdTimer);
  sosBtn.classList.remove("holding");
  countdownPanel.classList.add("hidden");

  sosArmed = true;
  isSendingSOS = true;

  statusBadge.textContent = "🚨 SOS ACTIVADO";
  triggerFeedback();
  showToast("Enviando alerta inmediata...", 1800);

  // Obtener ubicación en segundo plano
  getLocation(() => {});

  // WhatsApp principal inmediato
  if (config.contact1) {
    sendWhatsApp(config.contact1);
  }

  // SMS respaldo
  setTimeout(() => {
    if (config.contact1) {
      sendSMS(config.contact1);
    }
  }, 600);

  // WhatsApp secundario
  setTimeout(() => {
    if (config.contact2) {
      sendWhatsApp(config.contact2);
    }
  }, 1100);

  setTimeout(() => {
    sosArmed = false;
    isSendingSOS = false;
    setReadyStatus();
  }, 2500);
}

cancelBtn.addEventListener("click", cancelCountdown);

// Mouse
sosBtn.addEventListener("mousedown", startHold);
sosBtn.addEventListener("mouseup", cancelHold);
sosBtn.addEventListener("mouseleave", cancelHold);

// Touch
sosBtn.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    startHold();
  },
  { passive: false }
);

sosBtn.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    cancelHold();
  },
  { passive: false }
);

// =======================
// PWA / INSTALACIÓN
// =======================
function initPWAInstall() {
  // Mostrar ayuda para iPhone/iPad si no está instalada
  if (isIOS() && !isInStandaloneMode()) {
    if (iosInstallTip) {
      iosInstallTip.classList.remove("hidden");
    }
  }

  // Registrar service worker
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

  // Capturar prompt de instalación (Android / Chrome / Desktop)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBtn && !isInStandaloneMode()) {
      installBtn.classList.remove("hidden");
    }
  });

  // Botón instalar
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) {
        if (isIOS()) {
          showToast("En iPhone usa: Compartir → Añadir a pantalla de inicio", 3200);
        } else {
          showToast("Tu navegador aún no muestra la opción de instalación", 2800);
        }
        return;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        showToast("Instalando aplicación...");
      } else {
        showToast("Instalación cancelada");
      }

      deferredPrompt = null;
      installBtn.classList.add("hidden");
    });
  }

  // Si ya fue instalada
  window.addEventListener("appinstalled", () => {
    showToast("App instalada correctamente 💜");
    if (installBtn) {
      installBtn.classList.add("hidden");
    }
  });

  // Si ya está instalada, ocultar botón
  if (isInStandaloneMode() && installBtn) {
    installBtn.classList.add("hidden");
  }
}

// =======================
// INICIO
// =======================
loadTheme();
loadForm();
updatePreview();
updateSilentUI();
updateSetupState();
initPWAInstall();

if (countdownPanel) {
  countdownPanel.classList.add("hidden");
}

// Intentar obtener ubicación automáticamente
setTimeout(() => {
  getLocation();
}, 300);

// Si es primera vez, abrir onboarding automáticamente
if (!isConfigured()) {
  setTimeout(() => {
    openSettingsModal(true);
  }, 500);
}