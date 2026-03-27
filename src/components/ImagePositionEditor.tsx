"use client";

import { useState, useRef, useCallback } from "react";

interface ImagePositionEditorProps {
  imageUrl: string;
  position: string; // "50% 50%"
  onChange: (position: string) => void;
}

export function ImagePositionEditor({
  imageUrl,
  position,
  onChange,
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Parsear posición
  const [xStr, yStr] = position.split(" ");
  const x = parseFloat(xStr) || 50;
  const y = parseFloat(yStr) || 50;

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      const newY = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
      onChange(`${Math.round(newX)}% ${Math.round(newY)}%`);
    },
    [onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  };

  const presets = [
    { label: "Arriba", pos: "50% 0%" },
    { label: "Centro", pos: "50% 50%" },
    { label: "Abajo", pos: "50% 100%" },
    { label: "Izquierda", pos: "0% 50%" },
    { label: "Derecha", pos: "100% 50%" },
  ];

  if (!imageUrl) return null;

  return (
    <div className="mt-3">
      <label className="mb-2 block text-xs font-medium text-gray-500">
        Ajustar encuadre de portada
      </label>

      <div className="flex gap-4">
        {/* Preview con drag */}
        <div className="flex-1">
          <div
            ref={containerRef}
            className="relative aspect-video cursor-crosshair overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setDragging(false)}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
              style={{ objectPosition: position }}
              draggable={false}
            />
            {/* Punto focal */}
            <div
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: "rgba(114, 47, 55, 0.7)",
              }}
            >
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>
            {/* Guías */}
            <div
              className="pointer-events-none absolute top-0 h-full w-px bg-white/30"
              style={{ left: `${x}%` }}
            />
            <div
              className="pointer-events-none absolute left-0 h-px w-full bg-white/30"
              style={{ top: `${y}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-400">
            Arrastra para ajustar el punto focal ({Math.round(x)}%, {Math.round(y)}%)
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.pos)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                position === p.pos
                  ? "bg-wine-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
