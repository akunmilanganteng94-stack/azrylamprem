export function formatRupiah(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp0';
  return 'Rp' + Math.floor(amount).toLocaleString('id-ID');
}

export function formatDateTime(dateVal: any): string {
  if (!dateVal) return '-';
  let d: Date;
  if (typeof dateVal === 'object' && dateVal.seconds) {
    d = new Date(dateVal.seconds * 1000);
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    d = new Date(dateVal);
  } else {
    return '-';
  }
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

export function generateId(prefix = 'ID'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateOrderId(): string {
  return generateId('ORD');
}

export function generateDepositId(): string {
  return generateId('DEP');
}

export function generateInventoryId(): string {
  return generateId('INV');
}
