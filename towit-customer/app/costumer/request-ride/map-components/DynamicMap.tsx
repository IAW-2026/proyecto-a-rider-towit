"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
  towLocation?: [number, number] | null;
};

export default function DynamicMap({ origin, destination, towLocation }: MapProps) {
  const Map = useMemo(() => dynamic(
    () => import('@/app/costumer/request-ride/map-components/Map'),
    { 
      loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-200">Cargando mapa...</div>,
      ssr: false 
    }
  ), []);

  return <Map origin={origin} destination={destination} towLocation={towLocation} />;
}
