// Radix-2 complex DFT. Forward: exp(-i 2πkn/N); inverse: exp(+i 2πkn/N)/N.
export function fft(re, im, inverse = false) {
  const n = re.length;
  if (n !== im.length || n < 2 || (n & (n - 1)) !== 0) throw new Error('FFT length must be a power of 2');
  const r = Float64Array.from(re), q = Float64Array.from(im);
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >>> 1;
    while (j & bit) { j ^= bit; bit >>>= 1; }
    j ^= bit;
    if (i < j) {
      [r[i], r[j]] = [r[j], r[i]];
      [q[i], q[j]] = [q[j], q[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (inverse ? 2 : -2) * Math.PI / len;
    const wc = Math.cos(angle), ws = Math.sin(angle);
    for (let start = 0; start < n; start += len) {
      let wr = 1, wi = 0;
      for (let k = 0; k < (len >>> 1); k++) {
        const a = start + k, b = a + (len >>> 1);
        const vr = r[b] * wr - q[b] * wi;
        const vi = r[b] * wi + q[b] * wr;
        r[b] = r[a] - vr; q[b] = q[a] - vi;
        r[a] += vr; q[a] += vi;
        const nw = wr * wc - wi * ws;
        wi = wr * ws + wi * wc; wr = nw;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { r[i] /= n; q[i] /= n; }
  return { re: r, im: q };
}

export function fft2(re, im, n, inverse = false) {
  if (re.length !== n * n || im.length !== n * n) throw new Error('Invalid 2D array size');
  const r = Float64Array.from(re), q = Float64Array.from(im);
  for (let y = 0; y < n; y++) {
    const start = y * n;
    const row = fft(r.subarray(start, start + n), q.subarray(start, start + n), inverse);
    r.set(row.re, start); q.set(row.im, start);
  }
  const colR = new Float64Array(n), colI = new Float64Array(n);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) { colR[y] = r[y*n+x]; colI[y] = q[y*n+x]; }
    const col = fft(colR, colI, inverse);
    for (let y = 0; y < n; y++) { r[y*n+x] = col.re[y]; q[y*n+x] = col.im[y]; }
  }
  return { re: r, im: q };
}

export const zeros = (n) => new Float64Array(n);
export const complexMultiply = (ar, ai, br, bi) => ({
  re: ar*br-ai*bi, im: ar*bi+ai*br,
});

export function maxError(a, b) {
  let m = 0;
  for (let i=0;i<a.length;i++) m=Math.max(m,Math.abs(a[i]-b[i]));
  return m;
}
