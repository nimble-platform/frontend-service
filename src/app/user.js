"use strict";
var User = (function () {
    function User(firstname, lastname, jobTitle, email, dateOfBirth, placeOfBirth, legalDomain, phoneNumber, password, 
        /* ToDo: Hackathon only BEGIN */
        companyName, companyAddress, companyCountry) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.jobTitle = jobTitle;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.placeOfBirth = placeOfBirth;
        this.legalDomain = legalDomain;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.companyName = companyName;
        this.companyAddress = companyAddress;
        this.companyCountry = companyCountry;
    }
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map