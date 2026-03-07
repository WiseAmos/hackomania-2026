import { Zap, Users, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import OracleInjector from "./OracleInjector";
import WagerSimulator from "./WagerSimulator";
import TimeTravel from "./TimeTravel";

function AdminDashboard() {
  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-4">
        <h1 className="text-pt-text font-black text-2xl">
          Simulation Portal
        </h1>
        <p className="text-pt-muted text-sm mt-1">
          Admin-only controls for demo and testing
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap, label: "Oracle Trigger", color: "text-pt-cyan" },
          { icon: Users, label: "Wager Fail", color: "text-amber-400" },
          { icon: Clock, label: "Time Travel", color: "text-purple-400" },
        ].map(({ icon: Icon, label, color }) => (
          <Card key={label} className="flex flex-col items-center gap-2 p-3">
            <Icon size={20} className={color} />
            <span className="text-pt-muted text-xs text-center">{label}</span>
          </Card>
        ))}
      </div>

      <OracleInjector />
      <WagerSimulator />
      <TimeTravel />
    </div>
  );
}

export default AdminDashboard;
