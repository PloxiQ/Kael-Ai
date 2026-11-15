import type { Metadata } from "next";
import LegalPage from "../../components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — KAEL",
  description:
    "What data KAEL processes, why it is needed, where it is stored, and which rights you can exercise.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return <LegalPage id="privacy" />;
}
