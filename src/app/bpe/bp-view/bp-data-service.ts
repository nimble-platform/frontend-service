import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {LineReference} from "../../catalogue/model/publish/line-reference";
import {Injectable} from "@angular/core";
import {ItemProperty} from "../../catalogue/model/publish/item-property";
import {Item} from "../../catalogue/model/publish/item";
import {Dimension} from "../../catalogue/model/publish/dimension";
import {ActivityVariableParser} from "./activity-variable-parser";
import {DespatchAdvice} from "../../catalogue/model/publish/despatch-advice";
import {ReceiptAdvice} from "../../catalogue/model/publish/receipt-advice";
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {Quotation} from "../../catalogue/model/publish/quotation";
import {Order} from "../../catalogue/model/publish/order";
import {OrderResponseSimple} from "../../catalogue/model/publish/order-response-simple";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Ppap} from "../../catalogue/model/publish/ppap";
import {OrderReference} from "../../bpe/model/order-reference";
import {PpapResponse} from "../../catalogue/model/publish/ppap-response";
import {TransportExecutionPlanRequest} from "../../catalogue/model/publish/transport-execution-plan-request";
import {TransportExecutionPlan} from "../../catalogue/model/publish/transport-execution-plan";
import {SearchContextService} from "../../simple-search/search-context.service";
import {ItemInformationRequest} from "../../catalogue/model/publish/item-information-request";
import {ItemInformationResponse} from "../../catalogue/model/publish/item-information-response";
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
    ppap:Ppap;
    ppapResponse:PpapResponse;
    orderResponse:OrderResponseSimple;
    despatchAdvice:DespatchAdvice;
    receiptAdvice:ReceiptAdvice;
    transportExecutionPlanRequest:TransportExecutionPlanRequest;
    transportExecutionPlan:TransportExecutionPlan;
    itemInformationRequest:ItemInformationRequest;
    itemInformationResponse:ItemInformationResponse;

    ////////////////////////////////////////////////////////////////////////////
    //////// variables used when navigating to bp options details page //////
    ////////////////////////////////////////////////////////////////////////////
    // setBpOptionParameters method must be used to set these values
    processTypeSubject:BehaviorSubject<string> = new BehaviorSubject<string>('Item_Information_Request');
    processTypeObservable = this.processTypeSubject.asObservable();
    userRole:string;
    processMetadata:any;

    constructor(public searchContextService: SearchContextService) {
    }

    setBpOptionParametersWithProcessMetadata(userRole:string, targetProcess:string, processMetadata:any):void {
        this.resetBpData();
        this.setBpOptionParameters(userRole, targetProcess);
        this.processMetadata = processMetadata;
        this.setBpMessages(this.processTypeSubject.getValue(), processMetadata);
    }

    setBpMessages(processType:string, processMetadata:any) {
        let activityVariables = processMetadata.activityVariables;
        if(processType == 'Negotiation') {
            this.requestForQuotation = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let quotationVariable = ActivityVariableParser.getResponse(activityVariables);
            if(quotationVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.userRole == 'seller') {
                    this.quotation = UBLModelUtils.createQuotation(this.requestForQuotation);
                }

            } else {
                this.quotation = quotationVariable.value;
                this.order = UBLModelUtils.createOrder();
                this.order.orderLine[0].lineItem = this.quotation.quotationLine[0].lineItem;
            }

        } else if(processType == 'Order') {
            this.order = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let orderResponseVariable = ActivityVariableParser.getResponse(activityVariables);
            if(orderResponseVariable == null) {
                // initialize the order response only if the user is in seller role
                if(this.userRole == 'seller') {
                    this.orderResponse = UBLModelUtils.createOrderResponseSimple(this.order, true);
                }

            } else {
                this.orderResponse = orderResponseVariable.value;
            }


        } else if(processType == 'Ppap'){
          this.ppap = ActivityVariableParser.getInitialDocument(activityVariables).value;

          let ppapResponseVariable = ActivityVariableParser.getResponse(activityVariables);
          if(ppapResponseVariable == null){
              if(this.userRole == 'seller'){
                  this.ppapResponse = UBLModelUtils.createPpapResponse(this.ppap,true);
              }
              else{
                  this.ppapResponse = ppapResponseVariable.value;
              }
          }

        } else if(processType == 'Fulfilment') {
            this.despatchAdvice = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let receiptAdviceVariable = ActivityVariableParser.getResponse(activityVariables);
            if(receiptAdviceVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.userRole == 'buyer') {
                    this.receiptAdvice = UBLModelUtils.createReceiptAdvice(this.despatchAdvice);
                }

            } else {
                this.receiptAdvice = receiptAdviceVariable.value;
            }

        } else if(processType == 'Transport_Execution_Plan') {
            this.transportExecutionPlanRequest = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let transportExecutionPlanVariable = ActivityVariableParser.getResponse(activityVariables);
            if(transportExecutionPlanVariable == null) {
                if(this.userRole == 'seller') {
                    this.transportExecutionPlan = UBLModelUtils.createTransportExecutionPlan(this.transportExecutionPlanRequest);
                }

            } else {
                this.transportExecutionPlan = transportExecutionPlanVariable.value;
            }

        } else if(processType == 'Item_Information_Request') {
            this.itemInformationRequest = ActivityVariableParser.getInitialDocument(activityVariables).value;

            let itemInformationResponseVariable = ActivityVariableParser.getResponse(activityVariables);
            if(itemInformationResponseVariable == null) {
                if(this.userRole == 'seller') {
                    this.itemInformationResponse = UBLModelUtils.createItemInformationResponse(this.itemInformationRequest);
                }

            } else {
                this.itemInformationResponse = itemInformationResponseVariable.value;
            }
        }
    }

    setBpOptionParameters(userRole:string, targetProcess:string) {
        this.setProcessType(targetProcess);
        this.userRole = userRole;
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initRfq():void {
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation();
        this.requestForQuotation.requestForQuotationLine[0].lineItem.item = this.modifiedCatalogueLine.goodsItem.item;
        this.requestForQuotation.requestForQuotationLine[0].lineItem.lineReference = [new LineReference(this.modifiedCatalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    initPpap(documents:string[]):void{
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.ppap = UBLModelUtils.createPpap(documents);
        this.ppap.lineItem.item = this.catalogueLine.goodsItem.item;
        this.ppap.lineItem.lineReference = [new LineReference(this.catalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initOrder():void {
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem.item = this.modifiedCatalogueLine.goodsItem.item;
        this.order.orderLine[0].lineItem.lineReference = [new LineReference(this.modifiedCatalogueLine.id)];
        this.selectFirstValuesAmongAlternatives();
    }

    initItemInformationRequest():void {
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.itemInformationRequest = UBLModelUtils.createItemInformationRequest();
        this.itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.modifiedCatalogueLine.goodsItem.item;
        this.selectFirstValuesAmongAlternatives();
    }

    initOrderWithQuotation() {
        let copyQuotation:Quotation = JSON.parse(JSON.stringify(this.quotation));
        this.resetBpData();
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
        this.setProcessType('Order');
    }

    initRfqWithQuotation() {
        let copyQuotation:Quotation = JSON.parse(JSON.stringify(this.quotation));
        this.resetBpData();
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation();
        this.requestForQuotation.requestForQuotationLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
    }

    initDespatchAdviceWithOrder() {
        let copyOrder:Order = JSON.parse(JSON.stringify(this.order));
        this.resetBpData();
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.despatchAdvice = UBLModelUtils.createDespatchAdvice(copyOrder);
    }

    initTransportExecutionPlanRequestWithOrder(processMetadata:any) {
        this.resetBpData();
        this.setBpMessages('Order', this.searchContextService.associatedProcessMetadata);
        let copyOrder:Order = JSON.parse(JSON.stringify(this.order));
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithOrder(copyOrder, this.catalogueLine);
    }

    initTransportExecutionPlanRequestWithQuotation() {
        let copyQuotation:Quotation = JSON.parse(JSON.stringify(this.quotation));
        this.resetBpData();
        this.modifiedCatalogueLine = JSON.parse(JSON.stringify(this.catalogueLine));
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithQuotation(copyQuotation);
    }

    resetBpData():void {
        //this.setProcessType(null);
        this.processMetadata = null;
        this.modifiedCatalogueLine = null;
        this.requestForQuotation = null;
        this.quotation = null;
        this.order = null;
        this.orderResponse = null;
        this.despatchAdvice = null;
        this.receiptAdvice = null;
        this.ppap = null;
        this.ppapResponse = null;
        this.transportExecutionPlanRequest = null;
        this.transportExecutionPlan = null;
        this.itemInformationRequest = null;
        this.itemInformationResponse = null;

        // reinitialize the messages considering the search context
        //this.setBpMessages(this.searchContextService.associatedProcessType, this.searchContextService.associatedProcessMetadata);
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

    setProcessType(processType:string): void {
        this.processTypeSubject.next(processType);
    }
}
