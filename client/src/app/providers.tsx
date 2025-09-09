'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 3,
      },
    },
  }))

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'demo-app-id'}
      config={{
        loginMethods: ['email', 'google', 'twitter', 'discord'],
        appearance: {
          theme: 'light',
          accentColor: '#0C0C4F',
          logo: undefined,
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
          requireUserPasswordOnCreate: false,
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            network: 'homestead',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://rpc.ankr.com/eth'] },
              public: { http: ['https://rpc.ankr.com/eth'] },
            },
          },
          {
            id: 11155111,
            name: 'Ethereum Sepolia',
            network: 'sepolia',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://rpc.sepolia.org'] },
              public: { http: ['https://rpc.sepolia.org'] },
            },
          }
        ],
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  )
}