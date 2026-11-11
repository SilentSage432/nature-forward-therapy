import { MaintenanceHolding } from "@/components/PublicMaintenanceGate";
import { getMaintenanceModeCached } from "@/lib/system-settings";

export const revalidate = 30;

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceModeCached();
  return <MaintenanceHolding message={maintenance.message} />;
}
