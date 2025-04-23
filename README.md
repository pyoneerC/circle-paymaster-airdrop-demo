# Setting Up and Configuring the Circle Paymaster Integration

This guide explains how to set up a project that uses the Circle Paymaster to enable users to pay for gas fees using their USDC balance. It covers cloning the repository, installing dependencies, and updating contract addresses and network configurations.

## 1. Clone the Repository
To begin, clone the repository to your local machine:
```bash
git clone <repository-url>
cd <repository-name>
```

## 2. Install Dependencies
Install the required dependencies by running the following command:
```bash
npm install
```

## 3. Update Paymaster, USDC Contract Addresses, and Bundler Information

### Modify `lib/transfer-service.ts`
In the `lib/transfer-service.ts` file, update the Paymaster, USDC contract, and bundler information together for Arbitrum and Base networks. Replace the placeholders with the correct mainnet and testnet addresses and bundler URLs.

```typescript
// Arbitrum Sepolia Testnet Configuration
const ARBITRUM_SEPOLIA_USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const ARBITRUM_SEPOLIA_PAYMASTER = '0x31BE08D380A21fc740883c0BC434FcFc88740b58';
const ARBITRUM_SEPOLIA_BUNDLER = `https://public.pimlico.io/v2/${arbitrumSepolia.id}/rpc`;

// Example for Arbitrum Testnet
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

const bundlerClient = createBundlerClient({
  client,
  transport: http(ARBITRUM_SEPOLIA_BUNDLER),
});
```

## 4. Update Blockchain Network Configuration

### Modify `app/page.tsx`
Update the blockchain network configuration in the `app/page.tsx` file to match your intended network (e.g., Arbitrum mainnet, Base mainnet, or testnets). Replace the relevant chain information.

```typescript
import { arbitrum, baseMainnet } from 'viem/chains';

// Set the desired chain configuration
const selectedChain = arbitrum; // Change this to baseMainnet or another network as needed

const client = createPublicClient({
  chain: selectedChain,
  transport: http(),
});

const USDC_ADDRESS = '<UPDATED_USDC_ADDRESS>'; // Update based on the selected network
```

## 5. Start the Application
After making the necessary updates, start the application to verify the integration:
```bash
npm run dev
```
This command starts the development server. Open the app in your browser at `http://localhost:3000`.

## 6. Verify Configuration
Test the app by creating a smart wallet and initiating a USDC transfer to confirm that the Circle Paymaster is correctly configured and working as expected.

---
By following this guide, you will successfully integrate the Circle Paymaster with updated contract addresses and network configurations into your project.

## Paymaster Contracts for Mainnet and Testnet

- **Arbitrum Testnet (Sepolia):** 0x31BE08D380A21fc740883c0BC434FcFc88740b58
- **Base Testnet (Sepolia):** 0x31BE08D380A21fc740883c0BC434FcFc88740b58
- **Arbitrum Mainnet:** 0x6C973eBe80dCD8660841D4356bf15c32460271C9
- **Base Mainnet:** 0x6C973eBe80dCD8660841D4356bf15c32460271C9
