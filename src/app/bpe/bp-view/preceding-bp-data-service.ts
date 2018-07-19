import {Injectable} from "@angular/core";
import {Address} from "../../catalogue/model/publish/address";
/**
 * The service intends to keep the from(delivery) and to addresses that are used during the instantiation of the business processes.
 * The values are first initialized with the preferred values and then updated based on the user activities on UI.
 *
 * Created by suat on 08-Jun-18.
 */
@Injectable()
export class PrecedingBPDataService{
    // to, delivery address
    toAddress: Address;
    // from address
    fromAddress: Address;
    // last order process metadata between buyer and seller
    orderMetadata: any;

    reset(){
        this.toAddress = null;
        this.fromAddress = null;
        this.orderMetadata = null;
    }
}
