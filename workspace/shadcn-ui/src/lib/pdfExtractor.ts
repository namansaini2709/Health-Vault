import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js - using local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content (limited to 5000 characters)
 */
export async function extractPDFText(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n';

      // Stop if we've collected enough text (5000 chars limit to avoid token limits)
      if (fullText.length > 5000) {
        break;
      }
    }

    // Trim to 5000 characters
    const trimmedText = fullText.substring(0, 5000);

    console.log(`Extracted ${trimmedText.length} characters from PDF: ${file.name}`);
    return trimmedText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return ''; // Return empty string on error
  }
}
