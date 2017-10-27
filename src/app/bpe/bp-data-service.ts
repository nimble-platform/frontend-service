import {Order} from "./model/ubl/order";
import {RequestForQuotation} from "./model/ubl/request-for-quotation";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {LineReference} from "../catalogue/model/publish/line-reference";
import {Injectable} from "@angular/core";
import {ItemProperty} from "../catalogue/model/publish/item-property";
import {Item} from "../catalogue/model/publish/item";
import {Dimension} from "../catalogue/model/publish/dimension";
import {ActivityVariableParser} from "./activity-variable-parser";
import {OrderResponseSimple} from "./model/ubl/order-response-simple";
import {Quotation} from "./model/ubl/quotation";
/**
 * Created by suat on 20-Sep-17.
 */

@Injectable()
export class BPDataService {
    // original catalogue line to initialize the business process data
    catalogueLine:CatalogueLine;
    // catalogue line object that is kept updated based on user selections
    modifiedCatalogueLine:CatalogueLine;

    requestForQuotation:RequestForQuotation;
    quotation:Quotation;
    order:Order;
    orderResponse:OrderResponseSimple;

    ////////////////////////////////////////////////////////////////////////////
    //////// variables used when navigating to bp options details page //////
    ////////////////////////////////////////////////////////////////////////////
    // setBpOptionParameters method must be used to set these values
    processType:string;
    userRole:string;
    processMetadata:any;

    setBpOptionParameters(userRole:string, processMetadata:any):void {
        let activityVariables = processMetadata.activityVariables;
        this.processType = ActivityVariableParser.getProcessType(activityVariables);
        this.userRole = userRole;
        this.processMetadata = processMetadata;

        // decompose the activity variables
        if(this.processType == 'Order') {
            this.order = ActivityVariableParser.getInitialDocument(activityVariables).value

            let orderResponseVariable = ActivityVariableParser.getResponse(activityVariables);
            if(orderResponseVariable == null) {
                // initialize the order response only if the user is in seller role
                if(this.userRole == 'seller') {
                    this.orderResponse = UBLModelUtils.createOrderResponseSimple(this.order, true);
                }

            } else {
                this.orderResponse = orderResponseVariable.value;
            }

        } else if(this.processType == 'Negotiation') {
            this.requestForQuotation = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let quotationVariable = ActivityVariableParser.getResponse(activityVariables);
            if(quotationVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.userRole == 'seller') {
                    this.quotation = UBLModelUtils.createQuotation(this.requestForQuotation);
                }

            } else {
                this.quotation = quotationVariable.value;
            }
        }
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initRfq():void {
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation();
        this.requestForQuotation.requestForQuotationLine[0].lineItem.item = this.catalogueLine.goodsItem.item;
        this.requestForQuotation.requestForQuotationLine[0].lineItem.lineReference = [new LineReference(this.catalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initOrder():void {
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem.item = this.catalogueLine.goodsItem.item;
        this.order.orderLine[0].lineItem.lineReference = [new LineReference(this.catalogueLine.id)];
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