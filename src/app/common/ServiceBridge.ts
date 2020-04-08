/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { UnitService } from "./unit-service";
/**
 * This class is created to pass a global service instance to regular classes. The described fields must be instantiated via the Angular DI mechanism.
 */
export class ServiceBridge {
    private static _unitService: UnitService;


    static get unitService(): UnitService {
        if (this._unitService == null) {
            throw new Error("Unit service is not initialized yet");
        }
        return this._unitService;
    }

    static set unitService(value: UnitService) {
        this._unitService = value;
    }
}
