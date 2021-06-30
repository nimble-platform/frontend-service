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

import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {config} from '../../globals';

@Pipe({name: 'userRoleTranslate'})
export class UserRoleTranslatePipe implements PipeTransform {

    constructor(private translateService: TranslateService) {
    }

    transform(userRole: string): string {
        if(config.replaceLegalRepresentativeWithCompanyAdmin && (userRole === "Legal Representative" || userRole === "legal_representative")){
            return this.translateService.instant("Company Admin");
        }
        return this.translateService.instant(userRole);
    }
}
