import React, { useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage({ onBackToHome }) {
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
            <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-md text-neutral-300 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Terms of Service</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Terms & Conditions
            </h1>
            <p className="text-neutral-400 text-sm">
              Effective Date: October 12, 2026 · Last Updated: October 12, 2026
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-300 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms and Conditions constitute a legally binding agreement between you and Uber Clone. By registering an account, requesting a ride, or enrolling as an independent driver partner, you acknowledge that you have read, understood, and agreed to be bound by these terms in full. If you do not agree, you must immediately discontinue use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              2. Platform Nature & Role
            </h2>
            <p>
              Uber Clone provides an on-demand technology platform connecting prospective riders with independent third-party transportation providers (drivers). Uber Clone is a technology dispatch platform and does not itself operate a fleet of vehicles or employ transportation drivers directly, unless explicitly specified in enterprise partner agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              3. User Eligibility & Account Responsibilities
            </h2>
            <p>
              To use the platform, you must be at least 18 years of age and possess full legal capacity to enter into binding agreements. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>Provide accurate, current, and complete personal registration details.</li>
              <li>Maintain the security and confidentiality of your account credentials.</li>
              <li>Accept responsibility for all activities conducted under your authenticated session.</li>
              <li>Never allow third parties to use your personal rider profile or driver account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              4. Booking, Fares, and Cancellation Guidelines
            </h2>
            <p>
              Fare estimates displayed prior to booking are calculated based on route distance, expected trip duration, vehicle category (Uber Go, Comfort, XL, Black), and prevailing local traffic conditions.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>
                <strong className="text-neutral-200">PIN Verification Protocol:</strong> For rider and driver safety, a 4-digit One-Time PIN is generated upon booking confirmation. Riders must share this PIN only in person after visually confirming driver identity and vehicle license plate. Trips commence strictly after driver PIN validation.
              </li>
              <li>
                <strong className="text-neutral-200">Cancellation Terms:</strong> Riders may cancel a trip free of charge prior to driver dispatch or within 2 minutes of driver acceptance. Cancellations made after a driver has traversed significant distance toward pickup may incur a standard cancellation fee to compensate the driver partner.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              5. Driver Partner Obligations
            </h2>
            <p>
              Individuals operating as driver partners agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 text-sm">
              <li>Hold a valid commercial driving license, valid road tax, and active third-party vehicle insurance.</li>
              <li>Maintain registered vehicles in roadworthy, clean, and mechanically sound condition.</li>
              <li>Comply with all regional traffic laws, speed regulations, and passenger safety standards.</li>
              <li>Transmit genuine, real-time GPS location telemetry during all active online and assigned transit sessions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              6. Payment Terms and Settlements
            </h2>
            <p>
              All payments for completed trips must be settled through approved platform channels (UPI, Credit/Debit Card, or direct cash to driver). Driver partner earnings are subject to standard platform service commission (typically 20%), with net payouts disbursed directly via verified digital payment rails.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              7. Limitation of Liability
            </h2>
            <p>
              Uber Clone shall not be liable for indirect, incidental, special, exemplary, punitive, or consequential damages resulting from the use of the platform, delays caused by unforeseen traffic congestion, or conduct of third-party independent drivers beyond verified platform safety protocols.
            </p>
          </section>

          <section className="space-y-3 border-t border-neutral-800 pt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              8. Contact & Legal Notices
            </h2>
            <p className="text-neutral-400 text-sm">
              For formal dispute notices or questions regarding these Terms, contact our legal counsel:
              <br />
              <span className="font-semibold text-white">Uber Clone Legal Compliance Department</span>
              <br />
              Email: legal@uberclone.internal · Physical Address: Tech Operations Hub, Salt Lake Sector V, Kolkata
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
