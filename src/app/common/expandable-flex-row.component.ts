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

import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "expandable-flex-row",
    templateUrl: "./expandable-flex-row.component.html",
})
export class ExpandableFlexRow {

    @Input() content: string[] = [];
    @Input() shrinkElementSize = 2;
    expanded:boolean = false;


}
