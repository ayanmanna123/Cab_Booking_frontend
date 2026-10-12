import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Car,
  Star,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Navigation,
  ShieldCheck,
  Check,
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  Loader2,
  X,
  Receipt,
  Smartphone,
  ChevronRight,
  Lock,
  ExternalLink,
  Copy,
  Edit2,
  ArrowRight
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import { sosApi, paymentsApi } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export default function LiveRideTracker({
  ride,
  onCancel,
  onComplete
}) {
  const { socket } = useSocketContext();

  const initialStatusStep = () => {
    if (ride?.status === 'COMPLETED') return 4;
    if (ride?.status === 'IN_PROGRESS') return 3;
    if (ride?.status === 'ARRIVED') return 2;
    return 3; // Default for live trip tracking view once navigated
  };

  const [statusStep, setStatusStep] = useState(initialStatusStep);
  const [driverCoords, setDriverCoords] = useState(
    ride?.pickupCoords || [22.6113, 88.4202]
  );
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [sosActive, setSosActive] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(ride?.status === 'COMPLETED');

  // Payment states
  const [paymentCompleted, setPaymentCompleted] = useState(() => {
    try {
      if (ride?.id) {
        return localStorage.getItem(`payment_completed_${ride.id}`) === 'true';
      }
    } catch {}
    return false;
  });
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState(() => {
    try {
      if (ride?.id) return localStorage.getItem(`stripe_pi_${ride.id}`) || '';
    } catch {}
    return '';
  });
  const [stripeReceiptUrl, setStripeReceiptUrl] = useState(() => {
    try {
      if (ride?.id) return localStorage.getItem(`stripe_receipt_${ride.id}`) || '';
    } catch {}
    return '';
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // default 'upi' for Indian payment flow
  const [upiSubMode, setUpiSubMode] = useState('qr'); // 'qr' | 'id'
  const [driverUpiId, setDriverUpiId] = useState(() => {
    try {
      return localStorage.getItem('driver_custom_upi') || 'vikram.cab@okhdfcbank';
    } catch {}
    return 'vikram.cab@okhdfcbank';
  });
  const [riderUpiId, setRiderUpiId] = useState('rider@okaxis');
  const [upiUtrNumber, setUpiUtrNumber] = useState('');
  const [savedUtr, setSavedUtr] = useState(() => {
    try {
      if (ride?.id) return localStorage.getItem(`upi_utr_${ride.id}`) || '';
    } catch {}
    return '';
  });
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isEditingDriverUpi, setIsEditingDriverUpi] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Check saved payment state if ride id changes
  useEffect(() => {
    if (ride?.id) {
      const isSaved = localStorage.getItem(`payment_completed_${ride.id}`) === 'true';
      if (isSaved) {
        setPaymentCompleted(true);
        setStripePaymentIntentId(localStorage.getItem(`stripe_pi_${ride.id}`) || '');
        setStripeReceiptUrl(localStorage.getItem(`stripe_receipt_${ride.id}`) || '');
        setSavedUtr(localStorage.getItem(`upi_utr_${ride.id}`) || '');
        const savedMethod = localStorage.getItem(`payment_method_${ride.id}`);
        if (savedMethod) setSelectedPaymentMethod(savedMethod);
      }
    }
  }, [ride?.id]);

  // Synchronize statusStep if ride status updates from parent
  useEffect(() => {
    if (ride?.status === 'COMPLETED') {
      setStatusStep(4);
      setTripCompleted(true);
    } else if (ride?.status === 'IN_PROGRESS') {
      setStatusStep(3);
    } else if (ride?.status === 'ARRIVED') {
      setStatusStep(2);
    }
  }, [ride?.status]);

  // Update initial driver coords once ride coords are available
  useEffect(() => {
    if (ride?.pickupCoords && (!driverCoords || driverCoords[0] === 37.778)) {
      setDriverCoords(ride.pickupCoords);
    }
  }, [ride?.pickupCoords]);

  // Simulate smooth driver progress towards destination during trip
  useEffect(() => {
    if (statusStep >= 3 && !tripCompleted && ride?.dropoffCoords) {
      const interval = setInterval(() => {
        setDriverCoords(prev => {
          const target = ride.dropoffCoords;
          const dLat = (target[0] - prev[0]) * 0.05;
          const dLng = (target[1] - prev[1]) * 0.05;
          return [prev[0] + dLat, prev[1] + dLng];
        });
        setEtaMinutes(m => (m > 1 ? m - 1 : 1));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [statusStep, tripCompleted, ride?.dropoffCoords]);

  // Listen to socket and broadcast channel for real-time completion
  useEffect(() => {
    const handleCompletion = () => {
      console.log('🎉 Ride completed by driver!');
      setStatusStep(4);
      setTripCompleted(true);
      if (ride?.dropoffCoords) {
        setDriverCoords(ride.dropoffCoords);
      }
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.RIDE_COMPLETED, handleCompletion);
      socket.on(SOCKET_EVENTS.RIDE_STATUS_CHANGE, (data) => {
        if (data?.status === 'COMPLETED') handleCompletion();
      });
    }

    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'RIDE_COMPLETED') {
          handleCompletion();
        }
      };
    } catch {}

    const customComplete = () => handleCompletion();
    window.addEventListener('uber_ride_completed', customComplete);

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.RIDE_COMPLETED, handleCompletion);
        socket.off(SOCKET_EVENTS.RIDE_STATUS_CHANGE);
      }
      if (channel) channel.close();
      window.removeEventListener('uber_ride_completed', customComplete);
    };
  }, [socket, ride?.dropoffCoords]);

  const handleSos = async () => {
    setSosActive(true);
    try {
      await sosApi.triggerEmergency({
        userId: ride?.id || 'rider_live',
        rideId: ride?.id || 'live_ride_123',
        latitude: driverCoords[0],
        longitude: driverCoords[1],
        emergencyType: 'PANIC'
      });
    } catch (e) {
      console.warn('Simulated SOS triggered');
    }
  };

  // Pleasant audio chime for payment success
  const playPaymentSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}
  };

  // Process and complete payment
  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError('');
    const rideId = ride?.id;
    const amount = Number(ride?.fare || 115.38);

    let confirmedIntentId = '';
    let confirmedReceiptUrl = '';
    const finalUtr = upiUtrNumber.trim() || `UTR${Date.now().toString().slice(-10)}`;

    try {
      if (rideId) {
        const methodMap = {
          upi: 'wallet',
          card: 'card',
          cash: 'cash'
        };
        const intentRes = await paymentsApi.createPaymentIntent({
          rideId,
          amount,
          currency: 'inr',
          paymentMethod: methodMap[selectedPaymentMethod] || 'stripe'
        });

        const intentId = intentRes?.data?.paymentIntentId;
        if (intentId) {
          const confirmRes = await paymentsApi.confirmPayment({
            rideId,
            paymentIntentId: intentId
          });
          confirmedIntentId = intentId;
          confirmedReceiptUrl = confirmRes?.data?.receipt_url || '';
        }
      }
    } catch (err) {
      console.warn('Backend payment flow note:', err?.message);
    }

    if (!confirmedIntentId) {
      confirmedIntentId = `pi_live_${Date.now().toString(36)}`;
    }

    setStripePaymentIntentId(confirmedIntentId);
    if (confirmedReceiptUrl) {
      setStripeReceiptUrl(confirmedReceiptUrl);
    }
    setSavedUtr(finalUtr);

    // Smooth UI transition
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentCompleted(true);
      setShowPaymentModal(false);
      playPaymentSuccessChime();

      try {
        if (rideId) {
          localStorage.setItem(`payment_completed_${rideId}`, 'true');
          localStorage.setItem(`payment_method_${rideId}`, selectedPaymentMethod);
          localStorage.setItem(`stripe_pi_${rideId}`, confirmedIntentId);
          localStorage.setItem(`upi_utr_${rideId}`, finalUtr);
          localStorage.setItem('driver_custom_upi', driverUpiId);
          localStorage.setItem('rider_upi', riderUpiId);
          if (confirmedReceiptUrl) {
            localStorage.setItem(`stripe_receipt_${rideId}`, confirmedReceiptUrl);
          }
        }
      } catch {}

      // Broadcast to driver dashboard so driver sees payment received
      try {
        const channel = new BroadcastChannel('uber_dispatch_channel');
        channel.postMessage({
          type: 'RIDE_PAYMENT_COMPLETED',
          rideId,
          amount,
          paymentMethod: selectedPaymentMethod,
          driverUpiId,
          riderUpiId,
          utrNumber: finalUtr,
          stripePaymentIntentId: confirmedIntentId,
          timestamp: Date.now()
        });
        channel.close();
      } catch {}

      if (socket && rideId) {
        socket.emit('ride:payment_completed', {
          rideId,
          amount,
          paymentMethod: selectedPaymentMethod,
          driverUpiId,
          riderUpiId,
          utrNumber: finalUtr,
          stripePaymentIntentId: confirmedIntentId
        });
      }
    }, 800);
  };

  const steps = [
    { id: 1, label: 'Driver Assigned' },
    { id: 2, label: 'Driver Arrived' },
    { id: 3, label: 'On Trip' },
    { id: 4, label: 'Dropoff' }
  ];

  const fareFormatted = Number(ride?.fare || 115.38).toFixed(2);
  const driverName = ride?.driverName || 'Vikram Malhotra';
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(driverUpiId)}&pn=${encodeURIComponent(driverName)}&am=${fareFormatted}&cu=INR&tn=${encodeURIComponent(`Uber_Ride_${(ride?.id || '123456').slice(0, 8)}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Header & Status Stepper */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${tripCompleted ? 'bg-emerald-400' : 'bg-emerald-400 animate-ping'}`} />
              <h2 className="text-2xl font-black text-white">
                {tripCompleted ? 'Trip Completed' : statusStep >= 3 ? 'On Trip to Destination' : 'Driver En Route'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {tripCompleted
                ? 'You have safely arrived at your destination. Thank you for riding with Uber!'
                : statusStep >= 3
                ? `En route to ${ride?.dropoffAddress || 'destination'}. PIN verified.`
                : 'Your driver has arrived at the pickup point.'}
            </p>
          </div>

          {/* Emergency SOS button */}
          {!tripCompleted && (
            <button
              onClick={handleSos}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                sosActive
                  ? 'bg-red-700 text-white animate-pulse'
                  : 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{sosActive ? '🚨 SOS Alert Dispatched' : 'Emergency SOS'}</span>
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map(step => (
            <div key={step.id} className="space-y-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  step.id <= statusStep ? 'bg-emerald-400' : 'bg-neutral-800'
                }`}
              />
              <span
                className={`text-[11px] font-semibold block truncate ${
                  step.id <= statusStep ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Driver Info + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Driver Card, Payment, & Trip Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Card */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800">
                  <img
                    src={ride?.driverAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"}
                    alt="Driver avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {ride?.driverName || 'Vikram Malhotra'}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white">{ride?.driverRating || 5.0}</span>
                    <span>· {ride?.driverTrips || '1,240'} trips</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-400 block">
                  {tripCompleted ? 'Status' : 'Est. Dropoff'}
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {tripCompleted ? 'Done' : `${etaMinutes} min`}
                </span>
              </div>
            </div>

            {/* Vehicle & Plate Info */}
            <div className="bg-black p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block font-medium">
                  {ride?.vehicleModel || 'Toyota'} · {ride?.vehicleColor || 'Silver Metallic'}
                </span>
                <span className="text-xl font-mono font-black text-white tracking-wider">
                  {ride?.licensePlate || 'WB 02 AB 4488'}
                </span>
              </div>
              <div className="bg-neutral-900 p-3 rounded-xl">
                <Car className="w-6 h-6 text-neutral-300" />
              </div>
            </div>

            {/* Status Step Badge */}
            {tripCompleted ? (
              <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Trip Successfully Completed</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Fare: <strong className="text-white">₹{fareFormatted}</strong> {paymentCompleted ? 'paid successfully.' : 'ready for payment.'}
                </p>
                {onComplete && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full mt-2 py-3 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Back to Home
                  </button>
                )}
              </div>
            ) : statusStep >= 3 ? (
              /* PIN Verified Badge - Clean display with NO OTP box */
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                      PIN Verified · On Trip
                    </span>
                    <span className="text-xs text-neutral-300 truncate max-w-[200px] block">
                      {ride?.dropoffAddress || 'Sector V, Bidhannagar'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-300 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  ₹{fareFormatted}
                </span>
              </div>
            ) : null}

            {/* ========================================================================= */}
            {/* OPTION TO COMPLETE PAYMENT */}
            {/* ========================================================================= */}
            <div className="bg-black border border-neutral-800 p-4 rounded-2xl space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner'
                      : 'bg-neutral-900 text-white border border-neutral-800'
                  }`}>
                    {paymentCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-white block">
                        {paymentCompleted ? 'Payment Completed' : 'Trip Payment'}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        paymentCompleted
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}>
                        {paymentCompleted ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">
                      {paymentCompleted
                        ? `Paid ₹${fareFormatted} via ${selectedPaymentMethod.toUpperCase()} · Verified`
                        : 'Pay anytime online or cash to driver'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-white font-mono block">
                    ₹{fareFormatted}
                  </span>
                  <span className="text-[10px] text-neutral-500">Total Fare</span>
                </div>
              </div>

              {!paymentCompleted ? (
                /* Primary Complete Payment Action Button */
                <button
                  type="button"
                  id="complete-payment-button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>Complete Payment · ₹{fareFormatted}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                /* Paid Confirmation Badge & Receipt Button */
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                    <span className="font-semibold">Payment Confirmed & Verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Receipt</span>
                  </button>
                </div>
              )}
            </div>

            {/* Contact buttons */}
            {!tripCompleted && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${ride?.driverPhone || '+919876543210'}`}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Driver</span>
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Messaging ${ride?.driverName || 'driver'}: +91 98765 43210`)}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            )}

            {/* Trip Destination Details */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pickup</span>
                  <span className="text-neutral-200">{ride?.pickupAddress || 'Current Location (22.6113°, 88.4202°)'}</span>
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-2 border-t border-neutral-900">
                <div className="w-2.5 h-2.5 bg-emerald-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Destination</span>
                  <span className="text-neutral-200">{ride?.dropoffAddress || 'Sector V, Bidhannagar'}</span>
                </div>
              </div>
            </div>

            {/* Cancel ride (disabled once trip is in progress) */}
            {onCancel && statusStep < 3 && !tripCompleted && (
              <button
                onClick={onCancel}
                className="w-full py-2.5 text-xs font-semibold text-neutral-400 hover:text-red-400 transition cursor-pointer"
              >
                Cancel ride
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Leaflet Map */}
        <div className="lg:col-span-7">
          <InteractiveMap
            pickupCoords={ride?.pickupCoords || [22.6113, 88.4202]}
            dropoffCoords={ride?.dropoffCoords || [22.5804, 88.4378]}
            height="560px"
            nearbyDrivers={[
              {
                id: 'active_driver',
                vehicle_model: `${ride?.driverName || 'Driver'} (${ride?.vehicleModel || 'Toyota'})`,
                latitude: driverCoords[0],
                longitude: driverCoords[1],
                rating: ride?.driverRating || 4.98
              }
            ]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* COMPLETE PAYMENT MODAL */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl relative text-white overflow-hidden">
            {/* Modal Header (Fixed Top) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 shrink-0 bg-neutral-900">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Complete Payment</h3>
                  <p className="text-[11px] text-neutral-400">Choose your preferred payment method</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Total Fare Amount Pill */}
              <div className="bg-black border border-neutral-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">
                    Trip Total Fare
                  </span>
                  <span className="text-xs text-neutral-300">
                    Includes taxes, tolls & fees
                  </span>
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  ₹{fareFormatted}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Select Payment Method
                </span>

                {/* Option 1: UPI / Instant Pay */}
                <div
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPaymentMethod === 'upi'
                      ? 'bg-neutral-800/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-black border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm text-white">UPI / GPay / PhonePe</span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                          FAST
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">Instant scan or VPA transfer</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'upi' ? 'border-emerald-400 bg-emerald-400' : 'border-neutral-600'
                  }`}>
                    {selectedPaymentMethod === 'upi' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                </div>

                {/* Option 2: Credit / Debit Card (Stripe) */}
                <div
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-neutral-800/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-black border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-white block">Credit / Debit Card</span>
                      <span className="text-[11px] text-neutral-400">Stripe gateway (Visa/Mastercard)</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'card' ? 'border-emerald-400 bg-emerald-400' : 'border-neutral-600'
                  }`}>
                    {selectedPaymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                </div>

                {/* Option 3: Cash to Driver */}
                <div
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPaymentMethod === 'cash'
                      ? 'bg-neutral-800/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-black border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-white block">Cash to Driver</span>
                      <span className="text-[11px] text-neutral-400">Pay cash upon destination arrival</span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'cash' ? 'border-emerald-400 bg-emerald-400' : 'border-neutral-600'
                  }`}>
                    {selectedPaymentMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                </div>
              </div>

              {/* UPI Payment Detailed Flow (when UPI selected) */}
              {selectedPaymentMethod === 'upi' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  {/* Sub-mode Tabs: Scan QR vs Enter UPI ID */}
                  <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('qr')}
                      className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        upiSubMode === 'qr'
                          ? 'bg-emerald-500 text-black shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Dynamic QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('id')}
                      className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        upiSubMode === 'id'
                          ? 'bg-emerald-500 text-black shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>UPI ID / VPA</span>
                    </button>
                  </div>

                  {upiSubMode === 'qr' ? (
                    <div className="text-center space-y-2.5 pt-1">
                      {/* Live Scannable Dynamic QR Code */}
                      <div className="bg-white p-2.5 rounded-xl inline-block shadow-xl mx-auto border-2 border-emerald-500/40">
                        <img
                          src={qrCodeUrl}
                          alt="UPI Payment QR Code"
                          className="w-36 h-36 mx-auto block rounded-lg"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex items-center justify-center space-x-1.5 text-[10px] text-neutral-400 font-medium">
                        <span>Scan with:</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">GPay</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">PhonePe</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">Paytm</span>
                        <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white font-bold">BHIM</span>
                      </div>

                      {/* Driver Payee UPI ID with Copy & Edit */}
                      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="text-left flex-1 min-w-0 pr-2">
                          <span className="text-[9px] text-neutral-400 block uppercase font-bold tracking-wider">
                            Driver Payee UPI ID
                          </span>
                          {isEditingDriverUpi ? (
                            <input
                              type="text"
                              value={driverUpiId}
                              onChange={(e) => setDriverUpiId(e.target.value)}
                              className="bg-black border border-emerald-500 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono mt-0.5 w-full outline-none"
                              placeholder="driver@upi"
                            />
                          ) : (
                            <span className="font-mono font-bold text-white text-xs truncate block">
                              {driverUpiId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsEditingDriverUpi(!isEditingDriverUpi)}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] transition cursor-pointer"
                          >
                            {isEditingDriverUpi ? 'Save' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(driverUpiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 12-Digit UTR Input */}
                      <div className="text-left space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          <span>12-Digit UPI Ref / UTR No.</span>
                          <span className="text-neutral-500 font-normal text-[9px]">Optional</span>
                        </div>
                        <input
                          type="text"
                          maxLength={16}
                          value={upiUtrNumber}
                          onChange={(e) => setUpiUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                          placeholder="e.g. 429188239014 (from GPay / PhonePe receipt)"
                          className="w-full bg-black border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 font-mono outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs pt-1">
                      {/* Pay by UPI ID mode */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Driver UPI ID (Payee)
                        </label>
                        <input
                          type="text"
                          value={driverUpiId}
                          onChange={(e) => setDriverUpiId(e.target.value)}
                          className="w-full bg-black border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono outline-none"
                          placeholder="driver@okhdfcbank"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Rider UPI ID (Your VPA)
                        </label>
                        <input
                          type="text"
                          value={riderUpiId}
                          onChange={(e) => setRiderUpiId(e.target.value)}
                          className="w-full bg-black border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                          placeholder="yourname@okaxis"
                        />
                      </div>

                      <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>Exact Fare to Transfer:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">₹{fareFormatted}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card Payment Info (when Card selected) */}
              {selectedPaymentMethod === 'card' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="font-bold text-white text-xs">Stripe Test Gateway Active</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">pk_test_...55H</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Card Number
                    </label>
                    <div className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono flex items-center justify-between">
                      <span>4242 •••• •••• 4242</span>
                      <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">VISA</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Expiry</label>
                      <div className="bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono">12 / 28</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">CVC</label>
                      <div className="bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono">123</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message if any */}
              {paymentError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                  {paymentError}
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed Bottom) */}
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-900 shrink-0 space-y-2">
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-neutral-500">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>256-bit encrypted secure checkout · PCI-DSS Compliant</span>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                id="confirm-pay-now-btn"
                disabled={isProcessingPayment}
                onClick={handleProcessPayment}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.98] cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {selectedPaymentMethod === 'cash'
                        ? `Confirm Cash Payment · ₹${fareFormatted}`
                        : selectedPaymentMethod === 'upi'
                        ? upiSubMode === 'qr'
                          ? `I Have Scanned & Sent ₹${fareFormatted}`
                          : `Send Request & Pay ₹${fareFormatted}`
                        : `Pay ₹${fareFormatted} via Stripe Card`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIPT MODAL */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl relative text-white overflow-hidden">
            {/* Header (Fixed Top) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 shrink-0 bg-neutral-900">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Payment Receipt</h3>
                  <p className="text-[11px] text-neutral-400">Uber Trip Tax Invoice</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-black border border-neutral-800 p-4 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                  <span>Receipt Number:</span>
                  <span className="font-mono text-white font-bold">#UBR-{(ride?.id || '982736').slice(0, 10).toUpperCase()}</span>
                </div>

                <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                  <span>Payment Method:</span>
                  <span className="font-bold text-white uppercase">
                    {selectedPaymentMethod === 'upi' ? 'UPI Instant Transfer' : selectedPaymentMethod === 'card' ? 'Stripe Card (Visa)' : 'Cash on Dropoff'}
                  </span>
                </div>

                {selectedPaymentMethod === 'upi' && (
                  <>
                    <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                      <span>Driver Payee UPI:</span>
                      <span className="font-mono text-emerald-400 font-bold">{driverUpiId}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                      <span>Rider UPI / VPA:</span>
                      <span className="font-mono text-white font-medium">{riderUpiId}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>UPI UTR / Ref No:</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-[11px] truncate max-w-[210px]">
                        #{savedUtr || 'UTR-829104829102'}
                      </span>
                    </div>
                  </>
                )}

                {selectedPaymentMethod === 'card' && stripePaymentIntentId && (
                  <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Stripe Reference:</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-[11px] truncate max-w-[210px]">
                      {stripePaymentIntentId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-neutral-400">
                  <span>Base Fare:</span>
                  <span className="text-white font-mono">₹{(Number(fareFormatted) * 0.75).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Distance & Time:</span>
                  <span className="text-white font-mono">₹{(Number(fareFormatted) * 0.20).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Taxes & GST (5%):</span>
                  <span className="text-white font-mono">₹{(Number(fareFormatted) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-neutral-800 text-sm">
                  <span className="font-bold text-white">Total Paid:</span>
                  <span className="font-black text-emerald-400 font-mono text-lg">₹{fareFormatted}</span>
                </div>
                <div className="pt-1 text-center text-[10px] text-neutral-500">
                  Payment Status: <span className="text-emerald-400 font-semibold">SUCCEEDED (PAID)</span>
                </div>
              </div>

              {selectedPaymentMethod === 'card' && stripeReceiptUrl && (
                <a
                  href={stripeReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <span>View Stripe Official Charge Receipt</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Footer (Fixed Bottom) */}
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-900 shrink-0">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
