/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { Text } from '../model/publish/text';
import {LANGUAGES} from '../model/constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BinaryObject } from '../model/publish/binary-object';
import { TranslateService } from '@ngx-translate/core';
import { EmptyFormBase } from '../../common/validation/empty-form-base';
const BASIC_PRODUCT_DETAILS = 'basic_product_details';
@Component({
    selector: "name-description-panel",
    templateUrl: "./name-description-panel.component.html",
    styleUrls: ["./name-description-panel.component.css"]
})
export class NameDescriptionPanelComponent extends EmptyFormBase implements OnInit {

    constructor(private modalService: NgbModal,
        private translate: TranslateService) {
        super(BASIC_PRODUCT_DETAILS);
    }

    @Input() catalogueLine;
    @Input() productIdEditable;

    LANGUAGES = LANGUAGES;

    ngOnInit() {
        this.initViewFormAndAddToParentForm();
    }

    addItemNameDescription() {
        let availableLanguages = this.getAvailableLanguagesForProductName();
        let newItemName: Text = new Text("", availableLanguages[0]);
        let newItemDescription: Text = new Text("", availableLanguages[0]);
        this.catalogueLine.goodsItem.item.name.push(newItemName);
        this.catalogueLine.goodsItem.item.description.push(newItemDescription);
    }

    deleteItemNameDescription(index) {
        this.catalogueLine.goodsItem.item.name.splice(index, 1);
        this.catalogueLine.goodsItem.item.description.splice(index, 1);
    }

    removeHjidsFromImages() {
        for (var i = 0; i < this.catalogueLine.goodsItem.item.productImage.length; i++) {
            this.catalogueLine.goodsItem.item.productImage[i].hjid = null;
        }
    }

    onDecreaseIndex(index: number): void {
        this.removeHjidsFromImages();
        let tmp_img = this.catalogueLine.goodsItem.item.productImage[index - 1];
        this.catalogueLine.goodsItem.item.productImage[index - 1] = this.catalogueLine.goodsItem.item.productImage[index];
        this.catalogueLine.goodsItem.item.productImage[index] = tmp_img;
    }

    onIncreaseIndex(index: number): void {
        this.removeHjidsFromImages();
        let tmp_img = this.catalogueLine.goodsItem.item.productImage[index + 1];
        this.catalogueLine.goodsItem.item.productImage[index + 1] = this.catalogueLine.goodsItem.item.productImage[index];
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
                const filesize = parseInt(((file.size / 1024) / 1024).toFixed(4));
                if (filesize <= 5) {
                    let reader = new FileReader();

                    reader.onload = function(e: any) {
                        let base64String = (reader.result as string).split(',').pop();
                        let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
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
     * Method to find the language ids which are not used for the product names/descriptions
     * */
    getAvailableLanguagesForProductName(){
        let languageIds = this.catalogueLine.goodsItem.item.name.map(name => name.languageID);
        return this.LANGUAGES.filter(languageId => languageIds.indexOf(languageId) == -1);
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
