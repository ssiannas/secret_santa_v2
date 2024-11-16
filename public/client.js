document.addEventListener('DOMContentLoaded', async () => {
  const nameInput = document.getElementById('nameInput');
  const joinButton = document.getElementById('joinButton');
  const participantList = document.getElementById('participants');
  const status = document.getElementById('status');
  const participantDiv = document.getElementById('participantList');
  const errorMessage = document.getElementById('errorMessage'); // Error message div

  // Clear error message
  const clearError = () => {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
  };

  try {
    const response = await fetch('/session-status');
    const { alreadyJoined, name } = await response.json();

    if (alreadyJoined) {
      status.textContent = `Welcome back, ${name}!`;
      nameInput.style.display = 'none';
      joinButton.style.display = 'none';
      participantDiv.style.display = 'block';
      leaveButton.style.display = 'inline-block';
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
      const data = await response.json();

      if (response.ok) {
        status.textContent = data.message;
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
        participantDiv.style.display = 'none';
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
    const participants = JSON.parse(event.data);
    participantList.innerHTML = participants.map(name => `<div>${name}</div>`).join('');
    participantDiv.style.display = 'block';
  };
});
