import {AdditionalItemProperty} from "./publish/additional-item-property";
import {Identifier} from "./publish/identifier";
import {BinaryObject} from "./publish/binary-object";
/**
 * Created by suat on 05-Jul-17.
 */
export class ModelUtil {
    public static createAdditionalItemProperty(): AdditionalItemProperty {
        let id:Identifier = new Identifier(this.generateUUID(), null, null);

        new AdditionalItemProperty(id, "", [""], new Array<BinaryObject>(), "", "", "STRING", null, null);
        return null;
    }

    private static generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };
}
