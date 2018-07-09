import { CatalogueLine } from "../../catalogue/model/publish/catalogue-line";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import { LineReference } from "../../catalogue/model/publish/line-reference";
import { Injectable } from "@angular/core";
import { ItemProperty } from "../../catalogue/model/publish/item-property";
import { Item } from "../../catalogue/model/publish/item";
import { Dimension } from "../../catalogue/model/publish/dimension";
import { ActivityVariableParser } from "./activity-variable-parser";
import { DespatchAdvice } from "../../catalogue/model/publish/despatch-advice";
import { ReceiptAdvice } from "../../catalogue/model/publish/receipt-advice";
import { RequestForQuotation } from "../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../catalogue/model/publish/quotation";
import { Order } from "../../catalogue/model/publish/order";
import { OrderResponseSimple } from "../../catalogue/model/publish/order-response-simple";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Ppap } from "../../catalogue/model/publish/ppap";
import { PpapResponse } from "../../catalogue/model/publish/ppap-response";
import { TransportExecutionPlanRequest } from "../../catalogue/model/publish/transport-execution-plan-request";
import { TransportExecutionPlan } from "../../catalogue/model/publish/transport-execution-plan";
import { SearchContextService } from "../../simple-search/search-context.service";
import { ItemInformationRequest } from "../../catalogue/model/publish/item-information-request";
import { ItemInformationResponse } from "../../catalogue/model/publish/item-information-response";
import { CookieService } from "ng2-cookies";
import { UserService } from "../../user-mgmt/user.service";
import { PrecedingBPDataService } from "./preceding-bp-data-service";
import { BpUserRole } from "../model/bp-user-role";
import { BpWorkflowOptions } from "../model/bp-workflow-options";
import { NegotiationOptions } from "../../catalogue/model/publish/negotiation-options";
import { PAYMENT_MEANS } from "../../catalogue/model/constants";
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import { ProcessType } from "../model/process-type";
import { PaymentMeans } from "../../catalogue/model/publish/payment-means";
import { Code } from "../../catalogue/model/publish/code";
import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import { copy, getPropertyKey } from "../../common/utils";
import { NegotiationModelWrapper } from "./negotiation/negotiation-model-wrapper";
import { PriceWrapper } from "../../common/price-wrapper";
import { Quantity } from "../../catalogue/model/publish/quantity";

/**
 * Created by suat on 20-Sep-17.
 */

@Injectable()
export class BPDataService{
    // original catalogue lines to initialize the business process data
    private catalogueLines: CatalogueLine[] = [];
    // catalogue line object that is kept updated based on user selections
    modifiedCatalogueLines: CatalogueLine[] = [];
    // variables to keep the products and product categories related to the active business process
    relatedProducts: string[];
    relatedProductCategories: string[];

    requestForQuotation: RequestForQuotation;
    quotation: Quotation;
    order: Order;
    ppap: Ppap;
    ppapResponse: PpapResponse;
    orderResponse: OrderResponseSimple;
    despatchAdvice: DespatchAdvice;
    receiptAdvice: ReceiptAdvice;
    transportExecutionPlanRequest: TransportExecutionPlanRequest;
    transportExecutionPlan: TransportExecutionPlan;
    itemInformationRequest: ItemInformationRequest;
    itemInformationResponse: ItemInformationResponse;

    ////////////////////////////////////////////////////////////////////////////
    //////// variables used when navigating to bp options details page //////
    ////////////////////////////////////////////////////////////////////////////
    // setBpOptionParameters method must be used to set these values
    private processTypeSubject: BehaviorSubject<ProcessType> = new BehaviorSubject<ProcessType>("Item_Information_Request");
    processTypeObservable = this.processTypeSubject.asObservable();
    userRole: BpUserRole;
    processMetadata: ThreadEventMetadata;
    previousProcess: string;
    workflowOptions: BpWorkflowOptions;

    // variable to keep the business process instance group related to the new process being initiated
    private relatedGroupId: string;
    precedingProcessId: string;

