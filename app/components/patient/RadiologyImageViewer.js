"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function RadiologyImageViewer({ images = [], report }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imageViewportRef = useRef(null);

  useEffect(() => {
    if (!imageViewportRef.current) return;
    imageViewportRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`;
    imageViewportRef.current.style.filter = `brightness(${brightness}%)`;
  }, [offset, zoom, brightness]);

  const img = images[index];

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          عارض صور الأشعة
        </h2>
      </header>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm text-(--ui-muted-foreground)">
            تكبير/تصغير
          </label>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
          <label className="text-sm text-(--ui-muted-foreground)">
            الإضاءة
          </label>
          <input
            type="range"
            min={50}
            max={150}
            step={1}
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
          />
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-lg border border-(--ui-border) bg-(--color-neutral)">
          {img ? (
            <div
              ref={imageViewportRef}
              className="absolute inset-0 transition-transform duration-75"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const startOffset = { ...offset };
                const onMove = (ev) =>
                  setOffset({
                    x: startOffset.x + (ev.clientX - startX),
                    y: startOffset.y + (ev.clientY - startY),
                  });
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            >
              <Image
                src={img}
                alt="Radiology"
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-contain select-none"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-(--ui-muted-foreground)">
              لا توجد صور
            </div>
          )}
        </div>

        {/* سلايدر/مصغّرات للصور */}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded border ${i === index ? "border-(--ui-info)" : "border-(--ui-border)"}`}
              onClick={() => setIndex(i)}
            >
              <Image
                src={src}
                alt={`thumb-${i}`}
                width={96}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* تقرير الطبيب */}
        {report && (
          <div className="mt-4 rounded-md border border-(--ui-border) bg-(--ui-surface) p-3 text-sm text-(--ui-foreground)">
            <div className="mb-1 text-(--ui-muted-foreground)">
              تقرير الطبيب
            </div>
            <div>{report}</div>
          </div>
        )}
      </div>
    </section>
  );
}
