"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AlertModal({ alertId, alertData, open, setOpen, onSaved }: AlertModalProps & { onSaved?: () => void }) {
  const [alertName, setAlertName] = useState(alertData?.alertName ?? "");
  const [alertType, setAlertType] = useState<"upper" | "lower">(alertData?.alertType ?? "upper");
  const [threshold, setThreshold] = useState(alertData?.threshold ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAlertName(alertData?.alertName ?? "");
      setAlertType(alertData?.alertType ?? "upper");
      setThreshold(alertData?.threshold ?? "");
    }
  }, [open, alertData]);

  const isEdit = Boolean(alertId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertData) return;

    const thresholdValue = parseFloat(threshold);
    if (!alertName.trim()) {
      toast.error("Please enter a name for this alert");
      return;
    }
    if (!thresholdValue || thresholdValue <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...alertData, alertName, alertType, threshold };
      const result = isEdit && alertId ? await updateAlert(alertId, payload) : await createAlert(payload);

      if (result.success) {
        toast.success(isEdit ? "Alert updated" : "Alert created");
        setOpen(false);
        onSaved?.();
      } else {
        toast.error(result.error || "Failed to save alert");
      }
    } catch (error) {
      console.error("Alert save error:", error);
      toast.error("Failed to save alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {isEdit ? "Edit Alert" : "New Price Alert"}
          </DialogTitle>
          <DialogDescription>
            {alertData ? `${alertData.symbol} — ${alertData.company}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertName" className="form-label">Alert Name</Label>
            <Input
              id="alertName"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g. Buy the dip"
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label">Condition</Label>
            <Select value={alertType} onValueChange={(v) => setAlertType(v as "upper" | "lower")}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="upper" className="focus:bg-gray-600 focus:text-white">Price rises above</SelectItem>
                <SelectItem value="lower" className="focus:bg-gray-600 focus:text-white">Price falls below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold" className="form-label">Target Price</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Enter target price"
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Update Alert" : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
