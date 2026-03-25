# AI Coding Agent Instructions for Pro Blackjack

## Project Overview
This is a **Pro Blackjack game** built with vanilla HTML/CSS/JavaScript (no frameworks). Single-player game vs. dealer using a 6-deck shoe with persistent bankroll storage.

## Architecture & Key Files

### Core Components
- **`index.html`** - Game UI structure with bet controls, dealer/player hands, action buttons
- **`script.js`** - Complete game logic: card creation, scoring, deal/hit/stay mechanics, keyboard shortcuts
- **`style.css`** - Playing table styling with 4-color suit logic and card UI design

### State Management
Game state is stored in variables (no database):
- `shoe` - Array of shuffled 6 decks (refilled when < 52 cards remain)
- `playerHand` / `dealerHand` - Current hand arrays
- `balance` - Player bankroll (persisted to `localStorage` as `'bj-balance'`)
- `currentBet` - Current round's wager

### Critical Patterns

**Card Representation:**
```javascript
{ suit: '♥', value: 'A', weight: 11 }
// weight = int value or 10 for face cards; Aces default to 11
```

**Score Calculation (Ace Handling):**
The `calculateScore()` function starts with total weight and reduces Aces from 11 to 1 while score > 21. This prevents Ace-heavy hands from busting prematurely.

**Dealer Rules:**
Dealer must hit on totals < 17 (see `stay()` function) - **no soft-17 rule implemented**.

**Shuffle Strategy:**
Uses Fisher-Yates algorithm in `createShoe()`. Shoe refills when fewer than 52 cards remain (mid-shoe, not at threshold).

**UI Rendering:**
`updateUI(showDealer)` controls whether dealer's second card displays as hidden ('?'). Call with `false` during player turn, `true` after staying.

### Keyboard Shortcuts
Bound in global `keydown` listener:
- **D** or **Enter** = Deal
- **H** = Hit
- **S** = Stay
- **R** = Reset (prompts confirmation)

Shortcuts respect disabled button state—inactive actions won't trigger.

## Development Workflow

### Running the Game
1. Open `index.html` directly in browser (file:// protocol works)
2. No build step, no dependencies, no dev server required
3. State persists via localStorage

### Testing Considerations
- Clear localStorage (`localStorage.clear()`) to reset balance for testing
- Blackjack logic: 21 with 2 cards is a win, not special handling (see `endGame()`)
- Empty shoe refill happens at < 52 cards, so balance tracking depends on current round state

### Modification Impact Map
| Change | Affects |
|--------|---------|
| Suit/value arrays | Card creation in `createShoe()` |
| Shoe size | Card count, refill threshold (currently 52) |
| Dealer hit threshold | `while` condition in `stay()` |
| Payout rules | Multipliers in `endGame()` |
| Button labels | Only HTML text—doesn't affect key bindings |

## Conventions & Specific Patterns

1. **Blackjack Bonus**: Win payoff is `2.5x bet` on blackjack (21 with 2 cards), or `2x bet` on regular 21. Ties (push) return the original bet only. Detection: `playerHand.length === 2 && calculateScore(playerHand) === 21`.
2. **Card UI Rendering System**: 
   - `createCardUI(card, isHidden)` builds card DOM structure with three zones: `.card-corner.top` (left-aligned rank + suit), `.card-center` (faded watermark), `.card-corner.bottom` (right-aligned, rotated 180°). 
   - Each corner contains two spans: rank (e.g., 'A') and suit symbol (e.g., '♥'). 
   - Hidden cards add `.hidden` class (dark background, transparent text).
   - Card suit determines color class (`.suit-♥`, `.suit-♠`, etc.) applied at creation time.
3. **4-Color Suits**: CSS classes use suit symbols (♠/♣ = dark charcoal, ♥/♦ = red). Applied via `.suit-♥` classes on card elements.
4. **Card UI Design**: Corner ranks + center watermark. Hidden cards use `.hidden` class (dark background, transparent text).
5. **Functional Approach**: Game actions exposed as `window.deal()`, `window.hit()`, `window.stay()` for HTML onclick binding.
6. **Persistent Bankroll**: Always call `saveBalance()` after balance changes; load on init from localStorage.

## Common Tasks

**Add a feature:** Check if UI needs updates in `createCardUI()` or `updateUI()`, then wire event handlers to `script.js` functions and HTML buttons.

**Modify game rules:** Adjust dealer logic in `stay()`, payout in `endGame()`, or validation in `deal()`.

**Styling changes:** 4-color suit logic is in CSS—ensure `.suit-*` classes match card creation logic.

**Debugging:** Use browser DevTools; balance is always in `balance` variable and localStorage. Shoe state visible in `shoe` array length.
