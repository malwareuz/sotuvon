import type { Metadata } from "next";
import { POSScreen } from "@/components/pos/pos-screen";

export const metadata: Metadata = { title: "Xarid" };

export default function POSPage() {
  return <POSScreen />;
}
