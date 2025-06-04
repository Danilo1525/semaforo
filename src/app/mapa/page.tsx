"use client";

import { MapContainer, TileLayer, useMap, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Correção para os ícones do Leaflet
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

// Tipagem para posição
type LatLng = {
  lat: number;
  lng: number;
};

// Componente para pegar localização e centralizar no mapa
function LocalizacaoUsuario({
  setPosicao,
}: {
  setPosicao: React.Dispatch<React.SetStateAction<LatLng>>;
}) {
  const map = useMap();

  useEffect(() => {
    map
      .locate({
        watch: true, // Ativa rastreamento contínuo da posição
        setView: false,
      })
      .on("locationfound", function (e) {
        setPosicao(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      });
  }, [map, setPosicao]);

  return null;
}

export default function Mapa() {
  const [posicao, setPosicao] = useState<LatLng>({
    lat: -22.2231, // 📍 Dourados - MS
    lng: -54.8124,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#002B40] text-white text-center p-4">
      <h1 className="text-3xl font-bold mb-4">Mapa Acessível</h1>
      <p className="text-lg mb-4">
        Acompanhando sua localização em Dourados - MS.
      </p>

      <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg">
        {mounted && (
          <MapContainer center={posicao} zoom={17} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocalizacaoUsuario setPosicao={setPosicao} />

            {/* Círculo dinâmico na posição atual */}
            <Circle
              center={posicao}
              radius={15} // Raio em metros
              pathOptions={{
                color: "#00BFFF", // Borda azul clara
                fillColor: "#00BFFF",
                fillOpacity: 0.4,
              }}
            />
          </MapContainer>
        )}
      </div>
    </main>
  );
}
