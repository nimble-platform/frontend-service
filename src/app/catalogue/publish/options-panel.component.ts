import {Component, Input, OnInit} from '@angular/core';
import {Text} from '../model/publish/text';
import {DEFAULT_LANGUAGE} from '../model/constants';

@Component({
    selector: "options-panel",
    templateUrl: "./options-panel.component.html",
    styleUrls: ["./options-panel.component.css"]
})
export class OptionsPanelComponent implements OnInit{

    constructor() {
    }

    // inputs
    @Input() title;
    @Input() selectedTab;
    @Input() divStyle;
    @Input() checkboxOther = true;
    @Input() item;
    // variables

    options = [];

    option:string = null;

    selectedOptions:string[] = [];

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
            this.options = ["Multi-train","Customer train","Slot"];
        else if(this.selectedTab == "PRODUCTTYPE")
            this.options = ["Pallets","Medium/big packages","Box/small packages","Bulk cargo","Liquids","Coil","Hazardous goods","Stackable products","Perishable"];
        else if(this.selectedTab == "INDUSTRYSPECIALIZATION")
            this.options = ["Automotive","Construction","Wood/furniture","Food","Textile","Ceramic","Toy","Footwear","Retail"];
    }

    onOptionAdded() {
        if(this.option){
            this.selectedOptions.push(this.option);
            this.option = null;
        }
    }

    onOptionRemoved(option: string) {
        this.selectedOptions.splice(this.selectedOptions.indexOf(option), 1);
    }

    addItemNameDescription() {
        let newItemName: Text = new Text("",DEFAULT_LANGUAGE());
        let newItemDescription: Text = new Text("",DEFAULT_LANGUAGE());
        this.item.name.push(newItemName);
        this.item.description.push(newItemDescription);
    }

    deleteItemNameDescription(index){
        this.item.name.splice(index, 1);
        this.item.description.splice(index, 1);
    }
}
