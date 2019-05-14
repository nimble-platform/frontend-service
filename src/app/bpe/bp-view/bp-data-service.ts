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
import { BpWorkflowOptions } from "../model/bp-workflow-options";
import { NegotiationOptions } from "../../catalogue/model/publish/negotiation-options";
import {DEFAULT_LANGUAGE, PAYMENT_MEANS} from '../../catalogue/model/constants';
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import { ProcessType } from "../model/process-type";
import { PaymentMeans } from "../../catalogue/model/publish/payment-means";
import { Code } from "../../catalogue/model/publish/code";
import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import {copy, getPropertyKey, selectName} from '../../common/utils';
import { NegotiationModelWrapper } from "./negotiation/negotiation-model-wrapper";
import { PriceWrapper } from "../../common/price-wrapper";
import { Quantity } from "../../catalogue/model/publish/quantity";
import { CompanyNegotiationSettings } from "../../user-mgmt/model/company-negotiation-settings";
import { CompanySettings } from "../../user-mgmt/model/company-settings";
import {DocumentService} from "./document-service";
import {ShipmentStage} from "../../catalogue/model/publish/shipment-stage";
import {PartyName} from '../../catalogue/model/publish/party-name';
import {BpStartEvent} from '../../catalogue/model/publish/bp-start-event';
import {BpURLParams} from '../../catalogue/model/publish/bpURLParams';
import {Router} from '@angular/router';
import {Text} from '../../catalogue/model/publish/text';
import {Contract} from '../../catalogue/model/publish/contract';
import {Clause} from '../../catalogue/model/publish/clause';

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
    private companySettings: CompanySettings[] = [];
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
    //////// variables used when navigating to bp options details page //////
    ////////////////////////////////////////////////////////////////////////////

    // BpStartEvent is used to set bp options while navigating to bp details page
    bpStartEvent:BpStartEvent = new BpStartEvent(null,"Item_Information_Request",null,null,null);
    // these are used to update view according to the selected process type.
    private bpStartEventBehaviorSubject: BehaviorSubject<BpStartEvent> = new BehaviorSubject<BpStartEvent>(this.bpStartEvent);
    bpStartEventObservable = this.bpStartEventBehaviorSubject.asObservable();

    precedingProcessId: string;

    constructor(private searchContextService: SearchContextService,
                private precedingBPDataService: PrecedingBPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private documentService: DocumentService,
                private router: Router) {
    }

    setCatalogueLines(catalogueLines: CatalogueLine[], settings: CompanySettings[]): void {
        this.catalogueLines = [];
        this.relatedProducts = [];
        this.relatedProductCategories = [];
        this.companySettings = settings;

        for(let line of catalogueLines) {
            this.catalogueLines.push(line);
            this.relatedProducts.push(line.goodsItem.item.name[0].value);
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

    getCompanySettings(): CompanySettings {
        return this.companySettings[0];
    }

    private async setBpMessages(processMetadata: ThreadEventMetadata) {
        let activityVariables = processMetadata.activityVariables;
        let processType = processMetadata.processType;
        if(processType == 'Negotiation') {
            this.requestForQuotation = await this.documentService.getInitialDocument(activityVariables);
            this.initFetchedRfq();

            let quotationVariable = await this.documentService.getResponseDocument(activityVariables);
            if(quotationVariable == null) {
                // initialize the quotation only if the user is in seller role
                if(this.bpStartEvent.userRole == 'seller') {
                    this.quotation = copy(UBLModelUtils.createQuotation(this.requestForQuotation));
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
                if(this.bpStartEvent.userRole == 'seller') {
                    this.orderResponse = UBLModelUtils.createOrderResponseSimple(this.order, true);
                }

            } else {
                this.orderResponse = orderResponseVariable;
            }


        } else if(processType == 'Ppap'){
            this.ppap = await this.documentService.getInitialDocument(activityVariables);

            let ppapResponseVariable = await this.documentService.getResponseDocument(activityVariables);
            if(ppapResponseVariable == null) {
                if (this.bpStartEvent.userRole == 'seller') {
                    this.ppapResponse = UBLModelUtils.createPpapResponse(this.ppap, true);
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
                if(this.bpStartEvent.userRole == 'buyer') {
                    this.receiptAdvice = UBLModelUtils.createReceiptAdvice(this.despatchAdvice);
                }

            } else {
                this.receiptAdvice = receiptAdviceVariable;
            }

        } else if(processType == 'Transport_Execution_Plan') {
            this.transportExecutionPlanRequest = await this.documentService.getInitialDocument(activityVariables);

            let transportExecutionPlanVariable = await this.documentService.getResponseDocument(activityVariables);
            if(transportExecutionPlanVariable == null) {
                if(this.bpStartEvent.userRole == 'seller') {
                    this.transportExecutionPlan = UBLModelUtils.createTransportExecutionPlan(this.transportExecutionPlanRequest);
                }

            } else {
                this.transportExecutionPlan = transportExecutionPlanVariable;
            }

        } else if(processType == 'Item_Information_Request') {
            this.itemInformationRequest = await this.documentService.getInitialDocument(activityVariables);

            let itemInformationResponseVariable = await this.documentService.getResponseDocument(activityVariables);
            if(itemInformationResponseVariable == null) {
                if(this.bpStartEvent.userRole == 'seller') {
                    this.itemInformationResponse = UBLModelUtils.createItemInformationResponse(this.itemInformationRequest);
                }

            } else {
                this.itemInformationResponse = itemInformationResponseVariable;
            }
        }
    }

    // This function is used to start viewing business processes.
    // Dashboard and product-details are two way to start viewing business processes. For dashboard, business processes contain process document metadatas since
    // they are already started/completed. However, in the product-details page, we start a new business process, this is why we have a null check for processMetadata in the function.
    async startBp(bpStartEvent:BpStartEvent,clearSearchContext:boolean,bpURLParams:BpURLParams){
        this.resetBpData();
        if(clearSearchContext){
            this.searchContextService.clearSearchContext();
        }
        else {
            // If there is an associated process, we need to know collaboration group id since we will add the new process instance group to this collaboration group
            // Else, it is OK to reset collaboration group id since a new collaboration group will be created for the process.
            if(this.searchContextService.getAssociatedProcessType() == null){
                bpStartEvent.collaborationGroupId = null;
            }
        }

        this.bpStartEvent = bpStartEvent;
        if(bpStartEvent.processMetadata){
            await this.setBpMessages(bpStartEvent.processMetadata);
        }
        this.bpStartEventBehaviorSubject.next(this.bpStartEvent);
        this.navigateToBpExec(bpURLParams);
    }

    private navigateToBpExec(bpURLParams: BpURLParams){
        if(bpURLParams.processInstanceId){
            this.router.navigate(['bpe/bpe-exec'], {
                queryParams: {
                    catalogueId: bpURLParams.catalogueId,
                    id: bpURLParams.catalogueLineId,
                    pid: bpURLParams.processInstanceId
                }
            });
        }
        else {
            this.router.navigate(['bpe/bpe-exec'], {
                queryParams: {
                    catalogueId: bpURLParams.catalogueId,
                    id: bpURLParams.catalogueLineId
                }
            });
        }

    }

    // For business processes transitions (for example, from PPAP to Negotiation), we have to keep containerGroupId same since all processes are in the same process instance group
    // However, process type and userRole can be changed. Therefore, we use this function to update BpStartEvent correctly.
    // Moreover, processMetadata should be cleared since we will create a new business process.
    proceedNextBpStep(userRole: BpUserRole, processType:ProcessType){
        this.bpStartEvent.processType = processType;
        this.bpStartEvent.processMetadata = null;
        this.bpStartEventBehaviorSubject.next(new BpStartEvent(userRole,processType,this.bpStartEvent.containerGroupId,this.bpStartEvent.collaborationGroupId,this.bpStartEvent.processMetadata));
        // it is crucial to update userRole after updating process type. Otherwise, we will have problems while viewing transport execution plan details.
        this.bpStartEvent.userRole = userRole;
    }

    // this method is supposed to be called when the user is about to initialize a business process via the
    // search details page
    initRfq(settings: CompanyNegotiationSettings): Promise<void> {
        const rfq = UBLModelUtils.createRequestForQuotation(
            this.bpStartEvent.workflowOptions ? this.bpStartEvent.workflowOptions.negotiation : new NegotiationOptions(),
            settings
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
        rfqLine.lineItem.quantity.value = this.bpStartEvent.workflowOptions ? this.bpStartEvent.workflowOptions.quantity : 1;

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

    initRfqForTransportationWithOrder(order: Order): Promise<void> {
        this.requestForQuotation = UBLModelUtils.createRequestForQuotationWithOrder(
            copy(order),
            copy(this.catalogueLines[0])
        );
        return Promise.resolve();
    }

    async initRfqForTransportationWithThreadMetadata(thread: ThreadEventMetadata): Promise<void> {
        await this.setBpMessages(thread);
        return this.initRfqForTransportationWithOrder(this.order);
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
        this.computeRfqNegotiationOptionsIfNeededWithRfq(this.requestForQuotation);
    }

    computeRfqNegotiationOptionsIfNeededWithRfq(rfq: RequestForQuotation) {
        if(!rfq.negotiationOptions) {
            rfq.negotiationOptions = new NegotiationOptions();

            this.userService.getCompanyNegotiationSettingsForParty(UBLModelUtils.getPartyId(rfq.sellerSupplierParty.party)).then(res => {
                let settings: CompanyNegotiationSettings= res as CompanyNegotiationSettings;
                const line = this.catalogueLines[0];
                const wrapper = new NegotiationModelWrapper(line, rfq, null, settings);

                rfq.negotiationOptions.deliveryPeriod = wrapper.lineDeliveryPeriodString !== wrapper.rfqDeliveryPeriodString;
                rfq.negotiationOptions.incoterms = wrapper.lineIncoterms !== wrapper.rfqIncoterms;
                rfq.negotiationOptions.paymentMeans = wrapper.linePaymentMeans !== wrapper.rfqPaymentMeans;
                rfq.negotiationOptions.paymentTerms = wrapper.linePaymentTerms !== wrapper.rfqPaymentTermsToString;
                rfq.negotiationOptions.price = wrapper.lineTotalPriceString !== wrapper.rfqTotalPriceString;
                rfq.negotiationOptions.warranty = wrapper.lineWarrantyString !== wrapper.rfqWarrantyString;
            });
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

        // create a contract for Terms and Conditions
        let contract = new Contract();
        contract.id = UBLModelUtils.generateUUID();

        for(let clause of copyQuotation.termOrCondition){

            let newClause:Clause = JSON.parse(JSON.stringify(clause));
            newClause.id = UBLModelUtils.generateUUID();
            contract.clause.push(newClause);
        }
        // push contract to order.contract
        this.order.contract = [contract];
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

        // create a contract for Terms and Conditions
        let contract = new Contract();
        contract.id = UBLModelUtils.generateUUID();

        for(let clause of copyRfq.termOrCondition){

            let newClause:Clause = JSON.parse(JSON.stringify(clause));
            newClause.id = UBLModelUtils.generateUUID();
            contract.clause.push(newClause);
        }
        // push contract to order.contract
        this.order.contract = [contract];
    }

    initRfqWithQuotation() {
        const copyQuotation = copy(this.quotation);
        const copyRfq = copy(this.requestForQuotation);
        this.resetBpData();
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation(new NegotiationOptions(),null);
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
        this.requestForQuotation = UBLModelUtils.createRequestForQuotation(new NegotiationOptions(),null);
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

    initDispatchAdvice(handlingInst: Text, carrierName: string, carrierContact: string, deliveredQuantity: Quantity, endDate: string) {
        let copyOrder:Order;
        if(this.order){
            copyOrder = copy(this.order);
        }else{
            copyOrder = copy(this.productOrder)
        }

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
    }

    initTransportExecutionPlanRequest() {
        this.modifiedCatalogueLines = copy(this.catalogueLines);
        this.transportExecutionPlanRequest = UBLModelUtils.createTransportExecutionPlanRequest(this.modifiedCatalogueLines[0]);
        this.selectFirstValuesAmongAlternatives(this.modifiedCatalogueLines[0].goodsItem.item);

        if(this.quotation) {
            const quotationPeriod = this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod;
            this.transportExecutionPlanRequest.serviceStartTimePeriod.startDate = quotationPeriod.startDate;
            this.transportExecutionPlanRequest.serviceStartTimePeriod.endDate = quotationPeriod.endDate;
        }
    }

    async initTransportExecutionPlanRequestWithOrder() {
        this.resetBpData();
        await this.setBpMessages(this.searchContextService.getAssociatedProcessMetadata());
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
        this.bpStartEventBehaviorSubject.next(null);
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
            const indexToSelect = this.bpStartEvent.workflowOptions ? this.bpStartEvent.workflowOptions.selectedValues[key] || 0 : 0;

            switch(prop.valueQualifier) {
                case "STRING":
                    // Here, possible texts represent the values which can be chosen by the user in the product details page
                    let possibleTexts = this.getPossibleText(prop);
                    if(possibleTexts.length > 0){
                        // instead of possibleTexts, if we use prop variable, property value may be wrong.
                        prop.value = [possibleTexts[indexToSelect]];
                    }
                    break;
                case "NUMBER":
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
                        prop.valueQuantity = [prop.valueQuantity[indexToSelect]];
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
        switch(this.bpStartEventBehaviorSubject.getValue().processType) {
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

    computeWorkflowOptions() {
        if(!this.bpStartEvent.workflowOptions) {
            this.bpStartEvent.workflowOptions = new BpWorkflowOptions();

            // this item only contains the properties choosen by the user
            const item = this.getItemFromCurrentWorkflow();

            const line = this.catalogueLines[0];
            if(!item || !line) {
                return;
            }

            // negotiate the price if no price on the line
            const priceWrapper = new PriceWrapper(line.requiredItemLocationQuantity.price);
            if(!priceWrapper.hasPrice()) {
                this.bpStartEvent.workflowOptions.negotiation.price = true;
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
                                if(prop.value[valIndex].value === itemProp.value[0].value) {
                                    this.bpStartEvent.workflowOptions.selectedValues[key] = valIndex;
                                }
                            }
                        }
                        break;
                    case "NUMBER":
                        if(prop.valueDecimal.length > 1) {
                            if(prop.valueDecimal.length > 1) {
                                for(let valIndex = 0; valIndex < prop.valueDecimal.length; valIndex++) {
                                    if(prop.valueDecimal[valIndex] === itemProp.valueDecimal[0]) {
                                        this.bpStartEvent.workflowOptions.selectedValues[key] = valIndex;
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
                                    this.bpStartEvent.workflowOptions.selectedValues[key] = valIndex;
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
