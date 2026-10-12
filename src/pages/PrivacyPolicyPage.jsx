import React, { useEffect } from 'react';
import { Shield, Lock, Eye, FileText, ChevronRight, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage({ onBackToHome }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = (e) => {
    e.preventDefault();
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm font-semibold text-neutral-400 hover:text-white transition cursor-pointer mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Home</span>
          </button>
          
          <div className="space-y-4 border-b border-neutral-800 pb-8">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Privacy Policy
            </h1>
            <p className="text-neutral-400 text-sm">
              Effective Date: October 12, 2026 · Last Updated: October 12, 2026
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-300 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center">
              1. Overview and Scope
            </h2>
            <p>
              This Privacy Policy explains how Uber Clone collects, uses, processes, and protects your personal data when you interact with our ride-hailing applications, driver portal, web dashboard, and associated technology services. By accessing or using our services, you consent to the practices described in this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              2. Information We Collect
            </h2>
            <p>
              We collect information to deliver safe, reliable, and efficient mobility services. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>
                <strong className="text-neutral-200">Account Credentials:</strong> Name, verified email address, phone number, and authentication identifiers managed via Clerk authentication.
              </li>
              <li>
                <strong className="text-neutral-200">Location Information:</strong> Precise and approximate geolocation coordinates collected from riders and drivers during active app sessions, ride booking, and live route navigation.
              </li>
              <li>
                <strong className="text-neutral-200">Driver Partner Verification Data:</strong> Government-issued identification, commercial driving license numbers, vehicle registration numbers, vehicle make, model, color, and inspection documents.
              </li>
              <li>
                <strong className="text-neutral-200">Transaction & Payment Details:</strong> Payment method identifiers, transaction references, fare amounts, tips, and payout details processed securely via PCI-DSS compliant payment gateways. We do not store raw cardholder verification codes.
              </li>
              <li>
                <strong className="text-neutral-200">Trip & Sensor Data:</strong> Pickup and dropoff timestamps, route trajectories, distances traveled, cancellation events, and driver telemetry.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              3. How We Use Your Information
            </h2>
            <p>We use the data we collect solely for legitimate business operations:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>Facilitating ride dispatch, pairing riders with nearby available drivers, and calculating route geometry.</li>
              <li>Ensuring platform integrity, verifying user identities, preventing fraudulent transactions, and enforcing safety standards.</li>
              <li>Providing 24/7 incident assistance, in-app emergency SOS dispatch, and customer support resolution.</li>
              <li>Facilitating automated fare computation, driver commission settlement, and digital tax invoices.</li>
              <li>Complying with applicable statutory regulations, road safety directives, and law enforcement requests.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              4. Real-Time Location & Telemetry Disclosures
            </h2>
            <p>
              Real-time GPS location is fundamental to the operation of the platform. We collect driver location whenever the driver application is toggled to "Go Live" or an assigned trip is underway. For riders, location is accessed when requesting a ride, estimating pickup points, and monitoring active transit progress. Location sharing ceases upon trip completion or when background location permissions are revoked.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              5. Data Sharing and Third Parties
            </h2>
            <p>
              We do not sell, rent, or trade your personal data. Data is shared strictly under the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>
                <strong className="text-neutral-200">Between Drivers and Riders:</strong> Once a ride request is matched, the rider receives the driver's name, photo, vehicle details, and license plate. The driver receives the rider's pickup point, destination, and first name.
              </li>
              <li>
                <strong className="text-neutral-200">Service Providers:</strong> Encrypted hosting and database infrastructure (Supabase), user authentication (Clerk), mapping telemetry (OpenStreetMap / OSRM), and payment processing partners.
              </li>
              <li>
                <strong className="text-neutral-200">Emergency Services:</strong> In the event of an SOS activation, your real-time coordinates, vehicle model, and contact details are transmitted to emergency response authorities and designated trusted contacts.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              6. Data Security and Retention
            </h2>
            <p>
              We implement industry-standard encryption protocols (TLS 1.3 in transit and AES-256 at rest) across all database tiers and API endpoints. User account records and ride history are retained only for as long as required to fulfill transportation obligations, maintain audit records, or satisfy legal mandates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              7. Your Legal Rights & Account Controls
            </h2>
            <p>
              You maintain the right to access, inspect, correct, export, or request deletion of your account and personal data at any time through our Help Center or by contacting our data protection officer.
            </p>
          </section>

          <section className="space-y-3 border-t border-neutral-800 pt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              8. Contact Us
            </h2>
            <p className="text-neutral-400 text-sm">
              For privacy-related inquiries, legal notifications, or data protection officer requests, please contact:
              <br />
              <span className="font-semibold text-white">Uber Clone Legal & Privacy Operations</span>
              <br />
              Email: legal@uberclone.internal · Support Desk: Help Center
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
