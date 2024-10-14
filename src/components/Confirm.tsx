import { erc721ABI, erc20ABI, useAccount, useContractReads, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useContractRead } from "wagmi";
import { CaretLeftIcon, UpdateIcon } from "@radix-ui/react-icons";
import React, { useMemo, useState } from "react";
import {
    waitForTransaction,
    writeContract,
} from '@wagmi/core'
import { isAddressEqual, maxUint256, parseEther, parseUnits, zeroAddress } from "viem";
import NFTSwapContractABI from "@/assets/abi/ContractABI.json";
import NFTSwapContractAddress from "@/assets/contract_address"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast";
import { OwnedNft } from "alchemy-sdk";

interface ContractData {
    data: bigint | undefined; // Use BigInt or undefined
    error: any; // Adjust the type of error as needed
}

export default function Confirm({ selectedNFTs, receiver_address }: { selectedNFTs: OwnedNft[], receiver_address: string }) {
    const { toast } = useToast()
    const { address: wallet } = useAccount()
    const [approve_loading, setApproveLoading] = useState(false)
    const [createOfferLoading, setCreateOfferLoading] = useState(false)

    const { data, isError, isLoading, refetch } = useContractReads({
        contracts: selectedNFTs.map(nft => ({ address: nft.contract.address as `0x${string}`, functionName: 'getApproved', abi: erc721ABI, args: [nft.tokenId] })),
        watch: true
    })

    console.log([
        selectedNFTs.map(nft => nft.contract.address),
        selectedNFTs.map(nft => nft.tokenId),
        receiver_address,
    ])

    const { write, data: writeData } = useContractWrite({
        address: NFTSwapContractAddress as `0x${string}`,
        abi: NFTSwapContractABI,
        functionName: 'safeTransferMultipleERC721Tokens',
        args: [
            selectedNFTs.map(nft => nft.contract.address),
            selectedNFTs.map(nft => nft.tokenId),
            receiver_address,
        ],
        onError(error: Error) {
            const e = error as { cause?: { reason?: string }; shortMessage?: string }
            toast({
                title: e?.cause?.reason || e?.shortMessage || "Something Went Wrong",
                variant: "destructive"
            })
            setCreateOfferLoading(false)
        }
    })

    useWaitForTransaction({
        hash: writeData?.hash,
        onSettled() {
            setCreateOfferLoading(false)
        }
    })

    const createOffer = async () => {
        if (write) {
            setCreateOfferLoading(true)
            write?.()
        }
    }

    const isNFTApproved = useMemo(() => data?.every(result => result.result && isAddressEqual(result.result as `0x${string}`, NFTSwapContractAddress as `0x${string}`)), data)
    const isAllApproved = isNFTApproved;

    const approveNFT = async () => {
        setApproveLoading(true)
        const promises: Promise<any>[] = []; // Annotate promises as an array of
        if (!isNFTApproved) {
            selectedNFTs.map(nft => {
                promises.push(writeContract({
                    address: nft.contract.address as `0x${string}`,
                    abi: erc721ABI,
                    functionName: 'approve',
                    args: [NFTSwapContractAddress as `0x${string}`, BigInt(nft.tokenId)],
                }))
            })
        }

        Promise.all(promises).then(resposes => {
            const waitHash = resposes.map(respose => waitForTransaction(respose))
            Promise.all(waitHash).finally(() => {
                refetch()
                setApproveLoading(false)
            })
        }).catch(error => {
            setApproveLoading(false)
        })
    }

    return (
        <div>
            {!isAllApproved && <Button onClick={approveNFT} disabled={approve_loading} >Approve NFT {approve_loading && <UpdateIcon className="ml-2 animate-spin" />}</Button>}
            {isAllApproved && <Button onClick={createOffer} disabled={createOfferLoading}><span >Transfer </span>{createOfferLoading && <UpdateIcon className="ml-2 animate-spin" />}</Button>}
        </div>
    )
}