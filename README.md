# DeviceOrientationManager

A manager which will help you to control DeviceOrientation easily.

This manager supports graceful degradation, configurable frequency and smoothing.  

## Usage

Install:  

```sh
npm i device-orientation-manager --save
```

Then:

```ts
import DeviceOrientationManager from 'device-orientation-manager';

const options = {
  // Frequency, number, defaults to 10.
  // Event will be emitted every (1000 / freq)ms.
  freq: 10,
  // Allow user to control by mouse or touch? boolean | 'auto', defaults to 'auto'.
  // If 'auto', mouse controlling will be enabled on pc, touch controlling will be enable on mobile without supporting deviceorientation event.
  enableMouseOrTouch?: 'auto',
  // Field will be controlled, defaults to null.
  container?: HTMLElement,
  // User defined orientation mode, defaults to 'auto'.
  // If 'auto', orientation will be auto changed by window.orientation.
  orientation?: 0 | 90 | 180 | -90 | 'auto',
  // Filter smoothing, defaults to .5.
  // Larger smoothing, larger weight for current value.
  filterSmoothing?: number,
  // Filter window size, defaults to 10.
  // The larger size, better effect and larger delay for current value.
  filterWindowSize?: number
}

const doManager: DeviceOrientationManager = new DeviceOrientationManager(options);
// change options after constructor
doManager.freq = 30;

doManager.addEventListener(
  'orientationchange',
  orientation => {
    // 0 | 90 | 180 | -90
    console.log(orientation);
  }
);

doManager.addEventListener(
  'deviceorientation',
  ({yaw, pitch, roll, order, orientation}) => {
    console.log({
      // -PI ~ PI
      yaw,
      // -PI ~ PI
      pitch,
      // -PI / 2 ~ PI / 2
      roll,
      // 0 | 90 | 180 | -90
      orientation,
      // 'YXZ'
      order
    });

    const q0 = new Quaternion();
    const q1 = new Quaternion().rotateX(-Math.PI * 80 / 180);
    const euler = new Euler();
    euler.set(pitch, yaw, roll, order);
    camera.quaternion.fromEuler(euler);
    camera.quaternion.multiply(q1);
    camera.quaternion.multiply(q0.setAxisAngle(new Vector3(0, 0, 1), -orientation));
  }
);

doManager.start();

// If you want to stop
doManager.stop();
```
