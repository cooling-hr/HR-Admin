"""
ينسخ النسختين المعتمدتين من مجلد المشروع إلى سطح المكتب.

يحلّ محل build_v85_and_cleanup.py، الذي صار خطراً: كان يُولّد النسخة الأوفلاين
من index.html بتفريغ روابط Firebase النصية. ذلك كان صحيحاً حين كان الفارق بين
النسختين روابط فحسب، أما اليوم فالنسخة الأوفلاين إصدار مستقل له نظام دخول برمز
محلي لا علاقة له بـ Firebase. تشغيل السكربت القديم كان سيمحوها ويضع مكانها نسخة
تحمل كود المصادقة كاملاً ومفتاح ويب حقيقي — أي يكسر العزل بدل أن يحفظه.

فهذا السكربت لا يولّد شيئاً: ينسخ الملفين المصانَين في المستودع كما هما، ويرفض
النسخ إن اكتشف أن العزل مخروق.

الاستعمال:  python publish_desktop_copies.py
"""

import os
import shutil
import sys

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
DESKTOP = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
if not os.path.isdir(DESKTOP):
    DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")

CLOUD_SRC = os.path.join(WORKSPACE, "نظام_ادارة_الملاك_v8.5_cloud.html")
OFFLINE_SRC = os.path.join(WORKSPACE, "نظام_ادارة_الملاك_v8.5_offline.html")
INDEX_SRC = os.path.join(WORKSPACE, "index.html")

CLOUD_DEST = os.path.join(DESKTOP, "نظام_ادارة_الملاك_v8.5_سحابي_رسمي.html")
OFFLINE_DEST = os.path.join(DESKTOP, "نظام_ادارة_الملاك_v8.5_أوفلاين_محلي_مستقل.html")

CLOUD_MARKERS = ("firebaseio", "identitytoolkit", "AIza")


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def fail(msg):
    print("  ✗ " + msg)
    sys.exit(1)


def main():
    for path in (INDEX_SRC, CLOUD_SRC, OFFLINE_SRC):
        if not os.path.exists(path):
            fail("ملف مفقود: " + os.path.basename(path))

    # 1. النسخة السحابية يجب أن تطابق index.html بايت ببايت
    if read(INDEX_SRC) != read(CLOUD_SRC):
        fail("النسخة السحابية لا تطابق index.html. شغّل: cp index.html \"نظام_ادارة_الملاك_v8.5_cloud.html\"")
    print("  ✓ النسخة السحابية مطابقة لـ index.html")

    # 2. النسخة الأوفلاين يجب أن تخلو من أي أثر للسحابة
    offline = read(OFFLINE_SRC)
    hits = [m for m in CLOUD_MARKERS if m in offline]
    if hits:
        fail("النسخة الأوفلاين تحوي أثراً سحابياً (" + "، ".join(hits) + ") — لن يُنسخ شيء.")
    print("  ✓ النسخة الأوفلاين معزولة تماماً عن السحابة")

    if not os.path.isdir(DESKTOP):
        fail("لم يُعثر على سطح المكتب: " + DESKTOP)

    shutil.copy2(CLOUD_SRC, CLOUD_DEST)
    shutil.copy2(OFFLINE_SRC, OFFLINE_DEST)
    print("  ✓ نُسخت النسختان إلى: " + DESKTOP)
    print("\nتم. النسختان على سطح المكتب محدَّثتان من مجلد المشروع.")


if __name__ == "__main__":
    main()
