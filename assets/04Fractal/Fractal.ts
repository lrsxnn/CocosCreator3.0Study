import { _decorator, Component, Node, Material, Mesh, MeshRenderer, Vec3, tween, Quat, error, Color, instantiate, CCInteger, CCFloat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Fractal')
export class Fractal extends Component {
    @property(Material)
    material: Material = null!;
    @property([Mesh])
    mesh: Mesh[] = [];

    @property
    maxDepth: number = 0;
    @property
    childScale: number = 0;
    @property({ range: [0, 1] })
    spawnProbability: number = 0;
    @property
    maxRotationSpeed: number = 0;
    @property
    maxTwist: number = 0;

    public depth: number = 0;
    public materials: Material[][] = [];
    private _rotationSpeed: number = 0;

    private _childDirections: Vec3[] = [Vec3.UP, Vec3.RIGHT, Vec3.multiplyScalar(new Vec3(), Vec3.RIGHT, -1), Vec3.FORWARD, Vec3.multiplyScalar(new Vec3(), Vec3.FORWARD, -1)];
    private _childOrientations: Quat[] = [Quat.IDENTITY, Quat.fromEuler(new Quat(), 0, 0, -90), Quat.fromEuler(new Quat(), 0, 0, 90), Quat.fromEuler(new Quat(), -90, 0, 0), Quat.fromEuler(new Quat(), 90, 0, 0)];


    start() {
        if (this.materials.length == 0) {
            this.initializeMaterials();
        }
        let meshRender = this.node.addComponent(MeshRenderer);
        meshRender.setMaterial(this.materials[this.depth][Math.floor(Math.random() * (2 - 0) + 0)], 0);
        meshRender.mesh = this.mesh[Math.floor(Math.random() * (this.mesh.length - 0) + 0)];
        if (this.depth < this.maxDepth) {
            let c = this.createChildren();
            tween(this.node)
                .delay(Math.random() * (0.5 - 0.1 + 1) + 0.1)
                .call(() => {
                    c.next()
                })
                .union()
                .repeat(this._childDirections.length)
                .start();
        }

        this._rotationSpeed = Math.floor(Math.random() * (this.maxRotationSpeed + this.maxRotationSpeed + 1) - this.maxRotationSpeed);
        this.node.rotate(Quat.fromEuler(new Quat(), Math.random() * (this.maxTwist + this.maxTwist + 1) - this.maxRotationSpeed, 0, 0))
    }

    initializeMaterials() {
        for (let i = 0; i <= this.maxDepth; i++) {
            let t = i / (this.maxDepth - 1)
            t *= t;

            this.materials[i] = [];
            let material = new Material();
            material.copy(this.material);
            this.materials[i][0] = material;
            let pass = this.materials[i][0].passes[0];
            let hColor = pass.getHandle('albedo');
            let color = new Color();
            Color.lerp(color, Color.WHITE, Color.YELLOW, t);

            if (i == this.maxDepth) {
                pass.setUniform(hColor, Color.MAGENTA);
            } else {
                pass.setUniform(hColor, color);
            }

            material = new Material();
            material.copy(this.material);
            this.materials[i][1] = material;
            pass = this.materials[i][1].passes[0];
            hColor = pass.getHandle('albedo');
            color = new Color();
            Color.lerp(color, Color.WHITE, Color.CYAN, t);

            if (i == this.maxDepth) {
                pass.setUniform(hColor, Color.RED);
            } else {
                pass.setUniform(hColor, color);
            }
        }
    }
    initialize(parent: Fractal, childIndex: number) {
        this.mesh = parent.mesh;
        this.material = parent.material;
        this.materials = parent.materials
        this.maxDepth = parent.maxDepth;
        this.depth = parent.depth + 1;
        this.childScale = parent.childScale;
        this.spawnProbability = parent.spawnProbability;
        this.maxRotationSpeed = parent.maxRotationSpeed;
        this.maxTwist = parent.maxTwist;

        let scale = new Vec3(), position = new Vec3();
        Vec3.multiplyScalar(scale, Vec3.ONE, this.childScale);
        Vec3.multiplyScalar(position, this._childDirections[childIndex], 0.5 + 0.5 * this.childScale);
        this.node.setScale(scale);
        this.node.setPosition(position)
        this.node.setRotation(this._childOrientations[childIndex]);
    }

    *createChildren() {
        for (let i = 0; i < this._childDirections.length; i++) {
            if (Math.random() < this.spawnProbability) {
                let node = new Node();
                this.node.addChild(node);
                node.addComponent(Fractal).initialize(this, i);
                yield;
            }
        }
    }

    update(dt: number) {
        this.node.rotate(Quat.fromEuler(new Quat(), 0, this._rotationSpeed * dt, 0));
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
