import type { Metadata } from "next";
import LegalPage from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Wiloplay",
  description: "How Wiloplay collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      label="YOUR PRIVACY, IN PLAIN LANGUAGE"
      title="Privacy Policy"
      description="This policy explains what Wiloplay Technologies Limited collects when you use Wiloplay, why we use it, and the choices you have."
    >
      <section>
        <h2>1. Information we handle</h2>
        <p>Depending on how you use Wiloplay, we may handle:</p>
        <ul>
          <li>Account details such as your name, email address, password hash, and email-verification status.</li>
          <li>Music activity such as liked tracks, playlists, playback history, follows, and qualified listens.</li>
          <li>Artist releases and event details, including audio, artwork, descriptions, ticket orders, and check-in records.</li>
          <li>Payment references and transfer-account details needed to prepare or confirm event transactions. Paystack processes payment transactions under its own terms and privacy notice.</li>
          <li>A city you choose to share for artist trend reporting. City sharing is optional; Wiloplay does not request GPS location for this feature.</li>
          <li>Messages you send to Wiloplay and basic technical information required to operate and protect the service.</li>
        </ul>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p>We use information to create and secure accounts, verify email addresses, deliver music and artist features, manage playlists and listening history, show aggregated artist insights, operate events and tickets, send service emails, and prevent abuse or troubleshoot failures.</p>
      </section>

      <section>
        <h2>3. When information is shared</h2>
        <p>Wiloplay uses service providers to run the app. Depending on the feature, these may include hosting and database providers, SMTP email delivery, Deezer for catalog search and short previews, Paystack for payment services, OpenAI for optional artist tools, and Auphonic for optional audio processing. Their own terms and privacy notices apply to their services.</p>
        <p>Artist profiles show aggregate follower, listen, and optional city trends. Event organizers may see attendee details needed to manage ticket sales and check-in. We do not display a listener&apos;s email address as part of public music analytics.</p>
      </section>

      <section>
        <h2>4. Browser storage and choices</h2>
        <p>The web app stores your sign-in token and optional city preference in your browser&apos;s local storage. You can sign out to remove the saved sign-in token. You can stop city sharing in the player controls; Wiloplay will also remove previously shared city labels when that request succeeds.</p>
        <p>You can manage likes and playlists in your library. To ask about access, correction, or deletion of account information, contact us using the email address on this page.</p>
      </section>

      <section>
        <h2>5. Retention and security</h2>
        <p>We keep information for as long as needed to provide Wiloplay, maintain account and event records, resolve disputes, and meet applicable legal obligations. We use reasonable safeguards, but no online service can guarantee absolute security.</p>
      </section>

      <section>
        <h2>6. Children and policy updates</h2>
        <p>Wiloplay is not intended for children who are below the minimum age allowed to use the service under applicable law. We may update this policy as the app changes. Material updates will be posted on this page with a revised effective date.</p>
      </section>
    </LegalPage>
  );
}
