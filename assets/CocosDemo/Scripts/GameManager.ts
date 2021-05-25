import { PlayerController } from './PlayerController';
// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { _decorator, Component, Prefab, instantiate, Node, CCInteger, Vec3, Game, Label } from 'cc';
const { ccclass, property } = _decorator;

enum BlockType {
    BT_NONE,
    B_STONE,
};

enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    public cubePrfb: Prefab = null!;
    @property(CCInteger)
    public roadLength: Number = 50;
    @property(PlayerController)
    public playerCtrl: PlayerController = null!;
    @property(Node)
    public startMenu: Node = null!;
    @property(Label)
    public stepsLabel: Label = null!;


    private _road: number[] = [];
    private _curState: GameState = GameState.GS_INIT;

    start() {
        this.curState = GameState.GS_INIT;
        this.playerCtrl.node.on('JumpEnd', this.onPlayerJumpEnd, this);
    }

    init() {
        this.startMenu.active = true;
        this.generateRoad();
        this.playerCtrl.reset();
        this.playerCtrl.setInputActive(false);
        this.playerCtrl.node.setPosition(new Vec3(0, 1, 0));
    }

    set curState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                this.startMenu.active = false;
                this.stepsLabel.string = '0';
                setTimeout(() => {
                    this.playerCtrl.setInputActive(true);
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
        this._curState = value;
    }

    checkResult(moveIndex: number) {
        if (moveIndex <= this.roadLength) {
            if (this._road[moveIndex] === BlockType.BT_NONE) {
                this.curState = GameState.GS_INIT;
            }
        } else {
            this.curState = GameState.GS_INIT;
        }
    }

    generateRoad() {
        this.node.removeAllChildren();
        this._road = [];

        this._road.push(BlockType.B_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.B_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let i = 0; i < this._road.length; i++) {
            let block: Node | null = this.spwanBlockByType(this._road[i]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(i, -0.5, 0);
            }
        }
    }

    spwanBlockByType(type: BlockType): Node | null {
        let block: Node | null = null;
        switch (type) {
            case BlockType.B_STONE:
                block = instantiate(this.cubePrfb);
                break;
        }

        return block;
    }

    onStartButtonClicked() {
        this.curState = GameState.GS_PLAYING;
    }

    onPlayerJumpEnd(moveIndex: number) {
        this.stepsLabel.string = moveIndex.toString();
        this.checkResult(moveIndex);
    }
}
