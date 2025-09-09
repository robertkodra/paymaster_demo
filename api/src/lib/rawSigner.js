const { transaction, CallData, hash, stark, typedData, RPC } = require("starknet");

class RawSigner {
  async signRaw(messageHash) {
    throw new Error("signRaw method must be implemented by subclass");
  }

  async getPubKey() {
    throw new Error("This signer allows multiple public keys");
  }

  async signMessage(typedDataArgument, accountAddress) {
    const messageHash = typedData.getMessageHash(
      typedDataArgument,
      accountAddress
    );
    return this.signRaw(messageHash);
  }

  async signTransaction(transactions, details) {
    const compiledCalldata = transaction.getExecuteCalldata(
      transactions,
      details.cairoVersion
    );
    let msgHash;

    if (Object.values(RPC.ETransactionVersion2).includes(details.version)) {
      const det = details;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
      });
    } else if (
      Object.values(RPC.ETransactionVersion3).includes(details.version)
    ) {
      const det = details;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw new Error("unsupported signTransaction version");
    }

    return await this.signRaw(msgHash);
  }

  async signDeployAccountTransaction(details) {
    const compiledConstructorCalldata = CallData.compile(
      details.constructorCalldata
    );
    let msgHash;

    if (Object.values(RPC.ETransactionVersion2).includes(details.version)) {
      const det = details;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        constructorCalldata: compiledConstructorCalldata,
        version: det.version,
      });
    } else if (
      Object.values(RPC.ETransactionVersion3).includes(details.version)
    ) {
      const det = details;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        compiledConstructorCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw new Error(
        `unsupported signDeployAccountTransaction version: ${details.version}`
      );
    }

    return await this.signRaw(msgHash);
  }

  async signDeclareTransaction(details) {
    let msgHash;

    if (Object.values(RPC.ETransactionVersion2).includes(details.version)) {
      const det = details;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
      });
    } else if (
      Object.values(RPC.ETransactionVersion3).includes(details.version)
    ) {
      const det = details;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw new Error("unsupported signDeclareTransaction version");
    }

    return await this.signRaw(msgHash);
  }
}

module.exports = { RawSigner };
