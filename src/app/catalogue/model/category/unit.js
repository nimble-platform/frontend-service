"use strict";
/**
 * Created by suat on 12-May-17.
 */
class Unit {
    constructor(id, structuredName, shortName, definition, source, comment, siNotation, siName, dinNotation, eceName, eceCode, nistName, iecClassification, nameOfDedicatedQuantity) {
        this.id = id;
        this.structuredName = structuredName;
        this.shortName = shortName;
        this.definition = definition;
        this.source = source;
        this.comment = comment;
        this.siNotation = siNotation;
        this.siName = siName;
        this.dinNotation = dinNotation;
        this.eceName = eceName;
        this.eceCode = eceCode;
        this.nistName = nistName;
        this.iecClassification = iecClassification;
        this.nameOfDedicatedQuantity = nameOfDedicatedQuantity;
    }
}
exports.Unit = Unit;
//# sourceMappingURL=unit.js.map