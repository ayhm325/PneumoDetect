from fastapi import FastAPI, HTTPException  # لإنشاء API سريع ونقاط النهاية ومعالجة الأخطاء
from fastapi.staticfiles import StaticFiles  # لخدمة الملفات الثابتة مثل الصور والـ heatmaps
from pydantic import BaseModel  # لإنشاء نماذج البيانات (Request/Response validation)
from fastapi.middleware.cors import CORSMiddleware  # لتفعيل CORS للسماح بالوصول من أي دومين
import base64  # لتحويل الصور من/إلى صيغة base64
from io import BytesIO  # لإنشاء stream من بايتات الصورة لتحويلها لصورة PIL
from PIL import Image  # للتعامل مع الصور (فتح، تعديل، تحويل، حفظ)
import torch  # مكتبة PyTorch للتعلم العميق وتشغيل النموذج
from torchvision import transforms, models  # لتحويل الصور، واستخدام نماذج جاهزة مثل DenseNet
import os  # للتعامل مع مسارات الملفات وإنشاء المجلدات
import time  # لقياس زمن تنفيذ التنبؤ
import uuid  # لإنشاء معرف فريد (UUID) للملفات مثل heatmaps
import numpy as np  # للتعامل مع المصفوفات ومعالجة الصور بشكل رقمي
import matplotlib.pyplot as plt  # لإنشاء heatmaps وخرائط الألوان على الصور

# ============================================
# تعريف نموذج الطلب المتوقع (Request Model)
# ============================================
class PredictRequest(BaseModel):
    image_base64: str         # الصورة المرسلة بصيغة base64
    with_heatmap: bool = False  # هل يريد المستخدم توليد heatmap مع النتيجة؟

# ============================================
# إنشاء تطبيق FastAPI
# ============================================
app = FastAPI()

# إعداد أصول CORS المصرح بها من البيئة (مع إزالة السماح العام بالوايلدكارد مع بيانات الاعتماد)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================
# إعداد المسارات والملفات الثابتة
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# محاولة إيجاد مسار النموذج (model) في عدة أماكن
FALLBACK_PATHS = [
    os.path.join(BASE_DIR, '..', 'ai', 'models', 'best_densenet121_xray.pth'),
    os.path.join(BASE_DIR, '..', 'backend', 'best_densenet121_xray.pth'),
    os.path.join(BASE_DIR, '..', 'best_densenet121_xray.pth'),
]

MODEL_PATH = None
for p in FALLBACK_PATHS:
    p = os.path.normpath(p)
    if os.path.exists(p):
        MODEL_PATH = p
        break

# إذا لم يتم العثور على النموذج، استخدم مسار افتراضي وأظهر تحذير
if MODEL_PATH is None:
    MODEL_PATH = os.path.join(BASE_DIR, '..', 'backend', 'best_densenet121_xray.pth')
    print('WARNING: model not found in ai/models; using', MODEL_PATH)

