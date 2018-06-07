import {Component, Input} from "@angular/core";
import {Certificate} from "../model/publish/certificate";
import {BPDataService} from "../../bpe/bp-view/bp-data-service";
/**
 * Created by suat on 22-Sep-17.
 */
@Component({
    selector: 'certificate-view',
    templateUrl: './certificate-view.component.html'
})

export class CertificateViewComponent {
    @Input() presentationMode: string;
    @Input() certificates: Certificate[];

    constructor(private bpDataService: BPDataService) {
    }

    addNewValue():void {
        let certificate:Certificate = new Certificate();
        this.certificates.push(certificate);
    }

    removeValue(index:number):void {
        this.certificates.splice(index, 1);
    }

    updateCertificate(event: any){
        let prevValue = this.certificates[0];
        let selectedValue = this.certificates[event.target.selectedIndex];
        this.certificates[0] = selectedValue;

        this.certificates[event.target.selectedIndex] = prevValue;
        this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.certificate = [selectedValue];
    }
}
