"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TransactionDialog from "@/components/TransactionDialog";
import { getPortfolioHolding } from "@/lib/actions/portfolio.actions";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BuySellButtonsProps {
  userId: string;
  symbol: string;
  company: string;
}

export default function BuySellButtons({ userId, symbol, company }: BuySellButtonsProps) {
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [currentHolding, setCurrentHolding] = useState<{
    quantity: number;
    averageBuyPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHolding = async () => {
    setLoading(true);
    try {
      const holding = await getPortfolioHolding(userId, symbol);
      if (holding) {
        setCurrentHolding({
          quantity: holding.quantity,
          averageBuyPrice: holding.averageBuyPrice,
        });
      } else {
        setCurrentHolding(null);
      }
    } catch (error) {
      console.error("Error fetching holding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellClick = async () => {
    await fetchHolding();
    setSellDialogOpen(true);
  };

  return (
    <>
      <div className="flex gap-3">
        <Button
          onClick={() => setBuyDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Buy
        </Button>
        <Button
          onClick={handleSellClick}
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          disabled={loading}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Sell
        </Button>
      </div>

      <TransactionDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        userId={userId}
        symbol={symbol}
        company={company}
        type="BUY"
      />

      <TransactionDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        userId={userId}
        symbol={symbol}
        company={company}
        type="SELL"
        currentHolding={currentHolding || undefined}
      />
    </>
  );
}

