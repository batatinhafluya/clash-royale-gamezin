let cardsData = [];
let deck = [];
let unlockedCards = ["Giant", "Archer", "Mini P.E.K.K.A"];
let coins = 500;
let gems = 50;
let elixir = 0;
let maxElixir = 10;
let gameInterval;
let timerInterval;
let timeLeft = 180;
let playerCrowns = 0;
let enemyCrowns = 0;
let troops = [];

async function loadCards() {
  const response = await fetch('cards.json');
  const data = await response.json();
  cardsData = data.cards;
  renderDeckBuilder();
  updateCurrency();
}

function renderDeckBuilder() {
  const builder = document.getElementById('deckBuilder');
  builder.innerHTML = '';
  cardsData.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerText = card.name;
    if (!unlockedCards.includes(card.name)) {
      cardDiv.style.opacity = '0.3';
      cardDiv.style.pointerEvents = 'none';
    }
    cardDiv.onclick = () => selectCard(card.name);
    builder.appendChild(cardDiv);
  });
  renderSelectedDeck();
}

function selectCard(name) {
  if (deck.length >= 8) return;
  if (!deck.includes(name)) {
    deck.push(name);
    renderSelectedDeck();
  }
}

function renderSelectedDeck() {
  const playButton = document.getElementById('playButton');
  playButton.disabled = deck.length < 8;
}

function startGame() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('gameUI').classList.remove('hidden');
  renderCardBar();
  gameInterval = setInterval(updateGame, 100);
  timerInterval = setInterval(updateTimer, 1000);
  setInterval(enemySpawn, 3000);
}

function renderCardBar() {
  const cardBar = document.getElementById('cardBar');
  cardBar.innerHTML = '';
  deck.forEach(name => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerText = name;
    card.onclick = () => spawnTroop(name, false);
    cardBar.appendChild(card);
  });
}

function updateTimer() {
  timeLeft--;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer').innerText =
    (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  if (timeLeft <= 0) endGame();
}

function updateGame() {
  elixir = Math.min(maxElixir, elixir + 0.02);
  document.getElementById('elixirInner').style.width = (elixir / maxElixir * 100) + '%';

  troops.forEach(troop => {
    troop.y += troop.speed;
    troop.element.style.top = troop.y + 'px';

    if (troop.enemy && troop.y >= 600) {
      troop.element.remove();
      enemyCrowns++;
      document.getElementById('enemyCrowns').innerText = enemyCrowns;
      troops = troops.filter(t => t !== troop);
      checkEnd();
    } else if (!troop.enemy && troop.y <= 100) {
      troop.element.remove();
      playerCrowns++;
      document.getElementById('playerCrowns').innerText = playerCrowns;
      troops = troops.filter(t => t !== troop);
      checkEnd();
    }
  });
}

function spawnTroop(name, isEnemy) {
  const card = cardsData.find(c => c.name === name);
  if (!card) return;

  const costs = card.elixir;
  if (!isEnemy && elixir < costs) return;
  if (!isEnemy) elixir -= costs;

  const troop = document.createElement('div');
  troop.classList.add('troop');
  if (isEnemy) troop.classList.add('enemy-troop');

  const left = (Math.random() * 400 + 50) + 'px';
  troop.style.left = left;
  troop.style.top = isEnemy ? '100px' : '600px';
  document.getElementById('gameBoard').appendChild(troop);

  const speed = card.speed === "slow" ? (isEnemy ? 0.5 : -0.5) :
                card.speed === "medium" ? (isEnemy ? 1 : -1) :
                (isEnemy ? 2 : -2);

  troops.push({ element: troop, y: parseInt(troop.style.top), speed, enemy: isEnemy });
}

function enemySpawn() {
  const available = unlockedCards.length >= 3 ? unlockedCards : ["Giant", "Archer"];
  const name = available[Math.floor(Math.random() * available.length)];
  spawnTroop(name, true);
}

function checkEnd() {
  if (enemyCrowns >= 3 || playerCrowns >= 3) {
    endGame();
  }
}

function endGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  document.getElementById('gameUI').classList.add('hidden');
  const result = (playerCrowns > enemyCrowns) ? 'Vitória' :
    (playerCrowns < enemyCrowns) ? 'Derrota' : 'Empate';
  document.getElementById('resultText').innerText = result;
  document.getElementById('resultScreen').classList.remove('hidden');

  if (playerCrowns > enemyCrowns) {
    coins += 200;
    gems += 10;
    updateCurrency();
  }
}

function restartGame() {
  location.reload();
}

function updateCurrency() {
  document.getElementById('coins').innerText = coins;
  document.getElementById('gems').innerText = gems;
}

function openChest(type) {
  const chestData = {
    common: { cost: 100, currency: 'coins', rewards: 1 },
    gold: { cost: 500, currency: 'coins', rewards: 2 },
    magic: { cost: 30, currency: 'gems', rewards: 3 },
    legend: { cost: 100, currency: 'gems', rewards: 1, onlyLegend: true }
  };

  const chest = chestData[type];
  if (!chest) return;

  if (chest.currency === 'coins' && coins < chest.cost) return;
  if (chest.currency === 'gems' && gems < chest.cost) return;

  if (chest.currency === 'coins') coins -= chest.cost;
  else gems -= chest.cost;
  updateCurrency();

  const availableCards = chest.onlyLegend
    ? cardsData.filter(c => c.rarity === "legendary" || c.rarity === "champion")
    : cardsData;

  for (let i = 0; i < chest.rewards; i++) {
    const card = availableCards[Math.floor(Math.random() * availableCards.length)];
    if (!unlockedCards.includes(card.name)) {
      unlockedCards.push(card.name);
      alert(`Parabéns! Você desbloqueou: ${card.name}`);
    } else {
      coins += 50;
      alert(`Carta repetida! Você ganhou 50 moedas`);
    }
  }

  renderDeckBuilder();
}
