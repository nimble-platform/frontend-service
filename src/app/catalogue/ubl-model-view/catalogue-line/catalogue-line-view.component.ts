import {Component, Input} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {BinaryObject} from "../../model/publish/binary-object";
import * as myGlobals from "../../../globals";
import {FormGroup} from "@angular/forms";
import {ChildForm} from "../../child-form";
import {PublishService} from "../../publish-and-aip.service";

@Component({
    selector: 'catalogue-line-view',
    templateUrl: './catalogue-line-view.component.html'
})

// Component that displays information for individual catalogue lines in the Catalogue page

export class CatalogueLineViewComponent extends ChildForm {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;

    selectedTab: string = "Product Details";
    partyRole: string = "";
    regularProductDetailsForm: FormGroup = new FormGroup({});
    transportationServiceDetailsForm: FormGroup = new FormGroup({});
	public debug = myGlobals.debug;

	constructor(private publishService: PublishService) {
	    super();
    }

	ngOnInit() {
	    this.addToParentForm('productDetails', this.regularProductDetailsForm);
	    if(this.catalogueLine.goodsItem.item.transportationServiceDetails != null) {
	        this.changePartyRole('Transport Service Provider')
        }
    }

    ngOnDestroy() {
	    this.removeFromParentForm('productDetails');
	    this.removeFromParentForm('transportationServiceDetails');
    }

    private addImage(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let images = this.catalogueLine.goodsItem.item.productImage;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function (e: any) {
                    let base64String = reader.result.split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                    images.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

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

    changePartyRole(role:string) {
        this.partyRole = role;
        if(role == 'Manufacturer') {
            this.removeFromParentForm('transportationServiceDetails');
            this.addToParentForm('productDetails', this.regularProductDetailsForm);
            this.publishService.publishedProductNature = 'Regular product';

        } else if(role == 'Transport Service Provider') {
            this.removeFromParentForm('productDetails');
            this.addToParentForm('transportationServiceDetails', this.transportationServiceDetailsForm);
            this.publishService.publishedProductNature = 'Transportation service';
        }
    }
}
