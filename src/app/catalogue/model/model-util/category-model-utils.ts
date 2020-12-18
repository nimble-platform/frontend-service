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

import {Category} from '../category/category';
import {LanguageUtils} from './language-utils';
import {Text} from '../publish/text';
import {Property} from '../category/property';

export class CategoryModelUtils {
    /**
     * Transforms the category obtained from the index (Solr) to model maintained by the relational database
     */
    public static transformIndexCategoryToDbCategory(indexCategory: any): Category {
        const uri: string = indexCategory.uri;
        const preferredName: Text[] = LanguageUtils.transformIndexLabelsToTextArray(indexCategory.label);
        // for now these fields are sufficient, add the others if needed
        const categoryId:  string = uri.substring(uri.indexOf('#') + 1);
        const category: Category = new Category(
            categoryId,
            preferredName,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            uri);
        return category;
    }
}
