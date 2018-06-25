/**
 * @File   : LPF.ts
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-22 14:38:29
 * @Description:
 */
export default class AngleLPF {
  public smoothing: number = .2;
  public maxSize: number = 10;
  private buffer: [number, number][][] = [];
  private defaultValue: [number, number][] = [];
  private size: number;
  private defaultResult: number[] = [];

  public init(size: number, values: number[][] = []) {
    this.size = size;
    this.defaultValue = [];
    this.buffer = [];

    for (let i = 0; i < values.length; i += 1) {
      this.push(values[i]);
    }

    for (let i = 0; i < size; i += 1) {
      this.defaultValue.push([0, 1]);
      this.defaultResult.push(0);
    }

    return this.buffer;
  }

  public next(nextValue: number[]) {
    const removed = this.push(nextValue);
    const sI = 1 - this.smoothing;

    const result = this.buffer.reduce(
      (last, current) => current.map((v, index) => [
        this.smoothing * current[index][0] + sI * last[index][0],
        this.smoothing * current[index][1] + sI * last[index][1]
      ]),
      removed
    );

    this.buffer[this.buffer.length - 1] = result as [number, number][];
  }

  public reset(value: number[]) {
    this.buffer = [];
    this.push(value);
  }

  get current() {
    const length = this.buffer.length;

    if (length === 0) {
      return this.defaultResult;
    }

    return this.buffer[length - 1].map(point => Math.atan2(point[1], point[0]));
  }

  get ready() {
    return this.buffer.length === this.maxSize;
  }

  private push(value: number[]) {
    if (value.length !== this.size) {
      throw new Error(`Size of value must be ${this.size} !`);
    }

    const removed = (this.buffer.length === this.maxSize) ? this.buffer.shift() : this.defaultValue;

    const tmp: [number, number][] = [];
    for (let index = 0; index < this.size; index += 1) {
      tmp.push([Math.cos(value[index]), Math.sin(value[index])]);
    }

    this.buffer.push(tmp);

    return removed;
  }
}
