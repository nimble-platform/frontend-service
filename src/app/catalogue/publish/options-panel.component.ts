import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: "options-panel",
    templateUrl: "./options-panel.component.html"
})
export class OptionsPanelComponent implements OnInit{

    constructor() {
    }

    // inputs
    @Input() title;
    @Input() selectedTab;
    @Input() nameDescriptionPanel = true;
    // variables

    options = [];

    ngOnInit(){

        // set options according to the selected tab
        if(this.selectedTab == "WAREHOUSING")
            this.options = ["Deposit","Inventory management","Inventory control","Expiration/obsolescence control"];
        else if(this.selectedTab == "ORDERPICKING")
            this.options = ["Order preparation", "Replenishment of order","Labelling","Packaging"];
        else if(this.selectedTab == "REVERSELOGISTICS")
            this.options = ["Product disassembly","Reverse product transport","Reverse packaging/unit load transport","Money refund to customer"];
        else if(this.selectedTab == "INHOUSESERVICES")
            this.options = ["Reception operations","Classification operations","Storage operations","Picking operations","Packaging operations","Delivery operations"];
        else if(this.selectedTab == "CUSTOMSMANAGEMENT")
            this.options = ["Customs warehousing dispatching","Border control inspection handling","Customs declaration"];
        else if(this.selectedTab == "LOGISTICSCONSULTANCY")
            this.options = ["Supply chain management","Manufacturing processes","Warehousing processes","Transportation processes","Packaging processes"];
        else if(this.selectedTab == "TRUCKLOAD")
            this.options = ["FTL-Full truck load","PTL-Partial truck load","Groupage"];
        else if(this.selectedTab == "SHIPMENTTYPE")
            this.options = ["Doortodoor","Direct shipment","Drop shipping","Cross docking"];
        else if(this.selectedTab == "MARITIME")
            this.options = ["Full container","Groupage"];
        else if(this.selectedTab == "AIR")
            this.options = ["Pallet transport","Medium/big package transport"];
        else if(this.selectedTab == "RAIL")
            this.options = ["Multi-train","Customer train"];
    }
}