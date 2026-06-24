/**
 * Checks if an image URL to be uploaded for interactive messages points to a compliant image format (PNG or JPEG) and not in CMYK/YCCK color space.
 * @param url - The image URL to check.
 * @returns A promise that resolves to true if the image is compliant, false otherwise.
 */
export async function isCompliantImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-2047' }, // Only fetch first 2KB
    });

    if (!response.ok) return false;

    const buffer = Buffer.from(await response.arrayBuffer());

    // PNG — always RGB/RGBA, always compliant
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return true;

    // Must be JPEG from here
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return false;

    // Scan for APP14 marker (0xFF 0xEE) — indicates Adobe CMYK/YCCK
    for (let i = 2; i < buffer.length - 14; i++) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xee) {
        const transform = buffer[i + 13];
        // transform=0 → CMYK, transform=2 → YCCK — both are non-compliant
        if (transform === 0 || transform === 2) return false;
      }
    }

    return true;
  } catch {
    return false; // Treat fetch errors as non-compliant
  }
}
