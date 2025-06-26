"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ButtonVoltar } from "@/app/components/ButtonVoltar";
import { LoadScript, GoogleMap, Marker, Circle } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "70vh",
};

const SEMAFOROS = [
  {
    id: 1,
    position: { lat: -22.2235, lng: -54.812 },
    nome: "Semáforo Principal",
  },
  {
    id: 2,
    position: { lat: -22.224, lng: -54.8115 },
    nome: "Semáforo da Rua B",
  },
] as const;

type Posicao = {
  lat: number;
  lng: number;
};

export default function MapaAcessivel() {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [distanciaProxima, setDistanciaProxima] = useState<number>(Infinity);
  const ultimoAlerta = useRef<string | null>(null);
  const watchId = useRef<number | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para criar ícone seguro
  const criarIcone = useCallback(
    (url: string): google.maps.Icon | undefined => {
      if (!window.google) return undefined;
      return {
        url,
        scaledSize: new window.google.maps.Size(32, 32),
      };
    },
    []
  );

  // Função para calcular distância
  const calcularDistancia = useCallback(
    (pos1: Posicao, pos2: Posicao): number => {
      if (!isApiLoaded || !window.google) return Infinity;
      return window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(pos1),
        new window.google.maps.LatLng(pos2)
      );
    },
    [isApiLoaded]
  );

  // Função de voz
  const falar = useCallback((texto: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      ultimoAlerta.current = texto;
    }
  }, []);

  // Obter e monitorar localização em tempo real
  useEffect(() => {
    if (!isApiLoaded) return;

    const opcoes = {
      enableHighAccuracy: true, // Usar GPS quando disponível
      timeout: 10000, // Tempo máximo de espera
      maximumAge: 0, // Sem cache de posição
    };

    const successCallback = (position: GeolocationPosition) => {
      const newPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setPosicao(newPos);
      setLoadingPosition(false);
      setError(null);

      if (map) {
        map.panTo(newPos);
      }
    };

    const errorCallback = (err: GeolocationPositionError) => {
      console.error("Erro de geolocalização:", err);
      setLoadingPosition(false);

      // Mensagens de erro mais descritivas
      const errorMessages = {
        1: "Permissão de localização negada",
        2: "Localização indisponível",
        3: "Tempo de solicitação excedido",
      };

      setError(
        errorMessages[err.code as keyof typeof errorMessages] ||
          "Erro ao obter localização"
      );

      // Fallback para coordenadas padrão se a geolocalização falhar
      if (!posicao) {
        setPosicao({ lat: -22.2231, lng: -54.8124 });
      }
    };

    // Primeiro tenta obter a posição atual rapidamente
    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      opcoes
    );

    // Depois configura o monitoramento contínuo
    watchId.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      opcoes
    );

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isApiLoaded, map]);

  // Monitorar proximidade com semáforos
  useEffect(() => {
    if (!map || !posicao || !isApiLoaded) return;

    let menorDistancia = Infinity;
    SEMAFOROS.forEach((semaforo) => {
      const dist = calcularDistancia(posicao, semaforo.position);
      if (dist < menorDistancia) menorDistancia = dist;
      if (dist < 30) {
        falar(`Atenção: ${semaforo.nome} à ${Math.round(dist)} metros`);
      }
    });
    setDistanciaProxima(menorDistancia);
  }, [posicao, map, calcularDistancia, falar, isApiLoaded]);

  const repetirAlerta = useCallback(() => {
    if (ultimoAlerta.current) falar(ultimoAlerta.current);
  }, [falar]);

  return (
    <main className="flex flex-col items-center min-h-screen text-white text-center p-4 relative bg-gray-900">
      <div className="absolute top-4 left-4 z-10">
        <ButtonVoltar />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full py-8">
        <h1 className="text-3xl font-bold mb-4">Mapa Acessível</h1>
        <p className="text-lg mb-8">Navegação com alertas de semáforos</p>

        {loadingPosition && (
          <div className="mb-4 text-yellow-400">
            <p>Obtendo sua localização...</p>
            <p className="text-sm">
              Certifique-se de permitir o acesso à localização
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-400">
            <p>{error}</p>
            <p className="text-sm">Mostrando localização padrão</p>
          </div>
        )}

        {!loadingPosition && posicao && (
          <div className="mb-4 bg-gray-800 p-3 rounded-lg">
            <p>
              Distância do semáforo mais próximo: {Math.round(distanciaProxima)}
              m
            </p>
          </div>
        )}

        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["geometry"]}
          loadingElement={<div className="text-white">Carregando mapa...</div>}
          onLoad={() => setIsApiLoaded(true)}
          onError={() => setError("Falha ao carregar o Google Maps")}
        >
          {isApiLoaded && (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={posicao || { lat: -22.2231, lng: -54.8124 }} // Fallback
              zoom={posicao ? 17 : 15} // Zoom diferente para fallback
              onLoad={(map) => setMap(map)}
              onUnmount={() => setMap(null)}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  },
                ],
              }}
            >
              {posicao && (
                <>
                  <Marker
                    position={posicao}
                    icon={criarIcone(
                      "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    )}
                  />
                  <Circle
                    center={posicao}
                    radius={30}
                    options={{
                      strokeColor: "#FF0000",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: "#FF0000",
                      fillOpacity: 0.15,
                    }}
                  />
                </>
              )}

              {SEMAFOROS.map((semaforo) => (
                <Marker
                  key={semaforo.id}
                  position={semaforo.position}
                  icon={criarIcone(
                    "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  )}
                />
              ))}
            </GoogleMap>
          )}
        </LoadScript>

        <button
          onClick={repetirAlerta}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          disabled={!ultimoAlerta.current}
        >
          Repetir Alerta
        </button>
      </div>
    </main>
  );
}
