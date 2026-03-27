/**
 * BLACKJACK GAME LOGIC
 * Features: 6-Deck Shoe, 4-Color Suits, Persistent Bankroll, Keyboard Controls
 */

const suits = ['♥', '♦', '♣', '♠'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let shoe = [];
let playerHand = [];
let dealerHand = [];
let currentBet = 0;

// Load balance from browser storage or default to 1000
let balance = parseInt(localStorage.getItem('bj-balance')) || 1000;
document.getElementById('balance').innerText = balance;

/**
 * Creates 6 decks and shuffles them together.
 */
function createShoe() {
    let newShoe = [];
    for (let i = 0; i < 6; i++) {
        suits.forEach(s => values.forEach(v => {
            let weight = parseInt(v) || (v === 'A' ? 11 : 10);
            newShoe.push({ suit: s, value: v, weight: weight });
        }));
    }
    // Fisher-Yates Shuffle
    for (let i = newShoe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newShoe[i], newShoe[j]] = [newShoe[j], newShoe[i]];
    }
    return newShoe;
}

/**
 * Calculates score and handles flexible Ace values (11 to 1).
 */
function calculateScore(hand) {
    let total = hand.reduce((sum, card) => sum + card.weight, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) { 
        total -= 10; 
        aces--; 
    }
    return total;
}

/**
 * Builds the HTML structure for cards with corner ranks and a center watermark.
 * Matches the uploaded screenshot design.
 */
function createCardUI(card, isHidden = false) {
    const el = document.createElement('div');
    el.className = `card suit-${card.suit}`;

    if (isHidden) {
        el.classList.add('hidden');
        el.style.backgroundImage = "url('images/CardBack.gif')";
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        return el;
    }

    el.innerHTML = `
        <div class="card-corner top">
            <span>${card.value}</span>
            <span>${card.suit}</span>
        </div>
        <div class="card-center">${card.suit}</div>
        <div class="card-corner bottom">
            <span>${card.value}</span>
            <span>${card.suit}</span>
        </div>
    `;
    return el;
}

/**
 * Updates the screen with current card images and scores.
 */
function updateUI(showDealer) {
    const pHandDiv = document.getElementById('player-hand');
    const dHandDiv = document.getElementById('dealer-hand');
    pHandDiv.innerHTML = '';
    dHandDiv.innerHTML = '';

    playerHand.forEach(card => pHandDiv.appendChild(createCardUI(card)));
    
    dealerHand.forEach((card, index) => {
        const isHidden = (!showDealer && index === 1);
        dHandDiv.appendChild(createCardUI(card, isHidden));
    });

    document.getElementById('player-score').innerText = calculateScore(playerHand);
    document.getElementById('dealer-score').innerText = showDealer ? calculateScore(dealerHand) : '?';
    document.getElementById('balance').innerText = balance;
    document.getElementById('shoe-count').innerText = shoe.length;
}

// --- GAME ACTIONS ---

window.deal = function() {
    const betInput = document.getElementById('bet-amount');
    currentBet = parseInt(betInput.value);

    if (currentBet > balance || currentBet <= 0) {
        alert("Invalid bet amount!");
        return;
    }

    balance -= currentBet;
    saveBalance();

    if (shoe.length < 52) shoe = createShoe();
    playerHand = [shoe.pop(), shoe.pop()];
    dealerHand = [shoe.pop(), shoe.pop()];
    
    document.getElementById('status').innerText = "Playing for $" + currentBet;
    setControls(true);
    updateUI(false);
};

window.hit = function() {
    playerHand.push(shoe.pop());
    updateUI(false);
    if (calculateScore(playerHand) > 21) endGame("lose");
};

window.stay = function() {
    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(shoe.pop());
    }
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    if (dScore > 21 || pScore > dScore) endGame("win");
    else if (dScore > pScore) endGame("lose");
    else endGame("push");
};

function endGame(result) {
    if (result === "win") {
        // Check for blackjack (21 with exactly 2 cards)
        const isBlackjack = playerHand.length === 2 && calculateScore(playerHand) === 21;
        const payout = isBlackjack ? currentBet * 2.5 : currentBet * 2;
        const winAmount = isBlackjack ? currentBet * 1.5 : currentBet;
        balance += payout;
        document.getElementById('status').innerText = isBlackjack ? "BLACKJACK! +$" + winAmount : "You Win! +$" + currentBet;
    } else if (result === "lose") {
        document.getElementById('status').innerText = "Dealer Wins. -$"+ currentBet;
    } else {
        balance += currentBet;
        document.getElementById('status').innerText = "Push (Tie).";
    }

    saveBalance();
    updateUI(true);
    setControls(false);
}

// --- HELPERS & CONTROLS ---

function setControls(isPlaying) {
    document.getElementById('deal-btn').disabled = isPlaying;
    document.getElementById('hit-btn').disabled = !isPlaying;
    document.getElementById('stay-btn').disabled = !isPlaying;
    document.getElementById('bet-amount').disabled = isPlaying;
}

function saveBalance() {
    localStorage.setItem('bj-balance', balance);
}

window.resetGame = function() {
    if(confirm("Reset balance to $1000?")) {
        balance = 1000;
        saveBalance();
        document.getElementById('balance').innerText = balance;
    }
};

// --- KEYBOARD SHORTCUTS ---

window.addEventListener('keydown', function(event) {
    const key = event.key.toUpperCase();

    // D or Enter = DEAL
    if ((key === 'D' || event.key === 'Enter') && !document.getElementById('deal-btn').disabled) {
        window.deal();
    }
    // H = HIT
    if (key === 'H' && !document.getElementById('hit-btn').disabled) {
        window.hit();
    }
    // S = STAY / STAND
    if (key === 'S' && !document.getElementById('stay-btn').disabled) {
        window.stay();
    }
    // R = RESET
    if (key === 'R') {
        window.resetGame();
    }
});

// Initialize first shoe
shoe = createShoe();