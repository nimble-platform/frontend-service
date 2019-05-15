import {Component, Input, OnInit} from '@angular/core';
import {COUNTRY_NAMES, selectPreferredValue} from '../../common/utils';
import {Text} from '../model/publish/text';
import {ItemProperty} from '../model/publish/item-property';
import {REGIONS} from '../model/constants';

@Component({
    selector: "origin-destination-view",
    templateUrl: "./origin-destination-view-component.html"
})
export class OriginDestinationViewComponent implements OnInit{

    constructor() {
    }

    // stores the address information
    @Input() itemProperty:ItemProperty;

    regionOptions = REGIONS;
    countryNames = COUNTRY_NAMES;

    enableRegionSelection:boolean = false;
    enableCountrySelection:boolean = false;

    title:string;

    ngOnInit(){
        // set the title
        this.title = selectPreferredValue(this.itemProperty.name);

        for(let address of this.itemProperty.value){
            if(this.regionOptions.indexOf(address.value) != -1){
                this.enableRegionSelection = true;
                break;
            }
        }
    }

    onCountrySelected(event) {
        this.itemProperty.value.push(new Text(event.target.value));
    }

    onCountryRemoved(country: string) {
        for(let address of this.itemProperty.value){
            if(address.value == country){
                this.itemProperty.value.splice(this.itemProperty.value.indexOf(address),1);
                break;
            }
        }
    }

    isAllOverTheWorldOptionSelected(isChecked:boolean){
        if(isChecked){
            this.itemProperty.value.push(new Text("All over the world"));
        }else{
            for(let address of this.itemProperty.value){
                if(address.value == "All over the world"){
                    this.itemProperty.value.splice(this.itemProperty.value.indexOf(address),1);
                    break;
                }
            }
        }
    }

    // if Regions option is deselected, then remove all selected regions
    onRegionsChecked(isChecked:boolean){
        if(!isChecked){
            let addressesToBeRemoved:Text[] = [];
            for(let address of this.itemProperty.value){
                if(this.regionOptions.indexOf(address.value) != -1 && address.value != "All over the world"){
                    addressesToBeRemoved.push(address);
                }
            }

            for(let address of addressesToBeRemoved){
                this.itemProperty.value.splice(this.itemProperty.value.indexOf(address),1);
            }
        }
    }

    onRegionChecked(isChecked:boolean, option:string){
        if(isChecked){
            this.itemProperty.value.push(new Text(option));
        } else{
            for(let address of this.itemProperty.value){
                if(address.value == option){
                    this.itemProperty.value.splice(this.itemProperty.value.indexOf(address),1);
                    break;
                }
            }
        }
    }

    // get the selected countries
    getSelectedCountries():string[] {
        let countries:string[] = [];
        for(let address of this.itemProperty.value){
            if(this.regionOptions.indexOf(address.value) == -1 && address.value != "All over the world"){
                countries.push(address.value);
            }
        }
        return countries;
    }

    // check whether the given region option is selected or not
    isRegionSelected(option:string){
        for(let address of this.itemProperty.value){
            if(address.value == option){
                return true;
            }
        }
        return false;
    }
}
