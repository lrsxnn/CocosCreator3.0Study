import { Nucleon } from './Nucleon';

import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NucleonSpawner')
export class NucleonSpawner extends Component {
    @property
    timeBetweenSpawns: number = 0;
    @property
    spawnDistance: number = 0;
    @property([Prefab])
    nucleonPrefabs: Prefab[] = [];

    private _fixedTimeStep: number = 0.02;
    private _lastTime: number = 0;
    private _timeSinceLastSpawn: number = 0;
    start() {
        // [3]
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
        this._timeSinceLastSpawn += this._fixedTimeStep;
        if (this._timeSinceLastSpawn >= this.timeBetweenSpawns) {
            this._timeSinceLastSpawn -= this.timeBetweenSpawns;
            this.spawnNucleon();
        }
    }

    spawnNucleon() {
        let prefab = instantiate(this.nucleonPrefabs[Math.floor(Math.random() * this.nucleonPrefabs.length)]);
        this.node.addChild(prefab);
        prefab.setPosition(Vec3.random(new Vec3(), this.spawnDistance));
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
