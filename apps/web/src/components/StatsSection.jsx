"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function StatsSection() {
  const t = useTranslations("content"); // استخدام مكتبة next-intl للترجمة
  const [isVisible, setIsVisible] = useState(false); // لتحديد إذا كانت الـ section ظاهرة بالصفحة
  const [floaters, setFloaters] = useState([]); // تخزين الجسيمات العائمة في الخلفية
  const sectionRef = useRef(null); // مرجع DOM للـ section لمراقبة ظهوره

  // مراقبة ظهور الـ section على الشاشة
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // عند ظهور القسم اجعل العناصر متحركة
        }
      },
      { threshold: 0.2 }, // نسبة ظهور العنصر على الشاشة قبل التفعيل
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // توليد عناصر الجسيمات العائمة عند التحميل
  useEffect(() => {
    setFloaters(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        width: Math.random() * 100 + 20, // عرض عشوائي
        height: Math.random() * 100 + 20, // ارتفاع عشوائي
        left: Math.random() * 100, // موضع أفقي عشوائي %
        top: Math.random() * 100, // موضع عمودي عشوائي %
        delay: Math.random() * 5, // تأخير بداية الحركة
        duration: Math.random() * 10 + 10, // مدة الحركة
      })),
    );
  }, []);

  const stats = (t.raw && t.raw("content.stats.cards")) || []; // بيانات البطاقات الإحصائية

  // مكون داخلي لتحريك الأرقام تدريجياً عند ظهور القسم
  const AnimatedNumber = ({ target = 0, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000; // مدة التحريك بالمللي ثانية
      const steps = 60; // عدد الخطوات
      const increment = target / steps; // مقدار الزيادة في كل خطوة
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [target]);

    // إذا كان الرقم 24 والدعم متواصل (suffix == "/7")، اعرضه بدون فاصلة عشرية
    if (target === 24 && suffix === "/7") {
      return (
        <span>
          24/7
        </span>
      );
    }

    return (
      <span>
        {target < 100 ? (count / 1).toFixed(1) : count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef} // ربط المرجع لمراقبة ظهور القسم
      className="relative w-full py-20 sm:py-24 bg-linear-to-br from-(--color-bright-300) via-(--color-primary-500) to-(--color-dark-300) overflow-hidden"
    >
      {/* نمط الخلفية المتحركة */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-background) 20%, transparent) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--color-background) 15%, transparent) 0%, transparent 50%)
          `,
          }}
        />
      </div>

      {/* الجسيمات العائمة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floaters.map((f) => (
          <div
            key={f.id}
            className="absolute rounded-full bg-(--color-neutral)/10 animate-float"
            style={{
              width: `${f.width}px`,
              height: `${f.height}px`,
              left: `${f.left}%`,
              top: `${f.top}%`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* رأس القسم */}
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            {t("content.stats.title")}
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {t("content.stats.subtitle")}
          </p>
        </div>

        {/* شبكة الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`group animate-fadeIn ${isVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                animationDelay: `${i * 0.1}s`,
                transition: "opacity 0.5s ease-out",
              }}
            >
              {/* بطاقة الإحصاء */}
              <div className="relative h-full p-8 card-glass rounded-3xl border border-(--ui-border) hover:bg-(--ui-surface-2)/40 shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300">
                {/* أيقونة البطاقة */}
                <div className="text-5xl mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                  {stat.icon}
                </div>

                {/* الرقم المتحرك */}
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                  {isVisible ? (
                    <AnimatedNumber target={stat.number} suffix={stat.suffix} />
                  ) : (
                    `0${stat.suffix}`
                  )}
                </div>

                {/* عنوان البطاقة */}
                <div className="text-xl font-bold text-white mb-2">
                  {stat.label}
                </div>

                {/* وصف البطاقة */}
                <div className="text-sm text-white/80">{stat.description}</div>

                {/* خط زخرفي أسفل البطاقة */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-(--ui-border) opacity-60 rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* دعوة للإجراء في أسفل القسم */}
        <div
          className="mt-16 text-center animate-fadeIn"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 card-glass rounded-3xl border border-(--ui-border) shadow-2xl">
            <div className="text-6xl">🚀</div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-black text-white mb-2">
                {t("content.stats.ctaTitle")}
              </div>
              <div className="text-white/90">
                {t("content.stats.ctaSubtitle")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}