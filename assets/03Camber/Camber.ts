
import { _decorator, Component, Node, Prefab, instantiate, Vec3, CCInteger, Enum } from 'cc';
const { ccclass, property, integer } = _decorator;

enum GraphFunctionName {
    sineFunction,
    multiSineFunction,
    sine2DFunction,
    multiSine2DFunction,
    ripple,
    cylinder,
    sphere,
    torus,
}
Enum(GraphFunctionName);

@ccclass('Camber')
export class Camber extends Component {
    @property(Prefab)
    pointPrefab: Prefab = null!;
    @property({ type: CCInteger, range: [10, 100, 1] })
    resolution = 10;
    @property({ type: GraphFunctionName })
    graphFunctionName: GraphFunctionName = GraphFunctionName.sineFunction;


    private _points: Node[] = [];
    private _time: number = 0;
    private _graphFunction = [this.sineFunction.bind(this), this.multiSineFunction.bind(this), this.sine2DFunction.bind(this), this.multiSine2DFunction.bind(this), this.ripple.bind(this), this.cylinder.bind(this), this.sphere.bind(this), this.torus.bind(this)];
    onLoad() {
        this._points = [];
        let step = 2 / this.resolution;
        let scale = new Vec3(step, step, step)
        for (let i = 0; i < this.resolution * this.resolution; i++) {
            let point = instantiate(this.pointPrefab);
            this.node.addChild(point);
            point.scale = scale;
            this._points.push(point);
        }
    }

    update(dt: number) {
        let step = 2 / this.resolution;
        for (let i = 0, z = 0; z < this.resolution; z++) {
            let v = (z + 0.5) * step - 1;
            for (let x = 0; x < this.resolution; x++, i++) {
                let point = this._points[i];
                let u = (x + 0.5) * step - 1;
                point.setPosition(this._graphFunction[this.graphFunctionName](u, v, this._time));
            }
        }
        this._time += dt;
    }

    sineFunction(x: number, z: number, t: number): Vec3 {
        return new Vec3(x, Math.sin(Math.PI * (x + t)), z);
    }

    multiSineFunction(x: number, z: number, t: number): Vec3 {
        let y = Math.sin(Math.PI * (x + t));
        y += Math.sin(2 * Math.PI * (x + 2 * t)) / 2;
        y *= 2 / 3;
        return new Vec3(x, y, z);
    }

    sine2DFunction(x: number, z: number, t: number): Vec3 {
        let y = Math.sin(Math.PI * (x + t));
        y += Math.sin(Math.PI * (x + t));
        y *= 0.5;
        return new Vec3(x, y, z);
    }

    multiSine2DFunction(x: number, z: number, t: number): Vec3 {
        let y = 4 * Math.sin(Math.PI * (x + z + t * 0.5));
        y += Math.sin(Math.PI * (x + t));
        y += Math.sin(2 * Math.PI * (z + t * 2)) * 0.5;
        y *= 1 / 5.5;
        return new Vec3(x, y, z);
    }

    ripple(x: number, z: number, t: number): Vec3 {
        let d = Math.sqrt(x * x + z * z);
        let y = Math.sin(Math.PI * (4 * d - t));
        y /= 1 + 10 * d;
        return new Vec3(x, y, z);
    }

    cylinder(u: number, v: number, t: number): Vec3 {
        let r = 0.8 + Math.sin(Math.PI * (6 * u + 2 * v + t)) * 0.2;
        return new Vec3(r * Math.sin(Math.PI * u), v, r * Math.cos(Math.PI * u));
    }

    sphere(u: number, v: number, t: number): Vec3 {
        let r = 0.8 + Math.sin(Math.PI * (6 * u + t)) * 0.1;
        r += Math.sin(Math.PI * (4 * v + t)) * 0.1;
        let s = r * Math.cos(Math.PI * 0.5 * v);
        return new Vec3(s * Math.sin(Math.PI * u), r * Math.sin(Math.PI * 0.5 * v), s * Math.cos(Math.PI * u));
    }

    torus(u: number, v: number, t: number): Vec3 {
        let r1 = 0.65 + Math.sin(Math.PI * (6 * u + t)) * 0.1;
        let r2 = 0.2 + Math.sin(Math.PI * (4 * v + t)) * 0.05;
        let s = r2 * Math.cos(Math.PI * v) + r1;
        return new Vec3(s * Math.sin(Math.PI * u), r2 * Math.sin(Math.PI * v), s * Math.cos(Math.PI * u));
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
