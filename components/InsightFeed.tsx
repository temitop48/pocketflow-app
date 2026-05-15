"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

type Activity = {
  direction: "incoming" | "outgoing";
  amount: string;
  aiVerdict?: "safe" | "risky" | "not_recommended" | null;
};

export default function InsightFeed() {
  const { address, isConnected } = useAccount();

  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    count: 0,
    aiReviewed: 0,
    risky: 0,
  });

  useEffect(() => {
    async function load() {
      if (!address) return;

      const res = await fetch(`/api/transactions?wallet=${address}`);
      const data = await res.json();
      const activities: Activity[] = data.activities || [];

      let incoming = 0;
      let outgoing = 0;
      let aiReviewed = 0;
      let risky = 0;

      activities.forEach((tx) => {
        const amount = Number(tx.amount);

        if (tx.direction === "incoming") incoming += amount;
        if (tx.direction === "outgoing") outgoing += amount;

        if (tx.direction === "outgoing" && tx.aiVerdict) {
          aiReviewed += 1;
          if (tx.aiVerdict !== "safe") risky += 1;
        }
      });

      setStats({
        incoming,
        outgoing,
        count: activities.length,
        aiReviewed,
        risky,
      });
    }

    if (isConnected && address) load();

    window.addEventListener("pocketflow-activity-updated", load);
    return () => window.removeEventListener("pocketflow-activity-updated", load);
  }, [address, isConnected]);

  const insights = useMemo(() => {
    const notes: string[] = [];

    if (!isConnected) {
      return ["Connect your wallet to begin financial monitoring."];
    }

    if (stats.count === 0) {
      return [
        "No financial behavior signal yet. Send or receive funds to begin tracking.",
      ];
    }

    if (stats.incoming > stats.outgoing) {
      notes.push("Incoming flow is currently stronger than outgoing activity.");
    } else if (stats.outgoing > stats.incoming) {
      notes.push("Outgoing activity is currently higher than incoming flow.");
    } else {
      notes.push("Incoming and outgoing flow are currently balanced.");
    }

    if (stats.aiReviewed > 0) {
      notes.push(
        `Payment intelligence has reviewed ${stats.aiReviewed} outgoing payment${
          stats.aiReviewed === 1 ? "" : "s"
        }.`
      );
    }

    if (stats.risky > 0) {
      notes.push(
        `${stats.risky} reviewed payment${
          stats.risky === 1 ? "" : "s"
        } showed elevated risk.`
      );
    }

    if (stats.count >= 5) {
      notes.push("Your wallet has enough activity to form a behavior signal.");
    } else {
      notes.push("More activity will make your financial signal clearer.");
    }

    return notes;
  }, [isConnected, stats]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Insight Feed
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          What PocketFlow notices
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Calm observations from your wallet activity and payment reviews.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {insights.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}