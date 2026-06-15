// Gas-cost preflight for the mainnet deploy. Dry-runs the FULL governance kernel
// deployment on the in-process Hardhat network (free, no real ETH), sums the real
// gas used by every transaction, and prices it at live mainnet gas.
//
// Usage (nothing is broadcast to mainnet — this only READS the gas price):
//   MAINNET_RPC_URL=https://...  npx hardhat run scripts/estimate-deploy-gas.ts
//   # or pin a price:  GAS_PRICE_GWEI=18  npx hardhat run scripts/estimate-deploy-gas.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  let totalGas = 0n;

  async function gasOfDeploy(contract: { deploymentTransaction: () => unknown }): Promise<void> {
    const tx = contract.deploymentTransaction() as { wait: () => Promise<{ gasUsed: bigint } | null> } | null;
    const receipt = tx ? await tx.wait() : null;
    if (receipt) totalGas += receipt.gasUsed;
  }
  async function gasOfCall(txResponse: { wait: () => Promise<{ gasUsed: bigint } | null> }): Promise<void> {
    const receipt = await txResponse.wait();
    if (receipt) totalGas += receipt.gasUsed;
  }

  // ── Mirror scripts/deploy.ts exactly ───────────────────────────────────────
  const MemberRegistry = await ethers.getContractFactory("MemberRegistry");
  const memberRegistry = await MemberRegistry.deploy(deployer.address);
  await memberRegistry.waitForDeployment();
  await gasOfDeploy(memberRegistry);

  const timelockDelay = 2 * 24 * 60 * 60;
  const Timelock = await ethers.getContractFactory("Timelock");
  const timelock = await Timelock.deploy(timelockDelay, deployer.address, deployer.address);
  await timelock.waitForDeployment();
  await gasOfDeploy(timelock);

  const Governor = await ethers.getContractFactory("Governor");
  const governor = await Governor.deploy(
    await memberRegistry.getAddress(),
    await timelock.getAddress(),
    deployer.address,
    1,
    50400,
    20
  );
  await governor.waitForDeployment();
  await gasOfDeploy(governor);

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    await timelock.getAddress(),
    deployer.address,
    ethers.parseEther("10"),
    ethers.parseEther("50"),
    30 * 24 * 60 * 60
  );
  await treasury.waitForDeployment();
  await gasOfDeploy(treasury);

  const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
  const emergencyGuardian = await EmergencyGuardian.deploy(
    [deployer.address],
    1,
    await treasury.getAddress(),
    await governor.getAddress()
  );
  await emergencyGuardian.waitForDeployment();
  await gasOfDeploy(emergencyGuardian);

  // Wiring transactions
  await gasOfCall(await memberRegistry.setGovernor(await governor.getAddress()));
  await gasOfCall(await memberRegistry.setTimelock(await timelock.getAddress()));
  await gasOfCall(await timelock.setGovernor(await governor.getAddress()));
  await gasOfCall(await governor.setGuardianBootstrap(await emergencyGuardian.getAddress()));
  await gasOfCall(await treasury.setGuardianBootstrap(await emergencyGuardian.getAddress()));
  await gasOfCall(await timelock.setGuardianBootstrap(await emergencyGuardian.getAddress()));
  await gasOfCall(await memberRegistry.revokeAdmin());
  await gasOfCall(await timelock.finalizeBootstrap());
  await gasOfCall(await governor.finalizeBootstrap());
  await gasOfCall(await treasury.finalizeBootstrap());

  // ── Price it at live mainnet gas ───────────────────────────────────────────
  let gasPrice: bigint;
  let priceSource: string;
  if (process.env.GAS_PRICE_GWEI) {
    gasPrice = ethers.parseUnits(process.env.GAS_PRICE_GWEI, "gwei");
    priceSource = `GAS_PRICE_GWEI=${process.env.GAS_PRICE_GWEI}`;
  } else if (process.env.MAINNET_RPC_URL) {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const fee = await provider.getFeeData();
    gasPrice = fee.maxFeePerGas ?? fee.gasPrice ?? ethers.parseUnits("20", "gwei");
    priceSource = "live mainnet feeData";
  } else {
    gasPrice = ethers.parseUnits("20", "gwei");
    priceSource = "default 20 gwei (set MAINNET_RPC_URL or GAS_PRICE_GWEI for accuracy)";
  }

  const costWei = totalGas * gasPrice;
  console.log("\n=== GOVDAO mainnet deploy — gas preflight ===");
  console.log(`Total gas (15 txns):  ${totalGas.toString()}`);
  console.log(`Gas price:            ${ethers.formatUnits(gasPrice, "gwei")} gwei  (${priceSource})`);
  console.log(`Estimated cost:       ${ethers.formatEther(costWei)} ETH`);
  console.log("\nThis was a free dry-run on the in-process Hardhat chain — nothing was broadcast.");
  console.log("Deploy for real with:  CONFIRM_MAINNET=yes bash scripts/deploy-and-wire.sh mainnet\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
