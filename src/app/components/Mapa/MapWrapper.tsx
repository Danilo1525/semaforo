"use client";

import dynamic from "next/dynamic";

// Carrega o componente do mapa DINAMICAMENTE (apenas no cliente)
const MapaComponent = dynamic(() => import("./index"), {
  ssr: false, // Desativa renderização no servidor // Exibe um spinner enquanto carrega
});

export default function MapWrapper() {
  return <MapaComponent />;
}
