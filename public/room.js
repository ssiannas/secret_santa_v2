import { initSnowflakes } from "./scripts/snowflake.js";
import { initAudio, playAudio, stopAudio } from "./scripts/audio.js";

function updateParticipants(participants) {
  const participantList = document.getElementById('participantList');
  const participantElement = document.getElementById('participants');
  participantElement.innerHTML = participants.map(name => `<div>${name}</div>`).join('');
  participantList.style.display = 'block';
}


const status = document.getElementById('status');
// Setup SSE connection
const eventSource = new EventSource('/events');
function handleRoomUpdate(event) {
  const evtData = JSON.parse(event.data);
  const participants = evtData.participants;
  if (participants) {
    updateParticipants(participants);
    status.textContent = evtData.message;
  }
}

function handleResults(event) {
  const evtData = JSON.parse(event.data);
  console.log('Shuffled event data:', evtData);  // Debug

  const participants = evtData.participants;
  if (participants) {
    updateParticipants(participants);
  }
  status.textContent = evtData.results || evtData.message || 'The room has been shuffled! You will receive an email with your assignment soon.';
}

eventSource.addEventListener('joined', handleRoomUpdate);
eventSource.addEventListener('left', handleRoomUpdate);
eventSource.addEventListener('shuffled', handleResults);

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

// TODO: Add error message to display instead of 
document.addEventListener('DOMContentLoaded', async () => {
  initSnowflakes();
  initAudio();

  // Extract params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const nameFromUrl = urlParams.get('name');
  const emailFromUrl = urlParams.get('email');
  const roomCode = urlParams.get('roomId');
  const leaveButton = document.getElementById('leaveButton');
  const errorMessage = document.getElementById('errorMessage');

  const clearError = () => {
    status.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
  };

  // Leave room button handler
  leaveButton.addEventListener('click', async () => {
    clearError();

    try {
      const response = await fetch('/leave', { method: 'POST' });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/';
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


  // On page load, verify if user has access to this room
  try {
    // Check if user has access to this room
    const response = await fetch(`/session-status/${roomCode}`);
    const data = await response.json();

    if (!response.ok) {
      // Room doesn't exist
      alert('Room not found!');
      window.location.href = '/';
      return;
    }

    const { alreadyJoined, name, participants, maxParticipants, roomStatus } = data;

    if (roomStatus === "shuffled") {
      updateParticipants(participants);
      return;
    }

    if (alreadyJoined) {
      displayLeaveButton();
      displayAsJoined(roomCode, name, participants, maxParticipants);
    } else {
      if (nameFromUrl && emailFromUrl) {
        await joinRoom(nameFromUrl, emailFromUrl, roomCode);
      } else {
        alert('You must join the room first!');
        window.location.href = '/';
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error verifying room access');
    window.location.href = '/';
  }

});

function displayLeaveButton() {
  document.getElementById('leaveButton').style.display = 'inline-block';
}

function displayAsJoined(roomCode, name, participants, maxParticipants, firstTime = false) {
  document.getElementById('roomCode').textContent = `Room Code: ${roomCode}`;

  if (firstTime) {
    document.getElementById('status').textContent = `Welcome to the room, ${name}! Waiting for ${maxParticipants - participants.length} more participants to join.`;
  } else {
    document.getElementById('status').textContent =
      `Welcome back, ${name}! Waiting for ${maxParticipants - participants.length} more.`;
  }
  document.getElementById('participantList').style.display = 'block';

  updateParticipants(participants);
}

async function joinRoom(name, email, roomCode, firstTime = false) {
  const response = await fetch(`/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, roomCode })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message);
    window.location.href = '/';
    return;
  }

  const roomStatus = await fetch(`/session-status/${roomCode}`);
  const roomResponse = await roomStatus.json();
  displayLeaveButton();

  if (roomResponse.roomStatus !== "shuffled") {
    displayAsJoined(roomCode, name, roomResponse.participants, roomResponse.maxParticipants, firstTime = true);
  } else {
    updateParticipants(roomResponse.participants);
  }
}

// Cleanup SSE on page unload
window.addEventListener('beforeunload', () => {
  eventSource.close();
});