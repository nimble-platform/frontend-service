/*
* Copyright 2020
* SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { PublishMode } from "../model/publish/publish-mode";
import { ModelAssetType } from "./model/model-asset-type";

class NewAssetType {
constructor(
        public name: string,
        public shortID: string,
        public semanticID: number,
        public description: string,
        public certificate: string,
        public properties: string
    ) {}
}

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
selector: "type-registry",
templateUrl: "./type-registry.component.html",
styleUrls: ["./type-registry.component.css"]
})

export class AssetTypeRegistry implements OnInit {

    private publishMode: PublishMode;
    private publishingGranularity: "manually" | "automatically" = "manually";
    private newAssetType: NewAssetType = new NewAssetType(null, null, null, null, null, null);

    //-------------------------------------------------------------------------------------
    // canDeactivate
    //-------------------------------------------------------------------------------------
    canDeactivate(): boolean {
            return true;
    }

    //-------------------------------------------------------------------------------------
    // onSelectTab
    //-------------------------------------------------------------------------------------
    onSelectTab(event: any, id: any) {
        event.preventDefault();
        if (id === "singleUpload") {
            this.publishingGranularity = "manually";
        } else {
            this.publishingGranularity = "automatically";
        }
    }

    //-------------------------------------------------------------------------------------
    // Init Functions
    //-------------------------------------------------------------------------------------
    ngOnInit() {

    }

    constructor() {

    }
}
