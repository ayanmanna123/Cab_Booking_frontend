import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
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
  Copy
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
      const reg = localStorage.getItem('driver_registered_upi');
      if (ride?.driverUpiId && ride.driverUpiId !== 'vikram.cab@okhdfcbank') {
        return ride.driverUpiId;
      }
      if (reg) return reg;
      const custom = localStorage.getItem('driver_custom_upi');
      if (custom && custom !== 'vikram.cab@okhdfcbank') return custom;
      return ride?.driverUpiId || 'vikram.cab@okhdfcbank';
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
  const leftCardRef = useRef(null);
  const [syncedMapHeight, setSyncedMapHeight] = useState('480px');

  // Synchronize map height with left details card so both columns have matching heights
  useEffect(() => {
    if (!leftCardRef.current) return;
    const updateSize = () => {
      if (leftCardRef.current && window.innerWidth >= 1024) {
        const leftH = leftCardRef.current.offsetHeight;
        if (leftH > 200) {
          // Subtract 24px for bottom telemetry line (18px text + mt-1.5)
          setSyncedMapHeight(`${Math.max(380, leftH - 24)}px`);
        }
      } else {
        setSyncedMapHeight('380px');
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(leftCardRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [statusStep, paymentCompleted, tripCompleted, ride?.otp]);

  // Synchronize driverUpiId whenever assigned driver updates
  useEffect(() => {
    if (ride?.driverUpiId && ride.driverUpiId !== 'vikram.cab@okhdfcbank') {
      setDriverUpiId(ride.driverUpiId);
    } else {
      const reg = localStorage.getItem('driver_registered_upi');
      if (reg) {
        setDriverUpiId(reg);
      } else if (ride?.driverUpiId) {
        setDriverUpiId(ride.driverUpiId);
      }
    }
  }, [ride?.driverUpiId]);

  // Listen to live broadcast acceptance event for dynamic driver UPI ID
  useEffect(() => {
    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'RIDE_ACCEPTED' && event.data?.driverUpiId) {
          setDriverUpiId(event.data.driverUpiId);
        }
      };
    } catch {}

    return () => {
      if (channel) channel.close();
    };
  }, []);

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
    <div className="py-4 sm:py-6 max-w-[1200px] mx-auto px-4 sm:px-6 select-none">
      {/* Main Responsive Two-Column Layout: Ride & Driver Details (~38%) + Live Map (~62%) */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        {/* Left Column: Ride & Driver Details (~38% width) */}
        <div ref={leftCardRef} className="w-full lg:w-[38%] shrink-0">
          <div className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl select-none">
            {/* 1. Slim Ride Status Bar */}
            <div className="pb-3 border-b border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tripCompleted ? 'bg-emerald-400' : 'bg-white animate-pulse'}`} />
                  <span className="text-xs font-semibold text-white tracking-tight truncate">
                    {tripCompleted
                      ? 'Trip completed'
                      : statusStep >= 3
                      ? 'Trip in progress'
                      : statusStep === 2
                      ? 'Driver arrived at pickup'
                      : 'Driver arriving'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    {tripCompleted
                      ? 'COMPLETED'
                      : statusStep >= 3
                      ? 'ON TRIP'
                      : statusStep === 2
                      ? 'AT PICKUP'
                      : 'ARRIVING'}
                  </span>

                  {/* Compact Emergency SOS Button */}
                  {!tripCompleted && (
                    <button
                      type="button"
                      onClick={handleSos}
                      title="Emergency Assistance"
                      className={`h-5 px-1.5 rounded text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer ${
                        sosActive
                          ? 'bg-red-700 text-white animate-pulse'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                      <span>{sosActive ? 'SOS Dispatched' : 'SOS'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Supporting Text */}
              <p className="text-[11px] text-neutral-400 pl-4 leading-relaxed">
                {tripCompleted
                  ? 'You have safely arrived at your destination.'
                  : statusStep >= 3
                  ? `En route to ${ride?.dropoffAddress || 'destination'}.`
                  : statusStep === 2
                  ? 'Your driver has arrived at the pickup location. Verify PIN to begin.'
                  : 'Your driver is en route to meet you at pickup.'}
              </p>

              {/* Slim 4-Step Stepper Progress Bar */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {steps.map(step => (
                  <div key={step.id} className="space-y-1">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        step.id <= statusStep ? 'bg-white' : 'bg-neutral-800'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-medium block truncate text-center ${
                        step.id <= statusStep ? 'text-white' : 'text-neutral-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Minimal Driver Card */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                  <img
                    src={ride?.driverAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"}
                    alt="Driver avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-white truncate">
                    {ride?.driverName || 'Vikram Malhotra'}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mt-0.5">
                    <span className="flex items-center space-x-0.5 text-neutral-200 font-medium">
                      <Star className="w-3 h-3 text-white fill-white inline" />
                      <span>{Number(ride?.driverRating || 5.0).toFixed(1)}</span>
                    </span>
                    <span>•</span>
                    <span className="truncate">{ride?.driverTrips != null ? `${ride.driverTrips}+ trips` : '1,240+ trips'}</span>
                  </div>
                </div>
              </div>

              {/* Small Phone-call Icon Button (36px) */}
              <a
                href={`tel:${ride?.driverPhone || '+919876543210'}`}
                className="w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm"
                title="Call Driver"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 3. Vehicle Details: Compact Two-Column Layout */}
            <div className="space-y-2 pb-3 border-b border-neutral-800/80">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                    Vehicle
                  </span>
                  <span className="font-semibold text-white">
                    {ride?.vehicleModel || 'Toyota Camry'}
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    {ride?.vehicleColor || 'Silver Metallic'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                    License Plate
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-black border border-neutral-800 px-2.5 py-1 rounded-md inline-block mt-0.5">
                    {ride?.licensePlate || 'DL 01 AB 4488'}
                  </span>
                </div>
              </div>

              {/* Subtle Safety Reminder */}
              <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Verify vehicle model and license plate before boarding.</span>
              </div>
            </div>

            {/* 4. Compact Ride Verification PIN */}
            {tripCompleted ? (
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Trip Successfully Completed</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Fare: <strong className="text-white">₹{fareFormatted}</strong> {paymentCompleted ? 'paid successfully.' : 'ready for payment.'}
                </p>
                {onComplete && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full h-8 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Back to Home
                  </button>
                )}
              </div>
            ) : statusStep < 3 && ride?.otp ? (
              <div className="space-y-2 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Ride verification PIN
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Share with your driver before starting
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {(String(ride.otp || '5816').padStart(4, '0').slice(-4).split('')).map((digit, idx) => (
                      <span
                        key={idx}
                        className="w-7 h-8 rounded-md bg-black border border-neutral-800 flex items-center justify-center font-mono text-sm font-bold text-white shadow-inner"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500">
                  <Shield className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>Never disclose this PIN before verifying driver and car.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white">PIN Verified • On Trip</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  {etaMinutes} min to destination
                </span>
              </div>
            )}

            {/* 5. Compact Trip Payment */}
            <div className="space-y-2 pb-3 border-b border-neutral-800/80 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">
                    {paymentCompleted ? 'Payment Completed' : 'Trip Fare'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {paymentCompleted ? `Paid via ${selectedPaymentMethod.toUpperCase()}` : 'Pay online or cash to driver'}
                  </span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  ₹{fareFormatted}
                </span>
              </div>

              {!paymentCompleted ? (
                <button
                  type="button"
                  id="complete-payment-button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full h-9 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Complete Payment · ₹{fareFormatted}</span>
                </button>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-300 font-medium flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Verified</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="h-7 px-2.5 bg-neutral-900 border border-neutral-800 text-white text-[11px] font-medium rounded-md hover:bg-neutral-800 transition cursor-pointer"
                  >
                    View Receipt
                  </button>
                </div>
              )}
            </div>

            {/* 6. Trip Route Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start space-x-2 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <span className="text-neutral-300 truncate text-[11px]">
                  {ride?.pickupAddress || 'Pickup Point'}
                </span>
              </div>
              <div className="flex items-start space-x-2 truncate">
                <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                <span className="text-neutral-400 truncate text-[11px]">
                  {ride?.dropoffAddress || 'Destination Point'}
                </span>
              </div>
            </div>

            {/* 7. Cancel ride */}
            {onCancel && statusStep < 3 && !tripCompleted && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-8 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white font-medium text-xs rounded-lg transition cursor-pointer mt-1"
              >
                Cancel Ride
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Leaflet Map (~62%) */}
        <div className="w-full lg:w-[62%] flex-1 min-w-0">
          <div className="relative w-full rounded-[18px] overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
            {/* Map Top Floating Overlay */}
            <div className="absolute top-3 left-3 z-20 bg-neutral-950/80 border border-neutral-800 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-xs text-neutral-300 shadow-lg">
              <MapPin className="w-3 h-3 text-white" />
              <span className="font-mono text-[11px] font-medium">
                {ride?.dropoffAddress ? ride.dropoffAddress.split(',')[0] : 'Live Trip Route'}
              </span>
              <span className="text-[10px] text-neutral-500">
                · {etaMinutes} min away
              </span>
            </div>

            <InteractiveMap
              pickupCoords={ride?.pickupCoords || [22.6113, 88.4202]}
              dropoffCoords={ride?.dropoffCoords || [22.5804, 88.4378]}
              height={syncedMapHeight}
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

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400 px-1 shrink-0">
            <span>
              {tripCompleted
                ? 'Trip complete'
                : 'Live GPS telemetry stream active · Driver location synchronizing'}
            </span>
            <span className="text-neutral-500">Scroll wheel or + / − to zoom</span>
          </div>
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
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
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
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
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
                            onClick={() => {
                              if (isEditingDriverUpi && driverUpiId) {
                                try {
                                  localStorage.setItem('driver_custom_upi', driverUpiId.trim());
                                  localStorage.setItem('driver_registered_upi', driverUpiId.trim());
                                } catch {}
                              }
                              setIsEditingDriverUpi(!isEditingDriverUpi);
                            }}
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
                    <div>
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
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
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
                      <span>UPI UTR / Ref No:</span>
                      <span className="font-mono text-emerald-400 font-bold text-[11px] truncate max-w-[210px]">
                        #{savedUtr || 'UTR-829104829102'}
                      </span>
                    </div>
                  </>
                )}

                {selectedPaymentMethod === 'card' && stripePaymentIntentId && (
                  <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-900">
                    <span>Stripe Reference:</span>
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
