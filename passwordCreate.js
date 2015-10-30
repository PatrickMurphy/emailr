var bcrypt = require('bcrypt-nodejs');
var hasher = null;
function storePassword(err, hash){
	hasher = hash;
	 console.log(hash);
	bcrypt.compare("Gooseyss1", hasher, function(err, res) {
    console.log(res,err);
});
}
var i = 1;
function progress(data,data1,data2,data3){
	(i++);
}
bcrypt.hash("Gooseyss1", null, null, storePassword);

