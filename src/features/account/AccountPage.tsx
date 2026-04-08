import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTicketsStore } from "../tickets/model/ticketsStore";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function AccountPage() {
  const navigate = useNavigate();
  const { hasDeutschlandticket, toggleDeutschlandticket } = useTicketsStore();

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Account</h2>
          <p className="text-sm text-muted-foreground">Manage subscriptions and personal settings.</p>
        </div>
        <Button type="button" variant="outline" size="icon" onClick={() => navigate("/explore")} aria-label="Close account">
          <X size={16} />
        </Button>
      </header>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold">Deutschlandticket</h3>
            <p className="text-xs text-muted-foreground">Enable this PoC ticket so it appears in the Tickets page.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Status: {hasDeutschlandticket ? "Active" : "Inactive"}</span>
            <Button type="button" variant={hasDeutschlandticket ? "default" : "outline"} onClick={toggleDeutschlandticket}>
              {hasDeutschlandticket ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
