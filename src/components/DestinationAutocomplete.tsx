import React, { useState, useEffect, useRef } from 'react';
import {
  searchAndNormalizeDestination,
  NormalizedDestination,
} from '../services/destinationService';

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string, selectedDestination?: NormalizedDestination) => void;
  placeholder?: string;
  className?: string;
}

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Ex: Lisboa, Paris, Tóquio...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NormalizedDestination[]>([]);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handler para busca com Debounce de 300ms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setErrorAlert(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await searchAndNormalizeDestination({ query: val });
        setSuggestions(result.destinations);
        setIsAmbiguous(result.isAmbiguous);
        setIsOpen(result.destinations.length > 0);
        if (result.errorAlert) {
          setErrorAlert(result.errorAlert);
        }
      } catch (err: any) {
        console.error('[Autocomplete Error]', err);
        setErrorAlert(err.message || 'Erro ao buscar destinos.');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (dest: NormalizedDestination) => {
    setInputValue(dest.formattedAddress);
    onChange(dest.formattedAddress, dest);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
        {isLoading && (
          <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        )}
      </div>

      {errorAlert && (
        <div className="mt-1 text-[11px] text-amber-400 bg-amber-950/40 p-1.5 rounded border border-amber-500/30">
          ⚠️ {errorAlert}
        </div>
      )}

      {/* Dropdown de Sugestões Normalizadas */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {isAmbiguous && (
            <div className="px-3 py-1.5 bg-amber-500/10 border-b border-slate-800 text-[10px] font-bold text-amber-300 flex items-center justify-between">
              <span>⚠️ Múltiplos destinos encontrados. Escolha a cidade desejada:</span>
            </div>
          )}

          {suggestions.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleSelectSuggestion(dest)}
              className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/60 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{dest.cityName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {dest.countryCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                📍 {dest.formattedAddress} ({dest.coordinates.latitude.toFixed(2)}, {dest.coordinates.longitude.toFixed(2)})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
