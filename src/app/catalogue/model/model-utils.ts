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
/**
 * Created by suat on 05-Jul-17.
 */
export class ModelUtils {
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
            aip = new ItemProperty(this.generateUUID(), "", [], [], new Array<BinaryObject>(), "", "", "STRING", code, "", null);
        }
        else {
            let unit = "";
            if (property.unit != null) {
                unit = property.unit.shortName;
            }
            let valueQualifier = property.dataType;

            aip = new ItemProperty(property.id, property.preferredName, [''], [], new Array<BinaryObject>(), "", unit,
                valueQualifier, code, "", null);
        }
        return aip;
    }

    public static createCommodityClassification(category: Category): CommodityClassification {
        let code: Code = new Code(category.id, category.preferredName, category.taxonomyId, null);
        let commodityClassification = new CommodityClassification(code, null, null, "", "");
        return commodityClassification;
    }

    public static createPrice(amount: string): Price {
        // create amount
        let amountObj: Amount = new Amount(amount, "Euro");
        // price
        let price: Price = new Price(amountObj);
        return price;
    }

    public static createItemLocationQuantity(amount: string): ItemLocationQuantity {
        // create amount
        let amountObj: Amount = new Amount(amount, "Euro");
        // price
        let price: Price = new Price(amountObj);
        // item location quantity
        let ilq: ItemLocationQuantity = new ItemLocationQuantity(price, null, null, []);
        return ilq;
    }

    public static createCatalogueLine(providerParty: Party,): CatalogueLine {
        // create additional item properties
        let additionalItemProperties = new Array<ItemProperty>();

        // create item
        let item = new Item("", "", false, additionalItemProperties, providerParty, null, null, [], [], [], "", [], "");

        // create goods item
        let goodsItem = new GoodsItem(this.generateUUID(), item, null);

        // create required item location quantity
        let ilq = this.createItemLocationQuantity("");

        let catalogueLine = new CatalogueLine(null, null, null, [], ilq, goodsItem);
        return catalogueLine;
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
