"use strict";

const STREAM_URL = "https://video2.getstreamhosting.com:8070/stream";
const METADATA_URL = "https://video2.getstreamhosting.com:8070/status-json.xsl";
const REWARD_URL = "https://ktxretro.godaddysites.com/pad-rewards";
const BETA_SIGNAL = "GLITCH";

const bootScreen = document.getElementById("boot-screen");
const bootLog = document.getElementById("boot-log");
const bootEnter = document.getElementById("boot-enter");
const appShell = document.getElementById("app-shell");

const bootMessages = [
  "SIGNAL OVERRIDE DETECTED...",
  "BYPASSING P.A.D. SECURITY...",
  "REWRITING INTERFACE...",
  "TRENDING FOREVER...",
  "THE SIRENS OF POP HAVE ASSUMED CONTROL.",
  "WELCOME TO THE FREQUENCY."
];

let bootIndex = 0;
function runBootSequence() {
  bootLog.textContent = bootMessages[bootIndex++];
  if (bootIndex < bootMessages.length) {
    setTimeout(runBootSequence, 550);
  } else {
    setTimeout(() => { bootEnter.hidden = false; }, 350);
  }
}

bootEnter.addEventListener("click", () => {
  sessionStorage.setItem("pad-boot-complete", "true");
  bootScreen.hidden = true;
  appShell.hidden = false;
});

if (sessionStorage.getItem("pad-boot-complete") === "true") {
  bootScreen.hidden = true;
  appShell.hidden = false;
} else {
  runBootSequence();
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active-screen"));
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
    document.getElementById(button.dataset.screen)?.classList.add("active-screen");
    button.classList.add("active");
  });
});

const radioAudio = document.getElementById("radio-audio");
const playButton = document.getElementById("play-button");
const muteButton = document.getElementById("mute-button");
const trackArtist = document.getElementById("track-artist");
const trackTitle = document.getElementById("track-title");

function setPlaying(isPlaying) {
  playButton.textContent = isPlaying ? "❚❚" : "▶";
  playButton.setAttribute("aria-label", isPlaying ? "Pause KTX Radio" : "Play KTX Radio");
}

playButton.addEventListener("click", async () => {
  if (radioAudio.paused) {
    try {
      radioAudio.src = STREAM_URL;
      await radioAudio.play();
      setPlaying(true);
    } catch (error) {
      console.error("KTX playback failed:", error);
      setPlaying(false);
    }
  } else {
    radioAudio.pause();
    setPlaying(false);
  }
});

muteButton.addEventListener("click", () => {
  radioAudio.muted = !radioAudio.muted;
  muteButton.textContent = radioAudio.muted ? "×" : "◖";
});

function showFallbackMetadata() {
  trackArtist.textContent = "KTX RETRO";
  trackTitle.textContent = "LIVE TRANSMISSION";
}

function displayMetadata(value) {
  const title = String(value || "").trim();
  if (!title) return showFallbackMetadata();
  const separator = title.includes(" - ") ? " - " : title.includes(" — ") ? " — " : null;
  if (!separator) {
    trackArtist.textContent = "KTX RETRO";
    trackTitle.textContent = title;
    return;
  }
  const parts = title.split(separator);
  trackArtist.textContent = parts.shift().trim() || "KTX RETRO";
  trackTitle.textContent = parts.join(separator).trim() || title;
}

async function updateMetadata() {
  try {
    const response = await fetch(METADATA_URL, { cache: "no-store" });
    const payload = await response.json();
    const source = payload?.icestats?.source;
    const selected = Array.isArray(source)
      ? source.find((item) => String(item?.listenurl || "").includes("/stream")) || source[0]
      : source;
    displayMetadata(selected?.title);
  } catch (error) {
    showFallbackMetadata();
  }
}

showFallbackMetadata();
updateMetadata();
setInterval(updateMetadata, 15000);

const dossierResponse = document.getElementById("dossier-response");
const dossierModal = document.getElementById("dossier-modal");
const dossierClose = document.getElementById("dossier-close");
const dossierFullImage = document.getElementById("dossier-full-image");

document.querySelectorAll("[data-dossier]").forEach((button) => {
  button.addEventListener("click", () => {
    const image = button.dataset.image;
    const name = button.querySelector("em")?.textContent || "Authorized dossier";

    dossierFullImage.src = image;
    dossierFullImage.alt = `${name} classified dossier`;
    dossierModal.hidden = false;
    document.body.style.overflow = "hidden";
    dossierResponse.textContent = `${name.toUpperCase()} // FILE OPENED`;
  });
});

function closeDossier() {
  dossierModal.hidden = true;
  dossierFullImage.src = "";
  document.body.style.overflow = "";
}

dossierClose.addEventListener("click", closeDossier);
dossierModal.addEventListener("click", (event) => {
  if (event.target === dossierModal) {
    closeDossier();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dossierModal.hidden) {
    closeDossier();
  }
});

const decoderForm = document.getElementById("decoder-form");
const decoderInput = document.getElementById("decoder-input");
const decoderResponse = document.getElementById("decoder-response");
let failedSignalCount = Number(sessionStorage.getItem("pad-failed-signals") || 0);

decoderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const signal = decoderInput.value.trim().toUpperCase();
  decoderResponse.textContent = "VERIFYING FREQUENCY...";

  setTimeout(() => {
    if (signal === BETA_SIGNAL) {
      localStorage.setItem("pad-beta-signal-glitch", "verified");
      decoderResponse.innerHTML = `FREQUENCY VERIFIED<br>WE HEARD YOU<br>WELCOME TO THE FREQUENCY<br><br><a href="${REWARD_URL}" target="_blank" rel="noopener noreferrer">ACCESS RECOVERED FILE</a>`;
    } else {
      failedSignalCount += 1;
      sessionStorage.setItem("pad-failed-signals", String(failedSignalCount));
      decoderResponse.innerHTML = failedSignalCount >= 3
        ? "FREQUENCY NOT RECOGNIZED<br>UNAUTHORIZED LISTENER DETECTED<br>YOUR ATTEMPT HAS BEEN NOTED"
        : "FREQUENCY NOT RECOGNIZED<br>NO MATCH FOUND<br>TRY LISTENING CLOSER";
    }
  }, 900);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(console.warn);
  });
}
