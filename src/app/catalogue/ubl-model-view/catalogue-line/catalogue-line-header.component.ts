import {Component, Input, ViewChild} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {FormGroup, NgForm} from "@angular/forms";
import {BinaryObject} from "../../model/publish/binary-object";
import {Item} from '../../model/publish/item';
import {selectDescription, selectName} from '../../../common/utils';
import {ItemProperty} from '../../model/publish/item-property';
/**
 * Created by suat on 24-Oct-17.
 */

@Component({
    selector: 'catalogue-line-header',
    templateUrl: './catalogue-line-header.component.html'
})

export class CatalogueLineHeaderComponent {
    @ViewChild('catalogueLineHeaderForm') public catalogueLineHeaderForm: NgForm;
    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";
    PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS = "propertyDetails";
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();

    // after first three custom properties,check whether the rest is visible or not
    showOtherCustomProperties = false;

    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    trackByIndex(index: any, item: any) {
        return index;
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
    }

    selectDescription (item:  Item) {
        return selectDescription(item);
    }

    // private addImage(event: any) {
    //     let fileList: FileList = event.target.files;
    //     if (fileList.length > 0) {
    //         let images = this.catalogueLine.goodsItem.item.productImage;
    //
    //         for (let i = 0; i < fileList.length; i++) {
    //             let file: File = fileList[i];
    //             let reader = new FileReader();
    //
    //             reader.onload = function (e: any) {
    //                 let base64String = reader.result.split(',').pop();
    //                 let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
    //                 images.push(binaryObject);
    //             };
    //             reader.readAsDataURL(file);
    //         }
    //     }
    // }

    deleteImage(index: number): void {
        if (this.presentationMode == 'edit') {
            this.catalogueLine.goodsItem.item.productImage.splice(index, 1);
        }
    }

    changeImage(index: number): void {
        if (this.presentationMode == 'edit'){
            let x = this.catalogueLine.goodsItem.item.productImage[0];
            this.catalogueLine.goodsItem.item.productImage[0] = this.catalogueLine.goodsItem.item.productImage[index];
            this.catalogueLine.goodsItem.item.productImage[index] = x;
        }
    }
}
