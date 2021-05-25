
import { _decorator, Vec2, Quat, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('Utils')
export class Utils {
    /**
     * Unity Mathf.MoveTowards
     */
    public static mathfMoveTowards(current: number, target: number, maxDelta: number): number {
        if (Math.abs(target - current) <= maxDelta) {
            return target;
        }
        return current + Math.sign(target - current) * maxDelta;
    }
    /**
     * Unity Mathf.MoveTowardsAngle
     */
    public static mathfMoveTowardsAngle(current: number, target: number, maxDelta: number): number {
        let deltaAngle = this.mathfDeltaAngle(current, target);
        if (-maxDelta < deltaAngle && deltaAngle < maxDelta) {
            return target;
        }
        target = current + deltaAngle;
        return this.mathfMoveTowards(current, target, maxDelta);
    }
    /**
     * Unity Mathf.Clamp
     */
    public static mathfClamp(value: number, min: number, max: number): number {
        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        return value;
    }
    /**
     * Unity Mathf.Repeat
     */
    public static mathfRepeat(t: number, length: number): number {
        return this.mathfClamp(t - Math.floor(t / length) * length, 0, length);
    }
    /**
     * Unity Mathf.DeltaAngle
     */
    public static mathfDeltaAngle(current: number, target: number): number {
        let delta = this.mathfRepeat((target - current), 360);
        if (delta > 180) {
            delta -= 360;
        }
        return delta;
    }
    /**
     * Unity Vector2.ClampMagnitude
     */
    public static vector2ClampMagnitude(vector: Vec2, maxLength: number): Vec2 {
        let sqrMagnitude = vector.lengthSqr();
        if (sqrMagnitude > maxLength * maxLength) {
            let mag = Math.sqrt(sqrMagnitude);
            let normalized_x = vector.x / mag;
            let normalized_y = vector.y / mag;
            return new Vec2(normalized_x * maxLength, normalized_y * maxLength);
        }
        return vector;
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
