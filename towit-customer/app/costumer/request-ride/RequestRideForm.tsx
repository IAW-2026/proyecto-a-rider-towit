"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { calculateDistance, fetchOsrmRoute, subsampleRoute } from "@/lib/utils";
import { WEIGHT_LIMITS, CRANE_RATES, ANIMATION_POINTS_TO_ORIGIN, ANIMATION_POINTS_TO_DEST, SEARCH_DELAY_MS, MOCK_ETA_MINUTES } from "@/lib/constants";
import BackButton from "@/components/ui/BackButton";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import { createTripAction, cancelTripAction, finishTripAction } from "@/app/costumer/request-ride/actions";
import { addVehicleAction } from "@/app/costumer/vehicles/actions";
import { initMockTripProgress, getTowerRequestStatus, clearMockTripProgress } from "@/services/towerService";
import FormStep from "@/components/steps/FormStep";
import SearchingStep from "@/components/steps/SearchingStep";
import FoundStep from "@/components/steps/FoundStep";
import InProgressStep from "@/components/steps/InProgressStep";
import FeedbackSubmittedStep from "@/components/steps/FeedbackSubmittedStep";
import CancelledStep from "@/components/steps/CancelledStep";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

const craneTypeLabels: Record<string, string> = {
  medium: "Mediana",
  large: "Pesada",
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

export default function RequestRideForm({ initialVehicles = [] }: { initialVehicles?: Vehicle[] }) {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedCraneType, setSelectedCraneType] = useState<string>("medium");
  const [isExpanded, setIsExpanded] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
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
      if (saved.tripState) setTripState(saved.tripState as typeof tripState);
      if (saved.towLocation) setTowLocation(saved.towLocation as [number, number]);
      if (saved.eta !== undefined) setEta(saved.eta as number);
      if (saved.mockProgress) mockProgressRef.current = saved.mockProgress as { step: number; phase: "arriving" | "traveling" };
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
  const [isRequesting, setIsRequesting] = useState(false);
  const [tripState, setTripState] = useState<"idle" | "searching" | "found" | "in_progress" | "completed" | "cancelled">("idle");
  const [towLocation, setTowLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [originText, setOriginText] = useState<string>("");
  const [destinationText, setDestinationText] = useState<string>("");
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const intervalsRef = useRef<{ polling?: NodeJS.Timeout; searchTimeout?: NodeJS.Timeout }>({});
  const mockProgressRef = useRef<{ step: number; phase: "arriving" | "traveling" } | null>(null);
  const tripStateRef = useRef(tripState);
  tripStateRef.current = tripState;
  const persistedOnce = useRef(false);

  const startPolling = useCallback((tripId: number) => {
    intervalsRef.current.polling = setInterval(async () => {
      const res = await getTowerRequestStatus(String(tripId));
      if (!res) return;
      if (res.location) {
        setTowLocation([parseFloat(res.location.lat), parseFloat(res.location.long)]);
      }
      if (res.totalPoints && res.currentStep) {
        setEta(Math.max(1, Math.floor(7 * (1 - res.currentStep / res.totalPoints))));
      }
      if (res.status === "en_viaje" && tripStateRef.current === "found") {
        setTripState("in_progress");
      }
      if (res.status === "finalizado") {
        clearInterval(intervalsRef.current.polling);
        setTowLocation(destination);
        setTripState("completed");
        finishTripAction(tripId).catch(console.error);
        clearMockTripProgress(String(tripId));
      }
    }, 800);
  }, [destination]);

  useEffect(() => {
    if ((tripState === "completed" || tripState === "cancelled") && !isExpanded) {
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
      towLocation,
      eta,
      originText,
      destinationText,
      currentTripId,
      ...(mockProgressRef.current ? { mockProgress: mockProgressRef.current } : {}),
    });
  }, [origin, destination, selectedVehicleId, selectedCraneType, isExpanded, tripState, towLocation, eta, originText, destinationText, currentTripId]);

  // Restore mock progress after hydration and start polling
  useEffect(() => {
    if (!hydrated) return;
    if (!currentTripId || !origin || !destination) return;

    const savedProgress = mockProgressRef.current;

    const fakeStartLat = origin[0] + 0.015;
    const fakeStartLng = origin[1] + 0.015;
    const fakeStart: [number, number] = [fakeStartLat, fakeStartLng];

    Promise.all([
      fetchOsrmRoute(fakeStart, origin),
      fetchOsrmRoute(origin, destination),
    ]).then(([routeToOrigin, routeToDest]) => {
      const pointsToOrigin = subsampleRoute(routeToOrigin, ANIMATION_POINTS_TO_ORIGIN);
      const pointsToDest = subsampleRoute(routeToDest, ANIMATION_POINTS_TO_DEST);

      initMockTripProgress(
        String(currentTripId),
        pointsToOrigin,
        pointsToDest,
        savedProgress?.step ?? 0,
        savedProgress?.phase ?? "arriving",
      );

      if (tripState === "searching") {
        intervalsRef.current.searchTimeout = setTimeout(() => {
          setTripState("found");
          setEta(MOCK_ETA_MINUTES);
          setTowLocation(pointsToOrigin[savedProgress?.step ?? 0]);
          startPolling(currentTripId);
        }, SEARCH_DELAY_MS);
      } else if (tripState === "found" || tripState === "in_progress") {
        setTowLocation(pointsToOrigin[savedProgress?.step ?? 0] ?? origin);
        startPolling(currentTripId);
      }
    });

    return () => {
      if (intervalsRef.current.searchTimeout) {
        clearTimeout(intervalsRef.current.searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Clear storage on terminal states
  useEffect(() => {
    if (tripState === "completed") {
      clearPersistedState();
    }
    if (tripState === "cancelled") {
      clearPersistedState();
    }
  }, [tripState]);

  const estimatedDistance = origin && destination
    ? calculateDistance(origin[0], origin[1], destination[0], destination[1])
    : 0;

  const selectedVehicle = initialVehicles.find(v => v.id === selectedVehicleId);
  const selectedWeight = selectedVehicle?.weight ?? 0;

  const availableCraneTypes = (Object.keys(WEIGHT_LIMITS) as Array<keyof typeof WEIGHT_LIMITS>).filter(
    type => selectedWeight <= WEIGHT_LIMITS[type]
  );

  useEffect(() => {
    if (selectedVehicleId && availableCraneTypes.length > 0 && !availableCraneTypes.includes(selectedCraneType as keyof typeof WEIGHT_LIMITS)) {
      setSelectedCraneType(availableCraneTypes[0]);
    }
  }, [selectedVehicleId, selectedWeight, availableCraneTypes, selectedCraneType]);

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

    let createdTripId: number | null = null;
    if (result.trip) {
      createdTripId = result.trip.tripId;
      setCurrentTripId(createdTripId);
    }

    setTripState("searching");
    setIsRequesting(false);

    const fakeStartLat = origin![0] + 0.015;
    const fakeStartLng = origin![1] + 0.015;
    const fakeStart: [number, number] = [fakeStartLat, fakeStartLng];

    const routeToOrigin = await fetchOsrmRoute(fakeStart, origin!);
    const routeToDest = await fetchOsrmRoute(origin!, destination!);

    const pointsToOrigin = subsampleRoute(routeToOrigin, ANIMATION_POINTS_TO_ORIGIN);
    const pointsToDest = subsampleRoute(routeToDest, ANIMATION_POINTS_TO_DEST);

    mockProgressRef.current = { step: 0, phase: "arriving" };

    initMockTripProgress(String(createdTripId!), pointsToOrigin, pointsToDest);

    intervalsRef.current.searchTimeout = setTimeout(() => {
      setTripState("found");
      setEta(MOCK_ETA_MINUTES);
      setTowLocation(pointsToOrigin[0]);
      startPolling(createdTripId!);
    }, SEARCH_DELAY_MS);
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
    setTripState("cancelled");
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
        );
      case "searching":
        return <SearchingStep />;
      case "found":
        return (
          <FoundStep
            craneTypeLabel={craneTypeLabels[selectedCraneType] || selectedCraneType}
            eta={eta ?? 0}
          />
        );
      case "in_progress":
        return <InProgressStep />;
      case "completed":
        return <FeedbackSubmittedStep />;
      case "cancelled":
        return <CancelledStep />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none">
        {(tripState === "idle" || tripState === "cancelled" || tripState === "completed") && (
          <div className="absolute top-[10px] left-[10px] lg:left-[calc(450px+10px)] xl:left-[calc(500px+10px)] pointer-events-auto">
            <BackButton />
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-0 bg-muted">
        <DynamicMap origin={origin} destination={destination} towLocation={towLocation} craneType={selectedCraneType} />
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
              {(tripState === "searching" || tripState === "found") && (
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
