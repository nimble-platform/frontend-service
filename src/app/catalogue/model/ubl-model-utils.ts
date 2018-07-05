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
import { NegotiationOptions } from "./publish/negotiation-options";
import { PAYMENT_MEANS, CURRENCIES } from "./constants";
import { TradingTerm } from "./publish/trading-term";
import { copy } from "../../common/utils";

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
            ? new Code(category.id, category.preferredName, category.categoryUri, category.taxonomyId, null) 
            : new Code(null, null, null, "Custom", null);

        if (property == null) {
            return new ItemProperty(this.generateUUID(), "", [], [], [], 
                new Array<BinaryObject>(), "STRING", code, null);
        }
        return new ItemProperty(property.id, property.preferredName, 
            property.dataType === "BOOLEAN" ? ["false"] : [], [], [], 
            new Array<BinaryObject>(), property.dataType, code, property.uri);
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        let code: Code = new Code(category.id, category.preferredName, category.categoryUri, category.taxonomyId, null);
        let commodityClassification = new CommodityClassification(code, null, null, "");
        return commodityClassification;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // price
        let price: Price = this.createPrice();
        // item location quantity
        let ilq: ItemLocationQuantity = new ItemLocationQuantity(price, []);
        return ilq;
    }

    public static createCatalogueLine(catalogueUuid:string, providerParty: Party): CatalogueLine {
        // create additional item properties
        let additionalItemProperties = new Array<ItemProperty>();

        // catalogue document reference
        let docRef:DocumentReference = new DocumentReference();
        docRef.id = catalogueUuid;

        // create item
        let uuid:string = this.generateUUID();
        let item = new Item("", "", [], [], additionalItemProperties, providerParty, this.createItemIdentificationWithId(uuid), docRef, [], [], [], null);

        // create goods item
        let goodsItem = new GoodsItem(uuid, item, this.createPackage(), this.createDeliveryTerms());

        // create required item location quantity
        let ilq = this.createItemLocationQuantity("");

        let catalogueLine = new CatalogueLine(uuid, null, null, false, this.createPeriod(), [], ilq, goodsItem);

        // extra initialization
        catalogueLine.goodsItem.containingPackage.quantity.unitCode = "item(s)";

        return catalogueLine;
    }

    public static createOrder():Order {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price: Price = this.createPrice();
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let orderLine:OrderLine = new OrderLine(lineItem);
        let order = new Order(this.generateUUID(), "", new Period(), new Address(), null, null, null, 
            this.getDefaultPaymentMeans(), this.getDefaultPaymentTerms(), new MonetaryTotal(), [orderLine]);
        return order;
    }

    public static createOrderResponseSimple(order:Order, acceptedIndicator:boolean):OrderResponseSimple {
        let orderReference:OrderReference = this.createOrderReference(order.id);
        this.removeHjidFieldsFromObject(order.buyerCustomerParty);
        this.removeHjidFieldsFromObject(order.sellerSupplierParty);
        let customerParty:CustomerParty = order.buyerCustomerParty;
        let supplierParty:SupplierParty = order.sellerSupplierParty;
        let orderResponseSimple:OrderResponseSimple = new OrderResponseSimple(this.generateUUID(), "", "", acceptedIndicator, orderReference, supplierParty, customerParty);
        return orderResponseSimple;
    }

    public static createPpap(documents:String[]):Ppap {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price: Price = this.createPrice();
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let ppap = new Ppap(this.generateUUID(), "",documents, null, null, lineItem);
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
        let ppapResponse:PpapResponse = new PpapResponse();
        ppapResponse.id = this.generateUUID();
        ppapResponse.ppapDocumentReference = new DocumentReference(ppap.id);
        this.removeHjidFieldsFromObject(ppap.buyerCustomerParty);
        this.removeHjidFieldsFromObject(ppap.sellerSupplierParty);
        ppapResponse.buyerCustomerParty = ppap.buyerCustomerParty;
        ppapResponse.sellerSupplierParty = ppap.sellerSupplierParty;
        ppapResponse.acceptedIndicator = acceptedIndicator;
        return ppapResponse;
    }



    public static createRequestForQuotation(negotiationOptions: NegotiationOptions):RequestForQuotation {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice();
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(),
        [requestForQuotationLine], negotiationOptions, this.getDefaultPaymentMeans(), this.getDefaultPaymentTerms());

        // TODO remove this custom dimension addition once the dimension-view is improved to handle such cases
        let handlingUnitDimension:Dimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Length';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        handlingUnitDimension = new Dimension();
        handlingUnitDimension.attributeID = 'Handling Unit Width';
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.transportHandlingUnit[0].measurementDimension.push(handlingUnitDimension);
        return rfq;
    }

    public static createRequestForQuotationWithOrder(order:Order,catalogueLine:CatalogueLine):RequestForQuotation{
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice();
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(), 
            [requestForQuotationLine], new NegotiationOptions(), this.getDefaultPaymentMeans(), this.getDefaultPaymentTerms());

        rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = order.orderLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
        rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = order.orderLine[0].lineItem.quantity;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.originAddress = order.orderLine[0].lineItem.item.manufacturerParty.postalAddress;
        rfq.requestForQuotationLine[0].lineItem.item.transportationServiceDetails = catalogueLine.goodsItem.item.transportationServiceDetails;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item.name = order.orderLine[0].lineItem.item.name;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = order.orderLine[0].lineItem.quantity;
        rfq.paymentTerms = order.paymentTerms;
        rfq.paymentMeans = order.paymentMeans;
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

    public static createRequestForQuotationWithTransportExecutionPlanRequest(transportExecutionPlanRequest:TransportExecutionPlanRequest,catalogueLine:CatalogueLine):RequestForQuotation{
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice();
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(), 
            [requestForQuotationLine], new NegotiationOptions(), this.getDefaultPaymentMeans(), this.getDefaultPaymentTerms());

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

    public static getDefaultPaymentTerms(): PaymentTerms {
        return new PaymentTerms([], [
            new TradingTerm("Payment_In_Advance","Payment in advance","PIA",["false"]),
            // new TradingTerm("Values_Net","e.g.,NET 10,payment 10 days after invoice date","Net %s",[null]),
            new TradingTerm("End_of_month","End of month","EOM",["false"]),
            new TradingTerm("Cash_next_delivery","Cash next delivery","CND",["false"]),
            new TradingTerm("Cash_before_shipment","Cash before shipment","CBS",["false"]),
            // new TradingTerm("Values_MFI","e.g.,21 MFI,21st of the month following invoice date","%s MFI", [null]),
            // new TradingTerm("Values_/NET","e.g.,1/10 NET 30,1% discount if payment received within 10 days otherwise payment 30 days after invoice date","%s/%s NET %s",[null,null,null]),
            new TradingTerm("Cash_on_delivery","Cash on delivery","COD",["false"]),
            new TradingTerm("Cash_with_order","Cash with order","CWO",["false"]),
            new TradingTerm("Cash_in_advance","Cash in advance","CIA",["false"]),
        ]);
    }

    public static getDefaultPaymentTermsAsStrings(): string[] {
        return this.getDefaultPaymentTerms().tradingTerms.map(term => {
            return term.tradingTermFormat + " - " + term.description
        })
    }

    public static getDefaultPaymentMeans(): PaymentMeans {
        return new PaymentMeans(new Code(PAYMENT_MEANS[0], PAYMENT_MEANS[0]));
    }

    public static createRequestForQuotationWithIir(iir: ItemInformationResponse, fromAddress: Address, toAddress: Address, orderMetadata: any): RequestForQuotation {
        let rfq: RequestForQuotation = this.createRequestForQuotation(new NegotiationOptions());
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
        let quotationLine: QuotationLine = new QuotationLine(copy(rfq.requestForQuotationLine[0].lineItem));
        this.removeHjidFieldsFromObject(rfq.buyerCustomerParty);
        this.removeHjidFieldsFromObject(rfq.sellerSupplierParty);
        let customerParty: CustomerParty = rfq.buyerCustomerParty;
        let supplierParty: SupplierParty = rfq.sellerSupplierParty;

        let documentReference: DocumentReference = new DocumentReference(rfq.id);

        let quotation = new Quotation(this.generateUUID(), [""], new Code(), new Code(), 1, false, documentReference, 
            customerParty, supplierParty, [quotationLine], rfq.paymentMeans, rfq.paymentTerms);
        return quotation;
    }

    public static createDespatchAdvice(order:Order):DespatchAdvice {
        let despatchAdvice:DespatchAdvice = new DespatchAdvice();
        despatchAdvice.id = this.generateUUID();
        despatchAdvice.orderReference = [UBLModelUtils.createOrderReference(order.id)];
        despatchAdvice.despatchLine = [new DespatchLine(new Quantity(), order.orderLine[0].lineItem.item, [new Shipment()])];
        despatchAdvice.despatchSupplierParty = order.sellerSupplierParty;
        despatchAdvice.deliveryCustomerParty = order.buyerCustomerParty;
        return despatchAdvice
    }

    public static createReceiptAdvice(despatchAdvice:DespatchAdvice):ReceiptAdvice {
        let receiptAdvice:ReceiptAdvice = new ReceiptAdvice();
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
        let transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(new Shipment());
        transportExecutionPlanRequest.mainTransportationService = transportationServiceLine.goodsItem.item;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest;
    }

    public static createTransportExecutionPlanRequestWithOrder(order:Order, transportationServiceLine:CatalogueLine):TransportExecutionPlanRequest {
        let transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
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
        let transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
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
        let transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.mainTransportationService = quotation.quotationLine[0].lineItem.item;
        transportExecutionPlanRequest.fromLocation.address = quotation.quotationLine[0].lineItem.delivery[0].shipment.originAddress;
        transportExecutionPlanRequest.toLocation.address = quotation.quotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(quotation.quotationLine[0].lineItem.delivery[0].shipment);
        transportExecutionPlanRequest.consignment[0].grossVolumeMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossVolumeMeasure;
        transportExecutionPlanRequest.consignment[0].grossWeightMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossWeightMeasure;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest
    }

    public static createTransportExecutionPlanRequestWithTransportExecutionPlanRequest(transportExecutionPlanRequest:TransportExecutionPlanRequest): TransportExecutionPlanRequest{
        let tep:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        tep = transportExecutionPlanRequest;
        tep.id = this.generateUUID();
        this.removeHjidFieldsFromObject(tep);
        return tep;
    }

    public static createTransportExecutionPlan(transportExecutionPlanRequest:TransportExecutionPlanRequest):TransportExecutionPlan {
        let transportExecutionPlan:TransportExecutionPlan = new TransportExecutionPlan();
        transportExecutionPlan.id = this.generateUUID();
        transportExecutionPlan.transportExecutionPlanRequestDocumentReference = new DocumentReference(transportExecutionPlanRequest.id);
        transportExecutionPlan.transportUserParty = transportExecutionPlanRequest.transportUserParty;
        transportExecutionPlan.transportServiceProviderParty = transportExecutionPlanRequest.transportServiceProviderParty;
        this.removeHjidFieldsFromObject(transportExecutionPlan);
        return transportExecutionPlan;
    }

    public static createItemInformationRequest():ItemInformationRequest {
        let itemInformationRequest:ItemInformationRequest = new ItemInformationRequest();
        itemInformationRequest.id = this.generateUUID();
        return itemInformationRequest;
    }

    public static createItemInformationResponse(itemInformationRequest:ItemInformationRequest):ItemInformationResponse {
        let itemInformationResponse:ItemInformationResponse = new ItemInformationResponse();
        itemInformationResponse.id = this.generateUUID();
        itemInformationResponse.itemInformationRequestDocumentReference = new DocumentReference(itemInformationRequest.id);
        itemInformationResponse.item[0] = JSON.parse(JSON.stringify(itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item));
        itemInformationResponse.item[0].itemSpecificationDocumentReference = [];
        itemInformationResponse.sellerSupplierParty = itemInformationRequest.sellerSupplierParty;
        itemInformationResponse.buyerCustomerParty = itemInformationResponse.buyerCustomerParty;
        this.removeHjidFieldsFromObject(itemInformationResponse);
        return itemInformationResponse;
    }

    public static createOrderReference(orderId:string):OrderReference {
        let documentReference:DocumentReference = new DocumentReference(orderId);
        let orderReference:OrderReference = new OrderReference(documentReference);
        return orderReference;
    }

    public static createItem():Item {
        let item = new Item("", "", [], [], [], null, this.createItemIdentification(), null, [], [], [], null);
        return item;
    }

    public static createLineItem(quantity, price, item):LineItem {
        return new LineItem(quantity, [], [new Delivery()], new DeliveryTerms(), price, item, new Period(), null);
    }

    public static createPackage():Package {
        return new Package(this.createQuantity(), new Code(), null);
    }

    public static createPrice(): Price {
        let amountObj: Amount = this.createAmountWithCurrency(CURRENCIES[0]);
        let quantity: Quantity = this.createQuantity();
        let price: Price = new Price(amountObj, quantity);
        return price;
    }

    public static createDeliveryTerms():DeliveryTerms {
        let deliveryTerms = new DeliveryTerms(null, this.createPeriod(), null, null, this.createAmount(), new Location(), null);
        return deliveryTerms;
    }

    public static createPeriod(): Period {
        return new Period(null, null, null, null, this.createQuantity(null, "Working days"), null);
    }

    public static createDimension(attributeId:string, unitCode:string):Dimension {
        let quantity:Quantity = this.createQuantity();
        quantity.unitCode = unitCode;
        return new Dimension(attributeId, quantity);
    }

    public static createAddress():Address {
        return new Address(null,null,null,null, this.createCountry());
    }

    public static createCountry():Country {
        return new Country(null);
    }

    public static createQuantity(value: number = 1, unit: string = "item(s)"):Quantity {
        return new Quantity(value, unit, null);
    }

    public static createAmount():Amount{
        let amount:Amount = new Amount(null, null);
        return amount;
    }

    public static createAmountWithCurrency(currency:string):Amount {
        return new Amount(0, currency);
    }

    public static createItemIdentificationWithId(id:string):ItemIdentification {
        return new ItemIdentification(id);
    }

    public static createItemIdentification():ItemIdentification {
        return this.createItemIdentificationWithId(this.generateUUID());
    }


    public static mapAddress(address): Address {
        let addr: Address = new Address();
        addr.buildingNumber = address.buildingNumber;
        addr.cityName = address.cityName;
        addr.postalZone = address.postalCode;
        addr.streetName = address.streetName;
        addr.country = new Country(address.country);
        return addr;
    }

    public static removeHjidFieldsFromObject(object:any):any {
        delete object.hjid;
        for (let field in object) {
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

}
