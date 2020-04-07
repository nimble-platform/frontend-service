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
