"""ينسخ الناتج التجريبي الجديد إلى سطح المكتب بأسماء لا تستبدل النسخ المعتمدة الحالية."""
import os, shutil, sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
if not os.path.isdir(DESK):
    DESK = os.path.join(os.path.expanduser("~"), "Desktop")

JOBS = {
    "offline": (os.path.join(APP, "dist", "offline", "hr-offline.html"), "نظام_ادارة_الملاك_تجريبي_جديد_أوفلاين.html"),
    "cloud": (os.path.join(APP, "dist", "cloud", "hr-cloud.html"), "نظام_ادارة_الملاك_تجريبي_جديد_سحابي.html"),
}
which = sys.argv[1] if len(sys.argv) > 1 else "offline"
if which not in JOBS:
    sys.exit("usage: publish-desktop.py [offline|cloud]")
src, name = JOBS[which]
if which == "offline":
    txt = open(src, encoding="utf-8").read()
    for bad in ("firebaseio", "identitytoolkit", "AIza"):
        if bad in txt:
            sys.exit(f"الرفض: العزل مخروق ({bad})")
shutil.copyfile(src, os.path.join(DESK, name))
print("copied ->", os.path.join(DESK, name))
