/**
 * @File   : DeviceOrientationManager.ts
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-21 13:46:26
 * @Description:
 */
import mitt from 'mitt/dist/mitt.es';
import AngleLPF from './AngleLPF';

export type TOrientation = 0 | 90 | 180 | -90;

export interface IDeviceOrientationData {
  supported: boolean;
  orientation: TOrientation;
  origOrientation: TOrientation;
  order: 'YXZ';
  yaw: number;
  pitch: number;
  roll: number;
}

export type TDeviceOrientationEvents = 'orientationchange' | 'deviceorientation';

const {PI} = Math;
const PI2 = PI * 2;

function deg2Rad(deg: number) {
  return deg / 180 * PI;
}

export default class DeviceOrientationManager {
  public enableMouseOrTouch: boolean | 'auto' = 'auto';
  public freq: number;
  public filterSmoothing: number = .8;
  public filterWindowSize: number = 4;
  public container: HTMLElement = null;

  private _emitter: mitt.Emitter = new mitt();
  private _lpf: AngleLPF = new AngleLPF();
  private _orientationMode: TOrientation | 'auto' = 'auto';
  private _orientation: TOrientation = 90;
  private _deviceSupported: boolean = false;
  private _mode: 'mouse' | 'touch' | 'orientation' | 'init' = 'init';
  private _yaw: number = 0;
  private _pitch: number = Math.PI / 2;
  private _started: boolean = false;
  private _escapeTime: number = 0;
  private _pointerX: number = 0;
  private _pointerY: number = 0;

  constructor(options?: {
    freq?: number,
    enableMouseOrTouch?: boolean | 'auto',
    container?: HTMLElement,
    orientation?: TOrientation | 'auto',
    filterSmoothing?: number,
    filterWindowSize?: number
  }) {
    const opts = options || {};
    this.freq = opts.freq === undefined ? 10 : opts.freq;
    this.enableMouseOrTouch = opts.enableMouseOrTouch === undefined ? 'auto' : opts.enableMouseOrTouch;
    this.container = opts.container || document.body;
    this.filterSmoothing = opts.filterSmoothing || .5;
    this.filterWindowSize = opts.filterWindowSize || 10;
    this.orientation = opts.orientation || 'auto';

    this.handleOrientationChange();

    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.addEventListener('deviceorientation', this.handleDeviceOrientation);
    this.container.addEventListener('touchstart', this.handleTouchStart);
    this.container.addEventListener('mousedown', this.handleMouseDown);
  }

  set orientation (mode: TOrientation | 'auto') {
    this._orientationMode = mode;

    if (this._orientationMode !== 'auto') {
      (this._orientation as any) = mode;
    } else {
      this._orientation = (window.orientation as any) || 0;
    }
  }

  get ready() {
    return this._lpf.ready;
  }

  get current(): IDeviceOrientationData {
    let yaw = this._yaw;
    let pitch = this._pitch;
    let roll = 0;
    let orientation = 0 as TOrientation;

    if (this._mode === 'orientation') {
      const [alpha, beta, gamma] = this._lpf.current;

      yaw = alpha;
      pitch = beta;
      roll = -gamma;
      orientation = this._orientation;
    }

    return {
      orientation,
      origOrientation: this._orientation,
      supported: this._deviceSupported,
      order: 'YXZ',
      yaw,
      pitch,
      roll
    };
  }

  public addEventListener(type: TDeviceOrientationEvents, handler: (data: IDeviceOrientationData) => any) {
    this._emitter.on(type, handler);
  }

  public removeEventListener(type: TDeviceOrientationEvents, handler: (data: IDeviceOrientationData) => any) {
    this._emitter.off(type, handler);
  }

  public start() {
    this._started = true;
    this._escapeTime = 0;
    this.initLpf();
    this._emitter.emit('deviceorientation', this.current);

    requestAnimationFrame(this.loop);
  }

  public stop() {
    this._started = false;
  }

  private initLpf() {
    this._lpf.smoothing = this.filterSmoothing;
    this._lpf.maxSize = this.filterWindowSize;
    this._lpf.init(3, [[0, Math.PI / 2, 0]]);
  }

