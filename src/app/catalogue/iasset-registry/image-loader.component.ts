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

import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { PublishMode } from "../model/publish/publish-mode";
import { Text } from '../model/publish/text';
import { DEFAULT_LANGUAGE } from '../model/constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BinaryObject } from '../model/publish/binary-object';
import { TranslateService } from '@ngx-translate/core';
import { ChildFormBase } from '../../common/validation/child-form-base';
import { EmptyFormBase } from '../../common/validation/empty-form-base';
const BASIC_PRODUCT_DETAILS = 'basic_product_details';

//-------------------------------------------------------------------------------------
// Component
//-------------------------------------------------------------------------------------
@Component({
selector: "image-loader",
templateUrl: "./image-loader.component.html",
styleUrls: ["./image-loader.component.css"]
})

export class AssetImageLoader extends EmptyFormBase implements OnInit {

constructor(private modalService: NgbModal,
        private translate: TranslateService) {
        super(BASIC_PRODUCT_DETAILS);
    }

    @Input() productImage: BinaryObject[];

    ngOnInit() {
        this.initViewFormAndAddToParentForm();
    }

    onDecreaseIndex(index: number): void {
        //this.removeHjidsFromImages();
        let tmp_img = this.productImage[index - 1];
        this.productImage[index - 1] = this.productImage[index];
        this.productImage[index] = tmp_img;
    }

    onIncreaseIndex(index: number): void {
        //this.removeHjidsFromImages();
        let tmp_img = this.productImage[index + 1];
        this.productImage[index + 1] = this.productImage[index];
        this.productImage[index] = tmp_img;
    }

    onRemoveImage(index: number): void {
        this.productImage.splice(index, 1);
    }

    onClickImageRecommendations(content): void {
        this.modalService.open(content);
    }

    onAddImage(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let images = this.productImage;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                const filesize = parseInt(((file.size / 1024) / 1024).toFixed(4));
                if (filesize <= 5) {
                    let reader = new FileReader();

                    reader.onload = function(e: any) {
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

    //removeHjidsFromImages() {
    //    for (var i = 0; i < this.productImage.length; i++) {
    //        this.productImage[i].hjid = null;
    //    }
    //}

    //onLineIdChange(): void {
    //    this.catalogueLine.id = this.catalogueLine.goodsItem.item.manufacturersItemIdentification.id;
    //}
}