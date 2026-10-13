const LOWER = "abcdefghijkmnpqrstuvwxyz"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITS = "23456789"
const SYMBOLS = "!@#$%&*?"
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

function pick(chars: string) {
  const [n] = crypto.getRandomValues(new Uint32Array(1))
  return chars[n % chars.length]
}

// A temporary password with at least one of each character type.
// Look-alike characters (0/O, 1/l/I) are left out so it's easy to read out.
export function generatePassword(length = 12) {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
  while (chars.length < length) chars.push(pick(ALL))

  // Shuffle so the guaranteed characters aren't always at the start
  for (let i = chars.length - 1; i > 0; i--) {
    const [n] = crypto.getRandomValues(new Uint32Array(1))
    const j = n % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}
