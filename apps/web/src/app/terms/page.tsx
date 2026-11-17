import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Wiloplay",
  description: "The terms for using Wiloplay music, artist, and event features.",
};

export default function TermsPage() {
  return (
    <LegalPage
      label="THE HOUSE RULES"
      title="Terms of Service"
      description="These terms cover your use of Wiloplay, operated by Wiloplay Technologies Limited in Lagos, Nigeria. By using the service, you agree to follow them."
    >
      <section>
        <h2>1. Your account</h2>
        <p>Give us accurate account information, keep your sign-in details secure, and verify your email to use listener and artist features. You are responsible for activity under your account. Contact us if you believe someone else has accessed it.</p>
      </section>

      <section>
        <h2>2. Music and artist uploads</h2>
        <p>You keep ownership of music and artwork you upload. You confirm that you own or have permission to upload and share that material. You grant Wiloplay permission to store, process, display, and play it only as needed to operate the service and the features you choose.</p>
        <p>Do not upload material that infringes someone else&apos;s rights or use playback, listening, or artist features to manipulate analytics. Wiloplay may restrict or remove content reported as infringing or otherwise in breach of these terms.</p>
      </section>

      <section>
        <h2>3. Third-party music previews</h2>
        <p>Deezer search, chart information, links, artwork, and short audio previews are supplied by Deezer and remain subject to Deezer&apos;s terms and availability. Wiloplay does not provide full-length playback rights to Deezer&apos;s commercial catalog. Do not copy, extract, or redistribute third-party music through Wiloplay.</p>
      </section>

      <section>
        <h2>4. Playlists, library, and community</h2>
        <p>You are responsible for the names and descriptions you add to playlists and for using artist follows, likes, and other community features respectfully. Do not use the service to harass, impersonate, defraud, or interfere with other users.</p>
      </section>

      <section>
        <h2>5. Events and payments</h2>
        <p>Event organizers are responsible for providing accurate event details and honoring tickets issued for their events. Payment processing may be provided by Paystack and is subject to its applicable terms. The price, fees, payment status, and any event-specific cancellation or refund details shown during checkout apply to that transaction.</p>
      </section>

      <section>
        <h2>6. Service availability and account action</h2>
        <p>Wiloplay and third-party features may change or become temporarily unavailable. We may suspend or restrict an account or content when reasonably necessary to protect users, comply with law, or enforce these terms.</p>
      </section>

      <section>
        <h2>7. Legal terms</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria, subject to mandatory consumer protections. If part of these terms cannot be enforced, the remaining provisions continue to apply. We may update the terms by posting a revised version here.</p>
      </section>
    </LegalPage>
  );
}
