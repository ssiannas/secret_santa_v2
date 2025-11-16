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
audio.addEventListener("load", function() { 
    audio.play(); 
}, true);
audio.src = source;
document.body.appendChild(audio);

function updateParticipants(participants) {
    const participantList = document.getElementById('participantList');
    const participantElement = document.getElementById('participants');
    participantElement.innerHTML = participants.map(name => `<div>${name}</div>`).join('');
    participantList.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', async () => {
  initSnowflakes();
  const nameInput = document.getElementById('nameInput');
  const joinButton = document.getElementById('joinButton');
  const status = document.getElementById('status');
  const errorMessage = document.getElementById('errorMessage'); // Error message div
  const participantList = document.getElementById('participantList');

  // Clear error message
  const clearError = () => {
    status.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
  };

  try {
    const response = await fetch('/session-status');
    const { alreadyJoined, name, participants, maxParticipants } = await response.json();

    if (alreadyJoined) {
      status.textContent = `Welcome back, ${name}! Still waiting for ${maxParticipants - participants.length} more.`;
      nameInput.style.display = 'none';
      joinButton.style.display = 'none';
      participantList.style.display = 'block';
      leaveButton.style.display = 'inline-block';
      updateParticipants(participants);
    }
  } catch (error) {
    console.error('Error checking session status:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Unable to fetch session status. Please try again later.';
  }

  joinButton.addEventListener('click', async () => {
    clearError(); // Clear any previous errors

    const name = nameInput.value.trim();
    if (!name) {
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'Please enter your name!';
      return;
    }

    try {
      const response = await fetch('/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response;

      if (response.ok) {
        nameInput.style.display = 'none';
        joinButton.style.display = 'none';
        leaveButton.style.display = 'inline-block';
      } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = data.message || 'Error joining!';
      }
    } catch (error) {
      console.error('Error joining:', error);
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'An unexpected error occurred. Please try again.';
    }
  });

  leaveButton.addEventListener('click', async () => {
    clearError();

    try {
      const response = await fetch('/leave', { method: 'POST' });

      const data = await response.json();

      if (response.ok) {
        status.textContent = 'You have left';
        nameInput.style.display = 'inline-block';
        joinButton.style.display = 'inline-block';
        leaveButton.style.display = 'none';
        participantList.style.display = 'none';
      } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = data.message || 'Error leaving!';
      }
    } catch (error) {
      console.error('Error leaving:', error);
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'An unexpected error occurred';
    }
  });

  const eventSource = new EventSource('/events');
  eventSource.onmessage = (event) => {
    const evtData = JSON.parse(event.data);
    const participants = evtData.participants;
    if (!participants) return;
    
    const isResult = evtData.shuffled;
    const result = evtData.results;
    const msg = evtData.message;

    updateParticipants(participants);

    if (isResult) {
      status.textContent = `You will give a gift to: ${result} ❤️`;
    } else if(msg !== ""){
      status.textContent = msg;
    }
  };
});
