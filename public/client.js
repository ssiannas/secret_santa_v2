//===================== snow
import { initSnowflakes } from "./scripts/snowflake.js";
import { initAudio, playAudio, stopAudio } from "./scripts/audio.js";

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

//===================== audio handling
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
  initAudio();

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
