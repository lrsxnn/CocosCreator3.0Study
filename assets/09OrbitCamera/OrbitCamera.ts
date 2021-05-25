import { Utils } from './../Utils/Utils';
import { _decorator, Component, Node, Vec3, Vec2, Quat, systemEvent, SystemEventType, EventKeyboard, error, geometry, PhysicsSystem, Camera } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

const VEC3_BACK = Vec3.FORWARD.clone().negative();//Unity Forward

@ccclass('OrbitCamera')
@executeInEditMode
export class OrbitCamera extends Component {
    private _minVerticalAngle = -60;
    private _maxVerticalAngle = 30;

    @property(Node)
    focus: Node = null!;
    @property
    distance = 5;
    @property({ min: 0 })
    focusRadius = 1;
    @property({ range: [0, 1, 0.001], slide: true })
    focusCentering = 0.75;
    @property({ range: [1, 360, 0.001], slide: true })
    rotationSpeed = 90;
    @property({ range: [-90, 90] })
    get minVerticalAngle() {
        return this._minVerticalAngle;
    }
    set minVerticalAngle(value: number) {
        this._minVerticalAngle = value;
        if (EDITOR) {
            if (this.maxVerticalAngle < this.minVerticalAngle) {
                this.maxVerticalAngle = this.minVerticalAngle;
            }
        }
    }
    @property({ range: [-90, 90] })
    get maxVerticalAngle() {
        return this._maxVerticalAngle;
    }
    set maxVerticalAngle(value: number) {
        this._maxVerticalAngle = value;
        if (EDITOR) {
            if (this.maxVerticalAngle < this.minVerticalAngle) {
                this.minVerticalAngle = this.maxVerticalAngle;
            }
        }
    }
    @property({ min: 0 })
    alignDelay = 5;
    @property({ range: [0, 90, 0.001], slide: true })
    alignSmoothRange = 45;
    @property(Camera)
    regularCamera: Camera = null!;

    get cameraHalfExtends() {
        let halfExtends = new Vec3();
        halfExtends.y = this.regularCamera.near * Math.tan(0.5 * Math.PI / 180 * this.regularCamera.fov);
        halfExtends.x = halfExtends.y * this.regularCamera.camera.aspect;
        halfExtends.z = 0;
        return halfExtends;
    }

    private _axisHorizontal = 0;
    private _axisVertical = 0;
    private _iDown: boolean = false;
    private _kDown: boolean = false;
    private _jDown: boolean = false;
    private _lDown: boolean = false;
    private _uDown: boolean = false;
    private _oDown: boolean = false;
    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;

    private _focusPoint: Vec3 = new Vec3();
    private _previousFocusPoint: Vec3 = new Vec3();
    private _orbitAngles: Vec2 = new Vec2(-45, 0);
    private _lastManualRotationTime = 0;

    onLoad() {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        this._focusPoint = this.focus.position.clone();
        this.node.setRotation(Quat.fromEuler(new Quat(), this._orbitAngles.x, this._orbitAngles.y, 0));
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case 73://i
                this._iDown = true;
                break;
            case 75://k
                this._kDown = true;
                break;
            case 74://j
                this._jDown = true;
                break;
            case 76://l
                this._lDown = true;
                break;
            case 85://u
                this._uDown = true;
                break;
            case 79://o
                this._oDown = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case 73://i
                this._iDown = false;
                break;
            case 75://k
                this._kDown = false;
                break;
            case 74://j
                this._jDown = false;
                break;
            case 76://l
                this._lDown = false;
                break;
            case 85://u
                this._uDown = false;
                break;
            case 79://o
                this._oDown = false;
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
    }

    fixedUpdate() {
        if (this._iDown) {
            this._axisVertical -= 0.05;
            if (this._axisVertical <= -1) {
                this._axisVertical = -1;
            }
        } else if (this._kDown) {
            this._axisVertical += 0.05;
            if (this._axisVertical >= 1) {
                this._axisVertical = 1;
            }
        } else {
            this._axisVertical = 0;
        }

        if (this._jDown) {
            this._axisHorizontal -= 0.05;
            if (this._axisHorizontal <= -1) {
                this._axisHorizontal = -1;
            }
        } else if (this._lDown) {
            this._axisHorizontal += 0.05;
            if (this._axisHorizontal >= 1) {
                this._axisHorizontal = 1;
            }
        } else {
            this._axisHorizontal = 0;
        }
    }

