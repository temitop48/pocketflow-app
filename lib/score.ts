type ActivityItem = {
  direction: string;
  amount: string;
  createdAt: Date;
};

export type CashflowScoreResult = {
  score: number;
  label: "Weak" | "Growing" | "Stable" | "Strong";
  trend: "Irregular" | "Improving" | "Stable";
  summary: string;
  breakdown: {
    transactionVolume: number;
    consistency: number;
    incomingStrength: number;
    cashflowBalance: number;
    recency: number;
  };
  stats: {
    incomingTotal: number;
    outgoingTotal: number;
    transactionCount: number;
    activeDays: number;
    incomingCount: number;
    outgoingCount: number;
    lastActivityAt: string | null;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getTransactionVolumeScore(transactionCount: number) {
  return clamp(Math.floor(transactionCount / 10) * 5, 0, 50);
}

function getConsistencyScore(transactionCount: number, activeDays: number) {
  if (transactionCount < 10 || activeDays < 2) return 0;

  const activeDayScore = clamp(activeDays * 2, 0, 14);
  const spreadScore = transactionCount / activeDays <= 20 ? 6 : 3;

  return clamp(activeDayScore + spreadScore, 0, 20);
}

function getIncomingStrengthScore(incomingCount: number, incomingTotal: number) {
  if (incomingCount < 5 || incomingTotal <= 0) return 0;

  const countScore = clamp(Math.floor(incomingCount / 5) * 3, 0, 9);
  const totalScore = clamp(Math.floor(incomingTotal / 25) * 2, 0, 6);

  return clamp(countScore + totalScore, 0, 15);
}

function getCashflowBalanceScore(incomingTotal: number, outgoingTotal: number) {
  if (incomingTotal <= 0 || outgoingTotal <= 0) return 0;

  const ratio = outgoingTotal / incomingTotal;

  if (ratio >= 0.4 && ratio <= 0.9) return 10;
  if ((ratio >= 0.25 && ratio < 0.4) || (ratio > 0.9 && ratio <= 1.1)) return 7;
  if ((ratio >= 0.1 && ratio < 0.25) || (ratio > 1.1 && ratio <= 1.4)) return 4;

  return 1;
}

function getRecencyScore(lastActivityAt: Date | null) {
  if (!lastActivityAt) return 0;

  const now = new Date();
  const diffDays =
    (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 3) return 5;
  if (diffDays <= 7) return 3;
  if (diffDays <= 14) return 2;

  return 0;
}

export function calculateCashflowScore(
  activities: ActivityItem[]
): CashflowScoreResult {
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const incoming = sortedActivities.filter(
    (item) => item.direction === "incoming"
  );
  const outgoing = sortedActivities.filter(
    (item) => item.direction === "outgoing"
  );

  const incomingTotal = incoming.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const outgoingTotal = outgoing.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const transactionCount = sortedActivities.length;
  const incomingCount = incoming.length;
  const outgoingCount = outgoing.length;

  const uniqueDays = new Set(
    sortedActivities.map((item) =>
      new Date(item.createdAt).toISOString().slice(0, 10)
    )
  );

  const activeDays = uniqueDays.size;

  const lastActivityAt =
    sortedActivities.length > 0
      ? new Date(sortedActivities[0].createdAt)
      : null;

  const transactionVolume = getTransactionVolumeScore(transactionCount);
  const consistency = getConsistencyScore(transactionCount, activeDays);
  const incomingStrength = getIncomingStrengthScore(
    incomingCount,
    incomingTotal
  );
  const cashflowBalance = getCashflowBalanceScore(
    incomingTotal,
    outgoingTotal
  );
  const recency = getRecencyScore(lastActivityAt);

  const score = clamp(
    transactionVolume +
      consistency +
      incomingStrength +
      cashflowBalance +
      recency,
    0,
    100
  );

  let label: CashflowScoreResult["label"] = "Weak";
  if (score >= 80) label = "Strong";
  else if (score >= 55) label = "Stable";
  else if (score >= 25) label = "Growing";

  let trend: CashflowScoreResult["trend"] = "Irregular";
  if (transactionCount >= 100 && activeDays >= 10 && incomingCount >= 20) {
    trend = "Stable";
  } else if (transactionCount >= 30 && activeDays >= 5) {
    trend = "Improving";
  }

  let summary =
    "Very limited activity. More transactions and consistent wallet usage are needed to build a stronger profile.";

  if (score >= 80) {
    summary =
      "Strong proof-of-cashflow with deep transaction history, consistent usage, and healthy financial behavior.";
  } else if (score >= 55) {
    summary =
      "Stable cashflow profile with meaningful activity and improving reliability.";
  } else if (score >= 25) {
    summary =
      "Growing profile. Activity exists, but more transaction depth and consistency are needed.";
  }

  return {
    score,
    label,
    trend,
    summary,
    breakdown: {
      transactionVolume,
      consistency,
      incomingStrength,
      cashflowBalance,
      recency,
    },
    stats: {
      incomingTotal,
      outgoingTotal,
      transactionCount,
      activeDays,
      incomingCount,
      outgoingCount,
      lastActivityAt: lastActivityAt ? lastActivityAt.toISOString() : null,
    },
  };
}