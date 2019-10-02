import { CatalogueLine } from "../../catalogue/model/publish/catalogue-line";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import { LineReference } from "../../catalogue/model/publish/line-reference";
import { Injectable } from "@angular/core";
import { ItemProperty } from "../../catalogue/model/publish/item-property";
import { Item } from "../../catalogue/model/publish/item";
import { Dimension } from "../../catalogue/model/publish/dimension";
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
import {DEFAULT_LANGUAGE, PAYMENT_MEANS, PROCESSES} from '../../catalogue/model/constants';
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import { ProcessType } from "../model/process-type";
import { PaymentMeans } from "../../catalogue/model/publish/payment-means";
import { Code } from "../../catalogue/model/publish/code";
import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import {copy, getPropertyKey, selectName} from '../../common/utils';
import { PriceWrapper } from "../../common/price-wrapper";
import { Quantity } from "../../catalogue/model/publish/quantity";
import { CompanyNegotiationSettings } from "../../user-mgmt/model/company-negotiation-settings";
import { CompanySettings } from "../../user-mgmt/model/company-settings";
import {DocumentService} from "./document-service";
import {ShipmentStage} from "../../catalogue/model/publish/shipment-stage";
import {PartyName} from '../../catalogue/model/publish/party-name';
import {BpActivityEvent} from '../../catalogue/model/publish/bp-start-event';
import {Router} from '@angular/router';
import {Text} from '../../catalogue/model/publish/text';
import {Contract} from '../../catalogue/model/publish/contract';
import {Clause} from '../../catalogue/model/publish/clause';
import {Observable} from "rxjs/Rx";

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
    // the company settings for the producers of the catalogue lines
    private sellerSettings: CompanySettings[] = [];
    // the company settings of the current user
    currentUserSettings: CompanySettings;

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
    /** Set for logistics service, when following an order for a physical product. */
    productOrder: Order;

    ////////////////////////////////////////////////////////////////////////////
    // Variables used to keep a copy of documents while switching between business process views
    // e.g. from negotiation to negotiation itself or from negotiation to order. Process documents are reset by
    // resetBp method in some cases such as above, we need to keep a copy of the relevant documents.
    ////////////////////////////////////////////////////////////////////////////
    copyRequestForQuotation: RequestForQuotation;
    copyQuotation: Quotation;
    copyOrder: Order;

    ////////////////////////////////////////////////////////////////////////////
    // variables used when navigating to bp options details page //////
    ////////////////////////////////////////////////////////////////////////////

    // BpActivityEvent is used to set bp options while navigating to bp details page
    bpActivityEvent:BpActivityEvent = null;
    // these are used to update view according to the selected process type.
    private bpActivityEventBehaviorSubject: BehaviorSubject<BpActivityEvent> = new BehaviorSubject<BpActivityEvent>(this.bpActivityEvent);
    bpActivityEventObservable: Observable<BpActivityEvent> = this.bpActivityEventBehaviorSubject.asObservable();

    precedingProcessId: string;
    precedingDocumentId: string;

    constructor(private searchContextService: SearchContextService,
                private precedingBPDataService: PrecedingBPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                public documentService: DocumentService,
                private router: Router) {
    }

    setProductAndCompanyInformation(catalogueLines: CatalogueLine[], sellerSettings: CompanySettings): void {
        this.catalogueLines = [];
        this.relatedProducts = [];
        this.relatedProductCategories = [];
        this.sellerSettings = [sellerSettings];

        for(let line of catalogueLines) {
            this.catalogueLines.push(line);
            this.relatedProducts.push(line.goodsItem.item.name[0].value);
            for(let category of line.goodsItem.item.commodityClassification) {
                if(this.relatedProductCategories.indexOf(category.itemClassificationCode.name) == -1) {
                    this.relatedProductCategories.push(category.itemClassificationCode.name);
                }
            }
        }

        // select the first values from the product properties
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.modifiedCatalogueLines[0].goodsItem.item = copy(this.bpActivityEvent.itemWithSelectedProperties);
    }

    getCatalogueLine(): CatalogueLine {
        return this.catalogueLines[0];
    }

    getCompanySettings(): CompanySettings {
        return this.sellerSettings[0];
    }

    private async setProcessDocuments(processMetadata: ThreadEventMetadata) {
        let activityVariables = processMetadata.activityVariables;
        let processType = processMetadata.processType;
        if(processType == 'Negotiation') {
            this.requestForQuotation = await this.documentService.getInitialDocument(activityVariables);
            this.initFetchedRfq();

            let quotationVariable = await this.documentService.getResponseDocument(activityVariables);
            if(quotationVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.bpActivityEvent.userRole == 'seller') {
                    this.quotation = copy(UBLModelUtils.createQuotationWithRfqCopy(this.requestForQuotation));
                }

            } else {
                this.quotation = quotationVariable;
                this.order = UBLModelUtils.createOrder();
                this.order.orderLine[0].lineItem = this.quotation.quotationLine[0].lineItem;
            }

        } else if(processType == 'Order') {
            this.order = await this.documentService.getInitialDocument(activityVariables);

            let orderResponseVariable = await this.documentService.getResponseDocument(activityVariables);
            if(orderResponseVariable == null) {
                // initialize the order response only if the user is in seller role
                if(this.bpActivityEvent.userRole == 'seller') {
                    this.orderResponse = UBLModelUtils.createOrderResponseSimpleWithOrderCopy(this.order, true);
                }

            } else {
                this.orderResponse = orderResponseVariable;
            }


        } else if(processType == 'Ppap'){
            this.ppap = await this.documentService.getInitialDocument(activityVariables);

            let ppapResponseVariable = await this.documentService.getResponseDocument(activityVariables);
            if(ppapResponseVariable == null) {
                if (this.bpActivityEvent.userRole == 'seller') {
                    this.ppapResponse = UBLModelUtils.createPpapResponseWithPpapCopy(this.ppap, true);
                }
            }
            else{
                this.ppapResponse = ppapResponseVariable;
            }

        } else if(processType == 'Fulfilment') {
            this.despatchAdvice = await this.documentService.getInitialDocument(activityVariables);

            let receiptAdviceVariable = await this.documentService.getResponseDocument(activityVariables);
            if(receiptAdviceVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.bpActivityEvent.userRole == 'buyer') {
                    this.receiptAdvice = UBLModelUtils.createReceiptAdviceWithDespatchAdviceCopy(this.despatchAdvice);
                }

            } else {
                this.receiptAdvice = receiptAdviceVariable;
            }

        } else if(processType == 'Transport_Execution_Plan') {
            this.transportExecutionPlanRequest = await this.documentService.getInitialDocument(activityVariables);

            let transportExecutionPlanVariable = await this.documentService.getResponseDocument(activityVariables);
            if(transportExecutionPlanVariable == null) {
                if(this.bpActivityEvent.userRole == 'seller') {
                    this.transportExecutionPlan = UBLModelUtils.createTEPlanWithTERequestCopy(this.transportExecutionPlanRequest);
                }

            } else {
                this.transportExecutionPlan = transportExecutionPlanVariable;
            }

        } else if(processType == 'Item_Information_Request') {
            this.itemInformationRequest = await this.documentService.getInitialDocument(activityVariables);

            let itemInformationResponseVariable = await this.documentService.getResponseDocument(activityVariables);
            if(itemInformationResponseVariable == null) {
                if(this.bpActivityEvent.userRole == 'seller') {
                    this.itemInformationResponse = UBLModelUtils.createIIResponseWithIIRequestCopy(this.itemInformationRequest);
                }

            } else {
                this.itemInformationResponse = itemInformationResponseVariable;
            }
        }
    }

    /*
     This function is used to view business processes. Dashboard and product-details are two way to start viewing business processes.
     For dashboard, business process history contains process document metadatas since they are already started/completed.
     However, in the product-details page, we start a new business process, this is why we check for new process processMetadata.
     */
    async startBp(bpActivityEvent: BpActivityEvent, clearSearchContext:boolean){
        this.resetBpData();
        if(clearSearchContext){
            this.searchContextService.clearSearchContext();
        }

        this.bpActivityEvent = bpActivityEvent;
        // if the event is not created for a new process, processMetadata contains the process metadata for the continued process
        if(!bpActivityEvent.newProcess){
            await this.setProcessDocuments(bpActivityEvent.processMetadata);
        }
        this.navigateToBpExec();
    }

    private navigateToBpExec() {
        let processInstanceId;
        if (this.bpActivityEvent.newProcess) {
            processInstanceId = 'new';
        } else {
            processInstanceId = this.bpActivityEvent.processMetadata.processInstanceId;
        }

        this.router.navigate([`bpe/bpe-exec/${processInstanceId}`]).then(() => {
            this.bpActivityEventBehaviorSubject.next(this.bpActivityEvent);
        });
    }

    /*
     This method creates a new BpActivityEvent upon proceeding to a next business process from the current step.
     It fires this event without initiating a new navigation. The method does not create a new navigation but emits a new
     BpActivityEvent, which would caught by the ProductBpOptions component, resulting in displaying the corresponding business process view.

     For business processes transitions (for example, from PPAP to Negotiation), we have to keep containerGroupId same
     since all processes are in the same process instance group. However, process type and userRole can be changed.
     Therefore, we use this function to update BpActivityEvent correctly. Moreover, processMetadata should be cleared
     since we will create a new business process.
     */
    proceedNextBpStep(userRole: BpUserRole, processType:ProcessType){
        this.resetBpData();

        let bpStartEvent: BpActivityEvent = new BpActivityEvent(
            userRole,
            processType,
            this.bpActivityEvent.containerGroupId,
            null,
            this.bpActivityEvent.processHistory,
            this.bpActivityEvent.itemWithSelectedProperties, // continue with the item having the same configurations
            this.bpActivityEvent.itemQuantity,
            true, // new process is true
            false, // as this is a new process there is no subsequent process after this one
            // we get the following values from the previous bp activity event
            // as they are the same for the BpActivityEvent generated for the request document
            this.bpActivityEvent.catalogueId,
            this.bpActivityEvent.catalogueLineId,
            this.bpActivityEvent.previousProcessInstanceId,
            this.bpActivityEvent.previousDocumentId,
            null);
        this.bpActivityEvent = bpStartEvent;
        // this event is listened by the product-bp-options.component where the displayed process view is adjusted
        this.bpActivityEventBehaviorSubject.next(bpStartEvent);

        // TODO make getting the user role and process type more systematic, we should not have a logic as below
        // it is crucial to update userRole after updating process type. Otherwise, we will have problems while viewing transport execution plan details.
        this.bpActivityEvent.userRole = userRole;
        //
        // // We return an empty promise in order to have a callback following after calling this method. The main intention to have
        // // such a callback is to set the relevant document as it is nullified by calling the resetBpData.
        // return new Promise<void>();
    }

    setCopyDocuments(rfq: boolean, quotation: boolean, order: boolean): void {
        if (rfq) {
            this.copyRequestForQuotation = this.requestForQuotation;
        } else {
            this.copyRequestForQuotation = null;
        }
        if (quotation) {
            this.copyQuotation = this.quotation;
        } else {
            this.copyQuotation = null;
        }
        if (order) {
            this.copyOrder = this.order;
        } else {
            this.copyOrder = null;
        }
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initRfq(settings: CompanyNegotiationSettings): Promise<void> {
        const rfq = UBLModelUtils.createRequestForQuotation(settings);
        this.requestForQuotation = rfq;

        const copyLine = copy(this.modifiedCatalogueLines[0]);
        const rfqLine = this.requestForQuotation.requestForQuotationLine[0];

        rfqLine.lineItem.item = copyLine.goodsItem.item;
        rfqLine.lineItem.lineReference = [new LineReference(copyLine.id)];
        const linePriceWrapper = new PriceWrapper(
            copyLine.requiredItemLocationQuantity.price,
            copyLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        if(linePriceWrapper.itemPrice.hasPrice()) {
            rfqLine.lineItem.price = copyLine.requiredItemLocationQuantity.price;
        } else {
            rfqLine.lineItem.price.priceAmount.value = 1;
        }
        rfqLine.lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = copyLine.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
        rfqLine.lineItem.warrantyValidityPeriod = copyLine.warrantyValidityPeriod;
        rfqLine.lineItem.deliveryTerms.incoterms = copyLine.goodsItem.deliveryTerms.incoterms;
        rfqLine.lineItem.quantity.unitCode = copyLine.requiredItemLocationQuantity.price.baseQuantity.unitCode;

        // quantity
        rfqLine.lineItem.quantity.value = this.bpActivityEvent.itemQuantity ? this.bpActivityEvent.itemQuantity.value : 1;

        let userId = this.cookieService.get('user_id');
        return this.userService.getSettingsForUser(userId).then(settings => {
            // we can't copy because those are 2 different types of addresses.
            const lineItem = this.requestForQuotation.requestForQuotationLine[0].lineItem;
            const address = lineItem.deliveryTerms.deliveryLocation.address;
            address.country.name = new Text(settings.details.address.country,DEFAULT_LANGUAGE());
            address.postalZone = settings.details.address.postalCode;
            address.cityName = settings.details.address.cityName;
            address.region = settings.details.address.region;
            address.buildingNumber = settings.details.address.buildingNumber;
            address.streetName = settings.details.address.streetName;
        });
    }

    initRfqForTransportationWithOrder(order: Order): void {
        this.requestForQuotation = UBLModelUtils.createRequestForQuotationWithCopies(order, this.modifiedCatalogueLines[0]);
    }

    async initRfqForTransportationWithThreadMetadata(thread: ThreadEventMetadata): Promise<void> {
        await this.setProcessDocuments(thread);
        this.initRfqForTransportationWithOrder(this.order);
        return Promise.resolve();
    }

    private initFetchedRfq(): void {
        const rfq = this.requestForQuotation;
        rfq.paymentMeans = rfq.paymentMeans || new PaymentMeans(new Code(PAYMENT_MEANS[0], PAYMENT_MEANS[0]));
        rfq.paymentTerms = rfq.paymentTerms || new PaymentTerms();
    }

    initPpap(documents:string[]):void{
        let copyItem: Item = UBLModelUtils.removeHjidFieldsFromObject(copy(this.modifiedCatalogueLines[0].goodsItem.item));
        this.ppap = UBLModelUtils.createPpap(documents);
        this.ppap.lineItem.item = copyItem;
        this.ppap.lineItem.lineReference = [new LineReference(this.modifiedCatalogueLines[0].id)];
    }

    initItemInformationRequest():void {
        let copyItem: Item = UBLModelUtils.removeHjidFieldsFromObject(copy(this.modifiedCatalogueLines[0].goodsItem.item));
        this.itemInformationRequest = UBLModelUtils.createItemInformationRequest();
        this.itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = copyItem;
    }

    initOrderWithQuotation() {
        let copyQuotation: Quotation = copy(this.copyQuotation);
        let copyRfq = copy(this.copyRequestForQuotation);
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
        const copyLineItem = copyRfq.requestForQuotationLine[0].lineItem;
        this.order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = copyLineItem.deliveryTerms.deliveryLocation.address;
        this.order.paymentMeans = copyQuotation.paymentMeans;
        this.order.paymentTerms = copyQuotation.paymentTerms;

        this.order.anticipatedMonetaryTotal.payableAmount.currencyID = copyRfq.requestForQuotationLine[0].lineItem.price.priceAmount.currencyID;

        // create a contract for Terms and Conditions
        let contract = new Contract();
        contract.id = UBLModelUtils.generateUUID();

        for(let clause of copyQuotation.termOrCondition){
            let newClause:Clause = JSON.parse(JSON.stringify(clause));
            contract.clause.push(newClause);
        }
        // push contract to order.contract
        this.order.contract = [contract];

        UBLModelUtils.removeHjidFieldsFromObject(this.order);
    }

    initOrderWithRfq() {
        let copyRfq = copy(this.copyRequestForQuotation);
        this.order = UBLModelUtils.createOrder();
        this.order.orderLine[0].lineItem = copyRfq.requestForQuotationLine[0].lineItem;
        const copyLineItem = copyRfq.requestForQuotationLine[0].lineItem;
        this.order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address = copyLineItem.deliveryTerms.deliveryLocation.address;
        this.order.paymentMeans = copyRfq.paymentMeans;
        this.order.paymentTerms = copyRfq.paymentTerms;

        // create a contract for Terms and Conditions
        let contract = new Contract();
        contract.id = UBLModelUtils.generateUUID();

        for(let clause of copyRfq.termOrCondition){
            let newClause:Clause = JSON.parse(JSON.stringify(clause));
            contract.clause.push(newClause);
        }
        // push contract to order.contract
        this.order.contract = [contract];
        UBLModelUtils.removeHjidFieldsFromObject(this.order);
    }

    initRfqWithQuotation() {
        const copyQuotation = copy(this.copyQuotation);
        const copyRfq = copy(this.copyRequestForQuotation);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation(null);
        this.requestForQuotation.requestForQuotationLine[0].lineItem = copyQuotation.quotationLine[0].lineItem;
        this.requestForQuotation.paymentMeans = copyQuotation.paymentMeans;
        this.requestForQuotation.paymentTerms = copyQuotation.paymentTerms;
        this.requestForQuotation.tradingTerms = copyQuotation.tradingTerms;
        this.requestForQuotation.termOrCondition = copyQuotation.termOrCondition;
        this.requestForQuotation.delivery = copyQuotation.quotationLine[0].lineItem.delivery[0];
        this.requestForQuotation.dataMonitoringRequested = copyRfq.dataMonitoringRequested;

        UBLModelUtils.removeHjidFieldsFromObject(this.requestForQuotation);
    }

    initDispatchAdvice(handlingInst: Text, carrierName: string, carrierContact: string, deliveredQuantity: Quantity, endDate: string) {
        let copyOrder:Order;
        if (this.copyOrder) {
            copyOrder = copy(this.copyOrder);
        } else {
            copyOrder = copy(this.productOrder)
        }

        this.despatchAdvice = UBLModelUtils.createDespatchAdviceWithOrderCopy(copyOrder);
        if(deliveredQuantity.unitCode == null){
            this.despatchAdvice.despatchLine[0].deliveredQuantity.unitCode = copyOrder.orderLine[0].lineItem.quantity.unitCode;
        }
        else {
            this.despatchAdvice.despatchLine[0].deliveredQuantity.unitCode = deliveredQuantity.unitCode;
        }

        this.despatchAdvice.despatchLine[0].deliveredQuantity.value = deliveredQuantity.value;
        if(handlingInst){
            this.despatchAdvice.despatchLine[0].shipment[0].handlingInstructions = [handlingInst];
        }else{
            this.despatchAdvice.despatchLine[0].shipment[0].handlingInstructions = [new Text("",DEFAULT_LANGUAGE())];
        }

        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage.push(new ShipmentStage());

        let partyName: PartyName = new PartyName();
        partyName.name.value = carrierName;
        partyName.name.languageID = DEFAULT_LANGUAGE();

        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].carrierParty.partyName= [partyName];
        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].carrierParty.contact.telephone = carrierContact;
        this.despatchAdvice.despatchLine[0].shipment[0].shipmentStage[0].estimatedDeliveryDate = endDate;

        UBLModelUtils.removeHjidFieldsFromObject(this.despatchAdvice);
    }

    initTransportExecutionPlanRequestWithQuotation() {
        this.transportExecutionPlanRequest = UBLModelUtils.createTEPlanRequestWithQuotationCopy(this.copyQuotation);
    }

    resetBpData():void {
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
    }

    // checks whether the given process is the final step in the workflow or not
    isFinalProcessInTheWorkflow(processId:string){
        let companyWorkflow = this.getCompanySettings().negotiationSettings.company.processID;
        // if there is no workflow specified, then consider the default flow
        // Fulfilment or TEP is the final step in the default flow
        if((!companyWorkflow || companyWorkflow.length == 0) && (processId == "Fulfilment" || processId == "Transport_Execution_Plan")){
            return true;
        }
        return companyWorkflow[companyWorkflow.length-1] == processId;
    }

    // it retrieves the company's business workflow through settings and construct a workflow map
    // key is the id of process and value is true/false (whether this process is included in company's workflow or not)
    getCompanyWorkflowMap(companyWorkflow: string[]) {
        if (companyWorkflow == null) {
            companyWorkflow = this.getCompanySettings().negotiationSettings.company.processID;
        }

        let workflowMap = new Map();
        for(let process of PROCESSES){
            if(companyWorkflow.length == 0){
                workflowMap.set(process.id,true);
            }
            else if(companyWorkflow.indexOf(process.id) != -1){
                workflowMap.set(process.id,true);
            }
            else{
                workflowMap.set(process.id,false);
            }
        }
        return workflowMap;
    }

    /********************************************************************************************
     * Methods to update the modified catalogue lines based on the user activities on the UI
     * For example, user would choose a particular dimension for the product to be ordered, or
     * the user may choose a particular value for the color of the product among many.
     * The modified objects reflect the user selections during the continuation of the process.
     ********************************************************************************************/

    selectFirstValuesAmongAlternatives(item: Item, associatedProducts: CatalogueLine[]): void {
        this.chooseAllDimensions(item);
        this.chooseFirstValuesOfItemProperties(item, associatedProducts);
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

    private chooseFirstValuesOfItemProperties(item: Item, associatedProducts: CatalogueLine[]): void {
        for(let i = 0; i < item.additionalItemProperty.length; i++) {
            const prop = item.additionalItemProperty[i];

            const key = getPropertyKey(prop);

            switch(prop.valueQualifier) {
                case "STRING":
                    // Here, possible texts represent the values which can be chosen by the user in the product details page
                    let possibleTexts = this.getPossibleText(prop);
                    if(possibleTexts.length > 0){
                        // instead of possibleTexts, if we use prop variable, property value may be wrong.
                        prop.value = [possibleTexts[0]];

                        // update the associated item id
                        if (prop.associatedCatalogueLineID != null && prop.associatedCatalogueLineID.length > 0) {
                            // find the corresponding product id
                            let foundProduct = false;
                            for (let associatedProduct of associatedProducts) {
                                // checking the names of the associated product against the selected value
                                if (UBLModelUtils.doesTextArraysContainText(associatedProduct.goodsItem.item.name, prop.value[0])) {
                                    prop.associatedCatalogueLineID = [associatedProduct.hjid];
                                    foundProduct = true;
                                    break;
                                }
                            }
                            // Somehow, most probably because of an update in the associated product or values not linked to any product,
                            // the selected value cannot be existing product. Therefore, we clear the associated catalogue line id list
                            // to prevent wrong association.
                            if (!foundProduct) {
                                prop.associatedCatalogueLineID = [];
                            }
                        }
                    }
                    break;
                case "NUMBER":
                    if(prop.valueDecimal.length > 1) {
                        prop.valueDecimal = [prop.valueDecimal[0]];
                    }
                    break;
                case "BOOLEAN":
                    if(prop.value.length > 1) {
                        prop.value = [prop.value[0]];
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

    // For the given item property, this function returns all values for the default language of the browser
    // if there's no value for the default language of the browser, it returns english values
    private getPossibleText(itemProperty:ItemProperty):Text[]{
        let texts = [];
        let defaultLanguage = DEFAULT_LANGUAGE();
        let englishTexts = [];
        for (let text of itemProperty.value) {
            if(text.languageID === defaultLanguage) {
                texts.push(text);
            }
            else if(text.languageID == "en"){
                englishTexts.push(text);
            }
        }
        // there are values for the default language of the browser
        if(texts.length > 0){
            return texts;
        }
        // there are english values
        if(englishTexts.length > 0){
            return englishTexts;
        }

        return [];
    }

    private getItemFromCurrentWorkflow(): Item {
        switch(this.bpActivityEventBehaviorSubject.getValue().processType) {
            case "Item_Information_Request":
                return this.itemInformationRequest ? this.itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item : null;
            case "Ppap":
                return this.ppap ? this.ppap.lineItem.item : null;
            case "Negotiation":
                return this.requestForQuotation ? this.requestForQuotation.requestForQuotationLine[0].lineItem.item : null;
            case "Order":
                return this.order ? this.order.orderLine[0].lineItem.item : null;
            case "Transport_Execution_Plan":
                return null;
            case "Fulfilment":
                return this.despatchAdvice ? this.despatchAdvice.despatchLine[0].item : null;
        }
    }

    updateItemProperty(itemProperty:ItemProperty):void {
        if(itemProperty.valueQualifier == 'STRING') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => selectName(item) == selectName(itemProperty));
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].value[0] = itemProperty.value[0];
        } else if(itemProperty.valueQualifier == 'NUMBER') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => selectName(item) == selectName(itemProperty));
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].valueDecimal[0] = itemProperty.valueDecimal[0];
        } else if(itemProperty.valueQualifier == 'BOOLEAN') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => selectName(item) == selectName(itemProperty));
            this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty[index].value[0] = itemProperty.value[0];
        } else if(itemProperty.valueQualifier == 'QUANTITY') {
            let index = this.modifiedCatalogueLines[0].goodsItem.item.additionalItemProperty.findIndex(item => selectName(item) == selectName(itemProperty));
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
