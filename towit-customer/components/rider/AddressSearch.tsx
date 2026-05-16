"use client";

import { useState, useRef, useEffect } from "react";

type AddressResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type AddressSearchProps = {
  label: string;
  placeholder: string;
  id: string;
  onSelect: (coords: [number, number] | null) => void;
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

  const handleSelect = (result: AddressResult) => {
    setQuery(result.display_name);
    setIsOpen(false);
    onSelect([parseFloat(result.lat), parseFloat(result.lon)]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="block text-lg font-bold text-black mb-2">{label}</label>
      <input
        type="text"
        id={id}
        value={query}
        onChange={(e) => searchAddress(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition text-black"
      />
      
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && <li className="px-4 py-2 text-gray-900">Buscando...</li>}
          {!loading && results.length === 0 && <li className="px-4 py-2 text-gray-900">No se encontraron resultados</li>}
          {!loading && results.map((result, idx) => (
            <li 
              key={idx} 
              onClick={() => handleSelect(result)}
              className="px-4 py-3 text-black hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 truncate"
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
