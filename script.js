const suits = ['♥', '♦', '♣', '♠'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

let shoe = [];
let playerHands = [[]];
let handBets = [0];
let activeHandIdx = 0;
let dealerHand = [];
let currentBet = 0;
let insuranceBet = 0;
let hasInsurance = false;
let isSplitAcesRound = false;

let balance = parseInt(localStorage.getItem('bj-balance')) || 1000;

document.getElementById('balance').textContent = balance;
currentBet = 5;
document.getElementById('bet-display').textContent = currentBet;

function createShoe() {
    const newShoe = [];
    for (let i = 0; i < 6; i++) {
        suits.forEach(s => values.forEach(v => {
            const weight = v === 'A' ? 11 : (parseInt(v) || 10);
            newShoe.push({ suit: s, value: v, weight });
        }));
    }
    for (let i = newShoe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newShoe[i], newShoe[j]] = [newShoe[j], newShoe[i]];
    }
    return newShoe;
}

function calculateScore(hand) {
    let total = hand.reduce((sum, card) => sum + card.weight, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function createCardUI(card, isHidden = false) {
    const el = document.createElement('div');
    el.className = `card suit-${card.suit}`;
    if (isHidden) {
        el.classList.add('hidden');
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

function renderHand(handDiv, hand, showAll) {
    const currentCount = handDiv.children.length;

    if (showAll) {
        const hiddenEl = handDiv.querySelector('.hidden');
        if (hiddenEl) {
            const cardIndex = Array.from(handDiv.children).indexOf(hiddenEl);
            const revealed = createCardUI(hand[cardIndex]);
            revealed.style.animation = 'none';
            handDiv.replaceChild(revealed, hiddenEl);
        }
    }

    for (let i = currentCount; i < hand.length; i++) {
        const el = createCardUI(hand[i], !showAll && i === 1);
        el.style.animationDelay = `${(i - currentCount) * 0.08}s`;
        handDiv.appendChild(el);
    }
}

function getHandWrapper(idx) {
    return document.querySelector(`#player-hands [data-hand-idx="${idx}"]`);
}

function renderPlayerHands() {
    const container = document.getElementById('player-hands');

    playerHands.forEach((hand, i) => {
        let wrapper = getHandWrapper(i);

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'hand-wrapper';
            wrapper.dataset.handIdx = i;

            const scoreEl = document.createElement('div');
            scoreEl.className = 'hand-score';

            const handDiv = document.createElement('div');
            handDiv.className = 'hand';

            wrapper.appendChild(scoreEl);
            wrapper.appendChild(handDiv);
            container.appendChild(wrapper);
        }

        wrapper.classList.toggle('active-hand', playerHands.length > 1 && i === activeHandIdx);

        const handDiv = wrapper.querySelector('.hand');
        const scoreEl = wrapper.querySelector('.hand-score');

        renderHand(handDiv, hand, true);
        scoreEl.textContent = '+' + calculateScore(hand);
    });
}

function updateUI(showDealer) {
    renderPlayerHands();
    renderHand(document.getElementById('dealer-hand'), dealerHand, showDealer);
    document.getElementById('dealer-score').textContent = showDealer ? calculateScore(dealerHand) : '?';
    document.getElementById('balance').textContent = balance;
}

function canSplit() {
    const hand = playerHands[activeHandIdx];
    if (hand.length !== 2) return false;
    if (isSplitAcesRound) return false;
    if (handBets[activeHandIdx] > balance) return false;
    const faceVal = c => (parseInt(c.value) || 10);
    return faceVal(hand[0]) === faceVal(hand[1]);
}

function setControls(isPlaying) {
    const hand = isPlaying ? playerHands[activeHandIdx] : null;
    const bet = isPlaying ? handBets[activeHandIdx] : 0;

    document.getElementById('deal-btn').disabled = isPlaying;
    document.getElementById('hit-btn').disabled = !isPlaying || isSplitAcesRound;
    document.getElementById('stay-btn').disabled = !isPlaying || isSplitAcesRound;
    document.getElementById('double-btn').disabled = !isPlaying || !hand || hand.length !== 2 || bet > balance || isSplitAcesRound;
    document.getElementById('split-btn').disabled = !isPlaying || !canSplit();
    document.querySelectorAll('.chip').forEach(btn => btn.disabled = isPlaying);
    document.getElementById('reset-btn').style.visibility = isPlaying ? 'hidden' : 'visible';
}

function saveBalance() {
    localStorage.setItem('bj-balance', balance);
}

function deal() {
    if (currentBet <= 0 || currentBet > balance) {
        alert('Please place a valid bet!');
        return;
    }

    balance -= currentBet;
    saveBalance();

    if (shoe.length < 52) shoe = createShoe();

    playerHands = [[shoe.pop(), shoe.pop()]];
    handBets = [currentBet];
    activeHandIdx = 0;
    isSplitAcesRound = false;
    dealerHand = [shoe.pop(), shoe.pop()];

    insuranceBet = 0;
    hasInsurance = false;

    document.getElementById('dealer-score').classList.remove('win', 'loss');
    document.getElementById('status').textContent = 'Playing...';

    document.getElementById('player-hands').innerHTML = '';
    document.getElementById('dealer-hand').innerHTML = '';

    setControls(true);
    updateUI(false);

    if (dealerHand[0].value === 'A' && calculateScore(playerHands[0]) !== 21) {
        if (confirm('Dealer showing Ace! Take insurance?')) takeInsurance();
    }

    if (calculateScore(playerHands[0]) === 21) {
        runDealer();
    }
}

function hit() {
    const hand = playerHands[activeHandIdx];
    hand.push(shoe.pop());
    document.getElementById('double-btn').disabled = true;
    document.getElementById('split-btn').disabled = true;
    const score = calculateScore(hand);
    updateUI(false);
    if (score >= 21) handFinished();
}

function doubleDown() {
    const hand = playerHands[activeHandIdx];
    const bet = handBets[activeHandIdx];
    if (hand.length !== 2 || bet > balance) return;
    balance -= bet;
    handBets[activeHandIdx] *= 2;
    saveBalance();
    hand.push(shoe.pop());
    updateUI(false);
    handFinished();
}

function stay() {
    handFinished();
}

function split() {
    if (!canSplit()) return;

    const hand = playerHands[activeHandIdx];
    const bet = handBets[activeHandIdx];

    balance -= bet;
    saveBalance();

    isSplitAcesRound = (hand[0].value === 'A');

    // Move second card out; deal a fresh card to each hand
    const splitCard = hand.pop();
    hand.push(shoe.pop());
    const newHand = [splitCard, shoe.pop()];

    playerHands.splice(activeHandIdx + 1, 0, newHand);
    handBets.splice(activeHandIdx + 1, 0, bet);

    // Clear the active hand's div so it re-renders with its new composition
    const wrapper = getHandWrapper(activeHandIdx);
    if (wrapper) wrapper.querySelector('.hand').innerHTML = '';

    updateUI(false);
    setControls(true);

    if (isSplitAcesRound) {
        document.getElementById('status').textContent = 'Split Aces — one card each.';
        setTimeout(() => handFinished(), 500);
    }
}

function handFinished() {
    if (activeHandIdx < playerHands.length - 1) {
        activeHandIdx++;
        updateUI(false);
        setControls(true);
        if (isSplitAcesRound) setTimeout(() => handFinished(), 500);
    } else {
        runDealer();
    }
}

function runDealer() {
    const allBust = playerHands.every(h => calculateScore(h) > 21);
    if (!allBust) {
        while (calculateScore(dealerHand) < 17) {
            dealerHand.push(shoe.pop());
        }
    }
    finishGame();
}

function finishGame() {
    const dScore = calculateScore(dealerHand);
    const dealerBJ = dealerHand.length === 2 && dScore === 21;
    const messages = [];
    let anyWin = false;
    let allLose = true;

    playerHands.forEach((hand, i) => {
        const pScore = calculateScore(hand);
        const bet = handBets[i];
        const isNatural = playerHands.length === 1 && hand.length === 2 && pScore === 21;
        const label = playerHands.length > 1 ? `Hand ${i + 1}: ` : '';

        const wrapper = getHandWrapper(i);
        const scoreEl = wrapper ? wrapper.querySelector('.hand-score') : null;

        if (pScore > 21) {
            if (scoreEl) scoreEl.classList.add('loss');
            messages.push(`${label}Bust. -£${bet}`);
        } else if (dScore > 21 || pScore > dScore) {
            const profit = isNatural ? Math.floor(bet * 1.5) : bet;
            balance += bet + profit;
            if (scoreEl) scoreEl.classList.add('win');
            messages.push(`${label}${isNatural ? 'BLACKJACK! ' : ''}Win! +£${profit}`);
            anyWin = true;
            allLose = false;
        } else if (dScore > pScore) {
            if (scoreEl) scoreEl.classList.add('loss');
            messages.push(`${label}Lose. -£${bet}`);
        } else {
            balance += bet;
            messages.push(`${label}Push. £${bet} returned.`);
            allLose = false;
        }
    });

    if (hasInsurance) {
        if (dealerBJ) {
            balance += insuranceBet * 2;
            messages.push(`Insurance wins! +£${insuranceBet}`);
        } else {
            messages.push(`Insurance lost.`);
        }
    }

    const dScoreEl = document.getElementById('dealer-score');
    if (anyWin) dScoreEl.classList.add('loss');
    else if (allLose) dScoreEl.classList.add('win');

    document.getElementById('status').textContent = messages.join(' | ');
    currentBet = 5;
    document.getElementById('bet-display').textContent = currentBet;
    saveBalance();
    activeHandIdx = 0;
    updateUI(true);
    setControls(false);
}

function takeInsurance() {
    insuranceBet = Math.min(Math.floor(currentBet / 2), balance);
    hasInsurance = true;
    balance -= insuranceBet;
    saveBalance();
    document.getElementById('status').textContent = `Insurance: £${insuranceBet}`;
}

function addBet(amount) {
    if (currentBet + amount <= balance) {
        currentBet += amount;
        document.getElementById('bet-display').textContent = currentBet;
    }
}

function resetBet() {
    currentBet = 5;
    document.getElementById('bet-display').textContent = currentBet;
}

function resetGame() {
    if (confirm('Reset balance to £1000?')) {
        balance = 1000;
        currentBet = 5;
        saveBalance();
        document.getElementById('balance').textContent = balance;
        document.getElementById('bet-display').textContent = currentBet;
        document.getElementById('status').textContent = 'Reset complete.';
    }
}

// Event listeners
document.getElementById('deal-btn').addEventListener('click', deal);
document.getElementById('hit-btn').addEventListener('click', hit);
document.getElementById('double-btn').addEventListener('click', doubleDown);
document.getElementById('stay-btn').addEventListener('click', stay);
document.getElementById('split-btn').addEventListener('click', split);
document.getElementById('reset-btn').addEventListener('click', resetBet);
document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => addBet(parseInt(btn.dataset.amount)));
});

// Start
shoe = createShoe();
deal();
