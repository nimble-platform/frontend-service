import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { CallStatus } from "../../common/call-status";
//import { PPAP_CERTIFICATES } from "../../catalogue/model/constants";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import { FormGroup, FormBuilder } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as myGlobals from '../../globals';

@Component({
    selector: "company-certificates-settings",
    templateUrl: "./company-certificates-settings.component.html"
})
export class CompanyCertificatesSettingsComponent implements OnInit {

    @Input() settings: CompanySettings;
    @Input() certificates: any;
    @Input() ppapLevel: any;

    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    config = myGlobals.config;
    //ppapTypes: string[] = PPAP_CERTIFICATES;
    savePpapLevelCallStatus: CallStatus = new CallStatus();

    certFile = null;
    addCertForm: FormGroup;
    saveCertCallStatus: CallStatus = new CallStatus();
    certificatesCallStatus: CallStatus = new CallStatus();

    constructor(private _fb: FormBuilder,
                private userService: UserService,
                private modalService: NgbModal,
                private cookieService: CookieService) {

    }

    ngOnInit() {

    }

    isPpapLevelDirty(): boolean {
        return this.settings.tradeDetails.ppapCompatibilityLevel !== this.ppapLevel;
    }

    onAddCertificate(content) {
        this.addCertForm = this._fb.group({
            file: [""],
            name: [""],
            description: [""],
            type: [""]
        });
        this.certFile = null;
        this.modalService.open(content);
    }

    onSaveCertificate(model: FormGroup, close: any) {
        this.saveCertCallStatus.submit();
        const fields = model.getRawValue();
        this.userService
            .saveCert(this.certFile, encodeURIComponent(fields.name), encodeURIComponent(fields.description), encodeURIComponent(fields.type), this.settings.companyID)
            .then(() => {
                close();
                this.saveCertCallStatus.callback("Certificate saved", true);
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCertCallStatus.error("Error while saving cerficate", error);
            });
    }

    onRemoveCertificate(id: string, index: number) {
        if (confirm("Are you sure that you want to delete this certificate?")) {
            this.certificatesCallStatus.submit();
            this.userService
                .deleteCert(id, this.settings.companyID)
                .then(() => {
                    this.certificatesCallStatus.callback("Succesfully deleted certificate", true);
                    this.onSaveEvent.emit();
                })
                .catch(error => {
                    this.certificatesCallStatus.error("Error while deleting certificate", error);
                });
        }
    }

    onSetCertificateFile(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            this.certFile = file;
        } else {
            this.certFile = null;
        }
    }

    onSavePpapLevel(): void {
        this.savePpapLevelCallStatus.submit();

        this.settings.tradeDetails.ppapCompatibilityLevel = this.ppapLevel;
        const userId = this.cookieService.get("user_id");
        this.userService.putSettings(this.settings, userId)
            .then(() => {
                this.savePpapLevelCallStatus.callback("Ppap level saved.", true);
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.savePpapLevelCallStatus.error("Error while saving Ppap level.", error);
            });
    }

    onDownloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

}
