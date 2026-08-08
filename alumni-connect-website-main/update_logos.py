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

# Add padding to prevent the logo from being over-zoomed on Android
w, h = img.size
max_dim = max(w, h)
pad = int(max_dim * 0.2)  # 20% padding around the image
new_dim = max_dim + (pad * 2)

# Get the background color from the top left pixel to fill the padding
bg_color = img.getpixel((5, 5))

square_img = Image.new("RGBA", (new_dim, new_dim), bg_color)
paste_x = (new_dim - w) // 2
paste_y = (new_dim - h) // 2
square_img.paste(img, (paste_x, paste_y))

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
