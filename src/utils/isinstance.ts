export function isInstance (target: unknown, theClass: any): boolean {
  if (target instanceof Map) { target = Array.from(target.values()) }
  if (
    Array.isArray(target) &&
    target.map((f) => f instanceof theClass).includes(false)
  ) { return false } else if (!(target instanceof theClass) && !Array.isArray(target)) return false
  else return true
}
