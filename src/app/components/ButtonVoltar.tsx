"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ButtonVoltar() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors absolute top-4 left-4 z-[1000] shadow-md"
    >
      <ArrowLeft size={18} />
      Voltar ao menu
    </Link>
  );
}
