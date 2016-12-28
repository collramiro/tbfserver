
Parse.Cloud.define('hello', function(req, res) {
	res.success('Hi Ramiro');
});


Parse.Cloud.define("testCreate", function(request, response) {
	var Rate = Parse.Object.extend("Rate");
	var rate = new Rate();

	rate.set("videoObjectId", "testObjectId");
	rate.set("userObjectId", "userObjectId");

	rate.save(null, {
		success: function(rate) {
    // Execute any logic that should take place after the object is saved.
    response.success('New rate created with objectId: ' + rate.id);
},
error: function(rate, error) {
    // Execute any logic that should take place if the save fails.
    // error is a Parse.Error with an error code and message.
    response.error('Failed to create new rate, with error code: ' + error.message);
}
});
});

Parse.Cloud.define("rateVideo", function(request, response) {
	var query = new Parse.Query("Rate");
	query.equalTo("videoObjectId", request.params.videoObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);
	query.first({
		success: function(object) {
	// Successfully retrieved the object.
	response.success("Already rated");
},
error: function(error) {
	var Rate = Parse.Object.extend("Rate");
	var rate = new Rate();

	rate.set("videoObjectId", request.params.videoObjectId);
	gameScore.set("userObjectId", request.params.userObjectId);

	gameScore.save(null, {
		success: function(gameScore) {
    // Execute any logic that should take place after the object is saved.
    alert('New rate created with objectId: ' + gameScore.id);
},
error: function(gameScore, error) {
    // Execute any logic that should take place if the save fails.
    // error is a Parse.Error with an error code and message.
    alert('Failed to create new rate, with error code: ' + error.message);
}
});
}
});
});


Parse.Cloud.define("unrateVideo", function(request, response) {
	var query = new Parse.Query("Rate");
	query.equalTo("videoObjectId", request.params.videoObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);
	query.first({
		success: function(object) {

object.destroy({
  success: function(myObject) {
    // The object was deleted from the Parse Cloud.
  },
  error: function(myObject, error) {
    // The delete failed.
    // error is a Parse.Error with an error code and message.
  }
});
},
error: function(error) {
	response.error("Error: " + error.code + " " + error.message);
}
});
});