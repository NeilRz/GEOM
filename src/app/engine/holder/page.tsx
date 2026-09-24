import type { Metadata } from "next";
import HolderExperience from "@/components/engine/HolderExperience";
import "./holder.css";

export const metadata: Metadata = {
  title: "Holder workspace | Engine preview",
  description: "An illustrative holder journey through GEOM resource instruments.",
  robots: { index: false, follow: false },
};

export default function HolderPage() {
  return <HolderExperience />;
}
