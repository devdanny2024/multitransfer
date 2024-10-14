'use client';

import '@rainbow-me/rainbowkit/styles.css';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultWallets,
    connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    zora,
    goerli,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [
        mainnet,
        goerli,
    ],
    [publicProvider()]
);

const projectId = 'ede387d4877ed6b263a427423aaf8639';

const { wallets } = getDefaultWallets({
    appName: 'Trait.',
    projectId,
    chains,
});

const demoAppInfo = {
    appName: 'Trait.',
};

const connectors = connectorsForWallets([
    ...wallets,
    {
        groupName: 'Other',
        wallets: [
            argentWallet({ projectId, chains }),
            trustWallet({ projectId, chains }),
            ledgerWallet({ projectId, chains }),
        ],
    },
]);

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
});

const queryClient = new QueryClient();

const networks = {
    mainnet: mainnet,
    goerli: goerli
}

const network = process.env.NEXT_PUBLIC_CHAIN as keyof typeof networks;

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <WagmiConfig config={wagmiConfig}>
                <RainbowKitProvider modalSize="compact" chains={chains} initialChain={networks[network]} appInfo={demoAppInfo}>
                    {children}
                </RainbowKitProvider>
            </WagmiConfig>
        </QueryClientProvider>
    );
}
