"use client";

import { useState, useEffect, useRef } from "react";
import { calculateDistance, fetchOsrmRoute, subsampleRoute } from "@/lib/utils";
import { WEIGHT_LIMITS, CRANE_RATES, ANIMATION_POINTS_TO_ORIGIN, ANIMATION_POINTS_TO_DEST, ANIMATION_INTERVAL_ARRIVE_MS, ANIMATION_INTERVAL_TO_DEST_MS, SEARCH_DELAY_MS, MOCK_ETA_MINUTES } from "@/lib/constants";
import BackButton from "@/components/ui/BackButton";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import { createTripAction, cancelTripAction, finishTripAction, submitFeedbackAction } from "@/app/costumer/request-ride/actions";
import { addVehicleAction } from "@/app/costumer/vehicles/actions";
import FormStep from "@/components/steps/FormStep";
import SearchingStep from "@/components/steps/SearchingStep";
import FoundStep from "@/components/steps/FoundStep";
import InProgressStep from "@/components/steps/InProgressStep";
import CompletedFeedbackStep from "@/components/steps/CompletedFeedbackStep";
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

export default function RequestRideForm({ initialVehicles = [] }: { initialVehicles?: Vehicle[] }) {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedCraneType, setSelectedCraneType] = useState<string>("medium");
  const [isExpanded, setIsExpanded] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const intervalsRef = useRef<{ arrive?: NodeJS.Timeout; toDest?: NodeJS.Timeout }>({});

  useEffect(() => {
    if ((tripState === "completed" || tripState === "cancelled") && !isExpanded) {
      setIsExpanded(true);
    }
  }, [tripState, isExpanded]);

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

    setTimeout(() => {
      setTripState("found");
      setEta(MOCK_ETA_MINUTES);
      setTowLocation(pointsToOrigin[0]);

      let step1 = 0;
      intervalsRef.current.arrive = setInterval(() => {
        step1++;
        if (step1 >= pointsToOrigin.length) {
          clearInterval(intervalsRef.current.arrive);
          setTowLocation(origin);
          setTripState("in_progress");

          let step2 = 0;
          intervalsRef.current.toDest = setInterval(() => {
            step2++;
            if (step2 >= pointsToDest.length) {
              clearInterval(intervalsRef.current.toDest);
              setTowLocation(destination);
              setTripState("completed");
              if (createdTripId) {
                finishTripAction(createdTripId).catch(console.error);
              }
            } else {
              setTowLocation(pointsToDest[step2]);
            }
          }, ANIMATION_INTERVAL_TO_DEST_MS);
        } else {
          setTowLocation(pointsToOrigin[step1]);
          setEta(Math.max(1, Math.floor(7 * (1 - step1 / pointsToOrigin.length))));
        }
      }, ANIMATION_INTERVAL_ARRIVE_MS);
    }, SEARCH_DELAY_MS);
  };

  const handleCancelTrip = async () => {
    if (!currentTripId) return;
    if (intervalsRef.current.arrive) clearInterval(intervalsRef.current.arrive);
    if (intervalsRef.current.toDest) clearInterval(intervalsRef.current.toDest);
    setIsRequesting(true);
    const res = await cancelTripAction(currentTripId);
    setIsRequesting(false);
    if (res.error) {
      alert("Error al cancelar: " + res.error);
      return;
    }
    setTripState("cancelled");
    setTowLocation(null);
    setCurrentTripId(null);
    setEta(null);
  };

  const handleAddVehicle = async (formData: FormData) => {
    return await addVehicleAction(formData);
  };

  const handleSubmitFeedback = async (tripId: number, rating: number) => {
    const res = await submitFeedbackAction({ tripId, rating, comment: "" });
    if ("error" in res) return { success: false, error: res.error };
    return { success: true };
  };

  const handleFeedbackDone = () => {
    setFeedbackSubmitted(true);
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
        if (!feedbackSubmitted && currentTripId) {
          return (
            <CompletedFeedbackStep
              tripId={currentTripId}
              onSubmitFeedback={handleSubmitFeedback}
              onFeedbackDone={handleFeedbackDone}
            />
          );
        }
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
        {(tripState === "idle" || tripState === "cancelled" || (tripState === "completed" && feedbackSubmitted)) && (
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
          <div className="w-12 h-1.5 bg-muted rounded-full pointer-events-none" />
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
