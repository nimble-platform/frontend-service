import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
    selector: "file-input",
    templateUrl: "./file-input.component.html",
    styleUrls: ["./file-input.component.css"]
})
export class FileInputComponent {

    @Input() id: string;
    @Input() disabled: boolean = false;
    @Input() placeholder: string = "Choose a file...";

    @Output() onSelectFile: EventEmitter<File> = new EventEmitter();
    
    file: File;

    constructor() {
        
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
