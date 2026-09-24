import type { Metadata } from "next";
import EngineConsole from "@/components/engine/EngineConsole";
import "./engine.css";

/* Tokenization engine console: a design preview of the token layer as
   specified in whitepaper v4.0 Section 6 (Token-2022 mint configuration,
   issuer-composed compliance modules, pre-flight simulation, distributions
   paid against attested production statements).

   Standalone route, not linked from the nav or the module lobby, noindex.
   Everything below the attestation step is illustrative: no instrument
   exists, no program is deployed, no offer is made. Keep the copy that way.
   The attestation panel is the one live element: it reads /api/health.

   House rule: no em-dashes in brand-facing copy. */

export const metadata: Metadata = {
  title: "Tokenization Engine",
  description:
    "Design preview of the GEOM tokenization engine: permissioned Token-2022 instruments, issuer-composed compliance modules, and distributions paid against attested production statements.",
  robots: { index: false, follow: false },
};

export default function EnginePage() {
  return <EngineConsole />;
}
