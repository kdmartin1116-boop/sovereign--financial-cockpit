import argparse
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument('--bill')
parser.add_argument('--endorsement')
parser.add_argument('--qualifier')
parser.add_argument('--x', type=int)
parser.add_argument('--y', type=int)
args = parser.parse_args()

# Create overlay with endorsement text
packet = BytesIO()
can = canvas.Canvas(packet, pagesize=letter)
can.setFont("Helvetica-Bold", 12)
box_width = 300
box_height = 20
can.setFillColorRGB(1, 1, 1)  # white box
can.rect(args.x - 5, args.y - 5, box_width, box_height, fill=1, stroke=0)

can.setFillColorRGB(0, 0, 0)  # black text
can.drawString(args.x, args.y, f"{args.endorsement} ({args.qualifier})")
can.save()
packet.seek(0)

# Read original PDF
reader = PdfReader(args.bill)
writer = PdfWriter()
overlay = PdfReader(packet)

page = reader.pages[0]
page.merge_page(overlay.pages[0])
writer.add_page(page)

# Save new PDF
output_path = args.bill.replace(".pdf", "_endorsed.pdf")
with open(output_path, "wb") as f:
    writer.write(f)

print(f"✅ Endorsement placed at X:{args.x}, Y:{args.y}")
print(f"📄 Saved as: {output_path}")
