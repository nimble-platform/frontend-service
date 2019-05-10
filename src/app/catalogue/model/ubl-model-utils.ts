import {ItemProperty} from "./publish/item-property";
import {BinaryObject} from "./publish/binary-object";
import {CommodityClassification} from "./publish/commodity-classification";
import {Code} from "./publish/code";
import {Property} from "./category/property";
import {Category} from "./category/category";
import {Price} from "./publish/price";
import {Amount} from "./publish/amount";
import {ItemLocationQuantity} from "./publish/item-location-quantity";
import {Party} from "./publish/party";
import {Item} from "./publish/item";
import {GoodsItem} from "./publish/goods-item";
import {CatalogueLine} from "./publish/catalogue-line";
import {OrderReference} from "./publish/order-reference";
import {DocumentReference} from "./publish/document-reference";
import {Quantity} from "./publish/quantity";
import {LineItem} from "./publish/line-item";
import {OrderLine} from "./publish/order-line";
import {CustomerParty} from "./publish/customer-party";
import {SupplierParty} from "./publish/supplier-party";
import {DeliveryTerms} from "./publish/delivery-terms";
import {Period} from "./publish/period";
import {Package} from "./publish/package";
import {ItemIdentification} from "./publish/item-identification";
import {RequestForQuotationLine} from "./publish/request-for-quotation-line";
import {Delivery} from "./publish/delivery";
import {QuotationLine} from "./publish/quotation-line";
import {Dimension} from "./publish/dimension";
import {Country} from "./publish/country";
import {DespatchLine} from "./publish/despatch-line";
import {DespatchAdvice} from "./publish/despatch-advice";
import {ReceiptAdvice} from "./publish/receipt-advice";
import {ReceiptLine} from "./publish/receipt-line";
import {PaymentMeans} from "./publish/payment-means";
import {Order} from "./publish/order";
import {OrderResponseSimple} from "./publish/order-response-simple";
import {RequestForQuotation} from "./publish/request-for-quotation";
import {Quotation} from "./publish/quotation";
import {Location} from "./publish/location";
import {Ppap} from "./publish/ppap";
import {PpapResponse} from "./publish/ppap-response";
import {Shipment} from "./publish/shipment";
import {TransportExecutionPlanRequest} from "./publish/transport-execution-plan-request";
import {TransportExecutionPlan} from "./publish/transport-execution-plan";
import {ItemInformationRequest} from "./publish/item-information-request";
import {ItemInformationResponse} from "./publish/item-information-response";
import {PaymentTerms} from "./publish/payment-terms";
import {Address} from "./publish/address";
import {MonetaryTotal} from "./publish/monetary-total";
import {NegotiationOptions} from "./publish/negotiation-options";
import {CURRENCIES, DEFAULT_LANGUAGE} from "./constants";
import {TradingTerm} from "./publish/trading-term";
import {CompanyNegotiationSettings} from "../../user-mgmt/model/company-negotiation-settings";
import {ShipmentStage} from "./publish/shipment-stage";
import {copy, isNaNNullAware, selectPreferredName} from "../../common/utils";
import {Text} from "./publish/text";
import {Attachment} from "./publish/attachment";
import {LifeCyclePerformanceAssessmentDetails} from "./publish/life-cycle-performance-assessment-details";
import {PartyName} from './publish/party-name';
import {MultiTypeValue} from "./publish/multi-type-value";

/**
 * Created by suat on 05-Jul-17.
 */
export class UBLModelUtils {

