import {ShipmentStage} from "./shipment-stage";
import {GoodsItem} from "./goods-item";
import {Address} from "./address";
import {TransportHandlingUnit} from "./transport-handling-unit";
import {Quantity} from "./quantity";
import {Consignment} from "./consignment";
import {Text} from "./text";
import {DocumentReference} from './document-reference';

export class Shipment {
    constructor(
        public handlingInstructions: Text[] = [],
        public totalTransportHandlingUnitQuantity: Quantity = new Quantity(),
        public consignment: Consignment[] = [new Consignment()],
        public goodsItem:GoodsItem[] = [new GoodsItem()],
        public shipmentStage: ShipmentStage[] = [],
        public transportHandlingUnit: TransportHandlingUnit[] = [new TransportHandlingUnit()],
        public originAddress: Address = new Address(),
        public specialInstructions: string[] = [''],
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }

    selectHandlingInstructions(languageID: string): string {
        for (let pName of this.handlingInstructions) {
            if(pName.languageID === languageID) {
                return pName.value;
            }
        }

        return this.handlingInstructions[0].value;
    }
}
