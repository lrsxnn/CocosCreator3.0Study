
import { _decorator, Component, Node, systemEvent, SystemEventType, Vec3, EventKeyboard, error, Vec2, Rect, RigidBody, PhysicsSystem, Collider, ICollisionEvent, IContactEquation } from 'cc';
import { Utils } from '../Utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('RigidSphere')
export class RigidSphere extends Component {
    @property({ range: [0, 100] })
    maxSpeed = 10;
    @property({ range: [0, 100] })
    maxAcceleration = 10;
    @property({ range: [0, 10] })
    jumpHeight = 2;
    @property({ range: [0, 5] })
    maxAirJumps = 0;
    @property({ range: [0, 100] })
    maxAirAcceleration = 1;
    @property({ range: [0, 90] })
    maxGroundAngle = 25;

    private _axisHorizontal = 0;
    private _axisVertical = 0;
    private _wDown: boolean = false;
    private _sDown: boolean = false;
    private _aDown: boolean = false;
    private _dDown: boolean = false;
    private _spaceDown: boolean = false;

    private _velocity: Vec3 = new Vec3();
    private _desiredVelocity: Vec3 = new Vec3();
    private _body: RigidBody = null!;
    private _jumpPhase = 0;
    private _minGroundDotProduct = 0;
    private _contactNormal: Vec3 = new Vec3();

    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;
    private _groundContactCount = 0;
    public get onGround() {
        return this._groundContactCount > 0;
    }

    onLoad() {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        this._body = this.getComponent(RigidBody)!;
        let collider = this.getComponent(Collider)!;
        collider.on('onCollisionEnter', this.onCollisionEnter, this);
        collider.on('onCollisionStay', this.onCollisionStay, this);

        this._minGroundDotProduct = Math.cos(this.maxGroundAngle * Math.PI / 180);
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
            case 32://space
                this._spaceDown = true;
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

        Vec3.multiplyScalar(this._desiredVelocity, new Vec3(playerInput.x, 0, playerInput.y), this.maxSpeed);
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

        this.updateState();
        this.adjustVelocity();

        if (this._spaceDown) {
            this._spaceDown = false;
            if (this.onGround || this._jumpPhase < this.maxAirJumps) {
                this._jumpPhase++;
                let jumpSpeed = Math.sqrt(-2 * PhysicsSystem.instance.gravity.y * this.jumpHeight);
                let alignedSpeed = Vec3.dot(this._velocity, this._contactNormal);
                if (alignedSpeed > 0) {
                    jumpSpeed = Math.max(jumpSpeed - alignedSpeed, 0);
                }
                this._velocity.add(Vec3.multiplyScalar(new Vec3(), this._contactNormal, jumpSpeed));
            }
        }
        this._body.setLinearVelocity(this._velocity);

        this._groundContactCount = 0;
        this._contactNormal = Vec3.ZERO.clone();
    }

    onCollisionEnter(event: ICollisionEvent) {
        this.evaluateCollision(event.contacts);
    }
    onCollisionStay(event: ICollisionEvent) {
        this.evaluateCollision(event.contacts);
    }
    evaluateCollision(collision: IContactEquation[]) {
        for (let i = 0; i < collision.length; i++) {
            let normal: Vec3 = new Vec3();
            if (collision[i].isBodyA) {
                collision[i].getLocalNormalOnA(normal);
            } else {
                collision[i].getLocalNormalOnB(normal);
            }
            if (normal.y >= this._minGroundDotProduct) {
                this._groundContactCount += 1;
                this._contactNormal.add(normal.clone());
            }
        }
    }

    updateState() {
        this._body.getLinearVelocity(this._velocity);

        if (this.onGround) {
            this._jumpPhase = 0;
            if (this._groundContactCount > 1) {
                this._contactNormal.normalize();
            }
        } else {
            this._contactNormal = Vec3.UP.clone();
        }
    }

    projectOnContactPlane(vector: Vec3): Vec3 {
        vector.subtract(Vec3.multiplyScalar(new Vec3(), this._contactNormal, Vec3.dot(vector, this._contactNormal)));
        return vector;
    }

    adjustVelocity() {
        let xAxis = this.projectOnContactPlane(Vec3.RIGHT.clone()).normalize();
        let zAxis = this.projectOnContactPlane(Vec3.FORWARD.clone()).normalize();
        let currentX = Vec3.dot(this._velocity, xAxis);
        let currentZ = Vec3.dot(this._velocity, zAxis);

        let acceleration = this.onGround ? this.maxAcceleration : this.maxAirAcceleration;
        let maxSpeedChange = acceleration * this._fixedTimeStep;

        let newX = Utils.mathfMoveTowards(currentX, this._desiredVelocity.x, maxSpeedChange);
        let newZ = Utils.mathfMoveTowards(currentZ, this._desiredVelocity.z, maxSpeedChange);

        this._velocity.add(xAxis.multiplyScalar(newX - currentX).add(zAxis.multiplyScalar(newZ - currentZ)));
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
