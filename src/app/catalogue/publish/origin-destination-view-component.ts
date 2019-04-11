import {Component, OnInit} from '@angular/core';
import {COUNTRY_NAMES} from '../../common/utils';

@Component({
    selector: "origin-destination-view",
    templateUrl: "./origin-destination-view-component.html"
})
export class OriginDestinationViewComponent implements OnInit{

    constructor() {
    }

    regionOptions = ["Europe","Asia","Africa","North America","South America","Oceania"];
    countryNames = COUNTRY_NAMES;

    ngOnInit(){

    }
}