  private canUseMouseOrTouch() {
    if (this.enableMouseOrTouch === false) {
      return false;
    }

    if (this.enableMouseOrTouch === 'auto' && this._deviceSupported) {
      return false;
    }

    return true;
  }

  private handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    this._deviceSupported = true;

    if (this._mode === 'init') {
      this._mode = 'orientation';
    }

    if (this._mode !== 'orientation') {
      return;
    }

    const {alpha, beta, gamma} = event;

    this._lpf.next([deg2Rad(alpha), deg2Rad(beta), deg2Rad(gamma)]);
  }

  private handleOrientationChange = () => {
    if (this._orientationMode !== 'auto') {
      return;
    }

    this._orientation = window.orientation as any || 0;

    this._emitter.emit('orientationchange', this._orientation);
    this.handleMouseUp();
    this.handleTouchEnd();
  }

  private handleTouchStart = (event: TouchEvent) => {
    if (!this.canUseMouseOrTouch() || this._mode === 'mouse') {
      return;
    }

    this._mode = 'touch';
    this._pointerX = event.touches[0].clientX;
    this._pointerY = event.touches[0].clientY;

    this.container.removeEventListener('touchstart', this.handleTouchMove);
    this.container.addEventListener('touchmove', this.handleTouchMove);
    this.container.addEventListener('touchend', this.handleTouchEnd);
    this.container.addEventListener('touchcancel', this.handleTouchEnd);
  }

  private handleTouchMove = (event: TouchEvent) => {
    const diffX = event.touches[0].clientX - this._pointerX;
    const diffY = event.touches[0].clientY - this._pointerY;

    this._pointerX = event.touches[0].clientX;
    this._pointerY = event.touches[0].clientY;

    this.normalizeMouseOrTouch(diffX, diffY);
  }

  private handleTouchEnd = () => {
    this.container.removeEventListener('touchmove', this.handleTouchMove);
    this.container.removeEventListener('touchend', this.handleTouchEnd);
    this.container.removeEventListener('touchcancel', this.handleTouchEnd);
    this.container.addEventListener('touchstart', this.handleTouchStart);

    if (this._deviceSupported) {
      this.initLpf();
      this._mode = 'orientation';
    }
  }

  private handleMouseDown = (event: MouseEvent) => {
    if (!this.canUseMouseOrTouch() || this._mode === 'touch') {
      return;
    }

    this._mode = 'mouse';
    this._pointerX = event.clientX;
    this._pointerY = event.clientY;

    this.container.removeEventListener('mousedown', this.handleMouseMove);
    this.container.addEventListener('mousemove', this.handleMouseMove);
    this.container.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('mouseout', this.handleMouseUp);
  }

  private handleMouseMove = (event: MouseEvent) => {
    const diffX = event.clientX - this._pointerX;
    const diffY = event.clientY - this._pointerY;

    this._pointerX = event.clientX;
    this._pointerY = event.clientY;

    this.normalizeMouseOrTouch(diffX, diffY);
  }

  private handleMouseUp = () => {
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    this.container.removeEventListener('mouseup', this.handleMouseUp);
    this.container.removeEventListener('mouseout', this.handleMouseUp);
    this.container.addEventListener('mousedown', this.handleMouseDown);

    if (this._deviceSupported) {
      this.initLpf();
      this._mode = 'orientation';
    }
  }

  private normalizeMouseOrTouch(diffX: number, diffY: number) {
    this._yaw += diffX / this.container.offsetWidth * Math.PI;
    this._pitch += diffY / this.container.offsetHeight * Math.PI;

    this._yaw = this._yaw > PI ? this._yaw - PI2 : this._yaw < -PI ? this._yaw + PI2 : this._yaw;
    this._pitch = this._pitch > PI ? this._pitch - PI2 : this._pitch < -PI ? this._pitch + PI2 : this._pitch;
  }

  private loop = (escapeTime: number) => {
    if (!this._started) {
      return;
    }

    this._escapeTime += escapeTime;

    if (this._escapeTime > 1000 / this.freq) {
      this._escapeTime = 0;

      this._emitter.emit('deviceorientation', this.current);
    }

    requestAnimationFrame(this.loop);
  }
}
