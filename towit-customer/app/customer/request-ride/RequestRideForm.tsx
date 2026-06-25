"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { calculateDistance, fetchOsrmRoute, subsampleRoute } from "@/lib/utils";
import { WEIGHT_LIMITS, CRANE_RATES, ANIMATION_POINTS_TO_ORIGIN, ANIMATION_POINTS_TO_DEST, SEARCH_DELAY_MS, MOCK_ETA_MINUTES, PAYMENT_APP_URL, FEEDBACK_APP_URL } from "@/lib/constants";
import BackButton from "@/components/ui/BackButton";
import DynamicMap from "@/app/customer/request-ride/map-components/DynamicMap";
import { createTripAction, cancelTripAction, finishTripAction, confirmPaymentAction, getLatestActiveTripAction, getTripByIdAction, getDriverInfoAction } from "@/app/customer/request-ride/actions";
import { TRIP_STATUS, TERMINAL_STATUSES } from "@/lib/trip-status";
import { addVehicleAction } from "@/app/customer/vehicles/actions";
import { initMockTripProgress, getTowerRequestStatus, clearMockTripProgress } from "@/services/towerService";
import { getPaymentUrl } from "@/services/paymentService";
import FormStep from "@/components/steps/FormStep";
import SearchingStep from "@/components/steps/SearchingStep";
import FoundStep from "@/components/steps/FoundStep";
import InProgressStep from "@/components/steps/InProgressStep";
import FeedbackSubmittedStep from "@/components/steps/FeedbackSubmittedStep";
import CancelledStep from "@/components/steps/CancelledStep";
import PaymentFailedStep from "@/components/steps/PaymentFailedStep";
import PaymentPendingStep from "@/components/steps/PaymentPendingStep";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

const craneTypeLabels: Record<string, string> = {
  medium: "Mediana",
  large: "Grande",
  conventional: "Convencional",
};

const STORAGE_KEY = "towit-trip-state";

