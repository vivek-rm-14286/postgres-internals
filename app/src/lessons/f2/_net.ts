/** IPv4 helpers for the network view: the same answers as inet/cidr functions for IPv4 values. */

export const parseIp = (s: string): number | null => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s.trim())
  if (!m) return null
  const p = m.slice(1).map(Number)
  if (p.some((x) => x > 255)) return null
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]
}
export const ipStr = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.')
const maskOf = (len: number) => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0)

export interface Net { addr: number; len: number }
export const parseNet = (s: string): Net => {
  const [a, l] = s.split('/')
  return { addr: parseIp(a)!, len: l === undefined ? 32 : Number(l) }
}
/** network(): host bits cleared */
export const network = (n: Net) => (n.addr & maskOf(n.len)) >>> 0
export const broadcast = (n: Net) => (network(n) | (~maskOf(n.len) >>> 0)) >>> 0
export const netmask = (n: Net) => maskOf(n.len)
/** net >>= ip: the address lies inside the network */
export const containsIp = (n: Net, ip: number) => ((ip & maskOf(n.len)) >>> 0) === network(n)
/** a >> b: a strictly contains b (shorter prefix, and b's network lies inside a) */
export const strictlyContains = (a: Net, b: Net) => a.len < b.len && containsIp(a, b.addr)
/** cidr text output: abbreviated only by abbrev(); the default text keeps all four octets */
export const cidrText = (n: Net) => `${ipStr(network(n))}/${n.len}`
export const size = (n: Net) => 2 ** (32 - n.len)
