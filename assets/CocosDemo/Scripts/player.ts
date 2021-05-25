import { _decorator, Component, Node, SkeletalAnimation, systemEvent, SystemEventType, EventKeyboard, Vec3, log, find, Quat, EventMouse } from 'cc';
const { ccclass, property } = _decorator;
import { Ccos } from '../cocos/ccos';

enum PlayerState {
    STAND,
    WALK,
    RUN,
    JUMP,
    ATTACK,
    SHOOT
};

const VEC3_UNIT_X_2 = Vec3.clone(Vec3.UNIT_X).multiplyScalar(2);
const VEC3_UNIT_Z_2 = Vec3.clone(Vec3.UNIT_Z).multiplyScalar(2);
const VEC3_UNIT_X = Vec3.clone(Vec3.UNIT_X);
const VEC3_UNIT_Z = Vec3.clone(Vec3.UNIT_Z);
const VEC3_UNIT_Y_3 = Vec3.clone(Vec3.UNIT_Y).multiplyScalar(3);

let worldVec3 = new Vec3();
let bulletVec3 = new Vec3();

@ccclass('Player')
export class Player extends Component {
    @property(Node)
    public playerNode: Node = null!;
    @property(Ccos)
    public player: Ccos = null!;
    @property(SkeletalAnimation)
    public playerAnimation: SkeletalAnimation = null!;
    @property(Node)
    public camera: Node = null!;

    private _mouseDown = false;

    private _curPos: Vec3 = new Vec3();
    private _cameraPos: Vec3 = new Vec3();
    private _cameraRotation: Vec3 = new Vec3();

    private _wDown: boolean = false;
    private _sDown: boolean = false;
    private _aDown: boolean = false;
    private _dDown: boolean = false;
    private _shiftDown: boolean = false;
    private _spaceDown: boolean = false;
    private _uDown: boolean = false;
    private _iDown: boolean = false;

    private _playerState: PlayerState = PlayerState.STAND;

    private _tempTime: number = 0;
    onLoad() {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        systemEvent.on(SystemEventType.MOUSE_DOWN, this.onMouseDown, this);
        systemEvent.on(SystemEventType.MOUSE_LEAVE, this.onMouseUp, this);
        systemEvent.on(SystemEventType.MOUSE_UP, this.onMouseUp, this);
        systemEvent.on(SystemEventType.MOUSE_MOVE, this.onMouseMove, this);
        systemEvent.on(SystemEventType.MOUSE_WHEEL, this.onMouseWheel, this);

        this.camera.setPosition(new Vec3(0, 2, -12));

    }

