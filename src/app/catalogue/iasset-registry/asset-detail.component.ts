

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
    private type : ModelAssetType = null;
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
        // FOR TESTING
        // --------------------------------------------------------------
        this.registryService.getAllAssetInstances("12345")
            .then(instances => {

                this.instance = instances[2];


                //if(this.instance.assetType != null)
                //{
                //    this.registryService.getAssociatedTypeByName(this.instance.assetType)
                //        .then(assoctype => {
                //            this.type = assoctype;
                //    });
                //}
            });
        // --------------------------------------------------------------
    }

    //-------------------------------------------------------------------------------------
    // Button Operations
    //-------------------------------------------------------------------------------------
    deleteAsset(): void {

        this.registryService.unregisterAssetInstance("12345", this.instance)
            .then(() => {
                this.router.navigate(['dashboard']);
            })
            .catch(() => {
                alert("Error while removing AssetInstance.");
            });
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
