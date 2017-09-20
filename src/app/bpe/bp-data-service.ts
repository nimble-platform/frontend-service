import {Order} from "./model/ubl/order";
import {RequestForQuotation} from "./model/ubl/request-for-quotation";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {LineReference} from "../catalogue/model/publish/line-reference";
import {Injectable} from "@angular/core";
import {ItemProperty} from "../catalogue/model/publish/item-property";
import {Item} from "../catalogue/model/publish/item";
import {Dimension} from "../catalogue/model/publish/dimension";
/**
 * Created by suat on 20-Sep-17.
 */

@Injectable()
export class BPDataService {
    requestForQuotation:RequestForQuotation;
    order:Order;

    initRfq(catalogueLine:CatalogueLine):void {
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation();
        this.requestForQuotation.requestForQuotationLine[0].lineItem.item = catalogueLine.goodsItem.item;
        this.requestForQuotation.requestForQuotationLine[0].lineItem.lineReference = [new LineReference(catalogueLine.id)];
    }

    initOrder(catalogueLine:CatalogueLine):void {
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem.item = catalogueLine.goodsItem.item;
        this.order.orderLine[0].lineItem.lineReference = [new LineReference(catalogueLine.id)];
    }

    updateItemProperty(bpType:string, selectedValue:any, itemProperty:ItemProperty):void {
        let item:Item;
        if(bpType == 'RequestForQuotation') {
            item = this.requestForQuotation.requestForQuotationLine[0].lineItem.item;
        } else {
            item = this.order.orderLine[0].lineItem.item;
        }

        let targetProp:ItemProperty;
        for(let prop of item.additionalItemProperty) {
            if(prop.id == itemProperty.id) {
                targetProp = prop;
                break;
            }
        }

        if(itemProperty.valueQualifier == 'STRING') {
            targetProp.value[0] = selectedValue;
        } else if(itemProperty.valueQualifier == 'REAL_MEASURE') {
            targetProp.valueDecimal[0] = selectedValue;
        } else if(itemProperty.valueQualifier == 'BOOLEAN') {
            targetProp.value[0] = selectedValue;
        } else if(itemProperty.valueQualifier == 'QUANTITY') {
            targetProp.valueQuantity[0] = selectedValue;
        }
    }

    updateDimension(attributeId:string, selectedValue:number, bpType:string):void {
        let dimensions:Dimension[];
        if(bpType == 'RequestForQuotation') {
            dimensions = this.requestForQuotation.requestForQuotationLine[0].lineItem.item.dimension;
        } else {
            dimensions = this.order.orderLine[0].lineItem.item.dimension;
        }
        let newDimensions:Dimension[] = [];

        for(let dim of dimensions) {
            if(dim.attributeID == attributeId) {
                // only insert the dimension with the selected value
                if(dim.measure.value == selectedValue) {
                    newDimensions.push(dim);
                }
            } else {
                newDimensions.push(dim);
            }
        }

        if(bpType == 'RequestForQuotation') {
            this.requestForQuotation.requestForQuotationLine[0].lineItem.item.dimension = newDimensions;
        } else {
            this.order.orderLine[0].lineItem.item.dimension = newDimensions;
        }
    }

    chooseAllDimensions(bpType:string):void {
        let dimensions:Dimension[];
        if(bpType == 'RequestForQuotation') {
            dimensions = this.requestForQuotation.requestForQuotationLine[0].lineItem.item.dimension;
        } else {
            dimensions = this.order.orderLine[0].lineItem.item.dimension;
        }

        let finalDimensions:Dimension[] = [];
        let chosenAttributes:string[] = [];

        for(let dim of dimensions) {
            // attribute is not selected yet
            if (chosenAttributes.findIndex(aid => aid == dim.attributeID) == -1) {
                chosenAttributes.push(dim.attributeID);
                finalDimensions.push(dim);
            }
        }

        if(bpType == 'RequestForQuotation') {
            this.requestForQuotation.requestForQuotationLine[0].lineItem.item.dimension = finalDimensions;
        } else {
            this.order.orderLine[0].lineItem.item.dimension = finalDimensions;
        }
    }

    chooseFirstValuesOfItemProperties(bpType:string):void {
        let item:Item;
        if(bpType == 'RequestForQuotation') {
            item = this.requestForQuotation.requestForQuotationLine[0].lineItem.item;
        } else {
            item = this.order.orderLine[0].lineItem.item;
        }

        for(let prop of item.additionalItemProperty) {
            if(prop.valueQualifier == 'STRING') {
                if(prop.value.length > 1) {
                    prop.value = [prop.value[0]];
                }
            } else if(prop.valueQualifier == 'REAL_MEASURE') {
                if(prop.valueDecimal.length > 1) {
                    prop.valueDecimal = [prop.valueDecimal[0]];
                }
            } else if(prop.valueQualifier == 'BOOLEAN') {
                if(prop.value.length > 1) {
                    prop.value = [prop.value[0]];
                }
            } else if(prop.valueQualifier == 'QUANTITY') {
                if(prop.valueQuantity.length > 1) {
                    prop.valueQuantity = [prop.valueQuantity[0]];
                }
            }
        }
    }
}