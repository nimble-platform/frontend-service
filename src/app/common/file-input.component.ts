import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import { BinaryObject } from "../catalogue/model/publish/binary-object";
import {CatalogueService} from '../catalogue/catalogue.service';

@Component({
    selector: "file-input",
    templateUrl: "./file-input.component.html",
    styleUrls: ["./file-input.component.css"],
})
export class FileInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "Choose a file...";
    @Input() small: boolean = false;

    @Input() accept: string = "*/*";
    @Input() multiple: boolean = false;
    @Input() maxSize: number = 1;

    @Output() onSelectFile: EventEmitter<BinaryObject> = new EventEmitter();
    @Output() onClearFile: EventEmitter<BinaryObject> = new EventEmitter();
    @Output() onRemovingEmit: EventEmitter<boolean> = new EventEmitter();

    @Input() binaryObjects: BinaryObject[] = [];

    constructor(public catalogueService:CatalogueService) {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    onChooseFile(event: any): void {
        const fileList: FileList = event.target.files;
        const file = fileList.length > 0 ? fileList[0] : null;
        // reset the input
        event.target.value = "";
        if(file) {
            const filesize = parseInt(((file.size/1024)/1024).toFixed(4));
            if (filesize < this.maxSize) {
              const reader = new FileReader();
              const self = this;
              reader.onload = function () {
                  const base64String = (reader.result as string).split(',').pop();
                  const binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                  self.binaryObjects.push(binaryObject);
                  self.onSelectFile.emit(binaryObject);
              };
              reader.readAsDataURL(file);
            }
            else {
              alert("Maximum allowed filesize: "+this.maxSize+" MB");
            }
        }
    }

    onRemoveFile(index: number) {
        const removed = this.binaryObjects.splice(index, 1);
        if(removed.length > 0) {
            this.onClearFile.emit(removed[0]);
            this.onRemovingEmit.emit(true);
        }
    }

    onDownloadFile(file: BinaryObject, event: Event) {
        event.preventDefault();
        this.catalogueService.getBinaryObject(file.uri).then(binaryObject => {
            const binaryString = window.atob(binaryObject.value);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                const ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }
            const a = document.createElement("a");
            document.body.appendChild(a);
            const blob = new Blob([bytes], { type: binaryObject.mimeCode });
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = binaryObject.fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }).catch(error => {
            console.error("Failed to download the file",error);
        });


    }

    getFileClasses(): any {
        return {
            "no-file": true,
            disabled: this.disabled
        };
    }

    isShowingInput(): boolean {
        return this.presentationMode === 'edit'
            && (this.multiple || this.binaryObjects.length === 0);
    }
}
