"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BrowserProvider,
  JsonRpcSigner,
  Contract,
  parseEther,
  formatEther,
} from "ethers";

const CONTRACT_ADDRESS = "0x80197D71018fA03AF7B095A96E9179c28f87c96C"; // Replace with your contract address
const CONTRACT_ABI = [
  "function flip() external payable returns (bool)",
  "function getBalance() external view returns (uint256)",
  "function isValidBet(uint256 amount) public view returns (bool)",
  "function withdraw(uint256 amount) external",
  "function withdrawAll() external",
  "function owner() external view returns (address)",
  "event Withdrawn(address owner, uint256 amount)",
  "event FlipResult(address player, bool win, uint256 betAmount, uint256 payout)",
];

const NEXUS_CHAIN_ID = "0x188";
const NEXUS_RPC_URL = "https://rpc.nexus.xyz/http";
const EXPLORER_URL = "https://explorer.nexus.xyz";

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

// Calculate max possible bet based on contract balance (considering 1.95x payout)
const getMaxPossibleBet = (balance: string): number => {
  // Convert balance to number and divide by 1.95 to account for potential payout
  const maxBet = parseFloat(balance) / 1.95;
  return maxBet;
};

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [lastTxHash, setLastTxHash] = useState<string>("");
  const [selectedBet, setSelectedBet] = useState(1);
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<{
    win: boolean;
    payout: string;
  } | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");

  useEffect(() => {
    if (signer) {
      checkOwnership();
    }
  }, [signer]);

  const checkOwnership = async () => {
    if (!signer) return;
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const ownerAddress = await contract.owner();
      const userAddress = await signer.getAddress();
      setIsOwner(ownerAddress.toLowerCase() === userAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking ownership:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !isOwner) return;

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const amount = parseEther(withdrawAmount);
      const tx = await contract.withdraw(amount);
      await tx.wait();
      await getContractBalance();
      setWithdrawAmount("");
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Error withdrawing funds");
    }
  };

  const handleWithdrawAll = async () => {
    if (!signer || !isOwner) return;

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.withdrawAll();
      await tx.wait();
      await getContractBalance();
    } catch (error) {
      console.error("Error withdrawing all:", error);
      alert("Error withdrawing funds");
    }
  };

  // Add this section to your JSX where appropriate
  const withdrawSection = isOwner && (
    <div className="mt-8 p-4 border border-black/10 rounded-lg text-black">
      <h2 className="text-xl font-medium mb-4 text-black">Owner Controls</h2>
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount in NEXUS"
          className="px-4 py-2 border border-black/10 rounded-lg"
        />
        <button
          onClick={handleWithdraw}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg
                    hover:bg-gray-800 transition-colors duration-200"
        >
          Withdraw
        </button>
        <button
          onClick={handleWithdrawAll}
          className="px-4 py-2 text-sm font-medium text-black border border-black rounded-lg
                    hover:bg-black/10 transition-colors duration-200"
        >
          Withdraw All
        </button>
      </div>
    </div>
  );

  // Function to check and update user's balance
  const updateUserBalance = useCallback(async () => {
    if (!signer) return;
    try {
      const balance = await signer.provider.getBalance(userAddress);
      const balanceInNexus = formatEther(balance);
      console.log("Updated user balance:", balanceInNexus);
      setUserBalance(balanceInNexus);
    } catch (error) {
      console.error("Error getting user balance:", error);
    }
  }, [signer, userAddress]);

  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", async () => {
        const networkCorrect = await checkNetwork();
        if (networkCorrect) {
          const provider = new BrowserProvider(window.ethereum);
          setSigner(await provider.getSigner());
          await Promise.all([getContractBalance(), updateUserBalance()]);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", () => {
          console.log("Network change listener removed");
        });
      }
    };
  }, []);

  useEffect(() => {
    if (signer) {
      signer.getAddress().then((address) => {
        setUserAddress(address);
        updateUserBalance();
      });
      getContractBalance();
    }
  }, [signer]);

  const getContractBalance = useCallback(async () => {
    if (!signer) return;

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    try {
      const balance = await contract.getBalance();
      setContractBalance(formatEther(balance));
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }, [signer]);

  const checkNetwork = useCallback(async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    setIsCorrectNetwork(chainId === NEXUS_CHAIN_ID);
    return chainId === NEXUS_CHAIN_ID;
  }, []);

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NEXUS_CHAIN_ID }],
      });
      const networkCorrect = await checkNetwork();
      if (networkCorrect) {
        const provider = new BrowserProvider(window.ethereum);
        setSigner(await provider.getSigner());
        await getContractBalance();
      }
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: NEXUS_CHAIN_ID,
                rpcUrls: [NEXUS_RPC_URL],
                chainName: "Nexus Testnet",
                nativeCurrency: {
                  name: "NEXUS",
                  symbol: "NEXUS",
                  decimals: 18,
                },
              },
            ],
          });
          const networkCorrect = await checkNetwork();
          if (networkCorrect) {
            const provider = new BrowserProvider(window.ethereum);
            setSigner(await provider.getSigner());
            await getContractBalance();
          }
          return true;
        } catch (addError) {
          console.error("Error adding network:", addError);
          return false;
        }
      }
      console.error("Error switching network:", switchError);
      return false;
    }
  };

  const checkWalletConnection = useCallback(async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const networkCorrect = await checkNetwork();
          setIsConnected(true);
          setUserAddress(accounts[0].address);

          // Get initial balance
          const balance = await provider.getBalance(accounts[0].address);
          setUserBalance(formatEther(balance));

          if (networkCorrect) {
            setSigner(await provider.getSigner());
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  }, [checkNetwork]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const networkCorrect = await checkNetwork();
        setIsConnected(true);
        setUserAddress(accounts[0]);

        // Get initial balance
        const balance = await provider.getBalance(accounts[0]);
        setUserBalance(formatEther(balance));

        if (networkCorrect) {
          setSigner(await provider.getSigner());
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  };

  const placeBet = async () => {
    if (!signer) return;

    // Check if bet is still valid based on current contract balance and user balance
    const maxBet = getMaxPossibleBet(contractBalance);
    const userBetAmount = parseFloat(userBalance);

    if (selectedBet > maxBet) {
      alert("This bet amount is no longer available due to contract balance");
      return;
    }

    if (selectedBet > userBetAmount) {
      alert("Insufficient balance in your wallet for this bet");
      return;
    }

    setIsFlipping(true);
    setLastResult(null);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    try {
      const tx = await contract.flip({
        value: parseEther(selectedBet.toString()),
      });
      setLastTxHash(tx.hash);

      // Wait for transaction and get event data
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      const iface = contract.interface;
      const parsed = iface.parseLog(event);

      if (parsed) {
        const win = parsed.args[1];
        const payout = formatEther(parsed.args[3]);
        setLastResult({ win, payout });
      }

      await Promise.all([
        getContractBalance(),
        updateUserBalance()
      ]);
    } catch (error) {
      console.error("Error flipping coin:", error);
    } finally {
      setIsFlipping(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <main className="h-screen bg-white relative flex flex-col">
      <div className="absolute top-4 right-4 px-4 py-2 rounded-full border border-black/10">
        <p className="text-sm font-medium text-black/80">
          {isConnected
            ? `${formatAddress(userAddress)} (${parseFloat(userBalance).toFixed(
                2
              )} NEXUS)`
            : "Not Connected"}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        `
        <div className="max-w-4xl w-full px-4">
          <div className="space-y-12 text-center">
            <h1 className="text-5xl font-light tracking-tight text-black">
              Coin Flip Game
            </h1>
            {withdrawSection}
            <div className="text-lg text-gray-600">
              Contract Balance: {contractBalance} NEXUS
            </div>

            <div className="space-y-8">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                           hover:bg-gray-800 transition-colors duration-200 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Connect Wallet
                </button>
              ) : !isCorrectNetwork ? (
                <button
                  onClick={switchNetwork}
                  className="px-8 py-3 text-sm font-medium text-black bg-transparent border-2 border-black rounded-full 
                           hover:bg-black/10 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Switch to Nexus Network
                </button>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-wrap justify-center gap-4">
                    {BET_AMOUNTS.map((amount) => {
                      const maxBet = getMaxPossibleBet(contractBalance);
                      const hasContractFunds = amount <= maxBet;
                      // Compare as numbers with proper decimal handling
                      const userBalanceNum = parseFloat(userBalance);
                      const hasUserFunds =
                        !isNaN(userBalanceNum) && userBalanceNum >= amount;
                      const isEnabled = hasContractFunds && hasUserFunds;

                      // Debug log to help track balance issues
                      console.log(
                        `Bet: ${amount}, User Balance: ${userBalance}, Has Funds: ${hasUserFunds}`
                      );

                      // Only show 1 NEXUS option if balance is around 5 NEXUS
                      if (parseFloat(contractBalance) <= 5 && amount > 1) {
                        return null;
                      }

                      return (
                        <button
                          key={amount}
                          onClick={() => isEnabled && setSelectedBet(amount)}
                          className={`px-6 py-2 text-sm font-medium rounded-full transition-colors duration-200
                                    ${
                                      selectedBet === amount && isEnabled
                                        ? "bg-black text-white"
                                        : isEnabled
                                        ? "bg-gray-100 text-black hover:bg-gray-200"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                          disabled={!isEnabled}
                          title={
                            !hasContractFunds
                              ? "Insufficient contract balance for this bet"
                              : !hasUserFunds
                              ? "Insufficient wallet balance for this bet"
                              : ""
                          }
                        >
                          {amount} NEXUS
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <button
                      onClick={placeBet}
                      disabled={isFlipping}
                      className={`px-8 py-3 text-sm font-medium text-white rounded-full 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                                ${
                                  isFlipping
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-black hover:bg-gray-800"
                                }`}
                    >
                      {isFlipping ? "Flipping..." : "Flip Coin"}
                    </button>

                    {lastResult && (
                      <div
                        className={`text-lg font-medium ${
                          lastResult.win ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {lastResult.win
                          ? `You won! Payout: ${lastResult.payout} NEXUS`
                          : "You lost. Better luck next time!"}
                      </div>
                    )}

                    {lastTxHash && (
                      <a
                        href={`${EXPLORER_URL}/tx/${lastTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 
                                 transition-colors duration-200"
                      >
                        <span className="mr-1">Latest tx:</span>
                        <span className="font-medium">
                          {formatHash(lastTxHash)}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 w-full py-4 text-center bg-white">
        <a
          href="https://x.com/0xbaeee"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
        >
          Created by @0xbaeee
        </a>
      </footer>
    </main>
  );
}