    /**
     * Create a property based on the given property and category parameters.
     *
     * If the category is not null then a corresponding code is created and used in the item property to be returned. The
     * code refers to the category in the corresponding taxonomy is created. If the category is null, the code refers to
     * the "Custom" property.
     *
     * If the property is not null; unit, value qualifier, id and name is used from the given property. Fields keeping
     * actual data are still set to empty values.
     *
     * @param property
     * @param category
     * @returns {ItemProperty}
     */
    public static createAdditionalItemProperty(property: Property, category: Category): ItemProperty {
        const code: Code = category
            ? new Code(category.id, selectPreferredName(category), category.categoryUri, category.taxonomyId, null)
            : new Code(null, null, null, "Custom", null);

        if (property == null) {
            return new ItemProperty(this.generateUUID(), [], [], [], [],
                new Array<BinaryObject>(), "STRING", code, null);
        }

        let itemProperty = new ItemProperty(property.id, [],
            property.dataType === "BOOLEAN" ? [ new Text("false", "en" ) ] : [], [], [],
            new Array<BinaryObject>(), property.dataType, code, property.uri);

        itemProperty.name = [].concat(property.preferredName);
        return itemProperty;
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        const code: Code = new Code(category.id, selectPreferredName(category), category.categoryUri, category.taxonomyId, null);
        const commodityClassification = new CommodityClassification(code, null, null, "");
        return commodityClassification;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // price
        const price: Price = this.createPrice();
        // item location quantity
        const ilq: ItemLocationQuantity = new ItemLocationQuantity(price, [], [],null);
        return ilq;
    }

    public static createCatalogueLine(catalogueUuid:string, providerParty: Party,
        settings: CompanyNegotiationSettings,dimensionUnits:string[]=[]): CatalogueLine {
        // create additional item properties
        const additionalItemProperties = new Array<ItemProperty>();

        // catalogue document reference
        const docRef:DocumentReference = new DocumentReference();
        docRef.id = catalogueUuid;

        // create item
        const uuid:string = this.generateUUID();
        const item = new Item([], [], [], [], additionalItemProperties, providerParty, this.createItemIdentificationWithId(uuid), docRef, [], [], this.createDimensions(dimensionUnits), null);

        // create goods item
        const goodsItem = new GoodsItem(uuid, item, this.createPackage(),
            this.createDeliveryTerms(null, settings.deliveryPeriodUnits[0]));

        // create required item location quantity
        const ilq = this.createItemLocationQuantity("");
        const catalogueLine = new CatalogueLine(uuid, null, null, false,
            this.createPeriod(settings.warrantyPeriodRanges[0].start, settings.warrantyPeriodUnits[0]), [], ilq,[], goodsItem);

        // extra initialization
        catalogueLine.goodsItem.containingPackage.quantity.unitCode = "item(s)";

        return catalogueLine;
    }

