/**
 * Created by suat on 05-Aug-17.
 */
import {Pipe, PipeTransform} from '@angular/core';
import {ItemProperty} from "./model/publish/item-property";
import {Category} from "./model/category/category";
import {Property} from "./model/category/property";
import {CategoryService} from "./category/category.service";
import {ProductPropertiesComponent} from "./product-properties.component";
import {PublishService} from "./publish-and-aip.service";
import {CatalogueLine} from "./model/publish/catalogue-line";

/**
 * Pipe to return correct data source of an item property based on its value qualifier
 */
@Pipe({name: 'itemPropertyDataSourcePipe'})
export class ItemPropertyDataSourcePipe implements PipeTransform {

    transform(qualifier:string, itemProperty: ItemProperty): Array<any> {
        if (itemProperty.valueQualifier == "STRING") {
            console.log("Returning value array");
            return itemProperty.value;
            //return [].concat(itemProperty.value);
        } else if (itemProperty.valueQualifier == "REAL_MEASURE") {
            console.log("Returning value decimal array");
            return itemProperty.valueDecimal;
            //return [].concat(itemProperty.valueDecimal);
        } else if (itemProperty.valueQualifier == "BINARY") {
            return itemProperty.valueBinary;
        }
        return [];
    }
}