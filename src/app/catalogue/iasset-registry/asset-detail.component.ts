

import { Component, OnInit } from "@angular/core";

import { ModelAssetType } from "./model/model-asset-type";
import { ModelAssetInstance } from "./model/model-asset-instance";
import { ModelMaintenance } from "./model/model-maintenance";
import { AssetRegistryService } from "./iasset-registry.service";
import { Router } from "@angular/router";

class NewMaintenance {
constructor(
        public maintenanceDate: string,
        public maintenanceDuration: string,
        public maintenanceReason: string,
        public maintenanceCostPlan: string,
        public descriptionPyhsicalChanges: string,
        public descriptionSoftwareChanges: string,
        public listOfInvolvedSuppliers: string,
        public additionalText: string
    ) {}
}

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
selector: "asset-detail",
templateUrl: "./asset-detail.component.html",
styleUrls: ["./asset-detail.component.css"]
})

export class AssetDetail implements OnInit {

    // essential view members
    private instance: ModelAssetInstance = null; // TESTING - use @Input as soon as solr-search is working
    private type : ModelAssetType = new ModelAssetType("", "", "", "", "", null);

    // property display members
    private propertyNames : string[] = [];
    private selectedPropertyStream: string = "";

    // maintenance members
    private editMaintenance: boolean = false;
    private newMaintenance: NewMaintenance = new NewMaintenance(null, null, null, null, null, null, null, null);


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
                this.instance = instances[0];

                if(this.instance.assetType != null)
                {
                    this.registryService.getAssociatedTypeByName(this.instance.assetType)
                        .then(assoctype => {
                            this.type = assoctype;
                            this.propertyNames = this.type.properties.map( item => item.name ).sort();
                            this.selectedPropertyStream = this.propertyNames[0];
                    });
                }
            });
        // --------------------------------------------------------------
    }

    //-------------------------------------------------------------------------------------
    // handleSelectedPropertyChange
    //-------------------------------------------------------------------------------------
    handleSelectedPropertyChange(event): void {
        // TODO
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

    showMaintenance(): void {
        this.editMaintenance = true;
    }

    addMaintenance(): void {
        // TODO
        this.editMaintenance = false;
    }

    startAsset(): void {
        alert("not yet implemented")
    }

    stopAsset(): void {
        alert("not yet implemented")
    }
}
