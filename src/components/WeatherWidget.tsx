import React, { useState, useEffect } from 'react';
import {
  handleWeatherApiRequest,
  WeatherForecastResponse,
  DailyWeatherForecast,
} from '../services/api/weatherApi';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  className?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  latitude,
  longitude,
  startDate,
  endDate,
  className = '',
}) => {
  const [data, setData] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    handleWeatherApiRequest({ latitude, longitude, startDate, endDate })
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[WeatherWidget Error]', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, startDate, endDate]);

  if (loading) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse text-xs ${className}`}>
        <div className="h-4 w-36 bg-slate-800 rounded mb-2" />
        <div className="h-10 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!data || data.dailyForecasts.length === 0) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 ${className}`}>
        <p className="font-semibold text-white">❓ Clima Indisponível</p>
        <p className="text-[11px] mt-0.5">Não foi possível obter dados meteorológicos para este local.</p>
      </div>
    );
  }

  // Identificação visual de status predominante
  const hasHistorical = data.dailyForecasts.some((d) => d.isHistoricalEstimate);
  const hasUnavailable = data.dailyForecasts.some((d) => d.status === 'unavailable');

  return (
    <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl ${className}`}>
      {/* Header com Badge Visual de Status (UI Informa Indisponibilidade/Status) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <h4 className="font-bold text-white text-xs sm:text-sm">Previsão do Tempo SmartTrip</h4>
        </div>

        {hasUnavailable ? (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
            ❓ Dados Parciais / Indisponíveis
          </span>
        ) : hasHistorical ? (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            📊 Média Histórica Sazonal
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            ☀️ Previsão em Tempo Real
          </span>
        )}
      </div>

      {data.errorAlert && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{data.errorAlert}</span>
        </div>
      )}

      {/* Lista de Dias com Clima Normalizado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {data.dailyForecasts.slice(0, 4).map((day: DailyWeatherForecast, idx: number) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-300 text-[11px]">{day.date}</span>
              <span className="text-[10px]">
                {day.condition === 'ensolarado' && '☀️'}
                {day.condition === 'parcialmente_nublado' && '⛅'}
                {day.condition === 'nublado' && '☁️'}
                {day.condition === 'chuva' && '🌧️'}
                {day.condition === 'tempestade' && '⛈️'}
                {day.condition === 'neve' && '❄️'}
                {day.condition === 'desconhecido' && '❓'}
              </span>
            </div>

            <div className="my-1">
              {day.tempMin !== null && day.tempMax !== null ? (
                <p className="font-extrabold text-white text-sm">
                  {day.tempMin}°C <span className="text-slate-400 font-normal">/ {day.tempMax}°C</span>
                </p>
              ) : (
                <p className="font-bold text-slate-500 text-xs">--°C</p>
              )}
            </div>

            <div className="text-[10px] text-slate-400 truncate">
              {day.rainProbability !== null ? `💧 ${day.rainProbability}% chuva` : 'Chuva: N/I'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
