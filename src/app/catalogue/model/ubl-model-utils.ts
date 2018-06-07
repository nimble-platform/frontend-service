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
import {Address} from "./publish/address";
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
import {TransportationService} from "./publish/transportation-service";
import {TransportExecutionPlan} from "./publish/transport-execution-plan";
import {Consignment} from "./publish/consignment";
import {ItemInformationRequest} from "./publish/item-information-request";
import {ItemInformationResponse} from "./publish/item-information-response";
import {PaymentTerms} from './publish/payment-terms';
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
        let taxonomyId: string;
        let code: Code;

        if (category !== null) {
            code = new Code(category.id, category.preferredName, category.categoryUri, category.taxonomyId, null);
        }
        else {
            code = new Code(null, null, null, "Custom", null);
        }

        let aip: ItemProperty;
        if (property == null) {
            aip = new ItemProperty(this.generateUUID(), "", [], [], [], new Array<BinaryObject>(), "STRING", code, null);
        } else {
            let valueQualifier = property.dataType;
            let number;
            let quantity:Quantity = this.createQuantity();
            aip = new ItemProperty(property.id, property.preferredName, [''], [number], [quantity], new Array<BinaryObject>(), valueQualifier, code, property.uri);
        }
        return aip;
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        let code: Code = new Code(category.id, category.preferredName, category.categoryUri, category.taxonomyId, null);
        let commodityClassification = new CommodityClassification(code, null, null, "");
        return commodityClassification;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // price
        let price: Price = this.createPrice(null);
        // item location quantity
        let ilq: ItemLocationQuantity = new ItemLocationQuantity(price, null);
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
        return catalogueLine;
    }

    public static createOrder():Order {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price: Price = this.createPrice(null);
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let orderLine:OrderLine = new OrderLine(lineItem);
        let order = new Order(this.generateUUID(), "", new Period(), new Address(), null, null, null, new PaymentMeans(),new PaymentTerms() ,[orderLine]);
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
        let price: Price = this.createPrice(null);
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



    public static createRequestForQuotation():RequestForQuotation {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice(null)
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(), [requestForQuotationLine]);

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
        let price:Price = this.createPrice(null);
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(), [requestForQuotationLine]);

        rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = order.orderLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
        rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address = order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        rfq.requestForQuotationLine[0].lineItem.item.transportationServiceDetails = catalogueLine.goodsItem.item.transportationServiceDetails;

        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item.name = order.orderLine[0].lineItem.item.name;
        rfq.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity = order.orderLine[0].lineItem.quantity;

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
        let price:Price = this.createPrice(null);
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let rfq = new RequestForQuotation(this.generateUUID(), [""], false, null, null, new Delivery(), [requestForQuotationLine]);

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

    public static createQuotation(rfq:RequestForQuotation):Quotation {
        let quotationLine:QuotationLine = new QuotationLine(rfq.requestForQuotationLine[0].lineItem);
        this.removeHjidFieldsFromObject(rfq.buyerCustomerParty);
        this.removeHjidFieldsFromObject(rfq.sellerSupplierParty);
        let customerParty:CustomerParty = rfq.buyerCustomerParty;
        let supplierParty:SupplierParty = rfq.sellerSupplierParty;

        let documentReference:DocumentReference = new DocumentReference(rfq.id);

        let quotation = new Quotation(this.generateUUID(), [""], new Code(), new Code(), 1, false, documentReference, customerParty, supplierParty, [quotationLine]);
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
        receiptAdvice.orderReference = [JSON.parse(JSON.stringify(despatchAdvice.orderReference))];
        receiptAdvice.despatchDocumentReference = [new DocumentReference(despatchAdvice.id)];
        receiptAdvice.deliveryCustomerParty = despatchAdvice.deliveryCustomerParty;
        receiptAdvice.despatchSupplierParty = despatchAdvice.despatchSupplierParty;
        receiptAdvice.receiptLine = [new ReceiptLine(new Quantity(), [], despatchAdvice.despatchLine[0].item)];
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
        transportExecutionPlanRequest.consignment[0].consolidatedShipment[0].goodsItem[0].item = order.orderLine[0].lineItem.item;
        this.removeHjidFieldsFromObject(transportExecutionPlanRequest);
        return transportExecutionPlanRequest
    }

    public static createTransportExecutionPlanRequestWithQuotation(quotation:Quotation): TransportExecutionPlanRequest {
        let transportExecutionPlanRequest:TransportExecutionPlanRequest = new TransportExecutionPlanRequest();
        transportExecutionPlanRequest.id = this.generateUUID();
        transportExecutionPlanRequest.mainTransportationService = quotation.quotationLine[0].lineItem.item;
        transportExecutionPlanRequest.toLocation.address = quotation.quotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
        transportExecutionPlanRequest.consignment[0].grossWeightMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossWeightMeasure;
        transportExecutionPlanRequest.consignment[0].grossVolumeMeasure = quotation.quotationLine[0].lineItem.delivery[0].shipment.consignment[0].grossVolumeMeasure;
        let shipment = new Shipment();
        shipment.goodsItem[0].item = quotation.quotationLine[0].lineItem.delivery[0].shipment.goodsItem[0].item;
        transportExecutionPlanRequest.consignment[0].consolidatedShipment.push(shipment);
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

    public static createPrice(amount: string): Price {
        // create amount
        if(amount == null) {
            amount = "";
        }
        let amountObj: Amount = this.createAmountWithCurrency("");
        let quantity: Quantity = this.createQuantity();
        let price: Price = new Price(amountObj, quantity);
        return price;
    }

    public static createDeliveryTerms():DeliveryTerms {
        let deliveryTerms = new DeliveryTerms(null, this.createPeriod(), null, null, this.createAmount(), new Location(), null);
        return deliveryTerms;
    }

    public static createPeriod():Period {
        let period:Period = new Period(null, null, null, null, this.createQuantity(), null);
        return period;
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

    public static createQuantity():Quantity {
        return this.createQuantityWithUnit(null);
    }

    public static createQuantityWithUnit(unit:string):Quantity {
        return new Quantity(null, unit, null);
    }

    public static createAmount():Amount{
        let amount:Amount = new Amount(null, null);
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
