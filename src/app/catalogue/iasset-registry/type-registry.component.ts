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
import { ModelProperty } from "./model/model-property";
import { AssetRegistryService } from "./iasset-registry.service";

class NewAssetType {
constructor(
        public name: string,
        public shortID: string,
        public semanticID: string,
        public description: string,
        public certificate: string,
        public properties: ModelProperty[]
    )
    {
        this.properties = [];
    }
}

class NewProperty {
constructor(
        public name: string,
        public shortID: string,
        public semanticID: string,
        public description: string,
        public dataSpecification: string,
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
    private newProperty: NewProperty = new NewProperty(null, null, null, null, null, null);

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
    // add a property
    //-------------------------------------------------------------------------------------
    addProperty(): void {

        this.newAssetType.properties.push(new ModelProperty(this.newProperty.name,
                                                            this.newProperty.shortID,
                                                            this.newProperty.semanticID,
                                                            this.newProperty.description,
                                                            this.newProperty.dataSpecification,
                                                            this.newProperty.properties));
    }

    //-------------------------------------------------------------------------------------
    // remove a property
    //-------------------------------------------------------------------------------------
    removeProperty(property: ModelProperty): void {

        const index = this.newAssetType.properties.indexOf(property, 0);
        if (index > -1) {
            this.newAssetType.properties.splice(index, 1);
        }
    }

    //-------------------------------------------------------------------------------------
    // add asset type
    //-------------------------------------------------------------------------------------
    addAssetType(): void {

        // TODO: post request to register asset with all properties
        alert("Not yet implemented!");
    }

    //-------------------------------------------------------------------------------------
    // Init Functions
    //-------------------------------------------------------------------------------------
    ngOnInit() {

    }

    constructor() {

    }
}
