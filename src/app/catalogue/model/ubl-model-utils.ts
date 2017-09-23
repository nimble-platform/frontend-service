import {ItemProperty} from "./publish/item-property";
import {BinaryObject} from "./publish/binary-object";
import {CommodityClassification} from "./publish/commodity-classification";
import {Code} from "./publish/code";
import {Property} from "./category/property";
import {Category} from "./category/category";
import {ItemPropertyGroup} from "./publish/item-property-group";
import {Price} from "./publish/price";
import {Amount} from "./publish/amount";
import {ItemLocationQuantity} from "./publish/item-location-quantity";
import {Party} from "./publish/party";
import {Item} from "./publish/item";
import {GoodsItem} from "./publish/goods-item";
import {CatalogueLine} from "./publish/catalogue-line";
import {OrderResponseSimple} from "../../bpe/model/ubl/order-response-simple";
import {Order} from "../../bpe/model/ubl/order";
import {OrderReference} from "../../bpe/model/order-reference";
import {DocumentReference} from "./publish/document-reference";
import {ProcessVariables} from "../../bpe/model/process-variables";
import {Quantity} from "./publish/quantity";
import {LineItem} from "./publish/line-item";
import {OrderLine} from "./publish/order-line";
import {CustomerParty} from "./publish/customer-party";
import {SupplierParty} from "./publish/supplier-party";
import {DeliveryTerms} from "./publish/delivery-terms";
import {Period} from "./publish/period";
import {Package} from "./publish/package";
import {ItemIdentification} from "./publish/item-identification";
import {RequestForQuotation} from "../../bpe/model/ubl/request-for-quotation";
import {RequestForQuotationLine} from "./publish/request-for-quotation-line";
import {Delivery} from "./publish/delivery";
import {Quotation} from "../../bpe/model/ubl/quotation";
import {QuotationLine} from "./publish/quotation-line";
import {Dimension} from "./publish/dimension";
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

    public static createCatalogueLine(providerParty: Party): CatalogueLine {
        // create additional item properties
        let additionalItemProperties = new Array<ItemProperty>();

        // create item
        let item = new Item("", "", [], false, additionalItemProperties, providerParty, this.createItemIdentification(), null, [], [], [], "", [], "");

        // create goods item
        let uuid:string = this.generateUUID();
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
        let order = new Order(this.generateUUID(), "Some note", null, null, [orderLine]);
        return order;
    }

    public static createOrderResponseSimple(order:Order, acceptedIndicator:boolean):OrderResponseSimple {
        let documentReference:DocumentReference = new DocumentReference(order.id);
        let orderReference:OrderReference = new OrderReference(documentReference);
        this.removeHjidFieldsFromObject(order.buyerCustomerParty);
        this.removeHjidFieldsFromObject(order.sellerSupplierParty);
        let customerParty:CustomerParty = order.buyerCustomerParty;
        let supplierParty:SupplierParty = order.sellerSupplierParty;
        let orderResponseSimple:OrderResponseSimple = new OrderResponseSimple("", acceptedIndicator, orderReference, supplierParty, customerParty);
        return orderResponseSimple;
    }

    public static createRequestForQuotation():RequestForQuotation {
        let quantity:Quantity = new Quantity(null, "", null);
        let item:Item = this.createItem();
        let price:Price = this.createPrice(null)
        let lineItem:LineItem = this.createLineItem(quantity, price, item);
        let requestForQuotationLine:RequestForQuotationLine = new RequestForQuotationLine(lineItem);
        let delivery:Delivery = this.createDelivery();
        let rfq = new RequestForQuotation(this.generateUUID(), ["Some note"], null, null, delivery, [requestForQuotationLine]);
        return rfq;
    }

    public static createQuotation(rfq:RequestForQuotation):Quotation {
        let quantity: Quantity = new Quantity(null, "", null);
        let item: Item = this.createItem();
        let price: Price = this.createPrice(null);
        let lineItem:LineItem = new LineItem(quantity, price, item, null);
        let quotationLine:QuotationLine = new QuotationLine(lineItem, null);

        let delivery:Delivery = this.createDelivery();

        this.removeHjidFieldsFromObject(rfq.buyerCustomerParty);
        this.removeHjidFieldsFromObject(rfq.sellerSupplierParty);
        let customerParty:CustomerParty = rfq.buyerCustomerParty;
        let supplierParty:SupplierParty = rfq.sellerSupplierParty;

        let documentReference:DocumentReference = new DocumentReference(rfq.id);

        let quotation = new Quotation(this.generateUUID(), ["Some note"], 1, documentReference, customerParty, supplierParty, delivery, [quotationLine]);
        return quotation;
    }

    public static createItem():Item {
        let item = new Item("", "", [], false, [], null, this.createItemIdentification(), null, [], [], [], null, [], "");
        return item;
    }

    public static createLineItem(quantity, price, item):LineItem {
        return new LineItem(quantity, price, item, null);
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
        return new Delivery(this.createDeliveryTerms());
    }

    public static createDeliveryTerms():DeliveryTerms {
        let deliveryTerms = new DeliveryTerms(null, this.createPeriod(), null, null, this.createAmount(), null);
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

    public static createItemIdentification():ItemIdentification {
        return new ItemIdentification(this.generateUUID());
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
