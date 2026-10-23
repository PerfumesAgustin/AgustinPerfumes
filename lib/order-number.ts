export function formatOrderReference(orderNumber: string) {
  const normalized = orderNumber.trim();
  if (/^\d+$/.test(normalized)) return `N°${normalized.padStart(4, "0")}`;
  return normalized;
}

export function formatOrderLabel(orderNumber: string) {
  return `Pedido ${formatOrderReference(orderNumber)}`;
}
