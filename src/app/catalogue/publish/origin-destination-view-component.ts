import {Component, Input, OnInit} from '@angular/core';
import {COUNTRY_NAMES} from '../../common/utils';
import {Address} from '../model/publish/address';
import {Country} from '../model/publish/country';
import {Text} from '../model/publish/text';

@Component({
    selector: "origin-destination-view",
    templateUrl: "./origin-destination-view-component.html"
})
export class OriginDestinationViewComponent implements OnInit{

    constructor() {
    }

    @Input() divStyle;
    @Input() addresses:Address[] = [];
    @Input() addressesText:Text[] = null;

    regionOptions = ["Europe","Asia","Africa","North America","South America","Oceania"];
    countryNames = COUNTRY_NAMES;

    enableRegionSelection:boolean = false;
    enableCountrySelection:boolean = false;

    ngOnInit(){
        this.addressesText ? this.isRegionSelectionEnabledTextType():this.isRegionSelectionEnabledAddressType();
    }

    onCountrySelected(event) {
        this.addressesText ? this.onCountrySelectedTextType(event.target.value): this.onCountrySelectedAddressType(event.target.value);
    }

    onCountryRemoved(country: string) {
        this.addressesText ? this.onCountryRemovedTextType(country): this.onCountryRemovedAddressType(country);
    }

    isAllOverTheWorldOptionSelected(isChecked:boolean){
        this.addressesText ? this.isAllOverTheWorldOptionSelectedTextType(isChecked): this.isAllOverTheWorldOptionSelectedAddressType(isChecked);
    }

    // if Regions option is deselected, then remove all selected regions
    onRegionsChecked(isChecked:boolean){
        if(!isChecked){
            this.addressesText ? this.onRegionsCheckedTextType(): this.onRegionsCheckedAddressType();
        }
    }

    onRegionChecked(isChecked:boolean, option:string){
        this.addressesText ? this.onRegionCheckedTextType(isChecked,option): this.onRegionCheckedAddressType(isChecked,option);
    }

    // get the selected countries
    getSelectedCountries():string[] {
        return this.addressesText ? this.getSelectedCountriesTextType(): this.getSelectedCountriesAddressType();
    }

    // check whether the given region option is selected or not
    isRegionSelected(option:string){
        return this.addressesText ? this.isRegionSelectedTextType(option): this.isRegionSelectedAddressType(option);
    }

    // use these methods if the addresses are represented by Address
    isRegionSelectedAddressType(option:string){
        for(let address of this.addresses){
            if(address.region == option){
                return true;
            }
        }
        return false;
    }

    getSelectedCountriesAddressType():string[]{
        let countries:string[] = [];
        for(let address of this.addresses){
            if(address.country.name.value){
                countries.push(address.country.name.value);
            }
        }
        return countries;
    }

    onCountryRemovedAddressType(country: string){
        for(let address of this.addresses){
            if(address.country.name.value == country){
                this.addresses.splice(this.addresses.indexOf(address),1);
                break;
            }
        }
    }

    onCountrySelectedAddressType(value:string){
        let country:Country = new Country();
        country.name = new Text(value);

        let address:Address = new Address("","","","","",country);
        this.addresses.push(address);
    }

    isRegionSelectionEnabledAddressType(){
        for(let address of this.addresses){
            if(address.region != ""){
                this.enableRegionSelection = true;
                break;
            }
        }
    }

    onRegionCheckedAddressType(isChecked:boolean, option:string){
        if(isChecked){
            let address: Address = new Address("",option,"","","");

            this.addresses.push(address);
        } else{
            for(let address of this.addresses){
                if(address.region == option){
                    this.addresses.splice(this.addresses.indexOf(address),1);
                    break;
                }
            }
        }
    }

    onRegionsCheckedAddressType(){
        let addressesToBeRemoved:Address[] = [];
        for(let address of this.addresses){
            if(address.region != "" && address.region != "All over the world"){
                addressesToBeRemoved.push(address);
            }
        }

        for(let address of addressesToBeRemoved){
            this.addresses.splice(this.addresses.indexOf(address),1);
        }
    }

    isAllOverTheWorldOptionSelectedAddressType(isChecked:boolean){
        if(isChecked){
            let address: Address = new Address("","All over the world","","","");

            this.addresses.push(address);
        }else{
            for(let address of this.addresses){
                if(address.region == "All over the world"){
                    this.addresses.splice(this.addresses.indexOf(address),1);
                    break;
                }
            }
        }
    }
    // use these methods if the addresses are represented by Text
    isRegionSelectedTextType(option:string){
        for(let address of this.addressesText){
            if(address.value == option){
                return true;
            }
        }
        return false;
    }

    getSelectedCountriesTextType():string[]{
        let countries:string[] = [];
        for(let address of this.addressesText){
            if(this.regionOptions.indexOf(address.value) == -1 && address.value != "All over the world"){
                countries.push(address.value);
            }
        }
        return countries;
    }

    onCountryRemovedTextType(country: string){
        for(let address of this.addressesText){
            if(address.value == country){
                this.addressesText.splice(this.addressesText.indexOf(address),1);
                break;
            }
        }
    }

    onCountrySelectedTextType(value:string){
        this.addressesText.push(new Text(value));
    }

    isRegionSelectionEnabledTextType(){

        for(let address of this.addressesText){
            if(this.regionOptions.indexOf(address.value) != -1){
                this.enableRegionSelection = true;
                break;
            }
        }

    }

    onRegionCheckedTextType(isChecked:boolean, option:string){
        if(isChecked){
            this.addressesText.push(new Text(option));
        } else{
            for(let address of this.addressesText){
                if(address.value == option){
                    this.addressesText.splice(this.addressesText.indexOf(address),1);
                    break;
                }
            }
        }
    }

    onRegionsCheckedTextType(){
        let addressesToBeRemoved:Text[] = [];
        for(let address of this.addressesText){
            if(this.regionOptions.indexOf(address.value) != -1 && address.value != "All over the world"){
                addressesToBeRemoved.push(address);
            }
        }

        for(let address of addressesToBeRemoved){
            this.addressesText.splice(this.addressesText.indexOf(address),1);
        }
    }

    isAllOverTheWorldOptionSelectedTextType(isChecked:boolean){
        if(isChecked){
            this.addressesText.push(new Text("All over the world"));
        }else{
            for(let address of this.addressesText){
                if(address.value == "All over the world"){
                    this.addressesText.splice(this.addressesText.indexOf(address),1);
                    break;
                }
            }
        }
    }
}
