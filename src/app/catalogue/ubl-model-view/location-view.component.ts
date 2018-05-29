import {Component, Input, OnInit} from '@angular/core';
import {Address} from "../model/publish/address";
import {CookieService} from 'ng2-cookies';
import {UserService} from '../../user-mgmt/user.service';
import {SearchContextService} from '../../simple-search/search-context.service';
import {CallStatus} from '../../common/call-status';

@Component({
    selector: 'location-view',
    templateUrl: './location-view.component.html'
})

export class LocationViewComponent implements OnInit{
    @Input() propName:string;
    @Input() presentationMode:string;
    @Input() processMetadataNull;
    @Input() deliveryAddress:Address;
    @Input() useDefaultDeliveryLocation = true;

    getDefaultDeliveryLocation:CallStatus = new CallStatus();

    constructor(
        private cookieService: CookieService,
        private userService: UserService,
        private searchContextService: SearchContextService
    ) {	}

    ngOnInit():void{
        // get company address
        if(this.processMetadataNull && !this.deliveryAddress.hasOwnProperty('hjid') && this.useDefaultDeliveryLocation && !this.searchContextService.associatedProcessMetadata)
        {
            this.getDefaultDeliveryLocation.submit();
            let userId = this.cookieService.get('user_id');
            this.userService.getSettings(userId).then(settings => {
                this.deliveryAddress.country.name = settings.address.country;
                this.deliveryAddress.postalZone = settings.address.postalCode;
                this.deliveryAddress.cityName = settings.address.cityName;
                this.deliveryAddress.buildingNumber = settings.address.buildingNumber;
                this.deliveryAddress.streetName = settings.address.streetName;
                this.getDefaultDeliveryLocation.callback("Retrieved default delivery location", true);
            }).catch(error=>{
                this.getDefaultDeliveryLocation.error("Failed to retrieve default delivery location");
            });
        }
        else{
            this.getDefaultDeliveryLocation.callback("Does not need to retrieve default delivery location", true);
        }
    }
}
