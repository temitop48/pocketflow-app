import { db } from "@/lib/db";

type AnalyzePaymentInput = {
  wallet: string;
  amount: number;
  balance?: number;
  guardMode?: boolean;
  minimumBalancePercent?: number;
};

export type PaymentSafetyResult = {
  verdict: "safe" | "risky" | "not_recommended";
  confidence: number;
  reason: string;
  balanceSignal: "healthy" | "low" | "unknown";
  cashflowSignal: "positive" | "weak" | "negative" | "unknown";
  scoreImpact: "low" | "medium" | "high";
  stats: {
    incoming30d: number;
    outgoing30d: number;
    netFlow30d: number;
    transactionCount30d: number;
  };
};

export async function analyzePaymentSafety({
  wallet,
  amount,
  balance,
  guardMode = false,
  minimumBalancePercent = 20,
}: AnalyzePaymentInput): Promise<PaymentSafetyResult> {
  const normalizedWallet = wallet.toLowerCase();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const activities = await db.transactionActivity.findMany({
    where: {
      wallet: normalizedWallet,
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const incoming30d = activities
    .filter((tx) => tx.direction === "incoming")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const outgoing30d = activities
    .filter((tx) => tx.direction === "outgoing")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netFlow30d = incoming30d - outgoing30d;
  const transactionCount30d = activities.length;

  const hasKnownBalance =
    typeof balance === "number" && Number.isFinite(balance) && balance >= 0;

  const balanceAfterPayment = hasKnownBalance ? balance - amount : undefined;

  const minPercent = Math.max(0, Math.min(100, minimumBalancePercent));

  const guardThreshold =
    hasKnownBalance && balance !== undefined
      ? (minPercent / 100) * balance
      : undefined;

  const breaksGuard =
    guardMode &&
    hasKnownBalance &&
    balanceAfterPayment !== undefined &&
    balanceAfterPayment < (guardThreshold ?? 0);

  const paymentToBalanceRatio =
    hasKnownBalance && balance > 0 ? amount / balance : undefined;

  const paymentToIncomeRatio =
    incoming30d > 0 ? amount / incoming30d : amount > 0 ? 1 : 0;

  const balancePercentUsed =
    paymentToBalanceRatio !== undefined
      ? Math.round(paymentToBalanceRatio * 100)
      : undefined;

  let riskPoints = 0;

  if (!hasKnownBalance) riskPoints += 5;
  if (hasKnownBalance && balance < amount) riskPoints += 80;
  if (breaksGuard) riskPoints += 40;

  if (
    hasKnownBalance &&
    balanceAfterPayment !== undefined &&
    balanceAfterPayment >= 0 &&
    paymentToBalanceRatio !== undefined
  ) {
    if (paymentToBalanceRatio > 0.25) riskPoints += 15;
    if (paymentToBalanceRatio > 0.5) riskPoints += 20;
    if (paymentToBalanceRatio > 0.75) riskPoints += 25;
  }

  if (transactionCount30d < 3) riskPoints += 20;
  if (netFlow30d < 0) riskPoints += 15;
  if (paymentToIncomeRatio > 0.25) riskPoints += 10;
  if (paymentToIncomeRatio > 0.5) riskPoints += 15;
  if (amount > incoming30d && incoming30d > 0) riskPoints += 15;
  if (incoming30d === 0 && amount > 0) riskPoints += 35;

  const confidence = Math.max(35, Math.min(95, 95 - riskPoints));

  const balanceSignal: PaymentSafetyResult["balanceSignal"] = !hasKnownBalance
    ? "unknown"
    : balance < amount || breaksGuard
      ? "low"
      : paymentToBalanceRatio !== undefined && paymentToBalanceRatio > 0.5
        ? "low"
        : "healthy";

  const cashflowSignal: PaymentSafetyResult["cashflowSignal"] =
    transactionCount30d === 0
      ? "unknown"
      : netFlow30d > 0
        ? "positive"
        : netFlow30d === 0
          ? "weak"
          : "negative";

  const scoreImpact: PaymentSafetyResult["scoreImpact"] =
    riskPoints < 35 ? "low" : riskPoints < 65 ? "medium" : "high";

  const verdict: PaymentSafetyResult["verdict"] =
    hasKnownBalance && balance < amount
      ? "not_recommended"
      : breaksGuard
        ? "risky"
        : riskPoints >= 75
          ? "not_recommended"
          : riskPoints >= 45
            ? "risky"
            : "safe";

  const observations: string[] = [];

  if (hasKnownBalance && paymentToBalanceRatio !== undefined) {
    observations.push(
      `This payment would use ${balancePercentUsed}% of your current wallet balance.`
    );
  }

  if (hasKnownBalance && balanceAfterPayment !== undefined) {
    observations.push(
      `Your estimated balance after signing would be ${balanceAfterPayment.toFixed(
        2
      )} USDC.`
    );
  }

  if (breaksGuard) {
    observations.push(
      `That would move your wallet below your ${minPercent}% Spending Guard threshold.`
    );
  }

  if (netFlow30d < 0) {
    observations.push(
      `Your 30-day net flow is ${netFlow30d.toFixed(
        2
      )} USDC, meaning recent outgoing activity is higher than incoming activity.`
    );
  }

  if (incoming30d > 0 && amount > incoming30d) {
    observations.push(
      "This payment is larger than your total incoming flow over the last 30 days."
    );
  }

  if (transactionCount30d < 3) {
    observations.push(
      "Recent activity is limited, so PocketFlow has less history to evaluate."
    );
  }

  if (incoming30d === 0 && amount > 0) {
    observations.push(
      "No incoming flow was detected in the last 30 days."
    );
  }

  const explanation =
    observations.length > 0
      ? observations.join(" ")
      : "Your recent balance and cashflow signals do not show unusual pressure for this payment.";

  const reason =
    verdict === "safe"
      ? `This payment appears financially manageable. ${explanation}`
      : verdict === "risky"
        ? `This payment may create financial pressure. ${explanation}`
        : `PocketFlow detected elevated financial risk. ${explanation}`;

  return {
    verdict,
    confidence,
    reason,
    balanceSignal,
    cashflowSignal,
    scoreImpact,
    stats: {
      incoming30d,
      outgoing30d,
      netFlow30d,
      transactionCount30d,
    },
  };
}