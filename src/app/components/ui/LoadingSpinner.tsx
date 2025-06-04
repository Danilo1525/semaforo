"use client";

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-[#002B40]/90 flex flex-col items-center justify-center z-50">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-400 border-l-blue-400 animate-spin animation-delay-200"></div>
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-blue-300 border-r-blue-300 animate-spin animation-delay-400"></div>
      </div>
      <p className="mt-6 text-xl font-medium text-white">Carregando mapa...</p>
      <p className="mt-2 text-sm text-blue-200">
        Isso pode levar alguns segundos
      </p>
    </div>
  );
}
