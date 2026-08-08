import os
import sys
from PIL import Image

try:
    from rembg import remove
except ImportError:
    print("rembg is not installed. Background will not be removed.")
    remove = None

img_path = r"C:\Users\SRIMAN KUMAR\.gemini\antigravity-ide\brain\b9585578-b42d-4311-86e6-0a8d422d4000\media__1786200079379.png"
frontend_logo_path = r"frontend\public\logo.png"

# Read image
try:
    with open(img_path, 'rb') as f:
        img_data = f.read()
except Exception as e:
    print(f"Error reading image: {e}")
    sys.exit(1)

# Keep original background (user requested this for dark mode visibility)
print("Keeping original background...")
img = Image.open(img_path)
img = img.convert("RGBA")

# Make it a perfect square by center-cropping
w, h = img.size
min_dim = min(w, h)
left = (w - min_dim) / 2
top = (h - min_dim) / 2
right = (w + min_dim) / 2
bottom = (h + min_dim) / 2
square_img = img.crop((left, top, right, bottom))

# Save frontend logo (can be larger, e.g. original size)
square_img.save(frontend_logo_path, format="PNG")
print(f"Saved frontend logo to {frontend_logo_path}")

# Android App Icons
res_dir = r"mobile-wrapper\android\app\src\main\res"
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in mipmap_sizes.items():
    target_dir = os.path.join(res_dir, folder)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    icon = square_img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Save standard icon
    icon_path = os.path.join(target_dir, "ic_launcher.png")
    icon.save(icon_path, format="PNG")
    
    # Save round icon
    round_icon_path = os.path.join(target_dir, "ic_launcher_round.png")
    icon.save(round_icon_path, format="PNG")

    # Save foreground icon
    fg_icon_path = os.path.join(target_dir, "ic_launcher_foreground.png")
    icon.save(fg_icon_path, format="PNG")
    
print("Saved all Android app icons.")