    public static createCatalogueLinesForLogistics(catalogueUuid:string, providerParty: Party, settings: CompanyNegotiationSettings,logisticRelatedServices, eClassLogisticCategories:Category[],furnitureOntologyLogisticCategories:Category[]): Map<string,CatalogueLine>{
        let logisticCatalogueLines: Map<string,CatalogueLine> = new Map<string, CatalogueLine>();
        // if we have furniture ontology categories for logistics services,then use them.
        if(furnitureOntologyLogisticCategories){
            let furnitureOntologyLogisticRelatedServices = logisticRelatedServices["FurnitureOntology"];
            let eClassLogisticRelatedServices = logisticRelatedServices["eClass"];

            // for each service type, create a catalogue line
            for(let serviceType of Object.keys(furnitureOntologyLogisticRelatedServices)){
                // get corresponding furniture ontology category
                let furnitureOntologyCategory = this.getCorrespondingCategory(furnitureOntologyLogisticRelatedServices[serviceType],furnitureOntologyLogisticCategories);
                // get corresponding eClass category
                let eClassCategory = null;
                if(eClassLogisticCategories && eClassLogisticRelatedServices[serviceType]){
                    eClassCategory = this.getCorrespondingCategory(eClassLogisticRelatedServices[serviceType],eClassLogisticCategories);
                }

                // create the catalogue line
                let catalogueLine = this.createCatalogueLine(catalogueUuid,providerParty,settings);
                // add item name and descriptions
                let newItemName: Text = new Text("",DEFAULT_LANGUAGE());
                let newItemDescription: Text = new Text("",DEFAULT_LANGUAGE());
                catalogueLine.goodsItem.item.name.push(newItemName);
                catalogueLine.goodsItem.item.description.push(newItemDescription);
                // clear additional item properties
                catalogueLine.goodsItem.item.additionalItemProperty = [];
                // add additional item properties
                for(let property of furnitureOntologyCategory.properties){
                    catalogueLine.goodsItem.item.additionalItemProperty.push(this.createAdditionalItemProperty(property,furnitureOntologyCategory));
                }
                // add its default furniture ontology category
                catalogueLine.goodsItem.item.commodityClassification.push(this.createCommodityClassification(furnitureOntologyCategory));
                // add its default eClass category if exists
                if(eClassCategory){
                    catalogueLine.goodsItem.item.commodityClassification.push(this.createCommodityClassification(eClassCategory));
                }
                // push it to the list
                logisticCatalogueLines.set(serviceType,catalogueLine);
            }
            // create a dummy catalogue line to represent transport services
            let catalogueLine = this.createCatalogueLine(catalogueUuid,providerParty,settings);
            let category = this.getCorrespondingCategory(furnitureOntologyLogisticRelatedServices["ROADTRANSPORT"],furnitureOntologyLogisticCategories);
            for(let property of category.properties){
                catalogueLine.goodsItem.item.additionalItemProperty.push(this.createAdditionalItemProperty(property,category));
            }
            // push it to the list
            logisticCatalogueLines.set("TRANSPORT",catalogueLine);
        }

        return logisticCatalogueLines;
    }

    private static getCorrespondingCategory(categoryUri,logisticCategories:Category[]){
        for(let category of logisticCategories){
            if(category.id == categoryUri){
                return category;
            }
        }
    }

    public static createOrder(): Order {
        const quantity: Quantity = new Quantity(null, "", null);
        const item: Item = this.createItem();
        const price: Price = this.createPrice();
        const lineItem: LineItem = this.createLineItem(quantity, price, item);
        const orderLine: OrderLine = new OrderLine(lineItem);
        const settings = new CompanyNegotiationSettings();

        return new Order(this.generateUUID(), [''], new Period(), new Address(), null, null, null,
        this.getDefaultPaymentMeans(settings), this.getDefaultPaymentTerms(settings), new MonetaryTotal(), [orderLine]);
    }

    public static createOrderResponseSimple(order:Order, acceptedIndicator:boolean):OrderResponseSimple {
        const orderReference:OrderReference = this.createOrderReference(order.id);
        this.removeHjidFieldsFromObject(order.buyerCustomerParty);
        this.removeHjidFieldsFromObject(order.sellerSupplierParty);
        const customerParty:CustomerParty = order.buyerCustomerParty;
        const supplierParty:SupplierParty = order.sellerSupplierParty;
        const orderResponseSimple:OrderResponseSimple = new OrderResponseSimple(this.generateUUID(), [''], "", acceptedIndicator, orderReference, supplierParty, customerParty);
        return orderResponseSimple;
    }

    public static createPpap(documents:String[]):Ppap {
        const quantity:Quantity = new Quantity(null, "", null);
        const item:Item = this.createItem();
        const price: Price = this.createPrice();
        const lineItem:LineItem = this.createLineItem(quantity, price, item);
        const ppap = new Ppap(this.generateUUID(), [''],documents, null, null, lineItem);
        return ppap;
    }

