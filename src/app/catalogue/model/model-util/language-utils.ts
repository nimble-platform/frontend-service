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

import {createText} from '../../../common/utils';
import {Text} from '../publish/text';

export class LanguageUtils {
    /**
     * Creates an array of Text objects out of the label map in the form of:
     * {
     *    "en": "English label",
     *    "es": "Spanish label"
     * }
     *
     * @param labelMap
     */
    public static transformIndexLabelsToTextArray(labelMap: any): Text[] {
        const texts: Text[] = [];
        if (labelMap) {
            const langs = Object.keys(labelMap);
            for (let lang of langs) {
                texts.push(createText(labelMap[lang], lang));
            }
        }
        return texts;
    }
}
