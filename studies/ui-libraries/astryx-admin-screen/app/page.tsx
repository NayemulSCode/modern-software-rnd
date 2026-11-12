import { AppFrame } from "@/components/app-frame";
import { InventoryScreen } from "@/components/inventory-screen";

// The route file stays a Server Component. Everything interactive lives in
// the two Client Components it renders.
export default function InventoryPage() {
  return (
    <AppFrame>
      <InventoryScreen />
    </AppFrame>
  );
}
