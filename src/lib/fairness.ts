import CryptoJS from 'crypto-js'

export function generateServerSeed(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function generateClientSeed(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hashServerSeed(serverSeed: string): string {
  return CryptoJS.SHA256(serverSeed).toString()
}

export function generateResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameType: 'wingo' | 'k3' | '5d' | 'trx'
): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`
  const hash = CryptoJS.HmacSHA256(combined, serverSeed).toString()

  const bytes = []
  for (let i = 0; i < 8; i++) {
    bytes.push(parseInt(hash.slice(i * 2, i * 2 + 2), 16))
  }

  let value = 0
  for (const byte of bytes) {
    value = (value * 256 + byte) % 10
  }

  switch (gameType) {
    case 'wingo':
      return value
    case 'k3': {
      const d1 = ((parseInt(hash.slice(0, 2), 16)) % 6) + 1
      const d2 = ((parseInt(hash.slice(2, 4), 16)) % 6) + 1
      const d3 = ((parseInt(hash.slice(4, 6), 16)) % 6) + 1
      return d1 + d2 + d3
    }
    case '5d':
      return parseInt(hash.slice(0, 5), 16) % 100000
    case 'trx':
      return parseInt(hash.slice(0, 6), 16) % 10
    default:
      return value
  }
}

export function verifyResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameType: 'wingo' | 'k3' | '5d' | 'trx',
  result: number
): boolean {
  const expected = generateResult(serverSeed, clientSeed, nonce, gameType)
  return expected === result
}

export function getWingoColor(number: number): string {
  if (number === 0) return 'violet'
  if (number === 5) return 'violet'
  if ([1, 3, 7, 9].includes(number)) return 'green'
  return 'red'
}

export function getWingoColorDisplay(number: number): { color: string; label: string } {
  const c = getWingoColor(number)
  if (c === 'violet') return { color: 'violet', label: 'Violet' }
  if (c === 'green') return { color: 'green', label: 'Green' }
  return { color: 'red', label: 'Red' }
}

export function isWingoBig(number: number): boolean {
  return number >= 5
}

export function calculateWingoWin(
  betType: string,
  betValue: string,
  result: number,
  betAmount: number
): number {
  const color = getWingoColor(result)
  const isBig = isWingoBig(result)

  if (betType === 'number' && parseInt(betValue) === result) {
    return betAmount * 9
  }

  if (betType === 'color') {
    if (betValue === 'violet' && color === 'violet') return betAmount * 4.5
    if (betValue === 'red' && color === 'red') return betAmount * 2
    if (betValue === 'green' && color === 'green') return betAmount * 2
    if (betValue === 'red' && color === 'violet') return betAmount * 1.5
    if (betValue === 'green' && color === 'violet') return betAmount * 1.5
  }

  if (betType === 'size') {
    if (betValue === 'big' && isBig) return betAmount * 2
    if (betValue === 'small' && !isBig) return betAmount * 2
  }

  return 0
}
