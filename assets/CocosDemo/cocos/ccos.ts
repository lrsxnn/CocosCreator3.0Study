
import { _decorator, Component, Node, SkeletalAnimation, error, Prefab, instantiate, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Ccos')
export class Ccos extends Component {
    @property(Node)
    bullet: Node = null!;
    @property(Node)
    worldContent: Node = null!;

    private _isJump = false;
    private _isAttack = false;
    private _isShoot = false;
    private _canMove = true;

    private _worldVec3 = new Vec3();

    onLoad() {
        this._isJump = false;
        this._isAttack = false;
        this._isShoot = false;
        this._canMove = true;

        const animationComponent = this.node.getComponent(SkeletalAnimation);
        if (animationComponent) {
            const jumpClip = animationComponent.clips[4];
            if (jumpClip) {
                jumpClip.events.push({
                    frame: 0,
                    func: 'onStartJump',
                    params: [],
                });
                jumpClip.events.push({
                    frame: 1.13,
                    func: 'onStopMove',
                    params: [],
                });
                jumpClip.events.push({
                    frame: 1.66,
                    func: 'onEndJump',
                    params: [],
                });
                jumpClip.updateEventDatas();
            }

            const attackClip = animationComponent.clips[1];
            if (attackClip) {
                attackClip.events.push({
                    frame: 0,
                    func: 'onStartAttack',
                    params: [],
                });
                attackClip.events.push({
                    frame: 1.32,
                    func: 'onEndAttack',
                    params: [],
                });
                attackClip.updateEventDatas();
            }

            const shootClip = animationComponent.clips[6];
            if (shootClip) {
                shootClip.events.push({
                    frame: 0,
                    func: 'onStartShoot',
                    params: [],
                });
                shootClip.events.push({
                    frame: 0.40,
                    func: 'onCreateBullet',
                    params: [],
                });
                shootClip.events.push({
                    frame: 0.60,
                    func: 'onCreateBullet',
                    params: [],
                });
                shootClip.events.push({
                    frame: 1.30,
                    func: 'onEndShoot',
                    params: [],
                });
                shootClip.updateEventDatas();
            }
        }

    }

    onStartJump() {
        this._isJump = true;
        this._canMove = true;
    }

    isJump(): boolean {
        return this._isJump;
    }

    onEndJump() {
        this._isJump = false;
        this._canMove = true;
    }

    onStartAttack() {
        this._isAttack = true;
        this._canMove = false;
    }

    isAttack(): boolean {
        return this._isAttack;
    }

    onEndAttack() {
        this._isAttack = false;
        this._canMove = true;
    }

    onStartShoot() {
        this._isShoot = true;
        this._canMove = false;
    }

    isShoot(): boolean {
        return this._isShoot;
    }

    onEndShoot() {
        this._isShoot = false;
        this._canMove = true;
    }

    onStopMove() {
        this._canMove = false;
    }

    canMove() {
        return this._canMove;
    }

    onCreateBullet() {
        let bullet = instantiate(this.bullet);
        bullet.active = true;
        this.worldContent.addChild(bullet);
        this.bullet.getWorldPosition(this._worldVec3);
        bullet.setPosition(this._worldVec3);
        // bullet.getComponent(RigidBody)!.setLinearVelocity(Vec3.UNIT_Z);
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
