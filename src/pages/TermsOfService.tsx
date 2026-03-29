import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Terms of Service</h1>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-base">1. Acceptance of Terms</h2>
          <p>By creating an account or using Rewear, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">2. Who Can Use Rewear</h2>
          <p>You must be at least 13 years old to use Rewear. By using the app you confirm that you meet this requirement.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">3. Your Account</h2>
          <p>You are responsible for keeping your login credentials secure. You must not share your account with others or use someone else's account.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">4. Listings & Transactions</h2>
          <p>Rewear is a marketplace that connects buyers and sellers. We are not a party to any transaction between users. You are solely responsible for the items you list and the accuracy of your descriptions, photos, and prices.</p>
          <p>You must not list counterfeit, stolen, or prohibited items.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">5. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Harass, threaten, or abuse other users</li>
            <li>Post false or misleading information</li>
            <li>Use the app for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to any part of the app or its infrastructure</li>
            <li>Scrape, copy, or republish content without permission</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">6. Content You Post</h2>
          <p>You retain ownership of content you post (photos, descriptions, messages). By posting, you grant Rewear a non-exclusive, royalty-free license to display and distribute that content within the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">7. Account Suspension & Termination</h2>
          <p>We reserve the right to suspend or permanently ban accounts that violate these terms, without prior notice. You may also delete your account at any time from Settings.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">8. Disclaimer of Warranties</h2>
          <p>Rewear is provided "as is" without any warranty. We do not guarantee the quality, safety, or legality of items listed by users.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Rewear and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">10. Changes to These Terms</h2>
          <p>We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">11. Contact</h2>
          <p>For questions about these terms, contact us through the Help & FAQ section in the app.</p>
        </section>
      </div>
    </div>
  );
}
