

import { Component, OnInit } from "@angular/core";

import { ModelAssetType } from "./model/model-asset-type";
import { ModelAssetInstance } from "./model/model-asset-instance";
import { AssetRegistryService } from "./iasset-registry.service";
import { Router } from "@angular/router";

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
selector: "asset-detail",
templateUrl: "./asset-detail.component.html",
styleUrls: ["./asset-detail.component.css"]
})

export class AssetDetail implements OnInit {

    // --------------------------------------------------------------
    // TESTING - use real asset as soon as solr-search is working ---
    private instance: ModelAssetInstance = null;
    private type : ModelAssetType = new ModelAssetType("TEST", "TEST", "TEST", "TEST", "TEST", null);
    // --------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    // Init Functions
    //-------------------------------------------------------------------------------------
    ngOnInit() {

    }

    constructor(private registryService: AssetRegistryService,
                private router: Router)
    {
        // --------------------------------------------------------------
        // TESTING ONLY - dont checkin!!!!!!!!!!!!!!!!!!!!
        this.registryService.getAllAssetInstances("12345")
            .then(instances => {
                this.instance = instances[0];
            });
        // --------------------------------------------------------------

    }

    //-------------------------------------------------------------------------------------
    // Button Operations
    //-------------------------------------------------------------------------------------
    deleteAsset(): void {
        alert("not yet implemented")
    }

    editAsset(): void {
        alert("not yet implemented")
    }

    addMaintenance(): void {
        alert("not yet implemented")
    }

    startAsset(): void {
        alert("not yet implemented")
    }

    stopAsset(): void {
        alert("not yet implemented")
    }
}
