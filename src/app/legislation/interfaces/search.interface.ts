/*
 * Copyright 2020
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

export interface SearchInterface {
    mainAttr?: SearchMainAttrInterface;
    specAttr?: SearchSpecAttrInterface;

    dateEntryFromConv?: string;
    dateEntryToConv?: string;
}

export interface SearchMainAttrInterface {
    documentType?: string;

    dateEntryFrom?: string;
    dateEntryTo?: string;

    code?: string;
    title?: string;
    description?: string;
}

export interface SearchSpecAttrInterface {
    regulationType?: string;
    regulationNumber?: string;

    descriptors0?: string;
    descriptors1?: string;
    patentCode?: string;
    company?: string;
    scope?: string;
    countriesOfInterest?: string;
    descriptors2?: string;
    authors?: string;

    dateOfDocumentFrom?: string;
    dateOfDocumentTo?: string;
    dateOfDocumentFromConv?: string;
    dateOfDocumentToConv?: string;

    country?: string;
    descriptors3?: string;

    editingDateFrom?: string;
    editingDateTo?: string;
    editingDateFromConv?: string;
    editingDateToConv?: string;
}
