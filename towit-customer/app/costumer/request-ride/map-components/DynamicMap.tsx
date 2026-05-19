"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
};

export default function DynamicMap({ origin, destination }: MapProps) {
  const Map = useMemo(() => dynamic(
    () => import('@/app/costumer/request-ride/map-components/Map'),
    { 
      loading: () => <p>Cargando mapa...</p>,
      ssr: false 
    }
  ), []);

  return <Map origin={origin} destination={destination} />;
}
