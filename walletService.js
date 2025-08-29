const {
  Account,
  ec,
  stark,
  RpcProvider,
  hash,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  num,
} = require("starknet");
const {
  GaslessOptions,
  SEPOLIA_BASE_URL,
  fetchBuildTypedData,
  fetchExecuteTransaction,
} = require("@avnu/gasless-sdk");

const createReadyWallet = async () => {
  console.log("Starting Ready wallet creation...");

  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  const options = {
    baseUrl: SEPOLIA_BASE_URL,
    apiKey: process.env.PAYMASTER_KEY,
  };

  // Generating the private key with Stark Curve
  const privateKeyAX = stark.randomAddress();
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  console.log("Generated keys - Public key:", starkKeyPubAX);

  const accountClassHash = process.env.READY_CLASSHASH;
  console.log("Using Ready class hash:", accountClassHash);

  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption(CairoOptionVariant.None);

  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian,
  });

  const contractAddress = hash.calculateContractAddressFromHash(
    starkKeyPubAX,
    accountClassHash,
    AXConstructorCallData,
    0
  );
  console.log("Calculated contract address:", contractAddress);

  const account = new Account(provider, contractAddress, privateKeyAX);

  // Initial call to the contract
  const initialCalls = [
    {
      contractAddress: process.env.CONTRACT_ADDRESS,
      entrypoint: process.env.CONTRACT_ENTRY_POINT_GET_COUNTER || "get_counter",
      calldata: [contractAddress],
    },
  ];

  try {
    console.log("Building typed data for deployment...");
    const typeData = await fetchBuildTypedData(
      contractAddress,
      initialCalls,
      undefined,
      undefined,
      options,
      accountClassHash
    );

    console.log("Signing deployment message...");
    const userSignature = await account.signMessage(typeData);

    const deploymentData = {
      class_hash: accountClassHash,
      salt: starkKeyPubAX,
      unique: `${num.toHex(0)}`,
      calldata: AXConstructorCallData.map((value) => num.toHex(value)),
    };

    console.log("Executing deployment transaction...");
    const executeTransaction = await fetchExecuteTransaction(
      contractAddress,
      JSON.stringify(typeData),
      userSignature,
      options,
      deploymentData
    );

    console.log(
      "Deployment transaction hash:",
      executeTransaction.transactionHash
    );

    return {
      success: true,
      transactionHash: executeTransaction.transactionHash,
      walletAddress: contractAddress,
      publicKey: starkKeyPubAX,
      privateKey: privateKeyAX,
    };
  } catch (error) {
    console.error("Error in wallet creation:", error);
    return {
      success: false,
      error: error.response?.data || error.message,
      details: error.response?.data?.details || "Failed to create wallet",
    };
  }
};

module.exports = {
  createReadyWallet,
};