    onMouseDown(event: EventMouse) {
        this._mouseDown = true;
    }
    onMouseUp(event: EventMouse) {
        this._mouseDown = false;
    }
    onMouseMove(event: EventMouse) {
        if (this._mouseDown) {
            let deltaX = event.getLocation().x - event.getPreviousLocation().x;
            let deltaY = event.getLocation().y - event.getPreviousLocation().y;

            this._cameraRotation = this.camera.eulerAngles;
            this.camera.getPosition(this._cameraPos);

            if (deltaX < 0) {//左移
                Vec3.subtract(this._cameraRotation, this._cameraRotation, Vec3.UNIT_Y);
                Vec3.rotateY(this._cameraPos, this._cameraPos, this.player.node.position, 1);
            } else if (deltaX > 0) {
                Vec3.add(this._cameraRotation, this._cameraRotation, Vec3.UNIT_Y);
                Vec3.rotateY(this._cameraPos, this._cameraPos, this.player.node.position, -1);
            }

            // if (deltaY < 0) {
            //     Vec3.add(this._cameraRotation, this._cameraRotation, Vec3.UNIT_X);
            //     Vec3.rotateX(this._cameraPos, this._cameraPos, this.player.node.position, -1);
            // } else if (deltaY > 0) {//上移
            //     Vec3.subtract(this._cameraRotation, this._cameraRotation, Vec3.UNIT_X);
            //     Vec3.rotateX(this._cameraPos, this._cameraPos, this.player.node.position, 1);
            // }

            this.camera.eulerAngles = this._cameraRotation;
            this.camera.setPosition(this._cameraPos);

        }
    }
    onMouseWheel(event: EventMouse) {
        this.camera.getPosition(this._cameraPos);
        if (event.getScrollY() < 0) {
            Vec3.subtract(this._cameraPos, this._cameraPos, Vec3.UNIT_Z);
        } else {
            Vec3.add(this._cameraPos, this._cameraPos, Vec3.UNIT_Z)
        }
        if (this._cameraPos.z >= -2) {
            this._cameraPos.z = -2;
        } else if (this._cameraPos.z <= -30) {
            this._cameraPos.z = -30;
        }
        this.camera.setPosition(this._cameraPos);
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
            case 16://shift
                this._shiftDown = true;
                break;
            case 85://u
                this._uDown = true;
                break;
            case 73://i
                this._iDown = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        log(`${event.keyCode}`);
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
            case 32://space
                this._spaceDown = false;
                break;
            case 16://shift
                this._shiftDown = false;
                break;
            case 85://u
                this._uDown = false;
                break;
            case 73://i
                this._iDown = false;
                break;
            case 72://h
                this.camera.lookAt(this.player.node.position);
                break;
        }
    }

    private playerStand() {
        this._playerState = PlayerState.STAND;
        this.playerAnimation.play('cocos_anim_idle');
    }

    private playerWalk() {
        this._playerState = PlayerState.WALK;
        this.playerAnimation.play('cocos_anim_walk');
    }

    private playerRun() {
        this._playerState = PlayerState.RUN;
        this.playerAnimation.play('cocos_anim_run');
    }

    private playerJump() {
        this._playerState = PlayerState.JUMP;
        this.playerAnimation.play('cocos_anim_jump');
    }

    private playerAttack() {
        this._playerState = PlayerState.ATTACK;
        this.playerAnimation.play('cocos_anim_attack');
    }

    private playerShoot() {
        this._playerState = PlayerState.SHOOT;
        this.playerAnimation.play('cocos_anim_shoot');
    }

    update(dt: number) {
        if (this._tempTime > 0.05) {
            this._tempTime = 0;
            this.updatePlayer();
        } else {
            this._tempTime += dt;
        }
    }

    private updatePlayer() {
        if (this._uDown || this._iDown) {
            if (this._uDown) {
                if (!this.player.isJump() && !this.player.isAttack() && !this.player.isShoot()) {
                    this.playerAttack();
                }
            } else if (this._iDown) {
                if (!this.player.isJump() && !this.player.isAttack() && !this.player.isShoot()) {
                    this.playerShoot();
                }
            }
        } else if (this._wDown || this._sDown || this._aDown || this._dDown || this._spaceDown || this._shiftDown) {
            if (this.player.canMove()) {
                this.playerNode.getPosition(this._curPos);

                if (this._wDown && !this._sDown) {
                    if (this._shiftDown) {
                        Vec3.add(this._curPos, this._curPos, VEC3_UNIT_Z_2);
                    } else {
                        Vec3.add(this._curPos, this._curPos, VEC3_UNIT_Z);
                    }
                }
                if (this._sDown && !this._wDown) {
                    if (this._shiftDown) {
                        Vec3.subtract(this._curPos, this._curPos, VEC3_UNIT_Z_2);
                    } else {
                        Vec3.subtract(this._curPos, this._curPos, VEC3_UNIT_Z);
                    }
                }
                if (this._aDown && !this._dDown) {
                    if (this._shiftDown) {
                        Vec3.add(this._curPos, this._curPos, VEC3_UNIT_X_2);
                    } else {
                        Vec3.add(this._curPos, this._curPos, VEC3_UNIT_X);
                    }
                }
                if (this._dDown && !this._aDown) {
                    if (this._shiftDown) {
                        Vec3.subtract(this._curPos, this._curPos, VEC3_UNIT_X_2);
                    } else {
                        Vec3.subtract(this._curPos, this._curPos, VEC3_UNIT_X);
                    }
                }

                if (this._wDown && !this._aDown && !this._dDown && !this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 0, 0);
                } if (this._wDown && this._aDown && !this._dDown && !this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 45, 0);
                } if (!this._wDown && this._aDown && !this._dDown && !this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 90, 0);
                } if (!this._wDown && this._aDown && !this._dDown && this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 135, 0);
                } if (!this._wDown && !this._aDown && !this._dDown && this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 180, 0);
                } if (!this._wDown && !this._aDown && this._dDown && this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 225, 0);
                } if (!this._wDown && !this._aDown && this._dDown && !this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 270, 0);
                } if (this._wDown && !this._aDown && this._dDown && !this._sDown) {
                    this.player.node.eulerAngles = new Vec3(0, 315, 0);
                }

                if (this._spaceDown) {
                    if (!this.player.isJump()) {
                        this.playerJump();
                    }
                } else {
                    if (!this.player.isJump()) {
                        if (this._shiftDown && this._playerState !== PlayerState.RUN) {
                            this.playerRun();
                        } else if (!this._shiftDown && this._playerState !== PlayerState.WALK) {
                            this.playerWalk();
                        }
                    }

                }

                this.playerNode.setPosition(this._curPos);
            }
        } else {
            if (this._playerState !== PlayerState.STAND && !this.player.isJump() && !this.player.isAttack() && !this.player.isShoot()) {
                this.playerStand();
            }
        }
    }
}
