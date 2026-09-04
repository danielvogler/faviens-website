/**
 * CPython's `random` module, ported.
 *
 * The globe in `globe.mjs` is a seeded drawing: seed 7714 through Python's
 * Mersenne Twister is what produced the artwork of record in the brand package.
 * Any other generator draws a different, equally valid globe, and the site would
 * then ship a mark that did not match the logo files. So this reproduces the
 * exact sequence rather than substituting a JS PRNG.
 *
 * Three pieces have to match, not just the twister:
 *
 *   - `random()` is genrand_res53, two draws combined into a 53-bit double, not
 *     a single 32-bit draw divided down.
 *   - `gauss()` is Box-Muller with a cached second value. The cache is why the
 *     three normals of a strand's plane cost two draws and then none, and
 *     dropping it shifts every subsequent strand.
 *   - Seeding an integer goes through init_by_array, not init_genrand.
 *
 * `scripts/check-globe.mjs` asserts the result against the committed SVG.
 */

const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;

/** 32-bit multiply that keeps the low word, which `a * b | 0` loses. */
function mul32(a, b) {
  return Math.imul(a, b) >>> 0;
}

/** A drop-in for the subset of `random.Random` that the globe consumes. */
export class PythonRandom {
  /** @param {number} seed a non-negative integer, as Python's `Random(n)` */
  constructor(seed) {
    /** @type {Uint32Array} */
    this.mt = new Uint32Array(N);
    this.index = N + 1;
    /** @type {number | null} the second Box-Muller value, held for the next call */
    this.gaussNext = null;
    this.initByArray([seed >>> 0]);
  }

  /** @param {number} s */
  initGenrand(s) {
    this.mt[0] = s >>> 0;
    for (let i = 1; i < N; i += 1) {
      const prev = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (mul32(1812433253, prev) + i) >>> 0;
    }
    this.index = N;
  }

  /** @param {number[]} key */
  initByArray(key) {
    this.initGenrand(19650218);
    let i = 1;
    let j = 0;
    let k = Math.max(N, key.length);
    for (; k > 0; k -= 1) {
      const prev = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (((this.mt[i] ^ mul32(prev, 1664525)) >>> 0) + key[j] + j) >>> 0;
      i += 1;
      j += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (k = N - 1; k > 0; k -= 1) {
      const prev = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (((this.mt[i] ^ mul32(prev, 1566083941)) >>> 0) - i) >>> 0;
      i += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
    }
    this.mt[0] = 0x80000000;
  }

  /** @returns {number} the next 32-bit output */
  genrand() {
    if (this.index >= N) {
      for (let i = 0; i < N; i += 1) {
        const y = ((this.mt[i] & UPPER_MASK) | (this.mt[(i + 1) % N] & LOWER_MASK)) >>> 0;
        let next = (this.mt[(i + M) % N] ^ (y >>> 1)) >>> 0;
        if (y & 1) next = (next ^ MATRIX_A) >>> 0;
        this.mt[i] = next;
      }
      this.index = 0;
    }
    let y = this.mt[this.index];
    this.index += 1;
    y = (y ^ (y >>> 11)) >>> 0;
    y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
    y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
    y = (y ^ (y >>> 18)) >>> 0;
    return y;
  }

  /** genrand_res53: a 53-bit double in [0, 1), which is what Python returns. */
  random() {
    const a = this.genrand() >>> 5;
    const b = this.genrand() >>> 6;
    return (a * 67108864 + b) * (1.0 / 9007199254740992.0);
  }

  /**
   * @param {number} mu
   * @param {number} sigma
   * @returns {number}
   */
  gauss(mu = 0, sigma = 1) {
    let z = this.gaussNext;
    this.gaussNext = null;
    if (z === null) {
      const x2pi = this.random() * Math.PI * 2;
      const g2rad = Math.sqrt(-2.0 * Math.log(1.0 - this.random()));
      z = Math.cos(x2pi) * g2rad;
      this.gaussNext = Math.sin(x2pi) * g2rad;
    }
    return mu + z * sigma;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  uniform(a, b) {
    return a + (b - a) * this.random();
  }
}
