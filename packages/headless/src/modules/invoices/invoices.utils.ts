// -----------------------------------------------------------------------------
/**
 * @module invoices/invoices.utils
 * @description AC A's browser save-as trigger for a downloaded PDF blob —
 * the anchor-click pattern the `download` attribute needs
 * (`oracle: helpers/file.ts`'s `downloadBlob`). Mirrors `payment.utils.ts`'s
 * `submitViaForm` (create -> append -> trigger -> remove).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
