
import { _decorator, Component, Node, systemEvent, SystemEventType, Vec3, EventKeyboard, error, Vec2, Rect } from 'cc';
import { Utils } from '../Utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('MovingSphere')
export class MovingSphere extends Component {
    @property({ range: [0, 100] })
    maxSpeed = 10;
    @property({ range: [0, 100] })
    maxAcceleration = 10;
    @property({ range: [0, 1] })
    bounciness = 0.5;
    @property(Rect)
    allowedArea = new Rect(-5, -5, 10, 10);

    private _axisHorizontal = 0;
    private _axisVertical = 0;
    private _wDown: boolean = false;
    private _sDown: boolean = false;
    private _aDown: boolean = false;
    private _dDown: boolean = false;
    private _velocity: Vec3 = new Vec3();

    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;

    onLoad() {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case 87://w
                this._wDown = true;
                break;
            case 83://s
                this._sDown = true;
                break;
            case 65://a
                this._aDown = true;
                break;
            case 68://d
                this._dDown = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case 87://w
                this._wDown = false;
                break;
            case 83://s
                this._sDown = false;
                break;
            case 65://a
                this._aDown = false;
                break;
            case 68://d
                this._dDown = false;
                break;
        }
    }

    update(dt: number) {
        this._lastTime += dt;
        let fixedTime = this._lastTime / this._fixedTimeStep;
        for (let i = 0; i < fixedTime; i++) {
            this.fixedUpdate();
        }
        this._lastTime = this._lastTime % this._fixedTimeStep;

        let playerInput = new Vec2(this._axisHorizontal, this._axisVertical);
        // playerInput.normalize();
        playerInput = Utils.vector2ClampMagnitude(playerInput, 1);

        let desiredVelocity = new Vec3();
        Vec3.multiplyScalar(desiredVelocity, new Vec3(playerInput.x, 0, playerInput.y), this.maxSpeed);
        let maxSpeedChange = this.maxAcceleration * dt;
        // if (this._velocity.x < desiredVelocity.x) {
        //     this._velocity.x = Math.min(this._velocity.x + maxSpeedChange, desiredVelocity.x);
        // } else if (this._velocity.x > desiredVelocity.x) {
        //     this._velocity.x = Math.max(this._velocity.x - maxSpeedChange, desiredVelocity.x);
        // }
        // if (this._velocity.z < desiredVelocity.z) {
        //     this._velocity.z = Math.min(this._velocity.z + maxSpeedChange, desiredVelocity.z);
        // } else if (this._velocity.z > desiredVelocity.z) {
        //     this._velocity.z = Math.max(this._velocity.z - maxSpeedChange, desiredVelocity.z);
        // }

        this._velocity.x = Utils.mathfMoveTowards(this._velocity.x, desiredVelocity.x, maxSpeedChange);
        this._velocity.z = Utils.mathfMoveTowards(this._velocity.z, desiredVelocity.z, maxSpeedChange);

        let lastPos = this.node.position.clone();
        let displacement = new Vec3();
        Vec3.multiplyScalar(displacement, this._velocity, dt);
        lastPos.add(displacement);

        // if (!this.allowedArea.contains(new Vec2(lastPos.x, lastPos.z))) {
        //     lastPos.clampf(new Vec3(this.allowedArea.xMin, 0, this.allowedArea.yMin), new Vec3(this.allowedArea.xMax, 0, this.allowedArea.yMax));
        // }
        if (lastPos.x < this.allowedArea.xMin) {
            lastPos.x = this.allowedArea.xMin;
            this._velocity.x = -this._velocity.x * this.bounciness;
        } else if (lastPos.x > this.allowedArea.xMax) {
            lastPos.x = this.allowedArea.xMax;
            this._velocity.x = -this._velocity.x * this.bounciness;
        }
        if (lastPos.z < this.allowedArea.yMin) {
            lastPos.z = this.allowedArea.yMin;
            this._velocity.z = -this._velocity.z * this.bounciness;
        } else if (lastPos.z > this.allowedArea.yMax) {
            lastPos.z = this.allowedArea.yMax;
            this._velocity.z = -this._velocity.z * this.bounciness;
        }
        this.node.setPosition(lastPos);
    }

    fixedUpdate() {
        if (this._wDown) {
            this._axisVertical -= 0.05;
            if (this._axisVertical <= -1) {
                this._axisVertical = -1;
            }
        } else if (this._sDown) {
            this._axisVertical += 0.05;
            if (this._axisVertical >= 1) {
                this._axisVertical = 1;
            }
        } else {
            this._axisVertical = 0;
        }

        if (this._aDown) {
            this._axisHorizontal -= 0.05;
            if (this._axisHorizontal <= -1) {
                this._axisHorizontal = -1;
            }
        } else if (this._dDown) {
            this._axisHorizontal += 0.05;
            if (this._axisHorizontal >= 1) {
                this._axisHorizontal = 1;
            }
        } else {
            this._axisHorizontal = 0;
        }
    }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
