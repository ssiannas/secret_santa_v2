//===================== snow
import { initSnowflakes } from "./scripts/snowflake.js";

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

function playAudio() {
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

function stopAudio() {
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

function createMusicButton() {
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

  document.body.appendChild(musicButton);
}

//===================== core functions
function validateEmail(emailInput) {
  if (!emailInput.validity.valid) {
    emailInput.reportValidity();
    return false;
  }
  return true;
}

function validateName(nameInput) {
  if (nameInput.value.trim() === '') {
    nameInput.setCustomValidity('Name cannot be empty');
    nameInput.reportValidity();
    return false;
  }
  return true;
}

function validateCommonInput(emailInput, nameInput) {
  return validateEmail(emailInput) &&
    validateName(nameInput);
}

function getRoomURl(roomId, name, email) {
  return `/room.html?roomId=${roomId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
}

function initAudio() {
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

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    // User locked screen or switched tabs - stop audio
    stopAudio();
  } else {
    // User came back - resume if it was playing
    if (localStorage.getItem("musicPlaying") !== "false") {
      playAudio();
    }
  }
});

document.addEventListener("click", function () {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}, { once: true });

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize snowflakes and audio
  initSnowflakes();

  if (localStorage.getItem("musicPlaying") === null) {
    localStorage.setItem("musicPlaying", "true");
  }
  createMusicButton();
  initAudio();

  // Only fetch and decode audio once
  if (!window.audioBuffer) {
    initAudio();
  } else {
    // Audio already loaded, just play if it was playing
    if (localStorage.getItem("musicPlaying") !== "false") {
      playAudio();
    }
  }


  const nameInput = document.getElementById('nameInput');
  const roomId = document.getElementById('roomInput');
  const emailInput = document.getElementById('emailInput');
  const maxParticipantsInput = document.getElementById('maxRoomParticipants');

  const status = document.getElementById('status');
  const errorMessage = document.getElementById('errorMessage'); // 

  // Forms
  const joinRoomForm = document.getElementById('joinRoomForm');
  const createRoomForm = document.getElementById('createRoomForm');

  // Clear error message
  const clearError = () => {
    status.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
  };

  joinRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateCommonInput(emailInput, nameInput)) {
      return;
    }

    const roomCode = roomId.value.trim();

    clearError(); // Clear any previous errors

    window.location.href = getRoomURl(roomCode, nameInput.value.trim(), emailInput.value.trim());
  });

  createRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateCommonInput(emailInput, nameInput)) {
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const maxParticipants = parseInt(maxParticipantsInput.value);
    clearError(); // Clear any previous errors

    try {
      const response = await fetch('/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, maxParticipants })
      });
      const data = await response.json();
      if (response.ok) {
        window.location.href = getRoomURl(data.roomId, name, email);
      } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = data.message || 'Error creating room!';
      }
    } catch (error) {
      console.error('Error creating room:', error);
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'An unexpected error while creating the room. Please try again.';
    }
  });
});
