// --- Tab váltás ---
const tabButtons = document.querySelectorAll('nav button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    tabContents.forEach(content => {
      content.style.display = content.id === button.dataset.tab ? 'block' : 'none';
    });
  });
});

// --- Twitch OAuth ---
const clientId = 'g6jpzrt2unj01rbvw83rbnigdq3ft4';
const redirectUri = window.location.origin + window.location.pathname;
const scopes = '';

const twitchLoginBtn = document.getElementById('twitchLoginBtn');
const twitchUsernameSpan = document.getElementById('twitchUsername');
const userInfoDiv = document.getElementById('userInfo');
const loginRequiredMsg = document.getElementById('loginRequiredMsg');
const spinBtn = document.getElementById('spinBtn');
const winnerDisplay = document.getElementById('winner');

let accessToken = null;
let loggedInUserName = null;
let participants = [];
let currentAngle = 0;
let isSpinning = false;

const addNameBtn = document.getElementById('addNameBtn');
const nameInput = document.getElementById('nameInput');

function getAccessTokenFromUrl() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.slice(1));
  return params.get('access_token');
}

function fetchTwitchUser(token) {
  return fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId
    }
  })
    .then(res => res.json())
    .then(data => data.data[0]);
}

function setLoggedInUser(user) {
  loggedInUserName = user.login;
  twitchUsernameSpan.textContent = loggedInUserName;
  userInfoDiv.style.display = 'block';
  loginRequiredMsg.style.display = 'none';
  twitchLoginBtn.style.display = 'none';

  const admins = ['balazssssssss', 'Milanpro37'];
  const isAdmin = admins.includes(loggedInUserName);
  if (isAdmin) {
    document.getElementById('adminNotice').style.display = 'block';
    document.getElementById('adminControls').style.display = 'block';
    spinBtn.disabled = false;
  } else {
    spinBtn.disabled = true;
    winnerDisplay.textContent = '❌ Csak adminok pörgethetik meg a kereket.';
  }
}

function twitchLogin() {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopes}`;
  window.location = authUrl;
}

// --- Wheel rajzolás ---
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

function drawWheel() {
  const radius = canvas.width / 2;
  const centerX = radius;
  const centerY = radius;
  const sliceAngle = 2 * Math.PI / participants.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  participants.forEach((name, index) => {
    const startAngle = sliceAngle * index + currentAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.fillStyle = index % 2 === 0 ? '#ff6a00' : '#fce8dc';
    ctx.strokeStyle = '#1a0f0f';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = index % 2 === 0 ? '#1a0f0f' : '#ff6a00';
    ctx.font = 'bold 16px Poppins, sans-serif';
    ctx.fillText(name, radius - 10, 10);
    ctx.restore();
  });
}

function spinWheel() {
  if (participants.length === 0 || isSpinning) return;

  isSpinning = true;
  spinBtn.disabled = true;
  winnerDisplay.textContent = '';

  const spinDuration = 4000;
  const spins = Math.floor(Math.random() * 5) + 5;
  const randomSlice = Math.random() * (2 * Math.PI);
  const totalRotation = spins * 2 * Math.PI + randomSlice;

  let start = null;

  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;

    if (elapsed < spinDuration) {
      const progress = elapsed / spinDuration;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentAngle = (totalRotation * easeOut) % (2 * Math.PI);
      drawWheel();
      requestAnimationFrame(animate);
    } else {
      currentAngle = totalRotation % (2 * Math.PI);
      drawWheel();
      announceWinner();
      isSpinning = false;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
}

function announceWinner() {
  const sliceAngle = 2 * Math.PI / participants.length;
  const normalizedAngle = (2 * Math.PI - currentAngle + Math.PI / 2) % (2 * Math.PI);
  const index = Math.floor(normalizedAngle / sliceAngle);
  const winner = participants[index];

  winnerDisplay.textContent = `Nyertes: ${winner}! Gratulálunk!`;

  const popup = document.getElementById('popupWinner');
  const popupText = document.getElementById('popupText');
  popupText.textContent = `🎉 Nyertes: ${winner}! 🎉`;
  popup.style.display = 'block';

  setTimeout(() => {
    popup.style.display = 'none';
  }, 6000);
}

addNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name && !participants.includes(name)) {
    participants.push(name);
    nameInput.value = '';
    drawWheel();
  }
});

twitchLoginBtn.addEventListener('click', twitchLogin);

window.addEventListener('load', () => {
  const token = getAccessTokenFromUrl();
  if (token) {
    accessToken = token;
    history.replaceState(null, '', window.location.pathname);
    fetchTwitchUser(accessToken)
      .then(user => setLoggedInUser(user))
      .catch(() => alert('Nem sikerült bejelentkezni Twitch-el.'));
  }
});

spinBtn.addEventListener('click', spinWheel);
drawWheel();

function updateNameList(names) {
  const list = document.getElementById('nameList');
  list.innerHTML = ''; // törli az előző tartalmat
  names.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  });
}

addNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name && !participants.includes(name)) {
    participants.push(name);
    nameInput.value = '';
    drawWheel();
    updateNameList(participants); // <--- itt frissíted a listát
  }
});
