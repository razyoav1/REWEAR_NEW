import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-base">1. What Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, name, profile photo</li>
            <li><strong>Location:</strong> approximate location (city-level) used to show nearby listings</li>
            <li><strong>Listings:</strong> photos, descriptions, prices, and other content you post</li>
            <li><strong>Messages:</strong> chat messages between buyers and sellers</li>
            <li><strong>Usage data:</strong> listings you view, save, or interact with (used to personalise your feed)</li>
            <li><strong>Device info:</strong> device type and OS version (for bug fixes and compatibility)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate the marketplace and enable transactions</li>
            <li>To show you relevant listings near your location</li>
            <li>To send you notifications about messages and activity</li>
            <li>To enforce our Terms of Service and keep the platform safe</li>
            <li>To improve the app based on usage patterns</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">3. Who We Share Your Data With</h2>
          <p>We do not sell your personal data. We share data only with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> our database and authentication provider (data stored in the EU/US)</li>
            <li><strong>Google:</strong> if you sign in with Google, subject to Google's privacy policy</li>
            <li><strong>Other users:</strong> your public profile (name, photo, location city, ratings) is visible to other Rewear users</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">4. Location Data</h2>
          <p>We request your location only when you choose to update it in Settings. We store only approximate coordinates and never share your precise location with other users.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">5. Data Retention</h2>
          <p>Your data is retained for as long as your account is active. When you delete your account, all your personal data, listings, messages, and activity history are permanently deleted within 30 days.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">6. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> you can view all data associated with your account within the app</li>
            <li><strong>Correction:</strong> update your profile and settings at any time</li>
            <li><strong>Deletion:</strong> delete your account from Settings → Delete Account. This permanently removes all your data.</li>
            <li><strong>Portability:</strong> contact us to request a copy of your data</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">7. Children's Privacy</h2>
          <p>Rewear is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has created an account, contact us and we will delete it.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">8. Security</h2>
          <p>We use industry-standard security practices including encrypted connections (HTTPS/TLS), row-level security on our database, and secure authentication. However, no system is 100% secure — use a strong password and keep your account credentials private.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">9. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">10. Contact</h2>
          <p>For privacy-related questions or data deletion requests, contact us through the Help & FAQ section in the app.</p>
        </section>
      </div>
    </div>
  );
}
