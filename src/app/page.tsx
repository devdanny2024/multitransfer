import { NFTBox } from '@/components/NFTBox'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-24">
      <ConnectButton />
      <NFTBox />
    </main>
  )
}
