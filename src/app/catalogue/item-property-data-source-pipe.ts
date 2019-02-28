/**
 * Created by suat on 05-Aug-17.
 */
import {Pipe, PipeTransform} from '@angular/core';
import {ItemProperty} from "./model/publish/item-property";
import {Category} from "./model/category/category";
import {Property} from "./model/category/property";
import {CategoryService} from "./category/category.service";
import {PublishService} from "./publish-and-aip.service";
import {CatalogueLine} from "./model/publish/catalogue-line";

/**
 * Pipe to return correct data source of an item property based on its value qualifier
 */
@Pipe({name: 'itemPropertyDataSourcePipe'})
export class ItemPropertyDataSourcePipe implements PipeTransform {

    transform(qualifier:string, itemProperty: ItemProperty): Array<any> {
        if (itemProperty.valueQualifier == "NUMBER") {
            return itemProperty.valueDecimal;
        } else if (itemProperty.valueQualifier == "BINARY") {
            return itemProperty.valueBinary;
        } else {
            return itemProperty.value;
        }
    }
}