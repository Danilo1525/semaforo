"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner"; // Crie este componente ou use um div simples

const MapaComponent = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center bg-[#002B40]">
      <LoadingSpinner />
    </div>
  ),
});

export default function MapWrapper() {
  return <MapaComponent />;
}
