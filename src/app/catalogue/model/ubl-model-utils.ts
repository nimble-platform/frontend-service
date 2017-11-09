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
import {OrderReference} from "../../bpe/model/order-reference";
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
import {Shipment} from "./publish/shipment";
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
            code = new Code(category.id, category.preferredName, category.taxonomyId, null);
        }
        else {
            code = new Code(null, null, "Custom", null);
        }

        let aip: ItemProperty;
        if (property == null) {
            aip = new ItemProperty(this.generateUUID(), "", [], [], [], new Array<BinaryObject>(), "", "", "STRING", code, "", null);
        }
        else {
            let unit = "";
            if (property.unit != null) {
                unit = property.unit.shortName;
            }
            let valueQualifier = property.dataType;

            let number;
            let quantity:Quantity = this.createQuantity();
            aip = new ItemProperty(property.id, property.preferredName, [''], [number], [quantity], new Array<BinaryObject>(), "", unit,
                valueQualifier, code, "", null);
        }
        return aip;
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        let code: Code = new Code(category.id, category.preferredName, category.taxonomyId, null);
        let commodityClassification = new CommodityClassification(code, null, null, "", "");
        return commodityClassification;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // price
        let price: Price = this.createPrice(null);
        // item location quantity
        let ilq: ItemLocationQuantity = new ItemLocationQuantity(price, null, null, []);
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
        let item = new Item("", "", [], false, additionalItemProperties, providerParty, this.createItemIdentificationWithId(uuid), docRef, null, [], [], [], null, null, [], "");

        // create goods item
        let goodsItem = new GoodsItem(uuid, item, this.createPackage(), this.createDeliveryTerms());

        // create required item location quantity
        let ilq = this.createItemLocationQuantity("");

        let catalogueLine = new CatalogueLine(uuid, null, null, this.createPeriod(), [], ilq, goodsItem);
        return catalogueLine;
    }

    public static createOrder():Order {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price: Price = this.createPrice(null);
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let orderLine:OrderLine = new OrderLine(lineItem);
        let order = new Order(this.generateUUID(), "", new Period(), new Address(), null, null, new PaymentMeans(), [orderLine]);
        return order;
    }

    public static createOrderResponseSimple(order:Order, acceptedIndicator:boolean):OrderResponseSimple {
        let orderReference:OrderReference = this.createOrderReference(order.id);
        this.removeHjidFieldsFromObject(order.buyerCustomerParty);
        this.removeHjidFieldsFromObject(order.sellerSupplierParty);
        let customerParty:CustomerParty = order.buyerCustomerParty;
        let supplierParty:SupplierParty = order.sellerSupplierParty;
        let orderResponseSimple:OrderResponseSimple = new OrderResponseSimple("", "", acceptedIndicator, orderReference, supplierParty, customerParty);
        return orderResponseSimple;
    }

    public static createRequestForQuotation():RequestForQuotation {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice(null)
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let delivery:Delivery = this.createDelivery();
        let rfq = new RequestForQuotation(this.generateUUID(), [""], null, null, delivery, [requestForQuotationLine]);
        return rfq;
    }

    public static createQuotation(rfq:RequestForQuotation):Quotation {
        let quantity: Quantity = new Quantity(null, "", null);
        let item: Item = this.createItem();
        let price: Price = this.createPrice(null);
        let lineItem:LineItem = new LineItem(quantity, [], new Delivery(), new DeliveryTerms(), price, item, new Period(), null);
        let quotationLine:QuotationLine = new QuotationLine(lineItem, null);

        let delivery:Delivery = this.createDelivery();

        this.removeHjidFieldsFromObject(rfq.buyerCustomerParty);
        this.removeHjidFieldsFromObject(rfq.sellerSupplierParty);
        let customerParty:CustomerParty = rfq.buyerCustomerParty;
        let supplierParty:SupplierParty = rfq.sellerSupplierParty;

        let documentReference:DocumentReference = new DocumentReference(rfq.id);

        let quotation = new Quotation(this.generateUUID(), [""], 1, documentReference, customerParty, supplierParty, delivery, [quotationLine]);
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
        receiptAdvice.orderReference = [JSON.parse(JSON.stringify(despatchAdvice.orderReference))];
        receiptAdvice.despatchDocumentReference = [new DocumentReference(despatchAdvice.id)];
        receiptAdvice.deliveryCustomerParty = despatchAdvice.deliveryCustomerParty;
        receiptAdvice.despatchSupplierParty = despatchAdvice.despatchSupplierParty;
        receiptAdvice.receiptLine = [new ReceiptLine(new Quantity(), [], despatchAdvice.despatchLine[0].item)];
        return receiptAdvice;
    }

    public static createOrderReference(orderId:string):OrderReference {
        let documentReference:DocumentReference = new DocumentReference(orderId);
        let orderReference:OrderReference = new OrderReference(documentReference);
        return orderReference;
    }

    public static createItem():Item {
        let item = new Item("", "", [], false, [], null, this.createItemIdentification(), null, null, [], [], [], null, null, [], "");
        return item;
    }

    public static createLineItem(quantity, price, item):LineItem {
        return new LineItem(quantity, [], new Delivery(), new DeliveryTerms(), price, item, new Period(), null);
    }

    public static createPackage():Package {
        return new Package(this.createQuantity(), this.createCode(), null);
    }

    public static createPrice(amount: string): Price {
        // create amount
        if(amount == null) {
            amount = "EUR";
        }
        let amountObj: Amount = this.createAmountWithCurrency("EUR");
        let quantity: Quantity = this.createQuantity();
        let price: Price = new Price(amountObj, quantity);
        return price;
    }

    public static createDelivery():Delivery {
        return new Delivery(new Period(), this.createDeliveryTerms());
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
        return new Dimension(attributeId, quantity, null, null, null, null);
    }

    public static createAddress():Address {
        return new Address(null, this.createCountry());
    }

    public static createCountry():Country {
        return new Country(null, null, null);
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

    public static createCode():Code {
        return new Code(null, null, null, null);
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

    private static generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };
}
