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
  PaymasterRpc,
  num,
} = require("starknet");

const createReadyWallet = async () => {
  console.log("Starting Ready wallet creation with Starknet.js v8.5.2 paymaster...");

  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  // Initialize Paymaster RPC with proper options structure
  const paymasterOptions = {
    nodeUrl: process.env.PAYMASTER_URL || "https://sepolia.paymaster.avnu.fi",
  };
  
  // Add headers if API key is provided for sponsored mode
  if (process.env.PAYMASTER_API_KEY) {
    paymasterOptions.headers = { 
      "x-paymaster-api-key": process.env.PAYMASTER_API_KEY 
    };
  }

  const paymasterRpc = new PaymasterRpc(paymasterOptions);

  // Check if paymaster service is available
  const isAvailable = await paymasterRpc.isAvailable();
  if (!isAvailable) {
    throw new Error("Paymaster service is not available");
  }
  console.log("Paymaster service is available");

  // Get supported gas tokens
  const supportedTokens = await paymasterRpc.getSupportedTokens();
  console.log("Supported gas tokens:", supportedTokens.length);

  // Select gas token (ETH or USDC based on configuration)
  const gasToken =
    process.env.GAS_TOKEN_ADDRESS || supportedTokens[0]?.token_address;
  if (!gasToken) {
    throw new Error("No supported gas tokens available");
  }
  console.log("Using gas token:", gasToken);

  // Generate key pair
  const privateKey = stark.randomAddress();
  const publicKey = ec.starkCurve.getStarkKey(privateKey);
  console.log("Generated keys - Public key:", publicKey);

  const accountClassHash = process.env.READY_CLASSHASH;
  console.log("Using Ready class hash:", accountClassHash);

  // Prepare constructor calldata for Ready wallet
  const signer = new CairoCustomEnum({ Starknet: { pubkey: publicKey } });
  const guardian = new CairoOption(CairoOptionVariant.None);

  const constructorCalldata = CallData.compile({
    owner: signer,
    guardian: guardian,
  }).map(value => num.toHex(value));

  // Calculate contract address
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    accountClassHash,
    constructorCalldata,
    0
  );
  console.log("Calculated contract address:", contractAddress);

  // Create account instance with paymaster - use options object
  const account = new Account({
    provider: provider,
    address: contractAddress,
    signer: privateKey,
    cairoVersion: "1",
    paymaster: paymasterRpc,
  });

  try {
    console.log("Preparing paymaster transaction...");

    // Prepare paymaster details based on mode
    const isSponsored = process.env.PAYMASTER_MODE === "sponsored";
    
    // Create deployment data for paymaster in correct format (snake_case fields)
    const deploymentData = {
      class_hash: accountClassHash,
      salt: publicKey,
      calldata: constructorCalldata,
      address: contractAddress,
      version: 1,
    };

    // Initial call to execute after deployment
    const initialCall = {
      contractAddress: process.env.CONTRACT_ADDRESS,
      entrypoint: process.env.CONTRACT_ENTRY_POINT_GET_COUNTER || "get_counter",
      calldata: CallData.compile([contractAddress]),
    };

    // Prepare paymaster fee details with correct structure
    const paymasterDetails = {
      feeMode: isSponsored
        ? { mode: "sponsored" }
        : { mode: "default", gasToken: gasToken },
      deploymentData: deploymentData,
    };

    console.log(`Processing with paymaster in ${isSponsored ? "sponsored" : "default"} mode...`);

    let maxFee = undefined;
    
    // Estimate fees if not sponsored
    if (!isSponsored) {
      console.log("Estimating fees...");
      const feeEstimation = await account.estimatePaymasterTransactionFee(
        [initialCall],
        paymasterDetails
      );
      console.log("Estimated fee:", feeEstimation.suggested_max_fee_in_gas_token.toString());
      maxFee = feeEstimation.suggested_max_fee_in_gas_token;
    }

    // Execute deployment and initial transaction with paymaster
    console.log("Executing paymaster transaction...");
    const result = await account.executePaymasterTransaction(
      [initialCall],
      paymasterDetails,
      maxFee
    );

    console.log("Transaction hash:", result.transaction_hash);

    // Return immediately without waiting for confirmation to avoid timeout
    console.log("Transaction submitted successfully - not waiting for confirmation");

    return {
      success: true,
      transactionHash: result.transaction_hash,
      walletAddress: contractAddress,
      publicKey: publicKey,
      privateKey: privateKey,
      status: "SUBMITTED", // Since we're not waiting, mark as submitted
      gasToken: !isSponsored ? gasToken : "sponsored",
      mode: isSponsored ? "sponsored" : "default",
    };
  } catch (error) {
    console.error("Error in wallet creation:", error);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      error: error.message,
      details: error.stack || "Failed to create wallet with paymaster",
    };
  }
};

module.exports = {
  createReadyWallet,
};