/*
 * Copyright 2020
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

import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({name: 'wordByWordTranslate'})
export class WordByWordTranslatePipe implements PipeTransform {

    constructor(private translateService: TranslateService) {

    }

    transform(sentence: string): string {
        const words: string[] = sentence.split(' ');
        const translatedSentence: string = words.map(word => this.translateService.instant(word)).join(' ');
        return translatedSentence;
    }
}
