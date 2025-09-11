"use client";

import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import { useEffect, useState } from "react";
import { useCounter } from "@/hooks/useCounter";
import { toast } from "react-toastify";
import { formatStarknetAddress, txExplorerUrl } from "@/utils/format";
import { STORAGE_KEYS } from "@/utils/storage";

export default function Home() {
  const { ready, authenticated, user, getAccessToken, logout } =
    usePrivy() as any;
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [increasing, setIncreasing] = useState(false);

  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<boolean>(false);
  const [wallets, setWallets] = useState<Array<{
    id: string;
    address: string;
    publicKey?: string;
  }> | null>(null);

  const hasWallet = !!(walletId || walletAddress || publicKey);
  const baseApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const defaultCounterAddress =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_COUNTER_CONTRACT ||
    "";
  const [counterAddress] = useState<string>(defaultCounterAddress);
  const userAddressForCounter = formatStarknetAddress(walletAddress);
  const { data: counterData } = useCounter(
    counterAddress || null,
    userAddressForCounter || null,
    { intervalMs: 1000 }
  );

  

  // Sync local state with localStorage for the current Privy user
  useEffect(() => {
    try {
      if (!authenticated || !user?.id) return;
      const storedUser = window.localStorage.getItem(STORAGE_KEYS.userId);
      if (storedUser && storedUser !== user.id) {
        // Different user logged in → clear previous user's wallet state
        window.localStorage.removeItem(STORAGE_KEYS.walletId);
        window.localStorage.removeItem(STORAGE_KEYS.walletAddress);
        window.localStorage.removeItem(STORAGE_KEYS.publicKey);
        window.localStorage.removeItem(STORAGE_KEYS.deployedWalletId);
        setWalletId(null);
        setWalletAddress(null);
        setPublicKey(null);
        setTxHash(null);
        setWallets(null);
        setError(null);
        setDeployed(false);
      }
      // Record current user id
      window.localStorage.setItem(STORAGE_KEYS.userId, user.id);
      // Load cached wallet for this user (if any)
      const lsId = window.localStorage.getItem(STORAGE_KEYS.walletId);
      const lsAddr = window.localStorage.getItem(STORAGE_KEYS.walletAddress);
      const lsPk = window.localStorage.getItem(STORAGE_KEYS.publicKey);
      if (lsId) setWalletId(lsId);
      if (lsAddr) setWalletAddress(lsAddr);
      if (lsPk) setPublicKey(lsPk);
    } catch {}
  }, [authenticated, user?.id]);

  // Persist to localStorage when values change
  useEffect(() => {
    try {
      if (walletId) window.localStorage.setItem(STORAGE_KEYS.walletId, walletId);
    } catch {}
  }, [walletId]);
  useEffect(() => {
    try {
      if (walletAddress)
        window.localStorage.setItem(STORAGE_KEYS.walletAddress, walletAddress);
    } catch {}
  }, [walletAddress]);
  useEffect(() => {
    try {
      if (publicKey)
        window.localStorage.setItem(STORAGE_KEYS.publicKey, publicKey);
    } catch {}
  }, [publicKey]);
  // Reflect deployed flag when walletId changes
  useEffect(() => {
    try {
      const lsDeployed = window.localStorage.getItem(STORAGE_KEYS.deployedWalletId);
      setDeployed(!!(walletId && lsDeployed && lsDeployed === walletId));
    } catch {
      setDeployed(false);
    }
  }, [walletId]);

  // Ensure we store the current user id in localStorage when authenticated
  useEffect(() => {
    try {
      if (authenticated && user?.id) {
        window.localStorage.setItem(STORAGE_KEYS.userId, user.id);
      }
    } catch {}
  }, [authenticated, user?.id]);

  const fetchWallets = async () => {
    try {
      if (!ready || !authenticated || !user?.id) return;
      // If values already exist (from localStorage or previous fetch), don't overwrite them on refresh
      if (walletId || walletAddress || publicKey) return;
      setError(null);
      // fetch wallets from backend
      const resp = await fetch(
        `${baseApi}/privy/user-wallets?userId=${encodeURIComponent(user.id)}&t=${Date.now()}`
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "Failed to fetch wallets");
      const list = Array.isArray(data.wallets) ? data.wallets : [];
      setWallets(list);
      if (list.length > 0) {
        const w = list.find((v: any) => v?.publicKey) || list[0];
        if (w.id) setWalletId(w.id);
        if (w.address) setWalletAddress(formatStarknetAddress(w.address));
        if (w.publicKey) setPublicKey(w.publicKey);
        // If public key is missing, fetch full wallet details
        if (!w.publicKey && w.id) {
          try {
            const resp2 = await fetch(`${baseApi}/privy/public-key`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletId: w.id }),
            });
            const data2 = await resp2.json().catch(() => ({}));
            if (resp2.ok) {
              const pk =
                data2.public_key ||
                data2.wallet?.public_key ||
                data2.wallet?.publicKey;
              const addr = data2.wallet?.address || w.address;
              if (pk) setPublicKey(pk);
              if (addr) setWalletAddress(formatStarknetAddress(addr));
            }
          } catch {}
        }
      } // If no wallets, keep whatever is in localStorage/state
    } catch (e: any) {
      setError(e.message || "Failed to fetch wallets");
    } finally {
      // done fetching
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [ready, authenticated, user?.id]);

  const createWallet = async () => {
    try {
      setError(null);
      setTxHash(null);
      setCreating(true);
      const resp = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/privy/create-wallet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId: user?.id, chainType: "starknet" }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "Create wallet failed");
      const w = data.wallet || {};
      setWalletId(w.id || null);
      setWalletAddress(formatStarknetAddress(w.address) || null);
      setPublicKey(w.public_key || w.publicKey || null);
    } catch (e: any) {
      setError(e.message || "Create wallet failed");
    } finally {
      setCreating(false);
    }
  };

  const deployWallet = async () => {
    try {
      setError(null);
      setTxHash(null);
      setDeploying(true);
      const id = walletId;
      if (!id) {
        setError("No walletId found. Create a wallet first.");
        setDeploying(false);
        return;
      }
      let userJwt: string | undefined;
      try {
        userJwt =
          typeof getAccessToken === "function"
            ? await getAccessToken()
            : undefined;
      } catch {}
      if (!userJwt) {
        setError(
          "Unable to retrieve user session. Please re-login and try again."
        );
        setDeploying(false);
        return;
      }
      const resp = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/privy/deploy-wallet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
          },
          body: JSON.stringify({ walletId: id }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "Deploy failed");
      setTxHash(data.transactionHash || null);
      setWalletAddress(formatStarknetAddress(data.address) || walletAddress);
      setPublicKey(data.publicKey || publicKey);
      try {
        window.localStorage.setItem("starknet_deployed_wallet_id", id);
        setDeployed(true);
      } catch {}
    } catch (e: any) {
      setError(e.message || "Deploy failed");
    } finally {
      setDeploying(false);
    }
  };

  const increaseCounter = async () => {
    let toastId: any | undefined;
    let toastDone = false;
    try {
      setError(null);
      setIncreasing(true);
      toastId = toast.loading("Submitting transaction…");
      const id = walletId;
      if (!id) {
        const msg = "No walletId found. Create or select a wallet first.";
        setError(msg);
        if (toastId) {
          toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 5000 });
          toastDone = true;
        } else {
          toast.error(msg, { autoClose: 5000 });
        }
        return;
      }
      let userJwt: string | undefined;
      try {
        userJwt =
          typeof getAccessToken === "function"
            ? await getAccessToken()
            : undefined;
      } catch {}
      if (!userJwt) {
        const msg =
          "Unable to retrieve user session. Please re-login and try again.";
        setError(msg);
        if (toastId) {
          toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 5000 });
          toastDone = true;
        } else {
          toast.error(msg, { autoClose: 5000 });
        }
        return;
      }
      const resp = await fetch(`${baseApi}/privy/increase-counter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({ walletId: id, contractAddress: counterAddress, wait: true }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "Increase counter failed");
      const txHash: string | undefined = data?.transactionHash;
      if (txHash) {
        const url = txExplorerUrl(txHash);
        toast.update(toastId!, {
          render: (
            <span>
              Counter increased. View tx:{" "}
              <a className="underline" href={url} target="_blank" rel="noreferrer">
                {txHash.slice(0, 10)}…
              </a>
            </span>
          ),
          type: "success",
          isLoading: false,
          autoClose: 6000,
        });
        toastDone = true;
      } else {
        toast.update(toastId!, { render: "Counter increased", type: "success", isLoading: false, autoClose: 4000 });
        toastDone = true;
      }
    } catch (e: any) {
      const msg = e.message || "Increase counter failed";
      setError(msg);
      if (toastId) {
        toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 5000 });
        toastDone = true;
      } else {
        toast.error(msg, { autoClose: 5000 });
      }
    }
    finally {
      setIncreasing(false);
      try {
        if (!toastDone && toastId) toast.dismiss(toastId);
      } catch {}
    }
  };

  // Temporary debug utility to clear local wallet state
  const clearLocal = () => {
    try {
      window.localStorage.removeItem("starknet_wallet_id");
      window.localStorage.removeItem("starknet_wallet_address");
      window.localStorage.removeItem("starknet_public_key");
      window.localStorage.removeItem("starknet_deployed_wallet_id");
    } catch {}
    setWalletId(null);
    setWalletAddress(null);
    setPublicKey(null);
    setTxHash(null);
    setWallets(null);
    setError(null);
    (setDeployed as any)(false);
  };

  // Logout handler: clear cached wallet state before logging out
  const handleLogout = async () => {
    try {
      clearLocal();
    } catch {}
    try {
      await logout();
    } catch {}
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-starknet-blue">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {authenticated && (
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 truncate max-w-[280px]">
                {user?.email?.address || user?.id}
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        )}
        {/* Removed title/description and header counter */}

        <div className="max-w-xl mx-auto">
          {!authenticated ? (
            <div className="card text-center">
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">Login to continue.</p>
              <LoginButton />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="card text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome</h2>
                <p className="text-gray-600 mb-1">
                  {user?.email?.address || user?.id || "Authenticated user"}
                </p>
                <p className="text-gray-500 text-sm">
                  Use the buttons below to create and deploy a Starknet wallet
                  via the backend.
                </p>
              </div>
              {/* Big centered counter + increase button */}
              <div className="text-center my-8">
                <div className="text-6xl font-bold text-starknet-blue mb-6">
                  {counterData?.decimal ?? "0"}
                </div>
                <div className="arcade-ring mx-auto">
                  <button
                    onClick={increaseCounter}
                    className="arcade-btn"
                    disabled={!walletId || !deployed || increasing}
                    title={
                      !walletId
                        ? "Create a wallet first"
                        : !deployed
                        ? "Deploy the wallet first"
                        : increasing
                        ? "Submitting…"
                        : undefined
                    }
                    aria-label="Increase counter"
                  >
                    {increasing ? "..." : "Increase"}
                  </button>
                </div>
              </div>
              <div className="card">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={createWallet}
                    className="btn-primary"
                    disabled={creating || hasWallet}
                    title={hasWallet ? "Wallet already created" : undefined}
                  >
                    {creating
                      ? "Creating…"
                      : hasWallet
                      ? "Wallet Exists"
                      : "Create Wallet"}
                  </button>
                  <button
                    onClick={deployWallet}
                    className="btn-secondary"
                    disabled={deploying || !walletId || deployed}
                    title={
                      deployed
                        ? "Wallet already deployed"
                        : !walletId
                        ? "Create a wallet first"
                        : undefined
                    }
                  >
                    {deploying ? "Deploying…" : deployed ? "Deployed" : "Deploy Wallet"}
                  </button>
                  <button
                    onClick={clearLocal}
                    className="btn-secondary"
                    title="Clear locally saved wallet (debug)"
                  >
                    Clear Local (Debug)
                  </button>
                </div>
                <div className="mt-4 text-sm">
                  <div>
                    <span className="font-medium">Wallet ID:</span>{" "}
                    <span className="font-mono break-all">
                      {walletId || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    <span className="font-mono break-all">
                      {walletAddress
                        ? formatStarknetAddress(walletAddress)
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Public Key:</span>{" "}
                    <span className="font-mono break-all">
                      {publicKey || "-"}
                    </span>
                  </div>
                  
                </div>

                {txHash && (
                  <div className="mt-4 text-sm">
                    <div>
                      <span className="font-medium">Deployment Tx:</span>{" "}
                      <span className="font-mono break-all">{txHash}</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
