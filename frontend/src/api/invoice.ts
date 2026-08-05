import api from './axios';

export async function downloadInvoice(url: string): Promise<void> {
  const { data, headers } = await api.get(url, { responseType: 'blob' });
  const disposition = headers?.['content-disposition'] as string | undefined;
  let filename = 'invoice.pdf';
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match) filename = match[1];
  }
  const blobUrl = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(blobUrl);
}
