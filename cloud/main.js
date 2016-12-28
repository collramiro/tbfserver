
Parse.Cloud.define('hello', function(req, res) {
	res.success('Hi Ramiro');
});


Parse.Cloud.define('hello2', function(req, res) {
	res.success('Hi Ramiro2');
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

	query.find({
		success: function(results) {
			if (results.length > 0) {
				var rate = results[0];
				response.success('Already Rated: ' + rate.id);
			} else {
				var Rate = Parse.Object.extend("Rate");
				var rate = new Rate();

				rate.set("videoObjectId", request.params.videoObjectId);
				rate.set("userObjectId", request.params.userObjectId);

				rate.save(null, {
					success: function(rate) {
						response.success('New rate created with objectId: ' + rate.id);
					},
					error: function(rate, error) {
						response.error('Failed to create new rate, with error code: ' + error.message);
					}
				});
			};
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
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