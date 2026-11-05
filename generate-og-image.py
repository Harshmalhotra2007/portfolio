from PIL import Image, ImageDraw, ImageFont

# Create a 1200x630 black image
width, height = 1200, 630
img = Image.new('RGB', (width, height), '#000000')
draw = ImageDraw.Draw(img)

# Colors
BG = '#000000'
PRIMARY = '#00f0ff'  # Cyan
SECONDARY = '#00ff66' # Green
WHITE = '#ffffff'
MUTED = '#888888'

# Draw border
border_margin = 20
draw.rectangle([border_margin, border_margin, width - border_margin, height - border_margin], outline=PRIMARY, width=4)
draw.rectangle([border_margin + 10, border_margin + 10, width - border_margin - 10, height - border_margin - 10], outline=SECONDARY, width=2)

# Corner ticks (Brutalist style)
tick_len = 40
tick_width = 6
# Top-left
draw.rectangle([border_margin, border_margin, border_margin + tick_width, border_margin + tick_len], fill=PRIMARY)
draw.rectangle([border_margin, border_margin, border_margin + tick_len, border_margin + tick_width], fill=PRIMARY)
# Top-right
draw.rectangle([width - border_margin - tick_width, border_margin, width - border_margin, border_margin + tick_len], fill=PRIMARY)
draw.rectangle([width - border_margin - tick_len, border_margin, width - border_margin, border_margin + tick_width], fill=PRIMARY)
# Bottom-left
draw.rectangle([border_margin, height - border_margin - tick_len, border_margin + tick_width, height - border_margin], fill=PRIMARY)
draw.rectangle([border_margin, height - border_margin - tick_width, border_margin + tick_len, height - border_margin], fill=PRIMARY)
# Bottom-right
draw.rectangle([width - border_margin - tick_width, height - border_margin - tick_len, width - border_margin, height - border_margin], fill=PRIMARY)
draw.rectangle([width - border_margin - tick_len, height - border_margin - tick_width, width - border_margin, height - border_margin], fill=PRIMARY)

# Try to load a font, fallback to default if not found
try:
    font_title = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 110)
    font_subtitle = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 65)
    font_tag = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 32)
    font_meta = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 24)
except Exception:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_tag = ImageFont.load_default()
    font_meta = ImageFont.load_default()

# Text content
title_text = "HARSH MALHOTRA"
subtitle_text = "PORTFOLIO"
tag_text = "[ SYSTEMS ]  [ WEB_DEV ]  [ ALGORITHMS ]"
meta_text = "SEC_00_HERO // SYS_INIT_OK // MUMBAI, IN"

# Calculate positions
# Title
title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
title_w = title_bbox[2] - title_bbox[0]
title_x = (width - title_w) // 2
title_y = 180

# Subtitle
sub_bbox = draw.textbbox((0, 0), subtitle_text, font=font_subtitle)
sub_w = sub_bbox[2] - sub_bbox[0]
sub_x = (width - sub_w) // 2
sub_y = title_y + 130

# Draw Title in White
draw.text((title_x, title_y), title_text, fill=WHITE, font=font_title)

# Draw Subtitle in Secondary Green
draw.text((sub_x, sub_y), subtitle_text, fill=SECONDARY, font=font_subtitle)

# Draw Tag
tag_bbox = draw.textbbox((0, 0), tag_text, font=font_tag)
tag_w = tag_bbox[2] - tag_bbox[0]
tag_x = (width - tag_w) // 2
tag_y = sub_y + 100
draw.text((tag_x, tag_y), tag_text, fill=PRIMARY, font=font_tag)

# Draw Meta at bottom
meta_bbox = draw.textbbox((0, 0), meta_text, font=font_meta)
meta_w = meta_bbox[2] - meta_bbox[0]
meta_x = (width - meta_w) // 2
meta_y = height - 100
draw.text((meta_x, meta_y), meta_text, fill=MUTED, font=font_meta)

# Save the image
img.save('assets/og-image.png')
print("OG image generated successfully at assets/og-image.png")