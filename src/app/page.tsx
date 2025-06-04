"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#002B40] text-white text-center p-4">
      <Image
        src="/visi.jpg"
        alt="Logo Visi"
        width={160}
        height={160}
        className="mb-6 rounded-full shadow-lg"
      />
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Visi</h1>
      <p className="text-lg max-w-md mb-6">
        O Visi é um aplicativo feito para ajudar pessoas com deficiência visual
        a atravessar ruas com segurança. Ele mostra onde há semáforos, avisa por
        voz se o sinal está aberto ou fechado e calcula rotas seguras.
      </p>
      <button
        onClick={() => router.push("/mapa")}
        className="bg-white text-[#002B40] font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-gray-100 hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200"
      >
        Ir para o mapa
      </button>
    </main>
  );
}
