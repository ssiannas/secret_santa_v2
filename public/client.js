 //===================== audio
  var source = "music/music.mp3"
  var audio = document.createElement("audio");
  audio.autoplay = true;
  audio.controls = true;
  audio.volume = 0.01; // 0.1
  //
  audio.load()
  audio.addEventListener("load", function() { 
      audio.play(); 
  }, true);
  audio.src = source;
  document.body.appendChild(audio);


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
    const evtData = JSON.parse(event.data);
    const participants = evtData.participants;
    if (!participants) return;
    
    const isResult = evtData.shuffled;
    const result = evtData.results;
    const msg = evtData.message;

    participantList.innerHTML = participants.map(name => `<div>${name}</div>`).join('');
    participantDiv.style.display = 'block';

    if (isResult) {
      status.textContent = `You will give a gift to: ${result} ❤️`;
    } else {
      status.textContent = msg;
    }
  };

  //===================== snow
  const NUMBER_OF_SNOWFLAKES = 300;
  const MAX_SNOWFLAKE_SIZE = 5;
  const MAX_SNOWFLAKE_SPEED = 2;
  const SNOWFLAKE_COLOUR = '#ddddddb3';
  const snowflakes = [];

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.pointerEvents = 'none';
  canvas.style.top = '0px';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');


  const createSnowflake = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.floor(Math.random() * MAX_SNOWFLAKE_SIZE) + 1,
      color: SNOWFLAKE_COLOUR,
      speed: Math.random() * MAX_SNOWFLAKE_SPEED + 1,
      sway: Math.random() - 0.5 // next
  });

  const drawSnowflake = snowflake => {
      ctx.beginPath();
      ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2);
      ctx.fillStyle = snowflake.color;
      ctx.fill();
      ctx.closePath();
  }

  const updateSnowflake = snowflake => {
      snowflake.y += snowflake.speed;
      snowflake.x += snowflake.sway; // next
      if (snowflake.y > canvas.height) {
          Object.assign(snowflake, createSnowflake());
      }
  }

  const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach(snowflake => {
          updateSnowflake(snowflake);
          drawSnowflake(snowflake);
      });

      requestAnimationFrame(animate);
  }

  for (let i = 0; i < NUMBER_OF_SNOWFLAKES; i++) {
      snowflakes.push(createSnowflake());
  }

  window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  });

  window.addEventListener('scroll', () => {
      canvas.style.top = `${window.scrollY}px`;
  });

  // setInterval(animate, 15);
  animate()


});
