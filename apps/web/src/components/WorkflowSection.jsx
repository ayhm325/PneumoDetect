"use client"; // مخصص لـ Next.js Client Component (يتم تشغيله على المتصفح وليس السيرفر)
import Image from "@/lib/compat/Image"; // استيراد مكون الصور المدمج في Next.js لتحسين الأداء
import { useMemo } from "react"; // hook لحفظ القيم المحسوبة وعدم إعادة حسابها إلا عند تغير الاعتمادات
import { useTranslations } from "@/lib/compat/intl"; // hook لدعم الترجمة i18n

export default function WorkflowSection() {
  const t = useTranslations("workflowsection"); // الحصول على الترجمة الخاصة بالـ workflow section
  const workflowCopy = t.raw("content.workflow"); // استرجاع محتوى الخطوات (title, subtitle, steps, CTA)

  // توليد بيانات الجسيمات المتحركة (flowParticles) لمؤثرات الخلفية
  const flowParticles = useMemo(() => {
    const colors = [
      "var(--color-bright-500)", // أصفر تحذيري
      "var(--color-primary-500)", // أخضر طبي
      "var(--color-dark-500)", // أحمر خطر
    ];

    // توليد 18 جسيمًا بمواقع وألوان وأزمنة مختلفة
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: (i * 8.3 + 5) % 100, // موقع أفقي كنسبة %
      top: (i * 11 + 7) % 100,   // موقع عمودي كنسبة %
      color: colors[i % 3],      // اختيار لون بالتناوب
      duration: 8 + (i % 4) * 1.2, // مدة الحركة
      delay: (i % 5) * 0.4,        // تأخير البداية
    }));
  }, []);

  return (
    <section className="relative w-full py-20 sm:py-24 bg-linear-to-tr from-(--color-dark-50) via-(--color-background) to-(--color-bright-10) text-(--ui-foreground) overflow-hidden">
      {/* الخلفية المتحركة بالكامل */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* خطوط الدوائر الكهربائية (Circuit Lines) */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* تعريف Gradient للألوان المتدرجة للخطوط */}
            <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="10%">
              <stop offset="0%" style={{ stopColor: "var(--color-bright-500)", stopOpacity: 0.8 }} />
              <stop offset="50%" style={{ stopColor: "var(--color-primary-500)", stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: "var(--color-dark-500)", stopOpacity: 0.8 }} />
            </linearGradient>
          </defs>

          {/* خطوط أفقية */}
          <g stroke="url(#circuitGrad)" strokeWidth="2" fill="none">
            <line x1="0" y1="20%" x2="100%" y2="20%" opacity="0.6">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="20s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="40%" x2="100%" y2="40%" opacity="0.5">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="25s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="60%" x2="100%" y2="60%" opacity="0.4">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="22s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="80%" x2="100%" y2="80%" opacity="0.6">
              <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="28s" repeatCount="indefinite" />
            </line>
          </g>

          {/* خطوط رأسية */}
          <g stroke="url(#circuitGrad)" strokeWidth="2" fill="none">
            <line x1="20%" y1="0" x2="20%" y2="100%" opacity="0.5">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="18s" repeatCount="indefinite" />
            </line>
            <line x1="50%" y1="0" x2="50%" y2="100%" opacity="0.4">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="24s" repeatCount="indefinite" />
            </line>
            <line x1="80%" y1="0" x2="80%" y2="100%" opacity="0.5">
              <animate attributeName="stroke-dasharray" values="1000,0;0,1000" dur="20s" repeatCount="indefinite" />
            </line>
          </g>

          {/* عقد الدائرة (Nodes) */}
          <g fill="url(#circuitGrad)">
            {/* كل circle يمثل نقطة مضيئة تتحرك */}
            <circle cx="20%" cy="20%" r="4" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="50%" cy="40%" r="4" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="80%" cy="60%" r="4" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="20%" cy="80%" r="4" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="80%" cy="20%" r="4" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="3.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3.8s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* جسيمات البيانات المتدفقة (Flowing Data Particles) */}
        <div className="absolute inset-0">
          {flowParticles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: p.color,
                boxShadow: `0 0 10px ${p.color}`,
                animation: `dataFlow ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* تأثيرات خلفية إضافية */}

        {/* خلفية radial-gradient: تخفيف أو إخفاء في الوضع الليلي */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-0 transition-opacity duration-500"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--color-bright-500) 25%, transparent) 0%, transparent 55%),
              radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--color-dark-100) 22%, transparent) 0%, transparent 5%)
            `,
          }}
        />

       
        <div
          className="absolute top-10 left-10 w-100 h-100 bg-(--ui-warning)/15 rounded-full blur-3xl animate-pulse opacity-100 dark:opacity-20 transition-opacity duration-500"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-10 right-10 w-112.5 h-112.5 bg-(--ui-danger)/12 rounded-full blur-3xl animate-pulse opacity-100 dark:opacity-20 transition-opacity duration-500"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />

        {/* خط المسح الضوئي */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-full h-1 bg-linear-to-r from-transparent via-(--color-bright-500) to-transparent opacity-50"
            style={{
              animation: "scanLine 8s ease-in-out infinite",
              boxShadow:
                "0 0 20px color-mix(in srgb, var(--color-bright-500) 70%, transparent)",
            }}
          />
        </div>
      </div>

      {/* محتوى القسم الرئيسي */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* عنوان القسم */}
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8">
            <span className="brand-gradient-text">{workflowCopy.title}</span>
          </h2>
          <p className="text-lg text-(--ui-muted-foreground) max-w-2xl mx-auto">
            {workflowCopy.subtitle}
          </p>
        </div>

        {/* خطوات سير العمل */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {(workflowCopy.steps || []).map((step, i) => (
            <div
              key={i}
              className="relative animate-fadeIn"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* خط الربط بين البطاقات على أجهزة سطح المكتب */}
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 left-full w-12 lg:w-20 h-0.5 -translate-y-1/2 z-0">
                  <div className="w-full h-full bg-linear-to-r from-(--color-bright-500) to-(--color-dark-500) opacity-30" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-(--color-dark-500) rounded-full animate-pulse" />
                </div>
              )}

              {/* بطاقة كل خطوة */}
              <div className="group relative h-full">
                {/* تأثير توهج عند hover */}
                <div className="absolute -inset-1 bg-linear-to-r from-(--color-bright-500) to-(--color-dark-500) rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />

                {/* محتوى البطاقة */}
                <div className="relative h-full p-8 card-glass rounded-3xl border-2 border-(--ui-border) shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  {/* رقم الخطوة */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-linear-to-br from-(--color-bright-500) to-(--color-dark-500) rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {i + 1}
                  </div>

                  {/* أيقونة الخطوة */}
                  <div className="relative mb-6 inline-flex">
                    <div className="absolute inset-0 bg-linear-to-br from-(--color-bright-500) to-(--color-dark-500) rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />
                    <div className="relative w-20 h-20 flex items-center justify-center bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Image src={step.icon} alt={step.title} width={48} height={48} className="drop-shadow-lg" />
                    </div>
                  </div>

                  {/* عنوان الخطوة */}
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 text-(--ui-foreground)">{step.title}</h3>

                  {/* وصف الخطوة */}
                  <p className="text-(--ui-muted-foreground) text-base leading-relaxed">{step.desc}</p>

                  {/* سهم توضيحي للهواتف المحمولة */}
                  {i < 2 && (
                    <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 -mb-8 text-(--ui-info) animate-bounce">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* دعوة لاتخاذ إجراء CTA */}
        <div className="mt-16 text-center animate-fadeIn" style={{ animationDelay: "0.6s" }}>
          <div className="inline-flex items-center gap-4 p-6 card-glass rounded-2xl border border-(--ui-border) shadow-lg">
            <div className="text-4xl animate-bounce">⚡</div>
            <div className="text-right">
              <div className="text-lg font-bold text-(--ui-foreground)">{workflowCopy.ctaTitle}</div>
              <div className="text-sm text-(--ui-muted-foreground)">{workflowCopy.ctaSubtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}