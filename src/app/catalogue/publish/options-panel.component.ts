import {Component, Input, OnInit} from '@angular/core';
import {Text} from '../model/publish/text';
import {DEFAULT_LANGUAGE} from '../model/constants';
import {Item} from '../model/publish/item';

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
    @Input() item:Item;
    @Input() selectedOptions: Text[] = [];
    @Input() selectedOptionsWithExtraColumn = true;
    // variables

    options = [];

    option:string = null;

    ngOnInit(){

        // set options according to the selected tab
        if(this.selectedTab == "WAREHOUSING")
            this.options = [new Text("Deposit"),new Text("Inventory management"),new Text("Inventory control"),new Text("Expiration/obsolescence control")];
        else if(this.selectedTab == "ORDERPICKING")
            this.options = [new Text("Order preparation"), new Text("Replenishment of order"),new Text("Labelling"),new Text("Packaging")];
        else if(this.selectedTab == "REVERSELOGISTICS")
            this.options = [new Text("Product disassembly"),new Text("Reverse product transport"),new Text("Reverse packaging/unit load transport"),new Text("Money refund to customer")];
        else if(this.selectedTab == "INHOUSESERVICES")
            this.options = [new Text("Reception operations"),new Text("Classification operations"),new Text("Storage operations"),new Text("Picking operations"),new Text("Packaging operations"),new Text("Delivery operations")];
        else if(this.selectedTab == "CUSTOMSMANAGEMENT")
            this.options = [new Text("Customs warehousing dispatching"),new Text("Border control inspection handling"),new Text("Customs declaration")];
        else if(this.selectedTab == "LOGISTICSCONSULTANCY")
            this.options = [new Text("Supply chain management"),new Text("Manufacturing processes"),new Text("Warehousing processes"),new Text("Transportation processes"),new Text("Packaging processes")];
        else if(this.selectedTab == "TRUCKLOAD")
            this.options = [new Text("FTL-Full truck load"),new Text("PTL-Partial truck load"),new Text("Groupage")];
        else if(this.selectedTab == "SHIPMENTTYPE")
            this.options = [new Text("Doortodoor"),new Text("Direct shipment"),new Text("Drop shipping"),new Text("Cross docking")];
        else if(this.selectedTab == "MARITIME")
            this.options = [new Text("Full container"),new Text("Groupage")];
        else if(this.selectedTab == "AIR")
            this.options = [new Text("Pallet transport"),new Text("Medium/big package transport")];
        else if(this.selectedTab == "RAIL")
            this.options = [new Text("Multi-train"),new Text("Customer train"),new Text("Slot")];
        else if(this.selectedTab == "PRODUCTTYPE")
            this.options = [new Text("Pallets"),new Text("Medium/big packages"),new Text("Box/small packages"),new Text("Bulk cargo"),new Text("Liquids"),new Text("Coil"),new Text("Hazardous goods"),new Text("Stackable products"),new Text("Perishable")];
        else if(this.selectedTab == "INDUSTRYSPECIALIZATION")
            this.options = [new Text("Automotive"),new Text("Construction"),new Text("Wood/furniture"),new Text("Food"),new Text("Textile"),new Text("Ceramic"),new Text("Toy"),new Text("Footwear"),new Text("Retail")];
    }

    onOptionAdded() {
        if(this.option){
            this.selectedOptions.push(new Text(this.option));
        }
    }

    onOptionRemoved(value:Text) {
        this.selectedOptions.splice(this.selectedOptions.indexOf(value), 1);
    }

    onCheckboxChanged(checked,option){
        if(checked)
            this.selectedOptions.push(option);
        else
            for(let selectedOption of this.selectedOptions){
                if(selectedOption.value == option.value){
                    this.selectedOptions.splice(this.selectedOptions.indexOf(selectedOption),1);
                    break;
                }
            }
    }

    isDefaultOption(option:Text){
        for(let text of this.options){
            if(text.value == option.value){
                return true;
            }
        }
        return false;
    }

    isSelected(option:Text){
        for(let text of this.selectedOptions){
            if(text.value == option.value){
                return true;
            }
        }
        return false;
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
