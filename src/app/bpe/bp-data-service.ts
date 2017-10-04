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
    // original catalogue line to initialize the business process data
    catalogueLine:CatalogueLine;
    // catalogue line object that is kept updated based on user selections
    modifiedCatalogueLine:CatalogueLine;

    initRfq(catalogueLine:CatalogueLine):void {
        this.catalogueLine = catalogueLine;
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(catalogueLine));
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation();
        this.requestForQuotation.requestForQuotationLine[0].lineItem.item = catalogueLine.goodsItem.item;
        this.requestForQuotation.requestForQuotationLine[0].lineItem.lineReference = [new LineReference(catalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    initOrder(catalogueLine:CatalogueLine):void {
        this.catalogueLine = catalogueLine;
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(catalogueLine));
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem.item = catalogueLine.goodsItem.item;
        this.order.orderLine[0].lineItem.lineReference = [new LineReference(catalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    selectFirstValuesAmongAlternatives():void {
        this.chooseAllDimensions();
        this.chooseFirstValuesOfItemProperties();
    }

    /**
     * Updates modified catalogue line's dimensions with only the first occurrences of the dimension attributes
     */
    chooseAllDimensions():void {
        let dimensions:Dimension[] = this.modifiedCatalogueLine.goodsItem.item.dimension;
        let finalDimensions:Dimension[] = [];
        let chosenAttributes:string[] = [];

        for(let dim of dimensions) {
            // attribute is not selected yet
            if (chosenAttributes.findIndex(aid => aid == dim.attributeID) == -1) {
                chosenAttributes.push(dim.attributeID);
                finalDimensions.push(dim);
            }
        }
        this.modifiedCatalogueLine.goodsItem.item.dimension = finalDimensions;
    }

    chooseFirstValuesOfItemProperties():void {
        let item:Item = this.modifiedCatalogueLine.goodsItem.item;

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

    updateItemProperty(selectedValue:any, itemProperty:ItemProperty):void {
        let item:Item = this.modifiedCatalogueLine.goodsItem.item;

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

    /**
     * Keeps only the selected value for the given attribute in the dimension array
     */
    updateDimension(attributeId:string, selectedValue:number):void {
        let dimensions:Dimension[] = this.modifiedCatalogueLine.goodsItem.item.dimension;
        let allDimensions:Dimension[] = this.catalogueLine.goodsItem.item.dimension;
        let attIndexInOriginal = allDimensions.findIndex(dim => attributeId == dim.attributeID && selectedValue == dim.measure.value);
        let attIndexInModified = dimensions.findIndex(dim => attributeId == dim.attributeID);
        // return the items after the target attribute
        let remaining = dimensions.splice(attIndexInModified + 1);
        // remove the last item
        dimensions.splice(dimensions.length - 1);
        dimensions = dimensions.concat([allDimensions[attIndexInOriginal]]).concat(remaining);
        this.modifiedCatalogueLine.goodsItem.item.dimension = dimensions;
    }
}