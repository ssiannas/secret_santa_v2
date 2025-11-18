//===================== audio
if (!window.audioContext) {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
}
const audioContext = window.audioContext;

async function loadAudio() {
    try {
        const response = await fetch('music/music.mp3');
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        window.audioBuffer = audioBuffer;

        if (localStorage.getItem("musicPlaying") !== "false") {
            playAudio();
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

export function playAudio() {
    if (!window.audioBuffer) return;

    // Stop any currently playing audio first
    if (window.currentAudioSource) {
        try {
            window.currentAudioSource.stop();
        } catch (e) {
            // Source already stopped, ignore error
        }
    }

    // Create a source node
    const source = audioContext.createBufferSource();
    source.buffer = window.audioBuffer;
    source.loop = true; // Loop the audio

    // Create a gain node for volume control
    if (!window.gainNode) {
        window.gainNode = audioContext.createGain();
        window.gainNode.connect(audioContext.destination);
    }

    source.connect(window.gainNode);
    window.gainNode.gain.value = 0.1; // Volume

    source.start(0);
    window.currentAudioSource = source;
    window.isAudioPlaying = true;
}

export function stopAudio() {
    if (window.currentAudioSource) {
        try {
            window.currentAudioSource.stop();
            window.currentAudioSource = null;
        } catch (e) {
            // Source already stopped, ignore error
        }
    }
    window.isAudioPlaying = false; if (window.currentAudioSource) {
        window.currentAudioSource.stop();
    }
}

function createMusicButton(shouldUpdateOnInit = false) {
    const musicButton = document.createElement("button");
    musicButton.id = "musicToggle";
    musicButton.textContent = "🔊 Music On";
    musicButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.3s ease;
    `;

    function updateButton() {
        if (window.isAudioPlaying) {
            musicButton.textContent = "🔊 Music On";
            musicButton.style.backgroundColor = "#28a745";
        } else {
            musicButton.textContent = "🔇 Music Off";
            musicButton.style.backgroundColor = "#dc3545";
        }
    }

    musicButton.addEventListener("click", function (e) {
        e.stopPropagation();

        if (window.isAudioPlaying) {
            stopAudio();
            localStorage.setItem("musicPlaying", "false");
        } else {
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }
            playAudio();
            localStorage.setItem("musicPlaying", "true");
        }
        updateButton();
    });

    if (shouldUpdateOnInit) {
        updateButton();
    }

    document.body.appendChild(musicButton);
}



export function initAudio(shouldUpdateMusicBtnOnInit = false) {
    if (localStorage.getItem("musicPlaying") === null) {
        localStorage.setItem("musicPlaying", "true");
    }
    createMusicButton(shouldUpdateMusicBtnOnInit);

    // Only fetch and decode audio once
    if (!window.audioBuffer) {
        loadAudio();
    } else {
        // Audio already loaded, just play if it was playing
        if (localStorage.getItem("musicPlaying") !== "false") {
            playAudio();
        }
    }
}

