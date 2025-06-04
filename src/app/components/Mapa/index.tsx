"use client";

import { MapContainer, TileLayer, useMap, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import { ButtonVoltar } from "../ButtonVoltar";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ===== Configuração do ícone do marcador (fixo) =====
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

// ===== Tipagem para posição =====
type LatLng = {
  lat: number;
  lng: number;
};

// ===== Componente que rastreia a localização do usuário =====
function LocalizacaoUsuario({
  setPosicao,
}: {
  setPosicao: (pos: LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map
      .locate({
        watch: true, // Rastreamento contínuo
        setView: false, // Não muda o zoom automaticamente
      })
      .on("locationfound", (e) => {
        setPosicao(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      });

    return () => {
      map.stopLocate(); // Limpa o rastreamento ao desmontar
    };
  }, [map, setPosicao]);

  return null;
}

// ===== Componente Principal do Mapa =====
export default function Mapa() {
  const [posicao, setPosicao] = useState<LatLng>({
    lat: -22.2231, // Posição inicial: Dourados-MS
    lng: -54.8124,
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
      <ButtonVoltar />
      <h1 className="text-3xl font-bold mb-4">Mapa Acessível</h1>
      <p className="text-lg mb-4">Sua localização</p>

      {/* Container do Mapa (500px de altura) */}
      <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg">
        <MapContainer center={posicao} zoom={17} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocalizacaoUsuario setPosicao={setPosicao} />

          {/* Círculo azul na posição atual */}
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
    </main>
  );
}
