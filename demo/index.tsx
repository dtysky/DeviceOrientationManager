/**
 * @File   : index.tsx
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-25 19:25:53
 * @Description:
 */
import * as React from 'react';
import {render} from 'react-dom';

import DeviceOrientationManager from '../src';
import './base.scss';

interface IStateTypes {
  yaw: number;
  pitch: number;
  roll: number;
  orientation: number;
  order: string;
}

const doManager: DeviceOrientationManager = new DeviceOrientationManager();

export default class Component extends React.Component<{}, IStateTypes> {
  public state: IStateTypes = {
    yaw: 0,
    pitch: 0,
    roll: 0,
    orientation: 0,
    order: ''
  };

  public async componentDidMount() {
    doManager.addEventListener('deviceorientation', ({yaw, pitch, roll, order, orientation}) => {
      this.setState({
        yaw: yaw / Math.PI * 180,
        pitch: pitch / Math.PI * 180,
        roll: roll / Math.PI * 180,
        orientation,
        order
      });
    });
    doManager.start();
  }

  public render() {
    return (
      <React.Fragment>
        <p>yaw: {this.state.yaw.toFixed(4)}</p>
        <p>pitch: {this.state.pitch.toFixed(4)}</p>
        <p>roll: {this.state.roll.toFixed(4)}</p>
        <p>orientation: {this.state.orientation}</p>
        <p>order: {this.state.order}</p>
      </React.Fragment>
    );
  }
}

render(<Component />, document.getElementById('container'));
