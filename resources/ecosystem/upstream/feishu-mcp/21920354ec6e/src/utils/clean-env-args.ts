export function cleanEnvArgs(args: Record<string, string | undefined>) {
  const result = {} as Record<string, string>;
  for (const [key, value] of Object.entries(args)) {
    if (value) {
      result[key as keyof typeof args] = value;
    }
  }
  return result;
}
