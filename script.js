"use strict";

// --------------------------------------------------
// SCREEN NAVIGATION
// --------------------------------------------------

const navButtons = document.querySelectorAll(".nav-button");
const screens = document.querySelectorAll(".screen");

navButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetScreen = button.dataset.screen;

        screens.forEach((screen) => {
            screen.classList.remove("active-screen");
        });

        navButtons.forEach((navButton) => {
            navButton.classList.remove("active");
        });

        const selectedScreen = document.getElementById(targetScreen);

        if (selectedScreen) {
            selectedScreen.classList.add("active-screen");
            button.classList.add("active");
        }
    });
});


// --------------------------------------------------
// KTX RADIO PLAYER
// --------------------------------------------------

const streamUrl =
    "https://video2.getstreamhosting.com:8070/stream";

const metadataUrl =
    "https://video2.getstreamhosting.com:8070/status-json.xsl";

const radioAudio = document.getElementById("radio-audio");
const playButton = document.getElementById("play-button");
const muteButton = document.getElementById("mute-button");
const trackArtist = document.getElementById("track-artist");
const trackTitle = document.getElementById("track-title");

function showStoppedButton() {
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "Play KTX Radio");
}

function showPlayingButton() {
    playButton.textContent = "❚❚";
    playButton.setAttribute("aria-label", "Pause KTX Radio");
}

playButton.addEventListener("click", async () => {
    if (radioAudio.paused) {
        try {
            // Reconnects to the live point of the broadcast.
            radioAudio.src = streamUrl;
            await radioAudio.play();
            showPlayingButton();
        } catch (error) {
            console.error("Radio playback failed:", error);
            showStoppedButton();
        }
    } else {
        radioAudio.pause();
        showStoppedButton();
    }
});

muteButton.addEventListener("click", () => {
    radioAudio.muted = !radioAudio.muted;

    if (radioAudio.muted) {
        muteButton.textContent = "×";
        muteButton.setAttribute("aria-label", "Unmute KTX Radio");
    } else {
        muteButton.textContent = "◖";
        muteButton.setAttribute("aria-label", "Mute KTX Radio");
    }
});

radioAudio.addEventListener("error", () => {
    showStoppedButton();
});


// --------------------------------------------------
// CURRENT SONG METADATA
// --------------------------------------------------

function showFallbackMetadata() {
    trackArtist.textContent = "KTX RETRO";
    trackTitle.textContent = "LIVE TRANSMISSION";
}

function findIcecastSource(payload) {
    const source = payload?.icestats?.source;

    if (!source) {
        return null;
    }

    if (Array.isArray(source)) {
        return (
            source.find((item) =>
                String(item?.listenurl || "").includes("/stream")
            ) ||
            source.find((item) => item?.title) ||
            source[0]
        );
    }

    return source;
}

function displayMetadata(rawTitle) {
    const title = String(rawTitle || "").trim();

    if (!title) {
        showFallbackMetadata();
        return;
    }

    const separator = title.includes(" - ")
        ? " - "
        : title.includes(" — ")
            ? " — "
            : null;

    if (separator) {
        const parts = title.split(separator);
        const artist = parts.shift().trim();
        const song = parts.join(separator).trim();

        trackArtist.textContent = artist || "KTX RETRO";
        trackTitle.textContent = song || title;
    } else {
        trackArtist.textContent = "KTX RETRO";
        trackTitle.textContent = title;
    }
}

async function updateMetadata() {
    try {
        const response = await fetch(metadataUrl, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Metadata error: ${response.status}`);
        }

        const payload = await response.json();
        const source = findIcecastSource(payload);

        displayMetadata(source?.title);
    } catch (error) {
        console.warn("Metadata unavailable:", error);
        showFallbackMetadata();
    }
}

showFallbackMetadata();
updateMetadata();
window.setInterval(updateMetadata, 15000);


// --------------------------------------------------
// PAD SIGNAL DECODER
// --------------------------------------------------

const decoderForm = document.getElementById("decoder-form");
const decoderInput = document.getElementById("decoder-input");
const decoderResponse =
    document.getElementById("decoder-response");

const rewardUrl =
    "https://ktxretro.godaddysites.com/pad-rewards";

function decodeA1Z26(value) {
    const cleanedValue = value.trim().toUpperCase();

    // Also accepts the decoded word itself.
    if (/^[A-Z]+$/.test(cleanedValue)) {
        return cleanedValue;
    }

    const numbers = cleanedValue
        .split(/[^0-9]+/)
        .filter(Boolean)
        .map(Number);

    if (
        numbers.length === 0 ||
        numbers.some((number) => number < 1 || number > 26)
    ) {
        return null;
    }

    return numbers
        .map((number) =>
            String.fromCharCode(64 + number)
        )
        .join("");
}

function showDecoderFailure() {
    decoderResponse.innerHTML = `
        ACCESS DENIED<br>
        NO RECOGNIZED PAD SIGNAL PATTERN
    `;
}

function showStaticReward() {
    localStorage.setItem(
        "ktx-interface-override-unlocked",
        "true"
    );

    decoderResponse.innerHTML = `
        SIGNAL VERIFIED<br>
        RECOVERED TRANSMISSION LOCATED<br>
        INTERFACE OVERRIDE ACCESS GRANTED<br><br>
        <a
            href="${rewardUrl}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ACCESS FILE
        </a>
    `;
}

decoderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const decodedSignal = decodeA1Z26(decoderInput.value);

    decoderResponse.textContent = "DECRYPTING SIGNAL...";

    window.setTimeout(() => {
        if (decodedSignal === "STATIC") {
            showStaticReward();
        } else {
            showDecoderFailure();
        }
    }, 900);
});