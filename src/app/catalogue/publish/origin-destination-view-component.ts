import {Component, Input, OnInit} from '@angular/core';
import {COUNTRY_NAMES} from '../../common/utils';

@Component({
    selector: "origin-destination-view",
    templateUrl: "./origin-destination-view-component.html"
})
export class OriginDestinationViewComponent implements OnInit{

    constructor() {
    }

    @Input() divStyle;
    regionOptions = ["Europe","Asia","Africa","North America","South America","Oceania"];
    countryNames = COUNTRY_NAMES;

    selectedCountries: string[] = [];

    ngOnInit(){

    }

    onCountrySelected(event) {
        this.selectedCountries.push(event.target.value);
    }

    onCountryRemoved(countryName: string) {
        this.selectedCountries.splice(this.selectedCountries.indexOf(countryName), 1);
    }
}
