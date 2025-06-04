"use client";

import { MapContainer, TileLayer, useMap, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import { ButtonVoltar } from "@/app/components/ButtonVoltar";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Configuração do ícone do marcador
const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
      setPosicao(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    };

    const locationHandler = map
      .locate({
        watch: true,
        setView: false,
        enableHighAccuracy: true,
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
      {/* Botão Voltar */}
      <ButtonVoltar />

      {/* Conteúdo Centralizado */}
      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Mapa Acessível</h1>
        <p className="text-lg mb-4">Sua localização</p>

        {/* Container do Mapa */}
        <div className="w-full max-w-4xl h-[70vh] rounded-xl overflow-hidden shadow-lg">
          <MapContainer center={posicao} zoom={17} className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <LocalizacaoUsuario setPosicao={setPosicao} />

            {/* Círculo Dinâmico */}
            <Circle
              center={posicao}
              radius={15}
              pathOptions={{
                color: "#00BFFF",
                fillColor: "#00BFFF",
                fillOpacity: 0.4,
              }}
            />
          </MapContainer>
        </div>
      </div>
    </main>
  );
}
