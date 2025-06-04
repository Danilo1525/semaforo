"use client";

import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";
import { useEffect, useState } from "react";
import { ButtonVoltar } from "@/app/components/ButtonVoltar";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Ícone estilo Google Maps
const GoogleMapsIcon = L.divIcon({
  className: "google-maps-marker",
  html: `
    <div style="position:relative">
      <svg viewBox="0 0 24 24" width="24" height="24" style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3))">
        <path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <path fill="#1A73E8" d="M12 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: 6px;
        height: 6px;
        background: white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type LatLng = {
  lat: number;
  lng: number;
};

function LocalizacaoUsuario({
  setPosicao,
}: {
  setPosicao: (pos: LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleLocationFound = (e: L.LocationEvent) => {
      const newPos = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      setPosicao(newPos);

      // Movimento suave
      map.flyTo(newPos, map.getZoom(), {
        duration: 0.5,
        easeLinearity: 0.25,
      });
    };

    const locationHandler = map
      .locate({
        watch: true, // Rastreamento contínuo
        setView: false, // Não força o redimensionamento
        enableHighAccuracy: true, // Usa GPS quando disponível
        maximumAge: 1000, // Aceita posições com até 1s de atraso
        timeout: 10000, // Tempo máximo para tentar obter a localização
      })
      .on("locationfound", handleLocationFound);

    return () => {
      map.stopLocate();
      locationHandler.off("locationfound", handleLocationFound);
    };
  }, [map, setPosicao]);

  return null;
}

export default function Mapa() {
  const [posicao, setPosicao] = useState<LatLng>({
    lat: -22.2231,
    lng: -54.8124,
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
      <ButtonVoltar />

      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Mapa Acessível</h1>
        <p className="text-lg mb-4">Sua localização em tempo real</p>

        <div className="w-full max-w-4xl h-[70vh] rounded-xl overflow-hidden shadow-lg">
          <MapContainer
            center={posicao}
            zoom={18}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <LocalizacaoUsuario setPosicao={setPosicao} />

            <Marker position={posicao} icon={GoogleMapsIcon} />
          </MapContainer>
        </div>
      </div>
    </main>
  );
}
