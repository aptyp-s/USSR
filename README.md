# The Citadel

A gamified Soviet-style financial dashboard and productivity tool. "The Citadel" is designed to manage personal finances, debt repayment, and savings through a brutalist, dystopian interface inspired by Soviet bureaucracy and sci-fi aesthetics.

## Features

### 🏛️ The Citadel Map
An isometric dashboard representing key state institutions:
*   **GOSPLAN**: The economic brain. Manages income, calculates labor value, and executes resource allocation.
*   **KGB HQ**: The surveillance arm. Logs transaction history and enforces spending discipline.
*   **THE KREMLIN**: The executive power. Issues decrees, sets fundamental economic constants, and manages strategic reserves.

### 💰 GOSPLAN (Economy)
*   **Sector Value Calculator**: Automatically calculates your real hourly wage based on disposable income and work hours.
*   **Requisition Protocol**: Log expenses with a split slider between Cash and Reserves.
*   **Debt Repayment**: Specialized mode to allocate funds between Principal (reducing debt) and Interest (burned).
*   **Supply Lines**: Log income with options to allocate directly to Reserves or Debt.

### 🛡️ KGB HQ (History)
*   **Surveillance Log**: View a history of recent transactions and resource snapshots.
*   **Intervention System**: The KGB intercepts large withdrawals from reserves, forcing you to confirm or reconsider "unauthorized" spending.

### ☭ THE KREMLIN (Executive)
*   **Balance Transfer**: Irreversible transfer from Cash to Strategic Reserves.
*   **Attack Debt**: Use Strategic Reserves to aggressively pay down debt.
*   **Labor Standards**: Configure global settings (Monthly Income, Work Hours).
*   **Resource Ledger**: Manually audit and correct current balances.
*   **Archive Protocol**: Export/Import game state as JSON or perform a hard system reset.

## Tech Stack

*   **React 18** (Vite)
*   **TypeScript**
*   **Tailwind CSS**
*   **Framer Motion** (Animations)
*   **Lucide React** (Icons)

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/the-citadel.git
    cd the-citadel
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## Customization

### Colors & Theme
The visual style is defined in `tailwind.config.js` under the `colors.soviet` object. The global font stack uses *Chakra Petch* and *JetBrains Mono*.

## License

This project is open-source and available under the MIT License.