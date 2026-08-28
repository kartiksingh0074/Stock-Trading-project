"use client";

import { useState } from "react";
import { Bell, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AlertModal from "@/components/AlertModal";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { formatPrice, getAlertText } from "@/lib/utils";
import { toast } from "sonner";

export default function AlertsPanel({ alertData }: AlertsListProps) {
  const [editing, setEditing] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const alerts = alertData ?? [];

  const handleEdit = (alert: Alert) => {
    setEditing(alert);
    setModalOpen(true);
  };

  const handleDelete = async (alertId: string) => {
    const result = await deleteAlert(alertId);
    if (result.success) {
      toast.success("Alert removed");
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to remove alert");
    }
  };

  return (
    <div className="watchlist-alerts">
      <h2 className="watchlist-title">Price Alerts</h2>

      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="alert-empty">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>No alerts yet. Use &quot;Add Alert&quot; on any watchlist row to get notified.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <p className="alert-name">{alert.alertName}</p>
              <div className="alert-details">
                <span className="alert-company">{alert.symbol} · {alert.company}</span>
                <span className="alert-price">{formatPrice(alert.currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm ${alert.status === "TRIGGERED" ? "text-green-500" : "text-gray-400"}`}>
                  {alert.status === "TRIGGERED" ? "Triggered — " : ""}
                  {getAlertText(alert)}
                </span>
                <div className="alert-actions">
                  <Button size="icon" variant="ghost" className="alert-update-btn" onClick={() => handleEdit(alert)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="alert-delete-btn" onClick={() => handleDelete(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <AlertModal
          alertId={editing.id}
          alertData={{
            symbol: editing.symbol,
            company: editing.company,
            alertName: editing.alertName,
            alertType: editing.alertType,
            threshold: String(editing.threshold),
          }}
          open={modalOpen}
          setOpen={(open) => {
            setModalOpen(open);
            if (!open) setEditing(null);
          }}
          onSaved={() => window.location.reload()}
        />
      )}
    </div>
  );
}
