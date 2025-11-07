"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyStock, sellStock } from "@/lib/actions/transaction.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  symbol: string;
  company: string;
  type: "BUY" | "SELL";
  currentHolding?: {
    quantity: number;
    averageBuyPrice: number;
  };
}

export default function TransactionDialog({
  open,
  onOpenChange,
  userId,
  symbol,
  company,
  type,
  currentHolding,
}: TransactionDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    if (open && symbol) {
      fetchCurrentPrice();
    }
  }, [open, symbol]);

  const fetchCurrentPrice = async () => {
    setFetchingPrice(true);
    try {
      const quote = await getStockQuote(symbol);
      if (quote) {
        setCurrentPrice(quote.price);
        setPrice(quote.price.toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    const priceValue = parseFloat(price);

    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!priceValue || priceValue <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (type === "SELL" && currentHolding && qty > currentHolding.quantity) {
      toast.error(`You only have ${currentHolding.quantity} shares`);
      return;
    }

    setLoading(true);

    try {
      const result =
        type === "BUY"
          ? await buyStock({ userId, symbol, company, quantity: qty, price: priceValue })
          : await sellStock({ userId, symbol, company, quantity: qty, price: priceValue });

      if (result.success) {
        toast.success(`Successfully ${type === "BUY" ? "bought" : "sold"} ${qty} shares of ${symbol}`);
        setQuantity("");
        setPrice("");
        onOpenChange(false);
        // Refresh the page or update parent component
        window.location.reload();
      } else {
        toast.error(result.error || `Failed to ${type === "BUY" ? "buy" : "sell"} stock`);
      }
    } catch (error) {
      toast.error(`Failed to ${type === "BUY" ? "buy" : "sell"} stock`);
      console.error("Transaction error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : "0.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {type === "BUY" ? "Buy" : "Sell"} {symbol}
          </DialogTitle>
          <DialogDescription>{company}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "SELL" && currentHolding && (
            <div className="p-3 bg-gray-800 rounded-md">
              <p className="text-sm text-gray-400">Your Holdings</p>
              <p className="text-lg font-semibold">
                {currentHolding.quantity} shares @ ${currentHolding.averageBuyPrice.toFixed(2)} avg
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Share</Label>
            <div className="flex gap-2">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
                disabled={loading || fetchingPrice}
              />
              {fetchingPrice ? (
                <Button type="button" variant="outline" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchCurrentPrice}
                  disabled={loading}
                >
                  Use Current
                </Button>
              )}
            </div>
            {currentPrice && (
              <p className="text-xs text-gray-500">
                Current: ${currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div className="p-3 bg-gray-800 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Amount</span>
              <span className="text-lg font-bold">${totalAmount}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingPrice}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `${type === "BUY" ? "Buy" : "Sell"} Stock`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

