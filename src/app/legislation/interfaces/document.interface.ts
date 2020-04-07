export interface DocumentInterface {
    mainAttr?: MainAttrInterface;
    specAttr?: SpecAttrInterface;
}

export interface MainAttrInterface {
    documentId?: string,
    documentType?: string;

    dateEntry?: string;

    code?: string;
    title?: string;
    description?: string;
}

export interface SpecAttrInterface {
    regulationType?: string;
    regulationNumber?: string;
    technicalCommittee?: string;
    editingDate?: string;
    numOfPages?: string;
    language?: string;
    identifyEN?: string;

    legalAssessment?: string;
    link?: string;
    country?: string;
    publicationDate?: string;
    documentOrigin?: string;

    authors?: string;
    dateOfDocument?: string;

    patentCode?: string;
    descriptors?: string;
}
