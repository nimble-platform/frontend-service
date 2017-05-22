"use strict";
class Property {
    constructor(id, preferredName, shortName, definition, note, remark, preferredSymbol, unit, iecCategory, attributeType, dataType, synonyms, values) {
        this.id = id;
        this.preferredName = preferredName;
        this.shortName = shortName;
        this.definition = definition;
        this.note = note;
        this.remark = remark;
        this.preferredSymbol = preferredSymbol;
        this.unit = unit;
        this.iecCategory = iecCategory;
        this.attributeType = attributeType;
        this.dataType = dataType;
        this.synonyms = synonyms;
        this.values = values;
    }
}
exports.Property = Property;
//# sourceMappingURL=property.js.map