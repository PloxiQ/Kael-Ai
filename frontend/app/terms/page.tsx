import type { Metadata } from "next";
import LegalPage from "../../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use — KAEL",
  description:
    "The rules for using KAEL, acceptable use, AI limitations, MCP integrations, and liability.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return <LegalPage id="terms" />;
}
