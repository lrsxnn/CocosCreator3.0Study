
import { _decorator, Component, Node, Quat, error } from 'cc';
const { ccclass, property } = _decorator;

const degreesPerHour = 30, degreesPerMinute = 6, degreesPerSecond = 6;

@ccclass('Clock')
export class Clock extends Component {
    @property(Node)
    hourArm: Node = null!;
    @property(Node)
    minuteArm: Node = null!;
    @property(Node)
    secondArm: Node = null!;

    @property
    continuous: boolean = true;

    update(dt: number) {
        if (this.continuous) {
            this.updateContinuous();
        } else {
            this.updateDiscrete();
        }
    }

    updateContinuous() {
        let date = new Date();
        this.hourArm.setRotationFromEuler(0, -date.getHours() * degreesPerHour, 0);
        this.minuteArm.setRotationFromEuler(0, -date.getMinutes() * degreesPerMinute, 0);
        this.secondArm.setRotationFromEuler(0, -date.getSeconds() * degreesPerSecond, 0);
    }

    updateDiscrete() {
        let date = new Date();
        this.hourArm.setRotationFromEuler(0, -(date.getHours() + (date.getMinutes() + (date.getSeconds() + date.getMilliseconds() / 1000) / 60) / 60) * degreesPerHour, 0);
        this.minuteArm.setRotationFromEuler(0, -(date.getMinutes() + (date.getSeconds() + date.getMilliseconds() / 1000) / 60) * degreesPerMinute, 0);
        this.secondArm.setRotationFromEuler(0, -(date.getSeconds() + date.getMilliseconds() / 1000) * degreesPerSecond, 0);
    }
}