    constructor(private searchContextService: SearchContextService,
                private precedingBPDataService: PrecedingBPDataService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    setCatalogueLines(catalogueLines: CatalogueLine[]): void {
        this.catalogueLines = [];
        this.relatedProducts = [];
        this.relatedProductCategories = [];

        for(let line of catalogueLines) {
            this.catalogueLines.push(line);
            this.relatedProducts.push(line.goodsItem.item.name);
            for(let category of line.goodsItem.item.commodityClassification) {
                if(this.relatedProductCategories.indexOf(category.itemClassificationCode.name) == -1) {
                    this.relatedProductCategories.push(category.itemClassificationCode.name);
                }
            }
        }
    }

    getCatalogueLine(): CatalogueLine {
        return this.catalogueLines[0];
    }

    getRelatedGroupId(): string {
        return this.relatedGroupId;
    }

    setRelatedGroupId(id: string): void {
        // If there is an active search context, we do not nullify the related group id.
        // For example, when the user is looking for a transport service provider, we should not reset the id
        if(id == null) {
            if(this.searchContextService.associatedProcessType == null) {
                this.relatedGroupId = null;
                this.precedingProcessId = null;
            }
        } else {
            this.relatedGroupId = id;
        }
    }

    setBpOptionParametersWithProcessMetadata(userRole: BpUserRole, targetProcess: ProcessType, processMetadata: ThreadEventMetadata): void {
        this.resetBpData();
        this.setBpOptionParameters(userRole, targetProcess, null);
        this.processMetadata = processMetadata;
        this.setBpMessages(this.processTypeSubject.getValue(), processMetadata);
    }

    private setBpMessages(processType: ProcessType, processMetadata: ThreadEventMetadata) {
        let activityVariables = processMetadata.activityVariables;
        if(processType == 'Negotiation') {
            this.requestForQuotation = ActivityVariableParser.getInitialDocument(activityVariables).value;
            this.initFetchedRfq();

            let quotationVariable = ActivityVariableParser.getResponse(activityVariables);
            if(quotationVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.userRole == 'seller') {
                    this.quotation = copy(UBLModelUtils.createQuotation(this.requestForQuotation));
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
          if(ppapResponseVariable == null) {
              if (this.userRole == 'seller') {
                  this.ppapResponse = UBLModelUtils.createPpapResponse(this.ppap, true);
              }
          }
              else{
                  this.ppapResponse = ppapResponseVariable.value;
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

    setBpOptionParameters(userRole: BpUserRole, targetProcess: ProcessType, previousProcess: ProcessType) {
        this.previousProcess = previousProcess;
        this.setProcessType(targetProcess);
        this.userRole = userRole;
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initRfq(): Promise<void> {
        const rfq = UBLModelUtils.createRequestForQuotation(
            this.workflowOptions ? this.workflowOptions.negotiation : new NegotiationOptions()
        );
        this.requestForQuotation = rfq;

        const line = this.catalogueLines[0];
        const rfqLine = this.requestForQuotation.requestForQuotationLine[0];

        rfqLine.lineItem.item = copy(line.goodsItem.item);
        rfqLine.lineItem.lineReference = [new LineReference(line.id)];
        const linePriceWrapper = new PriceWrapper(line.requiredItemLocationQuantity.price);
        if(linePriceWrapper.hasPrice()) {
            rfqLine.lineItem.price = copy(line.requiredItemLocationQuantity.price);
        } else {
            rfqLine.lineItem.price.priceAmount.value = 1;
        }
        rfqLine.lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure =
            copy(line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure);
        rfqLine.lineItem.warrantyValidityPeriod = copy(line.warrantyValidityPeriod);
        rfqLine.lineItem.deliveryTerms.incoterms = line.goodsItem.deliveryTerms.incoterms;
        rfqLine.lineItem.quantity.unitCode = line.requiredItemLocationQuantity.price.baseQuantity.unitCode;
        this.selectFirstValuesAmongAlternatives(rfqLine.lineItem.item);

        // quantity
        rfqLine.lineItem.quantity.value = this.workflowOptions ? this.workflowOptions.quantity : 1;

        let userId = this.cookieService.get('user_id');
        return this.userService.getSettings(userId).then(settings => {
            // we can't copy because those are 2 different types of addresses.
            const lineItem = this.requestForQuotation.requestForQuotationLine[0].lineItem;
            const address = lineItem.deliveryTerms.deliveryLocation.address;
            address.country.name = settings.address.country;
            address.postalZone = settings.address.postalCode;
            address.cityName = settings.address.cityName;
            address.buildingNumber = settings.address.buildingNumber;
            address.streetName = settings.address.streetName;
        });
    }

    initRfqWithIir(): void {
        let copyIir:ItemInformationResponse = copy(this.itemInformationResponse);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotationWithIir(
            copyIir,
            this.precedingBPDataService.fromAddress,
            this.precedingBPDataService.toAddress,
            this.precedingBPDataService.orderMetadata
        );
    }

    private initFetchedRfq(): void {
        const rfq = this.requestForQuotation;
        if(this.catalogueLines.length > 0 && this.catalogueLines[0]) {
            this.computeRfqNegotiationOptionsIfNeeded();
        }
        rfq.paymentMeans = rfq.paymentMeans || new PaymentMeans(new Code(PAYMENT_MEANS[0], PAYMENT_MEANS[0]));
        rfq.paymentTerms = rfq.paymentTerms || new PaymentTerms();
    }

    computeRfqNegotiationOptionsIfNeeded() {
        const rfq = this.requestForQuotation;
        if(!rfq.negotiationOptions) {
            rfq.negotiationOptions = new NegotiationOptions();
            
            const line = this.catalogueLines[0];
            const wrapper = new NegotiationModelWrapper(line, rfq, null);

            rfq.negotiationOptions.deliveryPeriod = wrapper.lineDeliveryPeriodString !== wrapper.rfqDeliveryPeriodString;
            rfq.negotiationOptions.incoterms = wrapper.lineIncoterms !== wrapper.rfqIncoterms;
            rfq.negotiationOptions.paymentMeans = wrapper.linePaymentMeans !== wrapper.rfqPaymentMeans;
            rfq.negotiationOptions.paymentTerms = wrapper.linePaymentTerms !== wrapper.rfqPaymentTermsToString;
            rfq.negotiationOptions.price = wrapper.lineTotalPriceString !== wrapper.rfqTotalPriceString;
            rfq.negotiationOptions.warranty = wrapper.lineWarrantyString !== wrapper.rfqWarrantyString;
        }
    }

    initPpap(documents:string[]):void{
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.ppap = UBLModelUtils.createPpap(documents);
        this.ppap.lineItem.item = this.modifiedCatalogueLines[0].goodsItem.item;
        this.ppap.lineItem.lineReference = [new LineReference(this.modifiedCatalogueLines[0].id)];
        this.selectFirstValuesAmongAlternatives(this.modifiedCatalogueLines[0].goodsItem.item);
    }

    initItemInformationRequest():void {
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.itemInformationRequest = UBLModelUtils.createItemInformationRequest();
        this.itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.modifiedCatalogueLines[0].goodsItem.item;
        this.selectFirstValuesAmongAlternatives(this.modifiedCatalogueLines[0].goodsItem.item);
    }

    initOrderWithQuotation() {
        let copyQuotation: Quotation = copy(this.quotation);
        let copyRfq = copy(this.requestForQuotation);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
        const copyLineItem = copyRfq.requestForQuotationLine[0].lineItem;
        this.order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = copyLineItem.deliveryTerms.deliveryLocation.address;
        this.order.paymentMeans = copyQuotation.paymentMeans;
        this.order.paymentTerms = copyQuotation.paymentTerms;

        this.order.anticipatedMonetaryTotal.payableAmount.currencyID = copyRfq.requestForQuotationLine[0].lineItem.price.priceAmount.currencyID;
        
        // this.order.anticipatedMonetaryTotal.payableAmount.value = copyQuotation.
        
        this.setProcessType('Order');
    }

    initOrderWithRfq() {
        let copyRfq = copy(this.requestForQuotation);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem = copyRfq.requestForQuotationLine[0].lineItem;
        const copyLineItem = copyRfq.requestForQuotationLine[0].lineItem;
        this.order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = copyLineItem.deliveryTerms.deliveryLocation.address;
        this.order.paymentMeans = copyRfq.paymentMeans;
        this.order.paymentTerms = copyRfq.paymentTerms;

        this.setProcessType('Order');
    }

    initRfqWithQuotation() {
        const copyQuotation = copy(this.quotation);
        const copyRfq = copy(this.requestForQuotation);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation(new NegotiationOptions());
        this.requestForQuotation.requestForQuotationLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
        this.requestForQuotation.paymentMeans = copyQuotation.paymentMeans;
        this.requestForQuotation.paymentTerms = copyQuotation.paymentTerms;
        this.requestForQuotation.delivery = copyRfq.delivery;
        this.requestForQuotation.dataMonitoringRequested = copyRfq.dataMonitoringRequested;
    }

    initRfqWithOrder() {
        let copyOrder:Order = copy(this.order);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation(new NegotiationOptions());
        this.requestForQuotation.requestForQuotationLine[0].lineItem = copyOrder.orderLine[0].lineItem;
        this.requestForQuotation.paymentTerms = copyOrder.paymentTerms;
        this.requestForQuotation.paymentMeans = copyOrder.paymentMeans;
    }

    initRfqWithTransportExecutionPlanRequest() {
        let copyTransportExecutionPlanRequest:TransportExecutionPlanRequest = copy(this.transportExecutionPlanRequest);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotationWithTransportExecutionPlanRequest(copyTransportExecutionPlanRequest,this.modifiedCatalogueLines[0]);
    }

    initDespatchAdvice(handlingInst:string,carrierName:string,carrierContact:string,deliveredQuantity:Quantity,endDate:string) {
        let copyOrder:Order = copy(this.order);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.despatchAdvice = UBLModelUtils.createDespatchAdvice(copyOrder);
        if(deliveredQuantity.unitCode == null){
            this.despatchAdvice.despatchLine[0].deliveredQuantity.unitCode = copyOrder.orderLine[0].lineItem.quantity.unitCode;
        }
        else {
            this.despatchAdvice.despatchLine[0].deliveredQuantity.unitCode = deliveredQuantity.unitCode;
        }

        this.despatchAdvice.despatchLine[0].deliveredQuantity.value = deliveredQuantity.value;
        this.despatchAdvice.despatchLine[0].shipment[0].handlingInstructions = handlingInst;
        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].carrierParty.name = carrierName;
        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].carrierParty.contact.telephone = carrierContact;
        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].estimatedDeliveryDate = endDate;
    }

    initTransportExecutionPlanRequest() {
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequest(this.modifiedCatalogueLines[0]);
        this.selectFirstValuesAmongAlternatives(this.modifiedCatalogueLines[0].goodsItem.item);
    }

    initTransportExecutionPlanRequestWithOrder() {
        this.resetBpData();
        this.setBpMessages('Order', this.searchContextService.associatedProcessMetadata);
        let copyOrder:Order = copy(this.order);
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithOrder(copyOrder, this.modifiedCatalogueLines[0]);

        this.requestForQuotation = UBLModelUtils.createRequestForQuotationWithOrder(copy(this.order),this.modifiedCatalogueLines[0]);

        this.selectFirstValuesAmongAlternatives(this.modifiedCatalogueLines[0].goodsItem.item);
    }

    initTransportExecutionPlanRequestWithIir(): void {
        let copyIir:ItemInformationResponse = copy(this.itemInformationResponse);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithIir(copyIir, this.precedingBPDataService.fromAddress, this.precedingBPDataService.toAddress, this.precedingBPDataService.orderMetadata);
    }

    initTransportExecutionPlanRequestWithQuotation() {
        let copyQuotation:Quotation = copy(this.quotation);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithQuotation(copyQuotation);
    }


    initTransportExecutionPlanRequestWithTransportExecutionPlanRequest(){
        let copyTransportExecutionPlanRequest:TransportExecutionPlanRequest = copy(this.transportExecutionPlanRequest);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequestWithTransportExecutionPlanRequest(copyTransportExecutionPlanRequest);
    }

    resetBpData():void {
        if(this.searchContextService.associatedProcessType == null) {
            this.setProcessType(null);
            this.previousProcess = null;
        }
        this.processMetadata = null;
        this.modifiedCatalogueLines = null;
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

    setProcessType(processType: ProcessType): void {
        this.processTypeSubject.next(processType);
    }

    getProcessType(): string {
        return this.processTypeSubject.getValue();
    }

    /********************************************************************************************
     * Methods to update the modified catalogue lines based on the user activities on the UI
     * For example, user would choose a particular dimension for the product to be ordered, or
     * the user may choose a particular value for the color of the product among many.
     * The modified objects reflect the user selections during the continuation of the process.
     ********************************************************************************************/

    selectFirstValuesAmongAlternatives(item: Item): void {
        this.chooseAllDimensions(item);
        this.chooseFirstValuesOfItemProperties(item);
    }

    /**
     * Updates modified catalogue line's dimensions with only the first occurrences of the dimension attributes
     */
    private chooseAllDimensions(item: Item): void {
        let dimensions:Dimension[] = item.dimension;
        let finalDimensions:Dimension[] = [];
        let chosenAttributes:string[] = [];

        for(let dim of dimensions) {
            // attribute is not selected yet
            if (chosenAttributes.findIndex(aid => aid == dim.attributeID) == -1) {
                chosenAttributes.push(dim.attributeID);
                finalDimensions.push(dim);
            }
        }
        item.dimension = finalDimensions;
    }

    private chooseFirstValuesOfItemProperties(item: Item): void {
        for(let i = 0; i < item.additionalItemProperty.length; i++) {
            const prop = item.additionalItemProperty[i];

            const key = getPropertyKey(prop);
            const indexToSelect = this.workflowOptions ? this.workflowOptions.selectedValues[key] || 0 : 0;

            switch(prop.valueQualifier) {
                case "STRING":
                    if(prop.value.length > 1) {
                        prop.value = [prop.value[indexToSelect]];
                    }
                    break;
                case "REAL_MEASURE":
                    if(prop.valueDecimal.length > 1) {
                        prop.valueDecimal = [prop.valueDecimal[indexToSelect]];
                    }
                    break;
                case "BOOLEAN":
                    if(prop.value.length > 1) {
                        prop.value = [prop.value[indexToSelect]];
                    }
                    break;
                case "QUANTITY":
                    if(prop.valueQuantity.length > 1) {
                        prop.valueQuantity = [prop.valueQuantity[0]];
                    }
                    break;
            }
        }
    }

    private getItemFromCurrentWorkflow(): Item {
        switch(this.processTypeSubject.getValue()) {
            case "Item_Information_Request":
                return this.itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item;
            case "Ppap":
                return this.ppap.lineItem.item;
            case "Negotiation":
                return this.requestForQuotation.requestForQuotationLine[0].lineItem.item;
            case "Order":
                return this.order.orderLine[0].lineItem.item;
            case "Transport_Execution_Plan":
                return null;
            case "Fulfilment":
                return this.despatchAdvice.despatchLine[0].item;
        }
    }

    computeWorkflowOptions() {
        if(!this.workflowOptions) {
            this.workflowOptions = new BpWorkflowOptions();

            // this item only contains the properties choosen by the user
            const item = this.getItemFromCurrentWorkflow();
    
            const line = this.catalogueLines[0];
            if(!item || !line) {
                return;
            }

            // negotiate the price if no price on the line
            const priceWrapper = new PriceWrapper(line.requiredItemLocationQuantity.price);
            if(!priceWrapper.hasPrice()) {
                this.workflowOptions.negotiation.price = true;
            }

            // this item contains all the properties.
            const lineItem = line.goodsItem.item;
    
            // set the selected property values
            for(let i = 0; i < lineItem.additionalItemProperty.length;i++) {
                const prop = lineItem.additionalItemProperty[i];
                const key = getPropertyKey(prop);
    
                const itemProp = item.additionalItemProperty[i];
    
                switch(prop.valueQualifier) {
                    case "STRING":
                    case "BOOLEAN":
                        if(prop.value.length > 1) {
                            for(let valIndex = 0; valIndex < prop.value.length; valIndex++) {
                                if(prop.value[valIndex] === itemProp.value[0]) {
                                    this.workflowOptions.selectedValues[key] = valIndex;
                                }
                            }
                        }
                        break;
                    case "REAL_MEASURE":
                        if(prop.valueDecimal.length > 1) {
                            if(prop.valueDecimal.length > 1) {
                                for(let valIndex = 0; valIndex < prop.valueDecimal.length; valIndex++) {
                                    if(prop.valueDecimal[valIndex] === itemProp.valueDecimal[0]) {
                                        this.workflowOptions.selectedValues[key] = valIndex;
                                    }
                                }
                            }
                        }
                        break;
                    case "QUANTITY":
                        if(prop.valueQuantity.length > 1) {
                            for(let valIndex = 0; valIndex < prop.valueQuantity.length; valIndex++) {
                                if(prop.valueQuantity[valIndex].value === itemProp.valueQuantity[0].value 
                                        && prop.valueQuantity[valIndex].unitCode === itemProp.valueQuantity[0].unitCode) {
                                    this.workflowOptions.selectedValues[key] = valIndex;
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    updateItemProperty(itemProperty:ItemProperty):void {
        if(itemProperty.valueQualifier == 'STRING') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => item.name == itemProperty.name);
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].value[0] = itemProperty.value[0];
        } else if(itemProperty.valueQualifier == 'REAL_MEASURE') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => item.name == itemProperty.name);
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].valueDecimal[0] = itemProperty.valueDecimal[0];
        } else if(itemProperty.valueQualifier == 'BOOLEAN') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => item.name == itemProperty.name);
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].value[0] = itemProperty.value[0];
        } else if(itemProperty.valueQualifier == 'QUANTITY') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => item.name == itemProperty.name);
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].valueQuantity[0] = itemProperty.valueQuantity[0];
        }
    }

    /**
     * Keeps only the selected value for the given attribute in the dimension array
     */

    updateDimension(attributeId:string, event: any):void {
        // update catalogueLine
        let allDimensions:Dimension[] = this.catalogueLines[0].goodsItem.item.dimension;
        let index = allDimensions.findIndex(dim => attributeId == dim.attributeID);
        let firstDim = this.catalogueLines[0].goodsItem.item.dimension[index];

        this.catalogueLines[0].goodsItem.item.dimension[index] = this.catalogueLines[0].goodsItem.item.dimension[index+event.target.selectedIndex];
        this.catalogueLines[0].goodsItem.item.dimension[index+event.target.selectedIndex] = firstDim;
        this.catalogueLines[0].goodsItem.item.dimension = [].concat(this.catalogueLines[0].goodsItem.item.dimension);

        // update modifiedCatalogueLine
        let dimensions:Dimension[] = this.modifiedCatalogueLines[0].goodsItem.item.dimension;
        let attIndexInModified = dimensions.findIndex(dim => attributeId == dim.attributeID);
        dimensions[attIndexInModified] = this.catalogueLines[0].goodsItem.item.dimension[index];
        this.modifiedCatalogueLines[0].goodsItem.item.dimension = dimensions;
    }
}
