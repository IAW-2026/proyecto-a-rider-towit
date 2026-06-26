"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
  towLocation?: [number, number] | null;
  followTower?: boolean;
};

export default function DynamicMap({ origin, destination, towLocation, followTower }: MapProps) {
  const Map = useMemo(() => dynamic(
    () => import('@/app/customer/request-ride/map-components/Map'),
    {
      loading: () => <div className="w-full h-full flex items-center justify-center bg-muted text-foreground">Cargando mapa...</div>,
      ssr: false
    }
  ), []);

  return <Map origin={origin} destination={destination} towLocation={towLocation} followTower={followTower} />;
}
