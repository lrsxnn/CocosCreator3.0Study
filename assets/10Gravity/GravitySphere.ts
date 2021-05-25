import { renderer, Color, Layers } from 'cc';
import { _decorator, Component, Node, systemEvent, SystemEventType, Vec3, EventKeyboard, error, Vec2, Rect, RigidBody, PhysicsSystem, Collider, ICollisionEvent, IContactEquation, MeshRenderer, geometry } from 'cc';
import { Utils } from '../Utils/Utils';
const { ccclass, property } = _decorator;

const VEC3_DOWN = Vec3.UP.clone().negative();
const VEC3_BACK = Vec3.FORWARD.clone().negative();//Unity Forward

@ccclass('GravitySphere')
export class GravitySphere extends Component {
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
    @property({ range: [0, 100] })
    maxSnapSpeed = 100;
    @property({ min: 0 })
    probeDistance = 1;
    @property({ type: [Layers.Enum] })
    probeMask: Layers.Enum[] = [];

    public get onGround() {
        return this._groundContactCount > 0;
    }

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
    private _groundContactCount = 0;
    private _stepsSinceLastGrounded = 0;
    private _stepsSinceLastJump = 0;

    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;
    private _pass: renderer.Pass = null!;
    private _hColor: number = 0

    onLoad() {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        this._body = this.getComponent(RigidBody)!;
        let collider = this.getComponent(Collider)!;
        collider.on('onCollisionEnter', this.onCollisionEnter, this);
        collider.on('onCollisionStay', this.onCollisionStay, this);

        this._minGroundDotProduct = Math.cos(this.maxGroundAngle * Math.PI / 180);

        this._pass = this.getComponent(MeshRenderer)!.materials[0]!.passes[0]!;
        this._hColor = this._pass.getHandle('albedo');
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
        this._pass.setUniform(this._hColor, this.onGround ? Color.BLACK : Color.WHITE);

        let playerInput = new Vec2(this._axisHorizontal, this._axisVertical);
        // playerInput.normalize();
        playerInput = Utils.vector2ClampMagnitude(playerInput, 1);

        Vec3.multiplyScalar(this._desiredVelocity, new Vec3(playerInput.x, 0, playerInput.y), this.maxSpeed);

        this._lastTime += dt;
        let fixedTime = this._lastTime / this._fixedTimeStep;
        for (let i = 0; i < fixedTime; i++) {
            this.fixedUpdate();
        }
        this._lastTime = this._lastTime % this._fixedTimeStep;
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
                this._stepsSinceLastJump = 0;
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
        this._stepsSinceLastGrounded += 1;
        this._stepsSinceLastJump += 1;
        this._body.getLinearVelocity(this._velocity);

        if (this.onGround || this.snapToGround()) {
            this._stepsSinceLastGrounded = 0;
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
        let zAxis = this.projectOnContactPlane(VEC3_BACK.clone()).normalize();
        let currentX = Vec3.dot(this._velocity, xAxis);
        let currentZ = Vec3.dot(this._velocity, zAxis);

        let acceleration = this.onGround ? this.maxAcceleration : this.maxAirAcceleration;
        let maxSpeedChange = acceleration * this._fixedTimeStep;

        let newX = Utils.mathfMoveTowards(currentX, this._desiredVelocity.x, maxSpeedChange);
        let newZ = Utils.mathfMoveTowards(currentZ, this._desiredVelocity.z, maxSpeedChange);

        this._velocity.add(xAxis.multiplyScalar(newX - currentX).add(zAxis.multiplyScalar(newZ - currentZ)));
    }

    snapToGround(): boolean {
        if (this._stepsSinceLastGrounded > 1 || this._stepsSinceLastJump <= 2) {
            return false;
        }
        let speed = this._velocity.length();
        if (speed > this.maxSnapSpeed) {
            return false;
        }
        let outRay = geometry.Ray.create(this.node.position.x, this.node.position.y, this.node.position.z, VEC3_DOWN.x, VEC3_DOWN.y, VEC3_DOWN.z)
        if (!PhysicsSystem.instance.raycastClosest(outRay, Layers.makeMaskExclude(this.probeMask), this.probeDistance)) {
            return false;
        }
        let raycastClosest = PhysicsSystem.instance.raycastClosestResult;
        if (raycastClosest.hitNormal.y < this._minGroundDotProduct) {
            return false;
        }
        this._groundContactCount = 1;
        this._contactNormal = raycastClosest.hitNormal.clone();
        let dot = Vec3.dot(this._velocity, raycastClosest.hitNormal);
        if (dot > 0) {
            this._velocity.subtract(Vec3.multiplyScalar(new Vec3(), raycastClosest.hitNormal, dot)).normalize();
            this._velocity.multiplyScalar(speed);
        }
        return true;
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
