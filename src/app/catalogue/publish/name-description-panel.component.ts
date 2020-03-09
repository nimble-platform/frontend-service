import {Component, Input, OnInit} from '@angular/core';
import {Text} from '../model/publish/text';
import {DEFAULT_LANGUAGE} from '../model/constants';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BinaryObject} from '../model/publish/binary-object';
import {TranslateService} from '@ngx-translate/core';
import {ChildFormBase} from '../../common/validation/child-form-base';
import {EmptyFormBase} from '../../common/validation/empty-form-base';
const BASIC_PRODUCT_DETAILS = 'basic_product_details';
@Component({
    selector: "name-description-panel",
    templateUrl: "./name-description-panel.component.html",
    styleUrls: ["./name-description-panel.component.css"]
})
export class NameDescriptionPanelComponent extends EmptyFormBase implements OnInit{

    constructor(private modalService: NgbModal,
        private translate: TranslateService) {
        super(BASIC_PRODUCT_DETAILS);
    }

    @Input() catalogueLine;
    @Input() productIdEditable;

    ngOnInit(){
        this.initViewFormAndAddToParentForm();
    }

    addItemNameDescription() {
        let newItemName: Text = new Text("",DEFAULT_LANGUAGE());
        let newItemDescription: Text = new Text("",DEFAULT_LANGUAGE());
        this.catalogueLine.goodsItem.item.name.push(newItemName);
        this.catalogueLine.goodsItem.item.description.push(newItemDescription);
    }

    deleteItemNameDescription(index){
        this.catalogueLine.goodsItem.item.name.splice(index, 1);
        this.catalogueLine.goodsItem.item.description.splice(index, 1);
    }

    removeHjidsFromImages() {
      for (var i=0; i<this.catalogueLine.goodsItem.item.productImage.length; i++) {
        this.catalogueLine.goodsItem.item.productImage[i].hjid = null;
      }
    }

    onDecreaseIndex(index: number): void {
        this.removeHjidsFromImages();
        let tmp_img = this.catalogueLine.goodsItem.item.productImage[index-1];
        this.catalogueLine.goodsItem.item.productImage[index-1] = this.catalogueLine.goodsItem.item.productImage[index];
        this.catalogueLine.goodsItem.item.productImage[index] = tmp_img;
    }

    onIncreaseIndex(index: number): void {
        this.removeHjidsFromImages();
        let tmp_img = this.catalogueLine.goodsItem.item.productImage[index+1];
        this.catalogueLine.goodsItem.item.productImage[index+1] = this.catalogueLine.goodsItem.item.productImage[index];
        this.catalogueLine.goodsItem.item.productImage[index] = tmp_img;
    }

    onRemoveImage(index: number): void {
        this.catalogueLine.goodsItem.item.productImage.splice(index, 1);
    }

    onClickImageRecommendations(content): void {
        this.modalService.open(content);
    }

    onAddImage(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let images = this.catalogueLine.goodsItem.item.productImage;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                const filesize = parseInt(((file.size/1024)/1024).toFixed(4));
                if (filesize <= 5) {
                    let reader = new FileReader();

                    reader.onload = function (e: any) {
                        let base64String = (reader.result as string).split(',').pop();
                        let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "", "");
                        images.push(binaryObject);
                    };
                    reader.readAsDataURL(file);
                }
                else {
                    alert("Maximum allowed filesize: 5 MB");
                }
            }
        }
    }

    /**
     * Input is bound to the manufacturersItemIdentification.id . Copy it to the line id
     */
    onLineIdChange(): void {
        this.catalogueLine.id = this.catalogueLine.goodsItem.item.manufacturersItemIdentification.id;
    }

    /**
     * private methods
     */

}
