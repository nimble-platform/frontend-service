/**
 * Created by suat on 17-Apr-19.
 */

import {UnitService} from "./unit-service";
/**
 * This class is created to pass a global service instance to regular classes. The described fields must be instantiated via the Angular DI mechanism.
 */
export class ServiceBridge {
    private static _unitService: UnitService;


    static get unitService(): UnitService {
        if(this._unitService == null) {
            throw new Error("Unit service is not initialized yet");
        }
        return this._unitService;
    }

    static set unitService(value: UnitService) {
        this._unitService = value;
    }
}