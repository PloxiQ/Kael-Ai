import type { Metadata } from "next";
import LegalPage from "../../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Security — KAEL",
  description:
    "How KAEL protects accounts, tokens, MCP connections, and the service, and how to report a vulnerability.",
  alternates: { canonical: "/security/" },
};

export default function SecurityPage() {
  return <LegalPage id="security" />;
}
