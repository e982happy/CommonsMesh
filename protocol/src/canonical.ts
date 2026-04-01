function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    const sorted: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      sorted[key] = sortValue(val);
    }
    return sorted;
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}