    public static createPpapResponse(ppap:Ppap,acceptedIndicator:boolean):PpapResponse{
        /*
        let documentReference:DocumentReference = new DocumentReference(ppap.id);
        let ppapDocumentReference:PPAPDocumentReference = new PPAPDocumentReference(documentReference);
        this.removeHjidFieldsFromObject(ppap.buyerCustomerParty);
        this.removeHjidFieldsFromObject(ppap.sellerSupplierParty);
        let customerParty:CustomerParty = ppap.buyerCustomerParty;
        let supplierParty:SupplierParty = ppap.sellerSupplierParty;
        let ppapResponse:PpapResponse = new PpapResponse("","",acceptedIndicator,customerParty,supplierParty,null,documentReference);
        return ppapResponse;*/
        const ppapResponse:PpapResponse = new PpapResponse();
        ppapResponse.id = this.generateUUID();
        ppapResponse.ppapDocumentReference = new DocumentReference(ppap.id);
        this.removeHjidFieldsFromObject(ppap.buyerCustomerParty);
        this.removeHjidFieldsFromObject(ppap.sellerSupplierParty);
        ppapResponse.buyerCustomerParty = ppap.buyerCustomerParty;
        ppapResponse.sellerSupplierParty = ppap.sellerSupplierParty;
        ppapResponse.acceptedIndicator = acceptedIndicator;
        return ppapResponse;
    }

