export const DELETED_PRODUCT_PREFIX = "__deleted_product__:";

export function isDeletedProduct(sourceName?: string | null) {
  return sourceName?.startsWith(DELETED_PRODUCT_PREFIX) ?? false;
}

export function deletedProductSourceName(sourceName?: string | null) {
  if (isDeletedProduct(sourceName)) return sourceName as string;
  return `${DELETED_PRODUCT_PREFIX}${sourceName ?? ""}`;
}