# إعداد مجلد الملفات الثابتة والـ heatmaps
STATIC_DIR = os.path.join(BASE_DIR, "static")
HEATMAP_DIR = os.path.join(STATIC_DIR, "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)  # إنشاء المجلد إذا لم يكن موجوداً

# تحديد الجهاز لتشغيل PyTorch (GPU إذا متاح، وإلا CPU)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============================================
# دالة لتحميل النموذج
# ============================================
def load_model(path):
    model = models.densenet121(weights=None)  # نموذج DenseNet121 بدون أوزان مسبقة
    model.classifier = torch.nn.Linear(model.classifier.in_features, 2)  # طبقة إخراج ثنائية
    state = torch.load(path, map_location=DEVICE)  # تحميل الأوزان
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()  # ضبط النموذج على وضع التقييم
    return model

# تحميل النموذج عند بدء السيرفر
print("Python model server starting. Loading model from:", MODEL_PATH)
if not os.path.exists(MODEL_PATH):
    print("WARNING: model file not found:", MODEL_PATH)
    MODEL = None
else:
    MODEL = load_model(MODEL_PATH)
    print("Model loaded.")

# ============================================
# التحويلات المسبقة (Preprocessing) للصورة
# ============================================
prep_transform = transforms.Compose([
    transforms.Resize((224, 224)),                  # تغيير حجم الصورة لتتناسب مع نموذج DenseNet
    transforms.Grayscale(num_output_channels=3),   # تحويل الصورة لأبيض وأسود مع 3 قنوات (RGB)
    transforms.ToTensor(),                         # تحويل الصورة إلى Tensor
    transforms.Normalize(                           # تطبيع القيم بناءً على mean و std المستخدمة أثناء التدريب
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# تسمية الفئات (Labels) الناتجة عن النموذج
LABELS = {0: "NORMAL", 1: "PNEUMONIA"}

# تثبيت مسار الملفات الثابتة على السيرفر
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ============================================
# نقطة النهاية لتنبؤ الصورة (POST /predict)
# ============================================
@app.post("/predict")
async def predict(req: PredictRequest):
    # تحقق من أن النموذج محمل
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded on server")

    # محاولة قراءة الصورة من الـ base64
    try:
        img_data = base64.b64decode(req.image_base64)
        img = Image.open(BytesIO(img_data)).convert("L")  # تحويل الصورة لأبيض وأسود
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    # تحويل الصورة إلى Tensor وتغيير شكلها لتكون batch size = 1
    tensor = prep_transform(img).unsqueeze(0).to(DEVICE)

    # توقيت عملية التنبؤ لقياس زمن التنفيذ
    start = time.time()
    with torch.no_grad():  # تعطيل التتبع الحسابي (للتقييم فقط)
        out = MODEL(tensor)  # تمرير الصورة للنموذج
        probs = torch.softmax(out, dim=1).cpu().numpy()[0]  # تحويل المخرجات للاحتمالات
        pred_idx = int(probs.argmax())  # اختيار الفئة ذات الاحتمال الأعلى
        pred_label = LABELS.get(pred_idx, "Unknown")  # الحصول على التسمية النهائية
    end = time.time()

    # إعداد النتيجة الأساسية
    result = {
        "prediction": pred_label,
        "probabilities": {LABELS[i]: float(probs[i]) for i in range(len(probs))},
        "model_version": os.path.basename(MODEL_PATH),
        "heatmap_url": None,
        "inference_time_ms": int((end - start) * 1000),
    }

    # ============================================
    # توليد Heatmap إذا طلب المستخدم ذلك
    # ============================================
    if req.with_heatmap:
        try:
            # إنشاء مصفوفة كثافة البكسل من الصورة
            arr = np.array(img.resize((224, 224))).astype(float)
            arr = (arr - arr.min()) / (arr.max() - arr.min() + 1e-8)  # تطبيع القيم بين 0 و 1

            cmap = plt.get_cmap('jet')  # استخدام colormap "jet"
            heatmap_rgba = cmap(arr)
            heatmap_rgb = (heatmap_rgba[:, :, :3] * 255).astype('uint8')  # تحويل إلى RGB

            heatmap_img = Image.fromarray(heatmap_rgb).convert('RGBA')

            # دمج Heatmap مع الصورة الأصلية
            base_rgb = img.resize((224, 224)).convert('RGB')
            base_rgba = base_rgb.convert('RGBA')
            blended = Image.blend(base_rgba, heatmap_img, alpha=0.5)

            # حفظ الصورة المدمجة (ملاحظة: هذا تمثيل بصري لكثافة البكسل وليس خوارزمية Grad-CAM تدريبية)
            fname = f"heatmap_{uuid.uuid4().hex}.png"
            out_path = os.path.join(HEATMAP_DIR, fname)
            blended.save(out_path)

            # مسار URL للـ heatmap يعتمد على متغير بيئة أو مسار نسبي لتجنب فرض 127.0.0.1
            base_url = os.getenv("PUBLIC_HEATMAP_BASE_URL", "/static/heatmaps").rstrip("/")
            if base_url.startswith("http"):
                result['heatmap_url'] = f"{base_url}/{fname}"
            else:
                result['heatmap_url'] = f"{base_url}/{fname}"
            result['explanation'] = "Intensity-based image highlight visualization."
        except Exception as e:
            # لا تفشل التنبؤ إذا حدث خطأ في توليد Heatmap
            print('Heatmap generation failed:', e)

    return result

# ============================================
# تشغيل السيرفر بشكل مباشر (اختياري عند التشغيل محلياً)
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
