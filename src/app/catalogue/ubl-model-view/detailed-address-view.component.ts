import {Component, Input, OnInit} from '@angular/core';
import {Address} from "../model/publish/address";
import {CookieService} from 'ng2-cookies';
import {UserService} from '../../user-mgmt/user.service';
import {CallStatus} from '../../common/call-status';

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
