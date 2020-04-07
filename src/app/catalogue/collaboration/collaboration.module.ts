/*
 * Copyright 2020
 * DOMINA - Organization and Logistics; Biella; Italy
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CollaborationViewComponent } from "./collaboration-view.component";
import { AppCommonModule } from "../../common/common.module";
import { UserMgmtModule } from "../../user-mgmt/user-mgmt.module";

@NgModule({
	imports: [CommonModule,
		AppCommonModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
        UserMgmtModule,
		NgbModule.forRoot()
	],
    declarations: [
        CollaborationViewComponent
    ],
    exports: [
        CollaborationViewComponent
    ],
    providers: []
})
export class CollaborationModule {}
