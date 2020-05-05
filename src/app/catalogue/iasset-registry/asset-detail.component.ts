

import { Component, OnInit, Input } from "@angular/core";
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
    @Input() private instance: ModelAssetInstance;
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
    ngOnInit()
    {
        if(this.instance && this.instance.assetType != null)
        {
            this.registryService.getAssociatedTypeByName(this.instance.assetType)
            .then(assoctype => {
                this.type = assoctype;
                this.propertyNames = this.type.properties.map( item => item.name ).sort();
                this.selectedPropertyStream = this.propertyNames[0];
            });
        }
    }

    constructor(private registryService: AssetRegistryService,
                private router: Router) {

    }

    //-------------------------------------------------------------------------------------
    // handleSelectedPropertyChange
    //-------------------------------------------------------------------------------------
    handleSelectedPropertyChange(event): void {
        // TODO
    }

    //-------------------------------------------------------------------------------------
    // Delete Asset
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

    //-------------------------------------------------------------------------------------
    // Edit Asset
    //-------------------------------------------------------------------------------------
    editAsset(): void {
        alert("not yet implemented")
    }

    //-------------------------------------------------------------------------------------
    // show Maintenance entr field
    //-------------------------------------------------------------------------------------
    showMaintenance(): void {
        this.editMaintenance = true;
    }

    //-------------------------------------------------------------------------------------
    // register a maintenance
    //-------------------------------------------------------------------------------------
    addMaintenance(): void {

        var maintenance = new ModelMaintenance(this.newMaintenance.maintenanceDate,
                                              this.newMaintenance.maintenanceDuration,
                                              this.newMaintenance.maintenanceReason,
                                              this.newMaintenance.maintenanceCostPlan,
                                              this.newMaintenance.descriptionPyhsicalChanges,
                                              this.newMaintenance.descriptionSoftwareChanges,
                                              this.newMaintenance.listOfInvolvedSuppliers,
                                              this.newMaintenance.additionalText)

        this.registryService.registerMaintenance(this.instance.name, maintenance)
            .then(newAssetInstance => {
                this.instance = newAssetInstance;
                this.router.navigate(['dashboard']);
            })
            .catch(() => {
                alert("Error while removing AssetInstance.");
            });

        this.editMaintenance = false;
    }
    //-------------------------------------------------------------------------------------
    // start asset
    //-------------------------------------------------------------------------------------
    startAsset(): void {
        alert("not yet implemented")
    }

    //-------------------------------------------------------------------------------------
    // stop asset
    //-------------------------------------------------------------------------------------
    stopAsset(): void {
        alert("not yet implemented")
    }
}
