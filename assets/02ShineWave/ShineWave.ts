
import { _decorator, Component, Node, Prefab, instantiate, Vec3, CCInteger } from 'cc';
const { ccclass, property, integer } = _decorator;

@ccclass('ShineWave')
export class ShineWave extends Component {
    @property(Prefab)
    pointPrefab: Prefab = null!;
    @property({ type: CCInteger, range: [10, 100, 1] })
    resolution = 10;

    private _points: Node[] = [];
    private _time:number = 0;
    onLoad() {
        this._points = [];
        let step = 2 / this.resolution;
        let position = new Vec3();
        position.z = 0;
        let scale = new Vec3(step, step, step)
        for (let i = 0; i < this.resolution; i++) {
            let point = instantiate(this.pointPrefab);
            this.node.addChild(point);
            position.x = (i + 0.5) * step - 1;
            position.y = position.x * position.x * position.x;
            point.position = position;
            point.scale = scale;

            this._points.push(point);
        }
    }

    update(dt: number) {
        for (let i = 0; i < this._points.length; i++) {
            let point = this._points[i];
            let position = point.position.clone();
            position.y = Math.sin(Math.PI * (position.x + this._time));
            point.setPosition(position);
        }
        this._time += dt;
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
