/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import { BinaryObject } from "../catalogue/model/publish/binary-object";
import { CatalogueService } from '../catalogue/catalogue.service';
import { DEFAULT_LANGUAGE, LANGUAGES } from "../catalogue/model/constants";
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "file-input",
    templateUrl: "./file-input.component.html",
    styleUrls: ["./file-input.component.css"],
})
export class FileInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() languageEnabled: boolean = false;

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() small: boolean = false;

    @Input() accept: string = "*/*";
    @Input() multiple: boolean = false;
    @Input() maxSize: number = 5;

    @Output() onSelectFile: EventEmitter<BinaryObject> = new EventEmitter();
    @Output() onClearFile: EventEmitter<BinaryObject> = new EventEmitter();
    @Output() onRemovingEmit: EventEmitter<boolean> = new EventEmitter();

    @Input() binaryObjects: BinaryObject[] = [];

    activeLanguage = DEFAULT_LANGUAGE();
    fileExistsWithDefaultLanguage: boolean = false;
    private languages: Array<string> = LANGUAGES;
    selectedLanguage: string;

    constructor(public catalogueService: CatalogueService, private translate: TranslateService) {
    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        for (let binaryObject of this.binaryObjects) {
            if (binaryObject.languageID == this.activeLanguage) {
                this.fileExistsWithDefaultLanguage = true;
            }
        }
        // initialize the selected language for new files
        this.setSelectedLanguage()
    }

    onChooseFile(event: any): void {
        const fileList: FileList = event.target.files;
        const file = fileList.length > 0 ? fileList[0] : null;
        // reset the input
        event.target.value = "";
        if (file) {
            const filesize = parseInt(((file.size / 1024) / 1024).toFixed(4));
            if (filesize < this.maxSize) {
                const reader = new FileReader();
                const self = this;
                reader.onload = function() {
                    const base64String = (reader.result as string).split(',').pop();
                    const binaryObject = new BinaryObject(base64String, file.type, file.name, "", self.selectedLanguage);
                    self.binaryObjects.push(binaryObject);
                    self.onSelectFile.emit(binaryObject);
                    self.setSelectedLanguage()
                };
                reader.readAsDataURL(file);
            }
            else {
                alert("Maximum allowed filesize: " + this.maxSize + " MB");
            }
        }
    }

    onRemoveFile(index: number) {
        const removed = this.binaryObjects.splice(index, 1);
        if (removed.length > 0) {
            this.onClearFile.emit(removed[0]);
            this.onRemovingEmit.emit(true);
            this.setSelectedLanguage()
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
            console.error("Failed to download the file", error);
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
            && (this.multiple || this.binaryObjects.length === 0) && (this.languages.length !== this.binaryObjects.length);
    }

    /**
     * Method to find the language ids which are not used for the file names
     * */
    getAvailableLanguagesForFiles(){
        let languageIds = this.binaryObjects.map(value => value.languageID);
        return this.languages.filter(languageId => languageIds.indexOf(languageId) == -1);
    }

    /**
     * Returns the available languages for the given file language
     * */
    getLanguagesForFile(fileLanguage:string){
        let languageIds = this.getAvailableLanguagesForFiles();
        if(fileLanguage && languageIds.indexOf(fileLanguage) === -1){
            languageIds.push(fileLanguage);
        }
        return languageIds;
    }

    /**
     * Sets the selected language based on the available and default languages
     * */
    setSelectedLanguage(){
        let availableLanguages = this.getAvailableLanguagesForFiles();
        this.selectedLanguage = availableLanguages[0];
        if(availableLanguages.indexOf(this.activeLanguage) !== -1){
            this.selectedLanguage = this.activeLanguage;
        }
    }

    /**
     * Updates the selected language for new files when a language is selected for a file
     * */
    onLanguageIdSelected(){
        let availableLanguages = this.getAvailableLanguagesForFiles();
        this.selectedLanguage = availableLanguages[0];
    }
}
