
import { Component, OnInit } from "@angular/core";
import { ModelAssetInstance } from "./model/model-asset-instance";
import { AssetDetail } from "./asset-detail.component";
import { AssetRegistryService } from "./iasset-registry.service";
import { Router } from "@angular/router";

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
// TODO:
// this component can be removed or adapted as soon as
// SOLR-search i running (see: simple-search.component)
//-------------------------------------------------------------------------------------
@Component({
selector: "asset-search",
templateUrl: "./asset-search.component.html",
styleUrls: ["./asset-search.component.css"]
})

export class AssetSearch implements OnInit {

    private instances: ModelAssetInstance[] = [];

    private selectedInstance: ModelAssetInstance = null;

    //-------------------------------------------------------------------------------------
    // Init Functions
    //-------------------------------------------------------------------------------------
    ngOnInit() {

    }

    constructor(private registryService: AssetRegistryService,
                private router: Router) {

        this.registryService.getAllAssetInstances("12345")
            .then(instances => {
                this.instances = instances;
            });
    }

    //-------------------------------------------------------------------------------------
    // selectInstance
    //-------------------------------------------------------------------------------------
    selectInstance(instance: ModelAssetInstance) : void {

        this.selectedInstance = instance;
    }
}