import fitz
import os
import glob

dirs = [
    r"G:\My Drive\Data science L1\Our Year 2025-2026\S1\Algorithm\Course",
    r"G:\My Drive\Data science L1\Our Year 2025-2026\S2\Algorithms\Course"
]

out = open(r"d:\Programing\C\Projects\my website\algo-runner\pdf_texts.txt", "w", encoding="utf-8")

for d in dirs:
    pdf_files = glob.glob(os.path.join(d, "*.pdf"))
    for pdf_path in pdf_files:
        try:
            doc = fitz.open(pdf_path)
            out.write(f"\n{'='*80}\nFILE: {os.path.basename(pdf_path)}\n{'='*80}\n")
            for page in doc:
                out.write(page.get_text())
        except Exception as e:
            out.write(f"\nError reading {pdf_path}: {e}\n")

out.close()
print("Done extracting text.")