    public static createRequestForQuotation(negotiationOptions: NegotiationOptions, settings: CompanyNegotiationSettings): RequestForQuotation {
        if(settings == null){
            settings = new CompanyNegotiationSettings();
        }
        const quantity: Quantity = new Quantity(null, "", null);
        const item: Item = this.createItem();
        const price: Price = this.createPrice();
        const lineItem: LineItem = this.createLineItem(quantity, price, item);
        const requestForQuotationLine: RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        const rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(),
        [requestForQuotationLine], negotiationOptions, this.getDefaultPaymentMeans(settings), this.getDefaultPaymentTerms(settings));

        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension: Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        return rfq;
    }

    public static createRequestForQuotationWithOrder(order: Order, catalogueLine: CatalogueLine):RequestForQuotation{
        const quantity: Quantity = new Quantity(null, "", null);
        const item: Item = catalogueLine.goodsItem.item;
        const price: Price = catalogueLine.requiredItemLocationQuantity.price;
        const lineItem: LineItem = this.createLineItem(quantity, price, item);
        const requestForQuotationLine: RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        const rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(),
            [requestForQuotationLine], new NegotiationOptions(), null, null);

        rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = order.orderLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
        rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = order.orderLine[0].lineItem.quantity;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.originAddress = order.orderLine[0].lineItem.item.manufacturerParty.postalAddress;
        rfq.requestForQuotationLine[0].lineItem.item.transportationServiceDetails = catalogueLine.goodsItem.item.transportationServiceDetails;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item.name = order.orderLine[0].lineItem.item.name;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = order.orderLine[0].lineItem.quantity;
        rfq.paymentTerms = copy(order.paymentTerms);
        rfq.paymentMeans = copy(order.paymentMeans);
        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension:Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        this.removeHjidFieldsFromObject(rfq);

        return rfq;
    }

    public static createRequestForQuotationWithTransportExecutionPlanRequest(
        transportExecutionPlanRequest: TransportExecutionPlanRequest,catalogueLine: CatalogueLine): RequestForQuotation{
        const quantity:Quantity = new Quantity(null, "", null);
        const item:Item = this.createItem();
        const price:Price = this.createPrice();
        const lineItem:LineItem = this.createLineItem(quantity, price, item);
        const requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        const settings = new CompanyNegotiationSettings();
        const rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(),
            [requestForQuotationLine], new NegotiationOptions(), this.getDefaultPaymentMeans(settings), this.getDefaultPaymentTerms(settings));

        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item.name = transportExecutionPlanRequest.consignment[0].consolidatedShipment[0].goodsItem[0].item.name;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossVolumeMeasure = transportExecutionPlanRequest.consignment[0].grossVolumeMeasure;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossWeightMeasure = transportExecutionPlanRequest.consignment[0].grossWeightMeasure;
        rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = transportExecutionPlanRequest.toLocation.address;
        rfq.requestForQuotationLine[0].lineItem.item.transportationServiceDetails = catalogueLine.goodsItem.item.transportationServiceDetails;

        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension:Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        this.removeHjidFieldsFromObject(rfq);

        return rfq;
    }

    public static getDefaultPaymentTerms(settings?: CompanyNegotiationSettings): PaymentTerms {
        const terms = new PaymentTerms([], [
            new TradingTerm("Payment_In_Advance",[new Text("Payment in advance")],"PIA", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            // new TradingTerm("Values_Net","e.g.,NET 10,payment 10 days after invoice date","Net %s",[null]),
            new TradingTerm("End_of_month",[new Text("End of month")],"EOM", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_next_delivery",[new Text("Cash next delivery")],"CND", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_before_shipment",[new Text("Cash before shipment")],"CBS", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            // new TradingTerm("Values_MFI","e.g.,21 MFI,21st of the month following invoice date","%s MFI", [null]),
            // new TradingTerm("Values_/NET","e.g.,1/10 NET 30,1% discount if payment received within 10 days otherwise payment 30 days after invoice date","%s/%s NET %s",[null,null,null]),
            new TradingTerm("Cash_on_delivery",[new Text("Cash on delivery")],"COD", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_with_order",[new Text("Cash with order")],"CWO", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
            new TradingTerm("Cash_in_advance",[new Text("Cash in advance")],"CIA", new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)),
        ]);

        if(settings) {
            for(const term of terms.tradingTerms) {
                term.value.value[0].value = this.tradingTermToString(term) === settings.paymentTerms[0] ? "true" : "false";
            }
        }

        return terms;
    }

    public static getDefaultPaymentTermsAsStrings(settings?: CompanyNegotiationSettings): string[] {
        return this.getDefaultPaymentTerms(settings).tradingTerms.map(term => {
            return this.tradingTermToString(term);
        })
    }

    private static tradingTermToString(term: TradingTerm): string {
        return term.tradingTermFormat + " - " + term.description[0].value;
    }

    private static getDefaultPaymentMeans(settings: CompanyNegotiationSettings): PaymentMeans {
        return new PaymentMeans(new Code(settings.paymentMeans[0], settings.paymentMeans[0]));
    }

    public static createRequestForQuotationWithIir(iir: ItemInformationResponse, fromAddress: Address, toAddress: Address, orderMetadata: any): RequestForQuotation {
        const rfq: RequestForQuotation = this.createRequestForQuotation(new NegotiationOptions(), null);
        rfq.requestForQuotationLine[0].lineItem.item = iir.item[0];
        if(iir.item[0].transportationServiceDetails != null) {
            rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.originAddress = fromAddress;
            rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = toAddress;
            rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item.name = orderMetadata.content.orderLine[0].lineItem.item.name;
            rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = orderMetadata.content.orderLine[0].lineItem.quantity;
        }
        this.removeHjidFieldsFromObject(rfq);
        return rfq;
    }

    public static createQuotation(rfq: RequestForQuotation): Quotation {
        const quotationLine: QuotationLine = new QuotationLine(copy(rfq.requestForQuotationLine[0].lineItem));
        // set start and end dates
        quotationLine.lineItem.delivery[0].requestedDeliveryPeriod.startDate = rfq.delivery.requestedDeliveryPeriod.startDate;
        quotationLine.lineItem.delivery[0].requestedDeliveryPeriod.endDate = rfq.delivery.requestedDeliveryPeriod.endDate;
        this.removeHjidFieldsFromObject(rfq.buyerCustomerParty);
        this.removeHjidFieldsFromObject(rfq.sellerSupplierParty);
        const customerParty: CustomerParty = rfq.buyerCustomerParty;
        const supplierParty: SupplierParty = rfq.sellerSupplierParty;

        const documentReference: DocumentReference = new DocumentReference(rfq.id);

        const quotation = new Quotation(this.generateUUID(), [""], new Code(), new Code(), 1, false, documentReference,
            customerParty, supplierParty, [quotationLine], rfq.paymentMeans, rfq.paymentTerms);
        return quotation;
    }

    public static createDespatchAdvice(order:Order):DespatchAdvice {
        const despatchAdvice:DespatchAdvice = new DespatchAdvice();
        despatchAdvice.id = this.generateUUID();
        despatchAdvice.orderReference = [UBLModelUtils.createOrderReference(order.id)];
        despatchAdvice.despatchLine = [new DespatchLine(new Quantity(), order.orderLine[0].lineItem.item, [new Shipment()])];
        despatchAdvice.despatchLine[0].shipment[0].shipmentStage.push(new ShipmentStage());
        despatchAdvice.despatchSupplierParty = order.sellerSupplierParty;
        despatchAdvice.deliveryCustomerParty = order.buyerCustomerParty;
        return despatchAdvice
    }

    public static createReceiptAdvice(despatchAdvice:DespatchAdvice):ReceiptAdvice {
        const receiptAdvice:ReceiptAdvice = new ReceiptAdvice();
        receiptAdvice.id = this.generateUUID();
        receiptAdvice.orderReference = [copy(despatchAdvice.orderReference[0])];
        receiptAdvice.despatchDocumentReference = [new DocumentReference(despatchAdvice.id)];
        receiptAdvice.deliveryCustomerParty = despatchAdvice.deliveryCustomerParty;
        receiptAdvice.despatchSupplierParty = despatchAdvice.despatchSupplierParty;
        receiptAdvice.receiptLine = [
            new ReceiptLine(new Quantity(0, despatchAdvice.despatchLine[0].deliveredQuantity.unitCode),
                [], despatchAdvice.despatchLine[0].item)];
        return receiptAdvice;
    }

    public static createTransportExecutionPlanRequest(transportationServiceLine:CatalogueLine): TransportExecutionPlanRequest {
        const transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(new Shipment());
        transportExecutionPlanRequest.mainTransportationService = transportationServiceLine.goodsItem.item;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest;
    }

    public static createTransportExecutionPlanRequestWithOrder(order:Order, transportationServiceLine:CatalogueLine):TransportExecutionPlanRequest {
        const transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(new Shipment());
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.mainTransportationService = transportationServiceLine.goodsItem.item;
        transportExecutionPlanRequest.toLocation.address = order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        transportExecutionPlanRequest.fromLocation.address = order.orderLine[0].lineItem.item.manufacturerParty.postalAddress;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment[0].goodsItem[0].item = order.orderLine[0].lineItem.item;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest
    }

    public static createTransportExecutionPlanRequestWithIir(iir: ItemInformationResponse, fromAddress: Address, toAddress:Address, orderMetadata: any): TransportExecutionPlanRequest {
        const transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(new Shipment());
        transportExecutionPlanRequest.mainTransportationService = iir.item[0];
        transportExecutionPlanRequest.toLocation.address = toAddress;
        transportExecutionPlanRequest.fromLocation.address = fromAddress;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment[0].goodsItem[0].item.name = orderMetadata.content.orderLine[0].lineItem.item.name;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest;
    }

    public static createTransportExecutionPlanRequestWithQuotation(quotation:Quotation): TransportExecutionPlanRequest {
        const transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.mainTransportationService = quotation.quotationLine[0].lineItem.item;
        transportExecutionPlanRequest.fromLocation.address = quotation.quotationLine[0].lineItem.delivery[0].shipment.originAddress;
        transportExecutionPlanRequest.toLocation.address = quotation.quotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(quotation.quotationLine[0].lineItem.delivery[0].shipment);
        transportExecutionPlanRequest.consignment[0].grossVolumeMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossVolumeMeasure;
        transportExecutionPlanRequest.consignment[0].grossWeightMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossWeightMeasure;
        transportExecutionPlanRequest.serviceStartTimePeriod.startDate = quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.startDate;
        transportExecutionPlanRequest.serviceStartTimePeriod.endDate = quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.endDate;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest
    }

    public static createTransportExecutionPlanRequestWithTransportExecutionPlanRequest(
        transportExecutionPlanRequest: TransportExecutionPlanRequest): TransportExecutionPlanRequest{
        let tep = copy(transportExecutionPlanRequest);
        tep.id = this.generateUUID();
        this.removeHjidFieldsFromObject(tep);
        return tep;
    }

    public static createTransportExecutionPlan(transportExecutionPlanRequest:TransportExecutionPlanRequest):TransportExecutionPlan {
        const transportExecutionPlan:TransportExecutionPlan = new TransportExecutionPlan();
        transportExecutionPlan.id = this.generateUUID();
        transportExecutionPlan.transportExecutionPlanRequestDocumentReference = new DocumentReference(transportExecutionPlanRequest.id);
        transportExecutionPlan.transportUserParty = transportExecutionPlanRequest.transportUserParty;
        transportExecutionPlan.transportServiceProviderParty = transportExecutionPlanRequest.transportServiceProviderParty;
        this.removeHjidFieldsFromObject(transportExecutionPlan);
        return transportExecutionPlan;
    }

    public static createItemInformationRequest():ItemInformationRequest {
        const itemInformationRequest:ItemInformationRequest = new ItemInformationRequest();
        itemInformationRequest.id = this.generateUUID();
        return itemInformationRequest;
    }

    public static createItemInformationResponse(itemInformationRequest:ItemInformationRequest):ItemInformationResponse {
        const itemInformationResponse:ItemInformationResponse = new ItemInformationResponse();
        itemInformationResponse.id = this.generateUUID();
        itemInformationResponse.itemInformationRequestDocumentReference = new DocumentReference(itemInformationRequest.id);
        itemInformationResponse.item[0] = JSON.parse(JSON.stringify(itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item));
        itemInformationResponse.item[0].itemSpecificationDocumentReference = [];
        itemInformationResponse.sellerSupplierParty = itemInformationRequest.sellerSupplierParty;
        itemInformationResponse.buyerCustomerParty = itemInformationRequest.buyerCustomerParty;
        this.removeHjidFieldsFromObject(itemInformationResponse);
        return itemInformationResponse;
    }

    public static createOrderReference(orderId:string):OrderReference {
        const documentReference:DocumentReference = new DocumentReference(orderId);
        const orderReference:OrderReference = new OrderReference(documentReference);
        return orderReference;
    }

    public static createDocumentReferenceWithBinaryObject(binaryObject: BinaryObject): DocumentReference {
        let attachment:Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        let documentReference: DocumentReference = new DocumentReference();
        documentReference.attachment = attachment;
        return documentReference;
    }

    public static createItem():Item {
        const item = new Item([], [], [], [], [], null, this.createItemIdentification(), null, [], [], [], null);
        return item;
    }

    public static createDimensions(dimensionUnits:string[]):Dimension[]{
        let dimensions:Dimension[] = [];
        for(let unit of dimensionUnits){
            let unitName = unit.charAt(0).toUpperCase() + unit.slice(1);
            dimensions.push(new Dimension(unitName));
        }
        return dimensions;
    }

    public static createLineItem(quantity, price, item):LineItem {
        return new LineItem(quantity, [], [new Delivery()], new DeliveryTerms(), price, item, new Period(), null);
    }

    public static createPackage():Package {
        return new Package(this.createQuantity(), new Code(), null);
    }

    public static createPrice(): Price {
        const amountObj: Amount = this.createAmountWithCurrency(CURRENCIES[0]);
        const quantity: Quantity = this.createQuantity();
        const price: Price = new Price(amountObj, quantity);
        return price;
    }

    private static createDeliveryTerms(value: number = null, unit: string = "day(s)"): DeliveryTerms {
        const deliveryTerms = new DeliveryTerms(null, this.createPeriod(value, unit),
            null, null, this.createAmount(), new Location(), null);
        return deliveryTerms;
    }

    private static createPeriod(value: number = null, unit: string = "day(s)"): Period {
        return new Period(null, null, null, null, this.createQuantity(value, unit), null);
    }

    public static createDimension(attributeId:string, unitCode:string):Dimension {
        const quantity:Quantity = this.createQuantity();
        quantity.unitCode = unitCode;
        return new Dimension(attributeId, quantity);
    }

    public static createAddress():Address {
        return new Address(null,null,null,null,null, this.createCountry());
    }

    public static createCountry():Country {
        return new Country(null);
    }

    public static createQuantity(value: number = 1, unit: string = "item(s)"):Quantity {
        return new Quantity(value, unit, null);
    }

    public static createAmount():Amount{
        const amount:Amount = new Amount(null, null);
        return amount;
    }

    public static createAmountWithCurrency(currency:string):Amount {
        return new Amount(null, currency);
    }

    public static createItemIdentificationWithId(id:string):ItemIdentification {
        return new ItemIdentification(id);
    }

    public static createItemIdentification():ItemIdentification {
        return this.createItemIdentificationWithId(this.generateUUID());
    }


    public static mapAddress(address): Address {
        const addr: Address = new Address();
        addr.buildingNumber = address.buildingNumber;
        addr.cityName = address.cityName;
        addr.region = address.region;
        addr.postalZone = address.postalCode;
        addr.streetName = address.streetName;
        addr.country = new Country(address.country);
        return addr;
    }

    public static removeHjidFieldsFromObject(object:any):any {
        delete object.hjid;
        delete object.startDateItem;
        delete object.startTimeItem;
        delete object.endDateItem;
        delete object.endTimeItem;
        delete object.estimatedDeliveryDateItem;
        for (const field in object) {
            if(object.hasOwnProperty(field) && object[field] != null && typeof(object[field]) === 'object') {
                this.removeHjidFieldsFromObject(object[field]);
            }
        }
        return object;
    }

    public static generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    public static getPartyId(party: Party):string{
        return party.partyIdentification[0].id;
    }

    public static getPartyDisplayName(party: Party):string{
        return this.getPartyDisplayNameForPartyName(party.partyName);
    }

    public static getPartyDisplayNameForPartyName(partyNames: PartyName[]):string{
        let defaultLanguage = DEFAULT_LANGUAGE();

        let englishName = null;
        for(let partyName of partyNames){
            if(partyName.name.languageID == "en"){
                englishName = partyName.name.value;
            }
            if(partyName.name.languageID == defaultLanguage){
                return partyName.name.value;
            }
        }

        if(englishName){
            return englishName;
        }
        return partyNames[0].name.value;
    }

    public static isFilledLCPAInput(lcpaDetails: LifeCyclePerformanceAssessmentDetails): boolean {
        if(lcpaDetails.lcpainput == null) {
            return false;
        }
        let lcpaInput = lcpaDetails.lcpainput;

        if(!isNaNNullAware(lcpaInput.assemblyCost.value) ||
            !isNaNNullAware(lcpaInput.consumableCost.value) ||
            !isNaNNullAware(lcpaInput.endOfLifeCost.value) ||
            !isNaNNullAware(lcpaInput.energyConsumptionCost.value) ||
            !isNaNNullAware(lcpaInput.lifeCycleLength.value) ||
            !isNaNNullAware(lcpaInput.purchasingPrice.value) ||
            !isNaNNullAware(lcpaInput.sparePartCost.value) ||
            !isNaNNullAware(lcpaInput.transportCost.value) ||
            lcpaInput.additionalLCPAInputDetail.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    public static isFilledLCPAOutput(lcpaDetails: LifeCyclePerformanceAssessmentDetails): boolean {
        return false;
    }

    public static isEmptyQuantity(quantity:Quantity | Amount): boolean {
        if(quantity.value == null) {
            return true;
        }
        return false;
    }
}