    lateUpdate(dt: number) {
        this.updateFocusPoint(dt);
        let lookRotation = new Quat();
        if (this.manualRotation(dt) || this.automaticRotation(dt)) {
            this.constrainAngles();
            Quat.fromEuler(lookRotation, this._orbitAngles.x, this._orbitAngles.y, 0);
        } else {
            lookRotation = this.node.rotation;
        }

        let lookDirection = Vec3.transformQuat(new Vec3(), Vec3.FORWARD, lookRotation);
        let lookPosition = new Vec3();
        Vec3.subtract(lookPosition, this._focusPoint, Vec3.multiplyScalar(new Vec3(), lookDirection, this.distance));

        // let outRay = geometry.Ray.create(this._focusPoint.x, this._focusPoint.y, this._focusPoint.z, -lookDirection.x, -lookDirection.y, -lookDirection.z)
        // if (PhysicsSystem.instance.raycastClosest(outRay, 0xffffffff, this.distance)) {
        //     let raycastClosest = PhysicsSystem.instance.raycastClosestResult;
        //     Vec3.subtract(lookPosition, this._focusPoint, Vec3.multiplyScalar(new Vec3(), lookDirection, raycastClosest.distance));
        // }

        this.node.setPosition(lookPosition);
        this.node.setRotation(lookRotation);
    }

    updateFocusPoint(dt: number) {
        this._previousFocusPoint = this._focusPoint.clone();
        let targetPoint = this.focus.position.clone();
        if (this.focusRadius > 0) {
            let distance = Vec3.distance(targetPoint, this._focusPoint);
            let t = 1;
            if (distance > 0.01 && this.focusCentering > 0) {
                t = Math.pow(1 - this.focusCentering, dt);
            }
            if (distance > this.focusRadius) {
                // Vec3.lerp(this._focusPoint, targetPoint, this._focusPoint, this.focusRadius / distance);
                t = Math.min(t, this.focusRadius / distance);
            }
            Vec3.lerp(this._focusPoint, targetPoint, this._focusPoint, t);
        } else {
            this._focusPoint = targetPoint;
        }
    }

    manualRotation(dt: number): boolean {
        let input = new Vec2(this._axisVertical, this._axisHorizontal);
        const e = 0.001;
        if (input.x < -e || input.x > e || input.y < -e || input.y > e) {
            this._orbitAngles.add(Vec2.multiplyScalar(new Vec2(), input, this.rotationSpeed * dt));
            this._lastManualRotationTime = new Date().getTime();
            return true;
        }
        return false;
    }

    constrainAngles() {
        this._orbitAngles.x = Utils.mathfClamp(this._orbitAngles.x, this.minVerticalAngle, this.maxVerticalAngle);

        if (this._orbitAngles.y < 0) {
            this._orbitAngles.y += 360;
        } else if (this._orbitAngles.y >= 360) {
            this._orbitAngles.y -= 360;
        }
    }

    automaticRotation(dt: number): boolean {
        if (new Date().getTime() - this._lastManualRotationTime < this.alignDelay) {
            return false;
        }
        let movement = new Vec2(this._focusPoint.x - this._previousFocusPoint.x, this._focusPoint.z - this._previousFocusPoint.z);
        let movementDeltaSqr = movement.lengthSqr();
        if (movementDeltaSqr < 0.00001) {
            return false;
        }
        let headingAngle = this.getAngle(movement.multiplyScalar(1 / Math.sqrt(movementDeltaSqr)));
        let deltaAbs = Math.abs(Utils.mathfDeltaAngle(this._orbitAngles.y, headingAngle));
        let rotationChange = this.rotationSpeed * Math.min(dt, movementDeltaSqr);
        if (deltaAbs < this.alignSmoothRange) {
            rotationChange *= deltaAbs / this.alignSmoothRange;
        } else if (180 - deltaAbs < this.alignSmoothRange) {
            rotationChange += (180 - deltaAbs) / this.alignSmoothRange;
        }
        this._orbitAngles.y = Utils.mathfMoveTowardsAngle(this._orbitAngles.y, headingAngle, rotationChange);
        return true;
    }

    getAngle(direction: Vec2): number {
        let angle = Math.acos(-direction.y) * 180 / Math.PI;
        return direction.x > 0 ? 360 - angle : angle;
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
