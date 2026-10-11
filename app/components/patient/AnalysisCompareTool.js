"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function AnalysisCompareTool({
  leftImage,
  rightImage,
  comments,
}) {
  const [slider, setSlider] = useState(50);
  const rightPaneRef = useRef(null);

  useEffect(() => {
    if (!rightPaneRef.current) return;
    rightPaneRef.current.style.width = `${slider}%`;
  }, [slider]);

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          أداة مقارنة الصور
        </h2>
      </header>
      <div className="p-4">
        <div className="relative mx-auto h-80 max-w-3xl overflow-hidden rounded-lg border border-(--ui-border) bg-(--color-neutral)">
          {/* صورة اليسار */}
          {leftImage && (
            <Image
              src={leftImage}
              alt="left"
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-contain"
            />
          )}
          {/* صورة اليمين مع قصّ حسب السلايدر */}
          {rightImage && (
            <div ref={rightPaneRef} className="absolute left-0 top-0 h-full w-1/2">
              <div className="relative h-full w-full">
                <Image
                  src={rightImage}
                  alt="right"
                  fill
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
          )}
          {/* السلايدر */}
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(parseInt(e.target.value))}
            className="absolute bottom-2 left-1/2 w-1/2 -translate-x-1/2"
          />
        </div>
        {comments && (
          <div className="mt-4 rounded-md border border-(--ui-border) bg-(--ui-surface-2)/40 p-3 text-sm text-(--ui-foreground)">
            <div className="mb-1 text-(--ui-muted-foreground)">
              تعليقات الطبيب
            </div>
            <div>{comments}</div>
          </div>
        )}
        <div className="mt-3">
          <button className="btn-gradient rounded-md px-3 py-1.5 text-sm text-white">
            حفظ المقارنة
          </button>
        </div>
      </div>
    </section>
  );
}
