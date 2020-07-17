var parseDN = require("ldapjs").parseDN;

var dn = parseDN("cn=foo+sn=bar, ou=people, o=example");
console.log(dn);
