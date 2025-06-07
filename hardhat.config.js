
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      // Add your private key here when deploying
      // accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
