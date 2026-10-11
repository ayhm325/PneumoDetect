// يعيد JWT المخزن في الكوكيز (عادة لاستخدامه في مصادقة Socket)
export async function GET(req) {
  try {
    // قراءة كل الكوكيز المرسلة في الهيدر
    const cookie = req.headers.get("cookie") || "";

    // البحث عن التوكن باسم "token" داخل الكوكيز بشكل أكثر أماناً
    const tokenPair = cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("token="));

    const rawToken = tokenPair ? tokenPair.slice("token=".length) : "";
    const decodedToken = rawToken ? decodeURIComponent(rawToken).trim() : "";

    if (decodedToken) {
      // إذا وجد التوكن، إرجاعه بصيغة JSON
      return new Response(JSON.stringify({ token: decodedToken }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // إذا لم يوجد التوكن، إرجاع خطأ 404
    return new Response(JSON.stringify({ error: "Token not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    // في حال حدوث أي خطأ داخلي، نعيد 500
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
