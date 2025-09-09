'use client'

import { usePrivy } from '@privy-io/react-auth'

export default function LoginButton() {
  const { login, logout, authenticated } = usePrivy()

  if (authenticated) {
    return (
      <button
        onClick={logout}
        className="btn-secondary"
      >
        Logout
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={login}
        className="btn-primary text-lg px-8 py-3 block w-full max-w-md mx-auto"
      >
        Connect Wallet
      </button>
      <p className="text-sm text-gray-500">
        Choose from multiple authentication methods in the next step
      </p>
    </div>
  )
}