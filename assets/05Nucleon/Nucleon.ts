
import { _decorator, Component, Node, RigidBody, error, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Nucleon')
export class Nucleon extends Component {
    @property
    attractionForce: number = 0;

    private body: RigidBody = null!;
    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;

    onLoad() {
        this.body = this.getComponent(RigidBody)!;
    }

    start() {

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
        this.body.applyForce(Vec3.multiplyScalar(new Vec3(), this.node.position, -this.attractionForce));
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
