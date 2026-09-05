import { expect } from "chai";
import { useEnvironment } from "../helpers.js";
import { Verifier } from "../../src/internal/verifier/Verifier.js";
import { Reporter } from "../../src/internal/tools/reporters/Reporter.js";
import { networkManager } from "../../src/internal/tools/network/NetworkManager.js";

describe("Verifier outcomes", () => {
  useEnvironment("ethers");
  let verifier: any;
  const entry = {
    contractAddress: "0x0000000000000000000000000000000000000001",
    contractName: "Test",
    constructorArguments: [],
    chainId: 31337,
  };
  beforeEach(async function () {
    await Verifier.buildVerifierTaskDeps(this.hre);
    verifier = new Verifier(this.hre, { parallel: 2, attempts: 1 }, true);
  });
  it("rejects invalid loop bounds before any network work", async function () {
    for (const name of ["parallel", "attempts"])
      for (const value of [0, -1, 1.5, NaN, Infinity]) {
        const instance = new Verifier(this.hre, { parallel: 1, attempts: 1, [name]: value }, true);
        await expect(instance.verifyBatch([entry])).to.be.rejectedWith("positive safe integer");
      }
  });
  it("throws when all providers return false", async () => {
    verifier._tryVerifyWithProvider = async () => false;
    await expect(verifier._tryVerify(entry.contractAddress, entry.contractName, [])).to.be.rejectedWith(
      "No configured explorer confirmed",
    );
  });
  it("accepts the fallback provider only when it confirms success", async () => {
    const providers: string[] = [];
    verifier._tryVerifyWithProvider = async (provider: string) => {
      providers.push(provider);
      return provider === "blockscout";
    };
    await verifier._tryVerify(entry.contractAddress, entry.contractName, []);
    expect(providers).to.deep.equal(["etherscan", "blockscout"]);
  });
  it("retries transient failures and stops immediately on success", async function () {
    verifier = new Verifier(this.hre, { parallel: 1, attempts: 3 }, true);
    let calls = 0;
    verifier._tryVerify = async () => {
      if (++calls === 1) throw new Error("transient");
    };
    await verifier._verify(entry);
    expect(calls).to.equal(2);
  });
  it("exhausted failures reject instead of returning success", async () => {
    verifier._tryVerify = async () => {
      throw new Error("service unavailable");
    };
    await expect(verifier._verify(entry)).to.be.rejectedWith("after 1 attempt");
  });
  it("does not mistake an already-verified substring in a failure for confirmation", async () => {
    verifier._tryVerify = async () => {
      throw new Error("already verified lookup failed");
    };
    await expect(verifier._verify(entry)).to.be.rejectedWith("after 1 attempt");
  });
  it("handles non-Error throws without masking them", async () => {
    expect(() => verifier._handleVerificationError(entry.contractAddress, entry.contractName, null)).not.to.throw();
  });
  it("waits for all peers and later batches before rejecting the batch", async () => {
    const finished: string[] = [];
    verifier._verify = async (args: any) => {
      if (args.contractName === "bad") throw new Error("failed");
      await new Promise((resolve) => setTimeout(resolve, 5));
      finished.push(args.contractName);
    };
    await expect(
      verifier.verifyBatch([entry, { ...entry, contractName: "bad" }, { ...entry, contractName: "later" }]),
    ).to.be.rejectedWith("1 contract verification(s) failed");
    expect(finished).to.deep.equal(["Test", "later"]);
  });
  it("resolves successful and foreign-chain-only batches", async () => {
    let calls = 0;
    verifier._verify = async () => {
      calls++;
    };
    await verifier.verifyBatch([entry, { ...entry, chainId: 1 }]);
    expect(calls).to.equal(1);
    await verifier.verifyBatch([{ ...entry, chainId: 1 }]);
    expect(calls).to.equal(1);
  });
  it("reports terminal proxy failure, not initial queue acceptance", async () => {
    const original = networkManager!.axios;
    let failed = 0,
      successful = 0;
    const fail = Reporter!.reportFailedProxyLinking,
      success = Reporter!.reportSuccessfulProxyLinking;
    networkManager!.axios = { post: async () => ({ status: 200, data: { status: "1", result: "guid" } }) } as any;
    Reporter!.reportFailedProxyLinking = () => {
      failed++;
    };
    Reporter!.reportSuccessfulProxyLinking = () => {
      successful++;
    };
    verifier._checkProxyVerificationStatus = async () => ({ status: "0", result: "verification failed" });
    try {
      await verifier._linkProxyWithImplementationAbi(entry.contractAddress, entry.contractAddress);
    } finally {
      networkManager!.axios = original;
      Reporter!.reportFailedProxyLinking = fail;
      Reporter!.reportSuccessfulProxyLinking = success;
    }
    expect(failed).to.equal(1);
    expect(successful).to.equal(0);
  });
  it("bounds permanently pending proxy status and never reports success", async () => {
    const originalAxios = networkManager!.axios,
      originalTimer = globalThis.setTimeout;
    const fail = Reporter!.reportFailedProxyLinking,
      success = Reporter!.reportSuccessfulProxyLinking;
    let failed = 0,
      successful = 0,
      polls = 0;
    networkManager!.axios = { post: async () => ({ status: 200, data: { status: "1", result: "guid" } }) } as any;
    Reporter!.reportFailedProxyLinking = () => {
      failed++;
    };
    Reporter!.reportSuccessfulProxyLinking = () => {
      successful++;
    };
    verifier._checkProxyVerificationStatus = async () => {
      polls++;
      return { status: "1", result: "Pending in queue" };
    };
    globalThis.setTimeout = ((callback: (...args: any[]) => void) => {
      queueMicrotask(callback);
      return 0;
    }) as any;
    try {
      await verifier._linkProxyWithImplementationAbi(entry.contractAddress, entry.contractAddress);
    } finally {
      networkManager!.axios = originalAxios;
      globalThis.setTimeout = originalTimer;
      Reporter!.reportFailedProxyLinking = fail;
      Reporter!.reportSuccessfulProxyLinking = success;
    }
    expect(polls).to.equal(25);
    expect(failed).to.equal(1);
    expect(successful).to.equal(0);
  });
});