function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(state: Record<string, unknown>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearPersistedState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface InitialTripData {
  tripId: number;
  status: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedPrice: number | null;
  towerId: string | null;
}

export default function RequestRideForm({ initialVehicles = [], initialTrip, tripIdFromUrl }: { initialVehicles?: Vehicle[]; initialTrip?: InitialTripData | null; tripIdFromUrl?: number }) {
  const [origin, setOrigin] = useState<[number, number] | null>(
    initialTrip ? [initialTrip.originLat, initialTrip.originLng] : null
  );
  const [destination, setDestination] = useState<[number, number] | null>(
    initialTrip ? [initialTrip.destinationLat, initialTrip.destinationLng] : null
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedCraneType, setSelectedCraneType] = useState<string>("medium");
  const [isExpanded, setIsExpanded] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [currentTripId, setCurrentTripId] = useState<number | null>(initialTrip?.tripId ?? null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!initialTrip && !tripIdFromUrl) {
      clearPersistedState();
    }

    const saved = loadPersistedState();
    if (saved) {
      if (saved.origin) setOrigin(saved.origin as [number, number]);
      if (saved.destination) setDestination(saved.destination as [number, number]);
      if (saved.selectedVehicleId) setSelectedVehicleId(saved.selectedVehicleId as string);
      if (saved.selectedCraneType) setSelectedCraneType(saved.selectedCraneType as string);
      if (saved.isExpanded !== undefined) setIsExpanded(saved.isExpanded as boolean);
      if (saved.originText) setOriginText(saved.originText as string);
      if (saved.destinationText) setDestinationText(saved.destinationText as string);
      if (saved.currentTripId) setCurrentTripId(saved.currentTripId as number);
      if (saved.tripState === "pago_confirmado" || saved.tripState === "en_proceso") {
        setTripState(saved.tripState as typeof tripState);
      }
      if (saved.towLocation) setTowLocation(saved.towLocation as [number, number]);
      if (saved.eta !== undefined) setEta(saved.eta as number);
      if (saved.viajePhase) setViajePhase(saved.viajePhase as "en_camino" | "en_viaje");
      if (saved.mockProgress) mockProgressRef.current = saved.mockProgress as { step: number; phase: "arriving" | "traveling" };
      if (saved.mockPoints) mockPointsRef.current = saved.mockPoints as { pointsToOrigin: [number, number][]; pointsToDest: [number, number][] };
    }
    setHydrated(true);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 40) {
      setIsExpanded(false);
      setTouchStart(null);
    } else if (diff < -40) {
      setIsExpanded(true);
      setTouchStart(null);
    }
  };

  const [formErrors, setFormErrors] = useState<{ origin?: string; destination?: string; vehicle?: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [tripState, setTripState] = useState<"idle" | "esperando_pago" | "pago_confirmado" | "en_proceso" | "finalizado" | "cancelado" | "payment_failed">(
    initialTrip?.status === TRIP_STATUS.PAYMENT_CONFIRMED ? "pago_confirmado"
    : initialTrip?.status === TRIP_STATUS.IN_PROGRESS ? "en_proceso"
    : initialTrip?.status === TRIP_STATUS.PENDING_PAYMENT && tripIdFromUrl ? "esperando_pago"
    : "idle"
  );
  const [towLocation, setTowLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [viajePhase, setViajePhase] = useState<"en_camino" | "en_viaje">("en_camino");
  const [originText, setOriginText] = useState<string>("");
  const [destinationText, setDestinationText] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [driverRating, setDriverRating] = useState<number>(0);
  const intervalsRef = useRef<{ polling?: NodeJS.Timeout; searchTimeout?: NodeJS.Timeout }>({});
  const mockProgressRef = useRef<{ step: number; phase: "arriving" | "traveling" } | null>(null);
  const mockPointsRef = useRef<{ pointsToOrigin: [number, number][]; pointsToDest: [number, number][] } | null>(null);
  const tripStateRef = useRef(tripState);
  tripStateRef.current = tripState;
  const viajePhaseRef = useRef(viajePhase);
  viajePhaseRef.current = viajePhase;
  const persistedOnce = useRef(false);
  const useMocksRef = useRef(true);

  const startPolling = useCallback((tripId: number) => {
    intervalsRef.current.polling = setInterval(async () => {
      const towerRes = await getTowerRequestStatus(String(tripId));

      // Check local DB for completion via TowerApp PATCH
      const dbRes = await getTripByIdAction(tripId);
      if (dbRes.trip?.status === TRIP_STATUS.COMPLETED) {
        clearInterval(intervalsRef.current.polling);
        await finishTripAction(tripId);
        clearPersistedState();
        const returnUrl = encodeURIComponent(`${window.location.origin}/customer/home`);
        window.location.href = `${FEEDBACK_APP_URL}/rate/${tripId}?return_url=${returnUrl}`;
        return;
      }

      if (towerRes?.location) {
        setTowLocation([parseFloat(towerRes.location.lat), parseFloat(towerRes.location.long)]);
      }
      if (towerRes?.totalPoints && towerRes?.currentStep) {
        setEta(Math.max(1, Math.floor(7 * (1 - towerRes.currentStep / towerRes.totalPoints))));
      }
      if (towerRes?.phase === "en_viaje" && viajePhaseRef.current === "en_camino") {
        setViajePhase("en_viaje");
      }
      if (towerRes?.status === TRIP_STATUS.COMPLETED) {
        clearInterval(intervalsRef.current.polling);
        await finishTripAction(tripId);
        clearPersistedState();
        const returnUrl = encodeURIComponent(`${window.location.origin}/customer/home`);
        window.location.href = `${FEEDBACK_APP_URL}/rate/${tripId}?return_url=${returnUrl}`;
      }
    }, 2000);
  }, []);

  useEffect(() => {
    if ((tripState === "finalizado" || tripState === "cancelado") && !isExpanded) {
      setIsExpanded(true);
    }
  }, [tripState, isExpanded]);

  useEffect(() => {
    if (!persistedOnce.current) {
      persistedOnce.current = true;
      return;
    }
    persistState({
      origin,
      destination,
      selectedVehicleId,
      selectedCraneType,
      isExpanded,
      tripState,
      viajePhase,
      towLocation,
      eta,
      originText,
      destinationText,
      currentTripId,
      ...(mockProgressRef.current ? { mockProgress: mockProgressRef.current } : {}),
      ...(mockPointsRef.current ? { mockPoints: mockPointsRef.current } : {}),
    });
  }, [origin, destination, selectedVehicleId, selectedCraneType, isExpanded, tripState, viajePhase, towLocation, eta, originText, destinationText, currentTripId]);

  const restoredFromDb = useRef(false);

  useEffect(() => {
    if (!hydrated || restoredFromDb.current) return;
    restoredFromDb.current = true;

    if (initialTrip) return;

    if (tripIdFromUrl) {
      getTripByIdAction(tripIdFromUrl).then(restoreTripFromDb);
      return;
    }

    const saved = loadPersistedState();
    if (saved?.tripState === "pago_confirmado" || saved?.tripState === "en_proceso") {
      return;
    }

    getLatestActiveTripAction().then((result) => {
      if (result?.trip) {
        restoreTripFromDb(result);
      } else {
        setTripState("idle");
      }
    });
  }, [hydrated, tripIdFromUrl, initialTrip]);

  useEffect(() => {
    if (initialTrip?.status !== TRIP_STATUS.PAYMENT_CONFIRMED) return;
    confirmPaymentAction(initialTrip.tripId).then((res) => {
      if (!res.success) setTripState("payment_failed");
    });
  }, [initialTrip]);

  function restoreTripFromDb(result: Awaited<ReturnType<typeof getTripByIdAction>>) {
    if (!result?.trip) {
      setTripState("idle");
      return;
    }

    const t = result.trip;
    setCurrentTripId(t.tripId);

    if (t.status === TRIP_STATUS.PAYMENT_CONFIRMED) {
      setOrigin([t.originLat, t.originLng]);
      setDestination([t.destinationLat, t.destinationLng]);
      setTripState("pago_confirmado");
      confirmPaymentAction(t.tripId).then((res) => {
        if (!res.success) setTripState("payment_failed");
      });
    } else if (t.status === TRIP_STATUS.PENDING_PAYMENT && tripIdFromUrl) {
      setOrigin([t.originLat, t.originLng]);
      setDestination([t.destinationLat, t.destinationLng]);
      setTripState("esperando_pago");
    } else if (t.status === TRIP_STATUS.IN_PROGRESS) {
      setOrigin([t.originLat, t.originLng]);
      setDestination([t.destinationLat, t.destinationLng]);
      setTripState("en_proceso");
    } else {
      setOrigin(null);
      setDestination(null);
      setTripState("idle");
    }
  }

  // Poll waiting for payment confirmation
  useEffect(() => {
    if (tripState !== "esperando_pago" || !currentTripId) return;

    const id = setInterval(async () => {
      const res = await getTripByIdAction(currentTripId);
      if (res.trip?.status === TRIP_STATUS.PAYMENT_CONFIRMED) {
        clearInterval(id);
        confirmPaymentAction(currentTripId).then((r) => {
          if (r.success) {
            setTripState("pago_confirmado");
          } else {
            setTripState("payment_failed");
          }
        });
      }
    }, 2000);

    return () => clearInterval(id);
  }, [tripState, currentTripId]);

  // Poll real TowerApp during search (when tower mock is OFF)
  useEffect(() => {
    if (tripState !== "pago_confirmado" || !currentTripId) return;

    const isMockTower = process.env.NEXT_PUBLIC_MOCK_TOWER !== "false";
    if (isMockTower) return;

    const id = setInterval(async () => {
      const towerRes = await getTowerRequestStatus(String(currentTripId));

      // Check local DB for status change via TowerApp PATCH
      const dbRes = await getTripByIdAction(currentTripId);
      if (dbRes.trip?.status === TRIP_STATUS.IN_PROGRESS && dbRes.trip?.towerId) {
        clearInterval(id);
        setTripState("en_proceso");
        startPolling(currentTripId);
        return;
      }

      // Fallback: check TowerApp GET directly
      if (towerRes?.status === TRIP_STATUS.IN_PROGRESS) {
        clearInterval(id);
        setTripState("en_proceso");
        if (towerRes.location) {
          setTowLocation([parseFloat(towerRes.location.lat), parseFloat(towerRes.location.long)]);
        }
        startPolling(currentTripId);
      }
    }, 2000);

    return () => clearInterval(id);
  }, [tripState, currentTripId, startPolling]);

  // Restore mock progress after hydration and start polling
  useEffect(() => {
    if (!hydrated) return;
    if (!currentTripId || !origin || !destination) return;

    const isMockTower = process.env.NEXT_PUBLIC_MOCK_TOWER !== "false";
    if (!isMockTower) {
      if (tripState === "en_proceso") {
        startPolling(currentTripId);
      }
      return;
    }

    const savedProgress = mockProgressRef.current;
    const savedPoints = mockPointsRef.current;

    const proceedWithPoints = (pointsToOrigin: [number, number][], pointsToDest: [number, number][]) => {
      initMockTripProgress(
        String(currentTripId),
        pointsToOrigin,
        pointsToDest,
        savedProgress?.step ?? 0,
        savedProgress?.phase ?? "arriving",
      );

      mockPointsRef.current = { pointsToOrigin, pointsToDest };

      if (tripState === "pago_confirmado") {
        intervalsRef.current.searchTimeout = setTimeout(() => {
          setTripState("en_proceso");
          setEta(MOCK_ETA_MINUTES);
          setTowLocation(pointsToOrigin[savedProgress?.step ?? 0]);
          startPolling(currentTripId);
        }, SEARCH_DELAY_MS);
      } else if (tripState === "en_proceso") {
        setTowLocation(pointsToOrigin[savedProgress?.step ?? 0] ?? origin);
        startPolling(currentTripId);
      }
    };

    if (savedPoints) {
      proceedWithPoints(savedPoints.pointsToOrigin, savedPoints.pointsToDest);
      return;
    }

    const fakeStartLat = origin[0] + 0.015;
    const fakeStartLng = origin[1] + 0.015;
    const fakeStart: [number, number] = [fakeStartLat, fakeStartLng];

    Promise.all([
      fetchOsrmRoute(fakeStart, origin),
      fetchOsrmRoute(origin, destination),
    ]).then(([routeToOrigin, routeToDest]) => {
      proceedWithPoints(
        subsampleRoute(routeToOrigin, ANIMATION_POINTS_TO_ORIGIN),
        subsampleRoute(routeToDest, ANIMATION_POINTS_TO_DEST),
      );
    });

    return () => {
      if (intervalsRef.current.searchTimeout) {
        clearTimeout(intervalsRef.current.searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentTripId]);

  // Clear storage and map state on terminal states
  useEffect(() => {
    if (tripState === "finalizado" || tripState === "cancelado") {
      clearPersistedState();
      setOrigin(null);
      setDestination(null);
      setOriginText("");
      setDestinationText("");
      setSelectedVehicleId("");
      driverInfoFetched.current = false;
      setDriverName("");
      setDriverRating(0);
    }
  }, [tripState]);

  const driverInfoFetched = useRef(false);

  useEffect(() => {
    if (tripState !== "en_proceso" || !currentTripId) return;
    if (driverInfoFetched.current) return;
    driverInfoFetched.current = true;

    getTripByIdAction(currentTripId).then((res) => {
      if (!res.trip?.towerId) return;
      getDriverInfoAction(res.trip.towerId).then((info) => {
        if (info.error) return;
        setDriverName(info.driverName);
        setDriverRating(info.driverRating);
      });
    });
  }, [tripState, currentTripId]);

  const estimatedDistance = origin && destination
    ? calculateDistance(origin[0], origin[1], destination[0], destination[1])
    : 0;

  const selectedVehicle = initialVehicles.find(v => v.id === selectedVehicleId);
  const selectedWeight = selectedVehicle?.weight ?? 0;

  const availableCraneTypes = (Object.keys(WEIGHT_LIMITS) as Array<keyof typeof WEIGHT_LIMITS>).filter(
    type => selectedWeight <= WEIGHT_LIMITS[type]
  );

  useEffect(() => {
    if (!selectedVehicleId || availableCraneTypes.length === 0) return;
    if (!availableCraneTypes.includes(selectedCraneType as keyof typeof WEIGHT_LIMITS)) {
      setSelectedCraneType(availableCraneTypes[0]);
    }
  }, [selectedVehicleId, selectedWeight, availableCraneTypes, selectedCraneType]);

  const prevVehicleRef = useRef(selectedVehicleId);
  useEffect(() => {
    if (prevVehicleRef.current && prevVehicleRef.current !== selectedVehicleId && availableCraneTypes.length > 0) {
      setSelectedCraneType(availableCraneTypes[0]);
    }
    prevVehicleRef.current = selectedVehicleId;
  }, [selectedVehicleId, availableCraneTypes]);

  const handleOriginSelect = (coords: [number, number], display_name?: string) => {
    setOrigin(coords);
    setOriginText(display_name || "");
  };

  const handleDestinationSelect = (coords: [number, number], display_name?: string) => {
    setDestination(coords);
    setDestinationText(display_name || "");
  };

  const handleClearError = (field: "origin" | "destination" | "vehicle") => {
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const startSearchFlow = useCallback(async (tripId: number, options?: { skipSearchDelay?: boolean }) => {
    const fakeStartLat = origin![0] + 0.015;
    const fakeStartLng = origin![1] + 0.015;
    const fakeStart: [number, number] = [fakeStartLat, fakeStartLng];

    const [routeToOrigin, routeToDest] = await Promise.all([
      fetchOsrmRoute(fakeStart, origin!),
      fetchOsrmRoute(origin!, destination!),
    ]);

    const pointsToOrigin = subsampleRoute(routeToOrigin, ANIMATION_POINTS_TO_ORIGIN);
    const pointsToDest = subsampleRoute(routeToDest, ANIMATION_POINTS_TO_DEST);

    mockProgressRef.current = { step: 0, phase: "arriving" };
    mockPointsRef.current = { pointsToOrigin, pointsToDest };

    initMockTripProgress(String(tripId), pointsToOrigin, pointsToDest);

    if (options?.skipSearchDelay) {
      setTripState("en_proceso");
      setEta(MOCK_ETA_MINUTES);
      setTowLocation(origin);
      startPolling(tripId);
    } else {
      setTripState("pago_confirmado");
      intervalsRef.current.searchTimeout = setTimeout(() => {
        setTripState("en_proceso");
        setEta(MOCK_ETA_MINUTES);
        setTowLocation(origin);
        startPolling(tripId);
      }, SEARCH_DELAY_MS);
    }
  }, [origin, destination, startPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { origin?: string; destination?: string; vehicle?: string } = {};

    if (!origin) errors.origin = "Debes seleccionar una ubicación de origen";
    if (!destination) errors.destination = "Debes seleccionar un destino";
    if (!selectedVehicleId) errors.vehicle = "Debes seleccionar o registrar un vehículo";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsRequesting(true);

    const currentRate = CRANE_RATES[selectedCraneType as keyof typeof CRANE_RATES] || CRANE_RATES.medium;
    const estimatedPrice = estimatedDistance > 0
      ? currentRate.base + (currentRate.perKm * estimatedDistance)
      : 0;

    const result = await createTripAction({
      originLat: origin![0],
      originLng: origin![1],
      destinationLat: destination![0],
      destinationLng: destination![1],
      originText: originText,
      destinationText: destinationText,
      vehicleId: parseInt(selectedVehicleId, 10),
      craneType: selectedCraneType,
      estimatedPrice: estimatedPrice,
    });

    setIsRequesting(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    const createdTripId = result.trip!.tripId;
    setCurrentTripId(createdTripId);

    if (result.useMocks) {
      useMocksRef.current = true;
      const confirmRes = await confirmPaymentAction(createdTripId);
      if (confirmRes.error === "no_towers_available") {
        setCurrentTripId(null);
        setFormMessage("No hay conductores disponibles en este momento. Por favor, intentá de nuevo más tarde.");
        setTripState("idle");
        return;
      }
      if (confirmRes.error) {
        alert(confirmRes.error);
        return;
      }
      if (result.useMockTower) {
        startSearchFlow(createdTripId);
      } else {
        setTripState("pago_confirmado");
      }
    } else {
      useMocksRef.current = false;
      const returnUrl = encodeURIComponent(`${window.location.origin}/customer/request-ride?trip_id=${createdTripId}`);
      const paymentUrl = getPaymentUrl(createdTripId, returnUrl);
      window.location.href = paymentUrl;
    }
  };

  const handleRetryPayment = () => {
    if (!currentTripId) return;
    const returnUrl = encodeURIComponent(`${window.location.origin}/customer/request-ride?trip_id=${currentTripId}`);
    window.location.href = `${PAYMENT_APP_URL}/payments/${currentTripId}?return_url=${returnUrl}`;
  };

  const handleCancelTrip = async () => {
    if (!currentTripId) return;
    if (intervalsRef.current.polling) clearInterval(intervalsRef.current.polling);
    if (intervalsRef.current.searchTimeout) clearTimeout(intervalsRef.current.searchTimeout);
    setIsRequesting(true);
    const res = await cancelTripAction(currentTripId);
    setIsRequesting(false);
    if (res.error) {
      alert("Error al cancelar: " + res.error);
      return;
    }
    clearMockTripProgress(String(currentTripId));
    mockProgressRef.current = null;
    clearPersistedState();
    setOrigin(null);
    setDestination(null);
    setOriginText("");
    setDestinationText("");
    setSelectedVehicleId("");
    setTripState("cancelado");
    setTowLocation(null);
    setCurrentTripId(null);
    setEta(null);
  };

  const handleAddVehicle = async (formData: FormData) => {
    return await addVehicleAction(formData);
  };

  const renderStep = () => {
    switch (tripState) {
      case "idle":
        return (
          <>
            {formMessage && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-4 text-red-300 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex-1">{formMessage}</div>
                <button onClick={() => setFormMessage(null)} className="text-red-400 hover:text-red-300 shrink-0 cursor-pointer">✕</button>
              </div>
            )}
            <FormStep
            origin={origin}
            destination={destination}
            onOriginSelect={handleOriginSelect}
            onDestinationSelect={handleDestinationSelect}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={setSelectedVehicleId}
            selectedCraneType={selectedCraneType}
            onCraneTypeSelect={setSelectedCraneType}
            formErrors={formErrors}
            onClearError={handleClearError}
            initialVehicles={initialVehicles}
            availableCraneTypes={availableCraneTypes}
            estimatedDistance={estimatedDistance}
            isRequesting={isRequesting}
            onSubmit={handleSubmit}
            onAddVehicle={handleAddVehicle}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            selectedWeight={selectedWeight}
          />
          </>
        );
      case "esperando_pago":
        return <PaymentPendingStep />;
      case "pago_confirmado":
        return <SearchingStep />;
      case "en_proceso":
        return viajePhase === "en_camino" ? (
          <FoundStep
            driverName={driverName}
            driverRating={driverRating}
            craneTypeLabel={craneTypeLabels[selectedCraneType] || selectedCraneType}
            eta={eta ?? 0}
          />
        ) : (
          <InProgressStep />
        );
      case "finalizado":
        return <FeedbackSubmittedStep />;
      case "cancelado":
        return <CancelledStep />;
      case "payment_failed":
        return <PaymentFailedStep onRetry={handleRetryPayment} />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 z-0 bg-muted">
        <DynamicMap origin={origin} destination={destination} towLocation={towLocation} craneType={selectedCraneType} />
      </div>
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none">
        {(tripState === "idle" || tripState === "cancelado" || tripState === "finalizado") && (
          <div className="absolute top-[10px] left-[10px] lg:left-[calc(450px+10px)] xl:left-[calc(500px+10px)] pointer-events-auto">
            <BackButton />
          </div>
        )}
      </div>
      <div
          className={`absolute bottom-0 left-0 right-0 lg:right-auto lg:left-0 lg:top-0 lg:h-full lg:w-[450px] xl:w-[500px] bg-card z-10 rounded-t-3xl lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:shadow-[10px_0_40px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 ease-in-out ${
            isExpanded ? "h-[80vh]" : "h-[14vh] lg:h-full"
          }`}
        >
          <div
            className="w-full h-10 flex-none flex justify-center items-center cursor-pointer lg:hidden z-20"
            onClick={() => setIsExpanded(!isExpanded)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <svg
              className={`w-10 h-6 text-muted-foreground transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-0" : "rotate-180"}`}
              viewBox="0 0 24 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 12 14 23 4" />
            </svg>
          </div>

          <div
            className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar px-6 ${
              !isExpanded ? "hidden lg:block" : "block"
            } ${tripState !== "idle" ? "items-center" : "pb-6 lg:pt-6"}`}
          >
            {tripState !== "idle" ? (
              <>
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                  {renderStep()}
                </div>
                {(tripState === "esperando_pago" || tripState === "pago_confirmado" || tripState === "en_proceso" || tripState === "payment_failed") && (
                  <div className="w-full max-w-sm pb-6 shrink-0">
                    <button
                      onClick={handleCancelTrip}
                      disabled={isRequesting}
                      className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold rounded-xl border border-red-800 transition text-sm duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {isRequesting ? "Cancelando..." : "Cancelar Viaje"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="relative min-h-max flex flex-col pb-6 lg:pt-6">
                {renderStep()}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
