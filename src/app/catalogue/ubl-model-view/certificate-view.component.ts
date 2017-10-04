import {Component, Input} from "@angular/core";
import {Certificate} from "../model/publish/certificate";
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

    addNewValue():void {
        let certificate:Certificate = new Certificate();
        this.certificates.push(certificate);
    }

    removeValue(index:number):void {
        this.certificates.splice(index, 1);
    }
}
