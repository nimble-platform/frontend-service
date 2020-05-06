/*
 * Copyright 2020
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

import { Component, OnInit } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: "platform-members",
    templateUrl: "./platform-members.component.html",
    styleUrls: ["./platform-members.component.css"]
})
export class PlatformMembersComponent implements OnInit {

    size = 12;

    constructor(
        private translate: TranslateService,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params["size"]) {
                this.size = params["size"];
            }
        });
    }

}
