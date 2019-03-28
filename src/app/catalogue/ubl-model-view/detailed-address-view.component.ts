import {Component, Input, OnInit} from '@angular/core';
import {Address} from "../model/publish/address";
import {CookieService} from 'ng2-cookies';
import {UserService} from '../../user-mgmt/user.service';
import {CallStatus} from '../../common/call-status';

/*
 * Anthony 14/06/2018: this class should be removed (no longer used) once the
 * business process payment details is redone.
 */

@Component({
    selector: 'detailed-address-view',
    templateUrl: './detailed-address-view.component.html'
})

export class DetailedAddressViewComponent implements OnInit{
    @Input() propName:string;
    @Input() presentationMode: "singlevalue" | "edit";
    @Input() deliveryAddress:Address;
    @Input() fetchDefaultDeliveryAddress:boolean;

    getDefaultDeliveryLocation:CallStatus = new CallStatus();

    constructor(
        private cookieService: CookieService,
        private userService: UserService
    ) {	}

    ngOnInit():void{
        // get company address
        if(this.fetchDefaultDeliveryAddress)
        {
            this.getDefaultDeliveryLocation.submit();
            let userId = this.cookieService.get('user_id');
            this.userService.getSettingsForUser(userId).then(settings => {

                this.deliveryAddress.country.name.value = settings.details.address.country;
                this.deliveryAddress.postalZone = settings.details.address.postalCode;
                this.deliveryAddress.cityName = settings.details.address.cityName;
                this.deliveryAddress.region = settings.details.address.region;
                this.deliveryAddress.buildingNumber = settings.details.address.buildingNumber;
                this.deliveryAddress.streetName = settings.details.address.streetName;

                this.getDefaultDeliveryLocation.callback("Retrieved default delivery location", true);
            }).catch(error => {
                this.getDefaultDeliveryLocation.error("Failed to retrieve default delivery location", error);
            });
        }
        else{
            this.getDefaultDeliveryLocation.callback("Does not need to retrieve default delivery location", true);
        }
    }
}
