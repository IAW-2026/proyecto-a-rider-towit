"use client";

import { useState, useRef, useEffect } from "react";

type AddressResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: any;
};

type AddressSearchProps = {
  label: string;
  placeholder: string;
  id: string;
  onSelect: (coords: [number, number] | null, addressName?: string) => void;
};

export default function AddressSearch({ label, placeholder, id, onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = (text: string) => {
    setQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length < 3) {
      setResults([]);
      setIsOpen(false);
      onSelect(null); // Reset si borra el texto
      return;
    }

    // Debounce: wait 600ms before making the API call
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=ar&limit=5&addressdetails=1`, {
          headers: {
            "Accept": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch from Nominatim");
        }
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Error buscando dirección:", error);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const formatAddress = (address?: any) => {
    if (!address) return null;
    const road = address.road || address.pedestrian || address.street || "";
    const number = address.house_number || "";
    const neighbourhood = address.neighbourhood || address.suburb || address.quarter || address.city_district || "";
    const city = address.city || address.town || address.village || "";
    const state = address.state || address.province || "";

    const parts = [];
    if (road) parts.push(`${road}${number ? ` ${number}` : ''}`);
    if (neighbourhood) parts.push(neighbourhood);
    if (city) parts.push(city);
    if (state) parts.push(state);
    
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const handleSelect = (result: AddressResult) => {
    const formatted = formatAddress(result.address) || result.display_name.split(', ').slice(0, 3).join(', ');
    setQuery(formatted);
    setIsOpen(false);
    onSelect([parseFloat(result.lat), parseFloat(result.lon)], formatted);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="block text-lg font-bold text-black mb-2">
        <span className={`inline-block w-4 h-4 align-middle mr-2  ${id === 'origin' ? 'rounded-full' : 'rounded-xs'}`} style={{ backgroundColor: 'white', border: '4px solid  #1a1a1a' }} />
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={query}
        onChange={(e) => searchAddress(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
          className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-brand-yellow focus:border-brand-yellow transition text-foreground bg-card"
      />
      
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && <li className="px-4 py-2 text-foreground">Buscando...</li>}
          {!loading && results.length === 0 && <li className="px-4 py-2 text-foreground">No se encontraron resultados</li>}
          {!loading && results.map((result, idx) => {
            const formatted = formatAddress(result.address) || result.display_name.split(', ').slice(0, 3).join(', ');
            return (
              <li 
                key={idx} 
                onClick={() => handleSelect(result)}
                className="px-4 py-3 text-foreground hover:bg-muted cursor-pointer border-b border-border last:border-0 truncate"
              >
                {formatted}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
