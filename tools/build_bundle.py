#!/usr/bin/env python3
"""
tools/build_bundle.py
Universal Bundler for COACH PRO
Generates js/bundle.js and syncs all assets to Android assets folder.
"""

import os
import re
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JS_DIR = os.path.join(BASE_DIR, 'js')
OUTPUT_BUNDLE = os.path.join(JS_DIR, 'bundle.js')
ANDROID_ASSETS_DIR = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'assets')

# Strict DAG Module Order
MODULE_FILES = [
    'calculations.js',
    'qrGenerator.js',
    'lib/jsqr.js',
    'state.js',
    'printer.js',
    'security/pinLock.js',
    'security/license.js',
    'security/backup.js',
    'components/assessment21.js',
    'components/bodyComp.js',
    'components/metabolic.js',
    'components/comparator.js',
    'components/billing.js',
    'components/photos.js',
    'components/recurringSchedule.js',
    'components/contractModal.js',
    'components/planning.js',
    'components/nutrition.js',
    'components/programs.js',
    'components/progressCheckin.js',
    'components/messages.js',
    'components/quickTools.js',
    'components/qrScanner.js',
    'components/accounting.js',
    'components/todoList.js',
    'components/clientModal.js',
    'components/thermalModal.js',
    'components/settingsModal.js',
    'components/clientList.js',
    'components/clientDetail.js',
    'components/dashboard.js',
    'app.js'
]

def clean_module_code(code: str, file_rel: str) -> str:
    # Remove import statements
    code = re.sub(r'^\s*import\s+[^;]+;\s*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'^\s*import\s+[\s\S]*?from\s+[\'"][^\'"]+[\'"];?\s*$', '', code, flags=re.MULTILINE)
    
    # Replace 'export const X =' with 'const X ='
    code = re.sub(r'^\s*export\s+(const|let|var|function|class)\s+', r'\1 ', code, flags=re.MULTILINE)
    
    # Replace 'export default X;'
    code = re.sub(r'^\s*export\s+default\s+[^;]+;\s*$', '', code, flags=re.MULTILINE)
    
    # Replace 'export { ... };'
    code = re.sub(r'^\s*export\s*\{[^}]*\};?\s*$', '', code, flags=re.MULTILINE)
    
    header = f"\n/* ==========================================================================\n   MODULE: {file_rel}\n   ========================================================================== */\n"
    return header + code.strip() + "\n"

def build():
    print(f"[*] Building COACH PRO Universal Bundle from {len(MODULE_FILES)} modules...")
    bundle_parts = [
        "/**\n * COACH PRO - Bundle Universel de Production\n * Généré automatiquement pour Web, Mobile & Android Native SPP\n */\n",
        "(function() {\n  'use strict';\n"
    ]

    for rel_path in MODULE_FILES:
        full_path = os.path.join(JS_DIR, rel_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Missing required module: {full_path}")
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        cleaned = clean_module_code(content, rel_path)
        bundle_parts.append(cleaned)

    bundle_parts.append("\n})();\n")
    bundle_code = "\n".join(bundle_parts)

    with open(OUTPUT_BUNDLE, 'w', encoding='utf-8') as f:
        f.write(bundle_code)

    bundle_size_kb = len(bundle_code.encode('utf-8')) / 1024
    print(f"[✓] Bundle successfully created: {OUTPUT_BUNDLE} ({bundle_size_kb:.1f} KB)")

    # Sync to Android Assets
    if os.path.exists(ANDROID_ASSETS_DIR):
        print(f"[*] Syncing assets to Android folder: {ANDROID_ASSETS_DIR}")
        
        # Files to copy
        root_files = ['index.html', 'manifest.json', 'icon.svg', 'sw.js']
        for rf in root_files:
            src = os.path.join(BASE_DIR, rf)
            dst = os.path.join(ANDROID_ASSETS_DIR, rf)
            if os.path.exists(src):
                shutil.copy2(src, dst)

        # Copy CSS
        dst_css = os.path.join(ANDROID_ASSETS_DIR, 'css')
        os.makedirs(dst_css, exist_ok=True)
        shutil.copy2(os.path.join(BASE_DIR, 'css', 'style.css'), os.path.join(dst_css, 'style.css'))

        # Copy JS Bundle
        dst_js = os.path.join(ANDROID_ASSETS_DIR, 'js')
        os.makedirs(dst_js, exist_ok=True)
        shutil.copy2(OUTPUT_BUNDLE, os.path.join(dst_js, 'bundle.js'))
        
        print("[✓] Android assets synced successfully.")

if __name__ == '__main__':
    build()
