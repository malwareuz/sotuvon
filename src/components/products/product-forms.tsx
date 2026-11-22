"use client";

import { useState } from "react";
import Link from "next/link";

export function ProductForm() {
  const [limitError, setLimitError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error.includes("rejasida")) {
          setLimitError(err.error);
          return;
        }
        throw new Error(err.error);
      }
      // Muvaffaqiyatli qo'shildi
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {limitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong>Diqqat! </strong>
          <span>{limitError}</span>
          <Link href="/subscription" className="ml-2 underline font-bold">
            Obunani yangilash
          </Link>
        </div>
      )}
      {/* Forma */}
    </div>
  );
}