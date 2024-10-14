"use client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import alchemy from "@/lib/alchemy";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { OwnedNft } from "alchemy-sdk";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import Confirm from "./Confirm";

export function NFTBox() {
  const [receiver_address, setReceiverAddress] = useState("");
  const [selectedNFTs, setNFTs] = useState<OwnedNft[]>([]);
  const { address: wallet } = useAccount();

  const {
    isInitialLoading,
    error,
    data,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["getNftsForOwner", wallet],
    queryFn: async ({ pageParam }) =>
      alchemy.nft.getNftsForOwner(wallet as string, { pageKey: pageParam }),
    keepPreviousData: true,
    getNextPageParam: (lastPage, pages) => lastPage.pageKey,
    enabled: Boolean(wallet as string),
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleCheckboxChange = (checked: boolean | string, nft: OwnedNft) => {
    if (checked) {
      setNFTs((prevSelectedNFTs) => [...prevSelectedNFTs, nft]);
    } else {
      setNFTs((prevSelectedNFTs) =>
        prevSelectedNFTs.filter(
          (mynft) =>
            mynft.contract.address !== nft.contract.address ||
            mynft.tokenId !== nft.tokenId
        )
      );
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });
    observer.observe(bottomRef.current!);

    const bottomCurrent = bottomRef.current;
    return () => {
      observer.unobserve(bottomCurrent!);
    };
  }, []);

  return (
    <div className="flex flex-col gap-5 w-96">
      <Input
        value={receiver_address}
        onChange={(e) => setReceiverAddress(e.target.value)}
        placeholder="Enter a receiver wallet address"
      />
      <ScrollArea type="always" className="h-96 rounded-md border p-4">
        {!isInitialLoading && !data?.pages?.length && (
          <div>No NFTs in Your Collection Yet</div>
        )}
        {!isInitialLoading && data && (
          <div className="grid grid-cols-2 lg:grid-cols-3  gap-3">
            {data.pages.map((page) =>
              page.ownedNfts
                .filter((nft) => {
                  return nft.tokenType === "ERC721";
                })
                .map((post) => (
                  <div
                    key={`${post.contract.address}_${post.tokenId}`}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 sm:top-2 sm:right-2 z-10">
                      <Checkbox
                        checked={
                          selectedNFTs.findIndex(
                            (nft) =>
                              nft.contract.address === post.contract.address &&
                              nft.tokenId === post.tokenId
                          ) !== -1
                        }
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(checked, post)
                        }
                        id={`${post.contract.address}_${post.tokenId}`}
                        className="bg-background z-10"
                      />
                    </div>
                    {post.tokenType === "ERC1155" && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge>x{post.balance}</Badge>
                      </div>
                    )}
                    {post.tokenType === "ERC1155" && (
                      <div className="absolute bottom-7 w-12 right-4 z-10">
                        <Input />
                      </div>
                    )}
                    <label htmlFor={`${post.contract.address}_${post.tokenId}`}>
                      <div className="w-full aspect-square rounded-lg relative overflow-hidden">
                        <Image
                          src={
                            post?.media?.[0]?.thumbnail ||
                            "/assets/images/abstract_image.png"
                          }
                          alt=""
                          fill
                        />
                      </div>
                      <div className="flex flex-row justify-between px-2">
                        <div className="space-x-2">
                          <span className="whitespace-nowrap text-ellipsis overflow-hidden">
                            {post.contract.name}
                          </span>
                        </div>
                        <span className="whitespace-nowrap text-ellipsis overflow-hidden">
                          {post.title || `#${post.tokenId}`}
                        </span>
                      </div>
                    </label>
                  </div>
                ))
            )}
          </div>
        )}
        {isInitialLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(5)].map((el, index) => (
              <Skeleton key={index} className={`w-full aspect-square`} />
            ))}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="flex flex-row items-center justify-center mt-5 gap-2">
            Loading <UpdateIcon className="inline-block animate-spin" />
          </div>
        )}
        <div className="w-full h-1" ref={bottomRef} />
      </ScrollArea>
      <Confirm
        selectedNFTs={selectedNFTs}
        receiver_address={receiver_address}
      />
    </div>
  );
}
