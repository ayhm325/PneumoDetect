
// استيراد صفحة النتائج الأصلية (واجهة المستخدم)
import PatientResultsPage from './page';


// هذه الدالة يتم تنفيذها على الخادم فقط عند كل طلب للصفحة (SSR)
// الهدف منها جلب بيانات نتائج المريض من API قبل عرض الصفحة للمستخدم
export async function getServerSideProps(context) {
  // إرسال طلب إلى API الخاص بنتائج المريض
  // نستخدم عنوان API من متغير البيئة أو localhost افتراضياً
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/patient/results`, {
    // تمرير الكوكيز من الطلب الأصلي لضمان وصول بيانات المستخدم الصحيحة
    headers: {
      Cookie: context.req.headers.cookie || '',
    },
  });
  // تحويل الاستجابة إلى JSON إذا نجح الطلب، وإلا نعيد مصفوفة فارغة
  const data = res.ok ? await res.json() : { records: [] };
  // إعادة البيانات كمُدخلات (props) للصفحة
  return {
    props: {
      initialReports: data.records || [], // النتائج الأولية للعرض
    },
  };
}


// هذا هو المكون الرئيسي للصفحة الذي يستقبل البيانات من SSR ويعرضها باستخدام واجهة المستخدم الأصلية
export default function PatientResultsPageSSR(props) {
  // تمرير النتائج الأولية كمُدخلات للصفحة الأصلية (Client Component)
  return <PatientResultsPage initialReports={props.initialReports} />;
}
