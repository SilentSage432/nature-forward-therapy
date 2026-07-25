import { MaintenanceHolding } from "@/components/MaintenanceGate";
import { getMaintenanceMode } from "@/lib/system-settings";

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceMode();
  return <MaintenanceHolding message={maintenance.message} />;
}
