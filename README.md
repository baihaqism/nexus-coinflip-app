# Nexus Coinflip DApp

A decentralized coin flip game built on the Nexus blockchain. This application allows users to place bets and engage in a simple yet exciting betting game, leveraging the power of smart contracts and the unique features of the Nexus ecosystem.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Smart Contract](#smart-contract)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Nexus Coinflip DApp is designed to provide a fun and engaging way for users to interact with the Nexus blockchain. Players can place bets on the outcome of a coin flip, with the potential for payouts based on their bets. The app showcases the capabilities of the Nexus Layer 1 blockchain and zkVM technology.

## Features

- **Smart Contract Functionality**: 
  - Validates bets against predefined amounts.
  - Randomized outcomes using secure methods.
  - Payout mechanism for winning bets.
  - Owner controls for fund management.

- **User-Friendly Frontend**: 
  - Wallet connection and network switching.
  - Display of dealer and user balances.
  - Real-time feedback on bet outcomes.
  - Transaction tracking with links to the Nexus blockchain explorer.

## Getting Started

To get started with the Nexus Coinflip DApp, follow the instructions below to set up the project locally.

### Project Structure

The project is organized into two main workspaces:

- **contracts**: Contains the smart contract code and deployment scripts.
- **frontend**: Contains the React application for the user interface.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/baihaqism/nexus-coinflip-dapp.git
   cd nexus-coinflip-dapp
   ```

2. **Install dependencies**:
   Make sure you have [Node.js](https://nodejs.org/) installed. Then run:
   ```bash
   npm install
   ```

### Usage

1. **Deploy the Smart Contract**:
   Navigate to the `contracts` directory and deploy the smart contract to the Nexus network:
   ```bash
   npm run deploy
   ```

2. **Start the Frontend**:
   Navigate to the `frontend` directory and start the development server:
   ```bash
   npm run frontend
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000` to access the application.

4. **Connect your wallet**:
   Use a compatible wallet (like Rabbit) to connect to the Nexus network.

5. **Place your bets**:
   Select a valid bet amount and click "Flip Coin" to participate in the game.

## Smart Contract

The smart contract for the coin flip game is located in the `contracts` directory. It implements the core logic for betting, determining outcomes, and managing funds.

### Key Functions

- `flip()`: Allows users to place a bet and flip the coin.
- `withdraw(uint256 amount)`: Allows the owner to withdraw a specified amount.
- `withdrawAll()`: Allows the owner to withdraw all funds from the contract.
- `getBalance()`: Returns the current balance of the contract.

## Contributing

Contributions are welcome! If you would like to contribute to the Nexus Coinflip DApp, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your changes to your forked repository.
5. Create a pull request to the main repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Thank you for checking out the Nexus Coinflip DApp! We hope you enjoy playing and exploring the capabilities of the Nexus blockchain.
