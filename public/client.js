//===================== snow
import { initSnowflakes } from "./scripts/snowflake.js";

//===================== audio
var source = "music/music.mp3"
var audio = document.createElement("audio");
audio.autoplay = true;
audio.controls = true;
audio.volume = 0.1; // 0.1
//
audio.load()
audio.addEventListener("load", function () {
  audio.play();
}, true);
audio.src = source;
document.body.appendChild(audio);

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

document.addEventListener('DOMContentLoaded', async () => {
  initSnowflakes();
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
