"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LoadScript, GoogleMap, Marker, Circle } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "80vh",
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

type Posicao = { lat: number; lng: number };
type StatusSemaforo = {
  nome: string;
  distancia: number;
  direcao: string;
  proximidade: "distante" | "aproximando" | "perto" | "muito_perto";
};

export default function MapaAcessivel() {
  const [posicao, setPosicao] = useState<Posicao>({
    lat: -22.2231,
    lng: -54.8124,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [alertaAtual, setAlertaAtual] = useState<StatusSemaforo | null>(null);
  const [modoTeste, setModoTeste] = useState(false);
  const [velocidade, setVelocidade] = useState(0.0001);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const ultimoAlertaRef = useRef<{ texto: string; distancia: number } | null>(
    null
  );
  const ultimaFalaRef = useRef<number>(0);

  // Função de voz aprimorada
  const falar = useCallback(
    (texto: string, urgente = false) => {
      const agora = Date.now();
      if (isSpeaking || agora - ultimaFalaRef.current < 2000) return;

      setIsSpeaking(true);
      ultimaFalaRef.current = agora;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      utterance.rate = urgente ? 1.1 : 0.9;
      utterance.pitch = urgente ? 1.5 : 1.2;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSpeaking]
  );

  // Funções de movimento
  const mover = useCallback(
    (direcao: "cima" | "baixo" | "esquerda" | "direita") => {
      setPosicao((prev) => {
        const incremento = velocidade;
        const novaPos: Posicao = { ...prev };

        switch (direcao) {
          case "cima":
            novaPos.lat += incremento;
            break;
          case "baixo":
            novaPos.lat -= incremento;
            break;
          case "esquerda":
            novaPos.lng -= incremento;
            break;
          case "direita":
            novaPos.lng += incremento;
            break;
        }

        if (map) map.panTo(novaPos);
        return novaPos;
      });
    },
    [velocidade, map]
  );

  // Calcula direção relativa melhorada
  const getDirecaoRelativa = useCallback(
    (pos1: Posicao, pos2: Posicao): string => {
      const dx = pos2.lng - pos1.lng;
      const dy = pos2.lat - pos1.lat;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      if (angle > -30 && angle <= 30) return "à sua direita";
      if (angle > 30 && angle <= 60) return "à sua frente e direita";
      if (angle > 60 && angle <= 120) return "à sua frente";
      if (angle > 120 && angle <= 150) return "à sua frente e esquerda";
      if (angle > 150 || angle <= -150) return "à sua esquerda";
      if (angle > -150 && angle <= -120) return "atrás e à esquerda";
      if (angle > -120 && angle <= -60) return "atrás";
      return "atrás e à direita";
    },
    []
  );

  // Configura controles de teclado
  useEffect(() => {
    if (!modoTeste) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          mover("cima");
          break;
        case "ArrowDown":
          mover("baixo");
          break;
        case "ArrowLeft":
          mover("esquerda");
          break;
        case "ArrowRight":
          mover("direita");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modoTeste, mover]);

  // Monitora posição e verifica semáforos próximos com alertas progressivos
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const verificarProximidade = () => {
      // Encontra o semáforo mais próximo
      const { semaforo, distancia } = SEMAFOROS.reduce<{
        semaforo: (typeof SEMAFOROS)[number];
        distancia: number;
      }>(
        (closest, current) => {
          const dist =
            window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(posicao),
              new window.google.maps.LatLng(current.position)
            );
          return dist < closest.distancia
            ? { semaforo: current, distancia: dist }
            : closest;
        },
        { semaforo: SEMAFOROS[0], distancia: Infinity }
      );

      const distanciaArredondada = Math.round(distancia);
      const direcao = getDirecaoRelativa(posicao, semaforo.position);

      // Determina o nível de proximidade
      const proximidade: StatusSemaforo["proximidade"] =
        distancia < 5
          ? "muito_perto"
          : distancia < 10
          ? "perto"
          : distancia < 50
          ? "aproximando"
          : "distante";

      // Atualiza o estado do alerta
      setAlertaAtual((prev) => {
        const novoAlerta = {
          nome: semaforo.nome,
          distancia: distanciaArredondada,
          direcao,
          proximidade,
        };

        // Só atualiza se houver mudança significativa
        if (
          !prev ||
          prev.nome !== novoAlerta.nome ||
          Math.abs(prev.distancia - novoAlerta.distancia) > 2 ||
          prev.proximidade !== novoAlerta.proximidade
        ) {
          return novoAlerta;
        }
        return prev;
      });

      // Lógica de alertas de voz progressivos - CORRIGIDO
      const textoBase = `${semaforo.nome} a ${distanciaArredondada} metros ${direcao}`;
      const textoUrgente = `ATENÇÃO! ${textoBase}`;

      // Verifica se deve falar o alerta - CORRIGIDO
      const deveFalar =
        !ultimoAlertaRef.current ||
        ultimoAlertaRef.current.distancia !== distanciaArredondada ||
        proximidade === "muito_perto" ||
        (proximidade === "perto" && distanciaArredondada % 5 === 0) ||
        (proximidade === "aproximando" && distanciaArredondada % 10 === 0) ||
        (proximidade === "distante" && distanciaArredondada % 25 === 0);

      if (deveFalar) {
        const textoFalar =
          proximidade === "muito_perto" ? textoUrgente : textoBase;
        falar(textoFalar, proximidade === "muito_perto");
        ultimoAlertaRef.current = {
          texto: textoBase, // Armazena apenas o texto base sem "ATENÇÃO!"
          distancia: distanciaArredondada,
        };
      }
    };

    intervaloRef.current = setInterval(verificarProximidade, 500);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [posicao, map, getDirecaoRelativa, mapLoaded, falar]);

  // Função para criar um Size do Google Maps de forma segura
  const createGoogleMapsSize = (width: number, height: number) => {
    if (!window.google || !window.google.maps) return undefined;
    return new window.google.maps.Size(width, height);
  };

  // Estilo moderno para o mapa
  const mapStyles = [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [{ visibility: "simplified" }],
    },
  ];

  // Função para determinar a cor do alerta baseado na proximidade
  const getAlertColor = (proximidade: StatusSemaforo["proximidade"]) => {
    switch (proximidade) {
      case "muito_perto":
        return "bg-red-600 animate-pulse";
      case "perto":
        return "bg-orange-500";
      case "aproximando":
        return "bg-yellow-500";
      case "distante":
        return "bg-blue-600";
      default:
        return "bg-blue-600";
    }
  };

  // Função para determinar o texto do alerta baseado na proximidade
  const getAlertText = (proximidade: StatusSemaforo["proximidade"]) => {
    switch (proximidade) {
      case "muito_perto":
        return "ATENÇÃO! Próximo ao semáforo";
      case "perto":
        return "Próximo ao semáforo";
      case "aproximando":
        return "Aproximando-se do semáforo";
      case "distante":
        return "Semáforo à vista";
      default:
        return "Semáforo na área";
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-gray-900">
      {/* Cabeçalho modernizado */}
      <header className="sticky top-0 z-10 bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Voltar
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setModoTeste(!modoTeste)}
            className={`px-4 py-2 rounded-md font-medium ${
              modoTeste
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } transition-colors`}
          >
            {modoTeste ? "Desativar Modo Teste" : "Ativar Modo Teste"}
          </button>

          {modoTeste && (
            <div className="flex items-center">
              <span className="mr-2">Velocidade:</span>
              <input
                type="range"
                min="0.00001"
                max="0.001"
                step="0.00001"
                value={velocidade}
                onChange={(e) => setVelocidade(parseFloat(e.target.value))}
                className="w-32 accent-blue-500"
              />
            </div>
          )}
        </div>
      </header>

      {/* Barra de alerta com feedback progressivo */}
      {alertaAtual && (
        <div
          className={`sticky top-16 z-10 p-3 text-center ${getAlertColor(
            alertaAtual.proximidade
          )} flex items-center justify-between`}
        >
          <div className="flex-1">
            <p className="font-medium">
              {getAlertText(alertaAtual.proximidade)}
            </p>
            <p>
              {alertaAtual.nome} • {alertaAtual.distancia}m{" "}
              {alertaAtual.direcao}
            </p>
          </div>
          <button
            onClick={() =>
              falar(
                `Semáforo ${alertaAtual.nome} a ${alertaAtual.distancia} metros ${alertaAtual.direcao}`,
                alertaAtual.proximidade === "muito_perto"
              )
            }
            className="ml-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Instruções do modo teste */}
      {modoTeste && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-full text-sm shadow-lg flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Modo teste ativo • Use as setas para mover • Velocidade:{" "}
          {velocidade.toFixed(5)}
        </div>
      )}

      {/* Mapa */}
      <div className="flex-1 p-4">
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["geometry"]}
          onLoad={() => setMapLoaded(true)}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={posicao}
            zoom={17}
            onLoad={(mapInstance) => {
              setMap(mapInstance);
              setMapLoaded(true);
            }}
            options={{
              streetViewControl: false,
              fullscreenControl: false,
              styles: mapStyles,
            }}
          >
            {mapLoaded && (
              <>
                <Marker
                  position={posicao}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: createGoogleMapsSize(40, 40),
                  }}
                />

                <Circle
                  center={posicao}
                  radius={50}
                  options={{
                    strokeColor: "#4285F4",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#4285F4",
                    fillOpacity: 0.2,
                  }}
                />

                {SEMAFOROS.map((semaforo) => (
                  <Marker
                    key={semaforo.id}
                    position={semaforo.position}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      scaledSize: createGoogleMapsSize(32, 32),
                    }}
                  />
                ))}
              </>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </main>
  );
}
