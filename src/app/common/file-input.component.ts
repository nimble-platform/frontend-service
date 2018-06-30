import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

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
    
    @Output() onSelectFile: EventEmitter<File> = new EventEmitter();
    file: File;
    
    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    onChooseFile(event: any): void {
        const fileList: FileList = event.target.files;
        this.file = fileList.length > 0 ? fileList[0] : null;
        this.onSelectFile.emit(this.file);
    }

    getFileName(): string {
        return this.file ? this.file.name : this.placeholder;
    }

    getFileClasses(): any {
        return {
            "no-file": !this.file,
            disabled: this.disabled
        };
    }
}
