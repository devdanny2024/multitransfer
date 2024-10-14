import { Alchemy, Network } from "alchemy-sdk";

const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const networks = {
    mainnet: Network.ETH_MAINNET,
    goerli: Network.ETH_GOERLI
}

const network = process.env.NEXT_PUBLIC_CHAIN  as keyof typeof networks;

const settings = {
    apiKey: apiKey, // Replace with your Alchemy API Key.
    network: networks[network], // Replace with your network.
};

const alchemy = new Alchemy(settings);

export default alchemy;