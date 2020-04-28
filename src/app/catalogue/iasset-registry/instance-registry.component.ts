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
import { FormGroup } from "@angular/forms";
import { PublishMode } from "../model/publish/publish-mode";
import { ModelAssetType } from "./model/model-asset-type";
import { ModelAssetInstance } from "./model/model-asset-instance";
import { AssetImageLoader } from './image-loader.component';
import { BinaryObject } from '../model/publish/binary-object';
import { AssetRegistryService } from "./iasset-registry.service";
import { Router } from "@angular/router";

class NewAssetInstance {
constructor(
        public name: string,
        public assetType: string,
        public serialNumber: string,
        public currentLocation: string,
        public originalLocation: string,
        public listMaintenance: string,
        public listAvailableProperties: string,
        public ownerProperty: string,
        public assetImages: BinaryObject[]
    )
    {
        this.assetImages = [];
    }
}

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
selector: "instance-registry",
templateUrl: "./instance-registry.component.html",
styleUrls: ["./instance-registry.component.css"]
})

export class AssetInstanceRegistry implements OnInit {

    private publishMode: PublishMode;
    private publishingGranularity: "manually" | "automatically" = "manually";
    private newAssetInstance: NewAssetInstance = new NewAssetInstance(null, null, null, null, null, null, null, null, null);
    private publishForm: FormGroup = new FormGroup({});

    private registeredAssetTypes: ModelAssetType[] = [];  // all registered asset types
    private allTypeNames: String[] = [];  // the names of all registered asset types

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
    // add asset instance
    //-------------------------------------------------------------------------------------
    addAssetInstance(): void {

        var instance = new ModelAssetInstance(this.newAssetInstance.name,
                                              this.newAssetInstance.assetType,
                                              this.newAssetInstance.serialNumber,
                                              this.newAssetInstance.currentLocation,
                                              this.newAssetInstance.originalLocation,
                                              this.newAssetInstance.listMaintenance,
                                              this.newAssetInstance.listAvailableProperties,
                                              this.newAssetInstance.ownerProperty,
                                              this.newAssetInstance.assetImages)

        // add to backend
        this.registryService.registerAssetInstance("12345", instance)
            .then(addedAssetInstance => {
                this.router.navigate(['dashboard']);
            })
            .catch(() => {
                alert("Error while adding AssetInstance.");
            });
    }

    //-------------------------------------------------------------------------------------
    // Init Functions
    //-------------------------------------------------------------------------------------
    ngOnInit() {

    }

    constructor(private registryService: AssetRegistryService,
                private router: Router)
    {
        // get all registered types
        this.registryService.getAllAssetTypes("12345")
            .then(types => {
                this.registeredAssetTypes = types;
                this.allTypeNames = types.map( item => item.name );
            });
    }
}
