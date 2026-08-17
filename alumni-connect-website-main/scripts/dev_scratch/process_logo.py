import cv2
import numpy as np
import sys
import os

img_path = r"C:\Users\SRIMAN KUMAR\.gemini\antigravity\brain\49a8b383-9fe3-40d1-ac10-b588f885eca2\media__1781863083067.jpg"
out_path = r"frontend\public\logo.png"

img = cv2.imread(img_path)
if img is None:
    print("Could not load image at", img_path)
    sys.exit(1)

h, w = img.shape[:2]

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.medianBlur(gray, 5)

circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=h/2, param1=50, param2=40, minRadius=int(h*0.3), maxRadius=int(h*0.48))

if circles is not None:
    circles = np.uint16(np.around(circles))
    best_c = None
    best_dist = float('inf')
    for i in circles[0, :]:
        cx, cy, r = i[0], i[1], i[2]
        dist = (cx - w/2)**2 + (cy - h/2)**2
        if dist < best_dist:
            best_dist = dist
            best_c = i
    
    cx, cy, r = best_c[0], best_c[1], best_c[2]
    # The outer part of the badge has the text "ALUMNI GUIDE." 
    # We want to capture the whole circular badge. The Hough transform might grab the inner circle.
    # If the radius is too small, we just use a fallback.
    print(f"Found circle at ({cx}, {cy}) with radius {r}")
else:
    print("No circles found!")

# Looking at the image, the outer edge of the badge spans about 80% of the image height.
# Let's override the radius with an exact estimated radius since Hough might not be perfect.
cx, cy = w // 2, h // 2
r = int(h * 0.40) # The badge is about 80% of the height

# Let's try to refine the radius by looking at the color difference?
# Actually, 40% of height is a safe bet for the full badge.

mask = np.zeros((h, w), dtype=np.uint8)
cv2.circle(mask, (cx, cy), r, 255, -1)

b, g, r_ch = cv2.split(img)
alpha = mask
img_bgra = cv2.merge((b, g, r_ch, alpha))

x1, y1 = max(0, cx - r), max(0, cy - r)
x2, y2 = min(w, cx + r), min(h, cy + r)
cropped = img_bgra[y1:y2, x1:x2]

cv2.imwrite(out_path, cropped)
print(f"Saved logo to {out_path} with size {cropped.shape}")
