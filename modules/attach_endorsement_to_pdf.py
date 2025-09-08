from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

def attach_endorsement_to_pdf_function(original_pdf_path, endorsement_data, output_pdf_path, ink_color, page_index):
    # Define color map
    color_map = {
        "black": (0, 0, 0),
        "red": (1, 0, 0),
        "blue": (0, 0, 1),
        "green": (0, 1, 0),
        "white": (1, 1, 1)
    }
    r, g, b = color_map.get(ink_color.lower(), (0, 0, 0)) # Default to black

    try:
        # Create overlay PDF with endorsement text
        packet = BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica-Bold", 12)
        can.setFillColorRGB(r, g, b) # Set color
        can.drawString(50, 750, "🔗 Endorsement Chain Attached")

        can.setFont("Helvetica", 10)
        can.setFillColorRGB(r, g, b) # Set color
        y = 730
        for i, e in enumerate(endorsement_data.get("endorsements", []), start=1):
            can.drawString(50, y, f"{i}. {e.get('endorser_name', 'N/A')} → {e.get('next_payee', 'N/A')}")
            y -= 15
            can.drawString(60, y, f"Text: {e.get('text', 'N/A')}")
            y -= 15
            can.drawString(60, y, f"Signature: {e.get('signature', 'N/A')[:60]}...")
            y -= 25

        sig = endorsement_data.get("signature_block", {})
        can.drawString(50, y, f"Signed by: {sig.get('signed_by', 'N/A')} ({sig.get('capacity', 'N/A')})")
        y -= 15
        can.drawString(60, y, f"Signature: {sig.get('signature', 'N/A')}")
        y -= 15
        can.drawString(60, y, f"Date: {sig.get('date', 'N/A')}")
        can.save()
        packet.seek(0)

        # Load original PDF
        reader = PdfReader(original_pdf_path)
        writer = PdfWriter()
        overlay = PdfReader(packet)

        # Validate page_index
        if not (0 <= page_index < len(reader.pages)):
            raise ValueError(f"Invalid page_index: {page_index}. PDF has {len(reader.pages)} pages.")

        # Merge overlay onto specified page
        page = reader.pages[page_index]
        page.merge_page(overlay.pages[0])
        writer.add_page(page)

        # Add remaining pages
        for i, p in enumerate(reader.pages):
            if i != page_index:
                writer.add_page(p)

        # Save new PDF
        with open(output_pdf_path, "wb") as f:
            writer.write(f)

        print(f"📎 Endorsement chain attached to {output_pdf_path}")
        return True # Indicate success
    except Exception as e:
        print(f"❌ Error attaching endorsement to PDF: {e}")
        return False # Indicate failure

def stamp_pdf_with_endorsement(original_pdf_path, output_pdf_path, x, y, endorsement_text, qualifier):
    try:
        # Create an overlay with the endorsement text at the specified coordinates
        packet = BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica", 10)
        can.setFillColorRGB(0, 0, 0) # Black ink
        
        # The y-coordinate from PDF.js needs to be flipped for ReportLab
        page_height = letter[1]
        adjusted_y = page_height - y

        full_text = f"{endorsement_text} - {qualifier}"
        can.drawString(x, adjusted_y, full_text)
        can.save()
        packet.seek(0)

        # Merge the overlay with the original PDF
        reader = PdfReader(original_pdf_path)
        writer = PdfWriter()
        overlay = PdfReader(packet)

        page = reader.pages[0] # Assuming we are stamping the first page
        page.merge_page(overlay.pages[0])
        writer.add_page(page)

        # Add remaining pages
        for i in range(1, len(reader.pages)):
            writer.add_page(reader.pages[i])

        with open(output_pdf_path, "wb") as f:
            writer.write(f)

        return True
    except Exception as e:
        print(f"Error stamping PDF: {e}")
        return False