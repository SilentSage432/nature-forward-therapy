import { MaintenanceHolding } from "@/components/PublicMaintenanceGate";
import { getMaintenanceMode } from "@/lib/system-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceMode();
  return <MaintenanceHolding message={maintenance.message} />;
}
