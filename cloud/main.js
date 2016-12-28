
Parse.Cloud.define('hello', function(req, res) {
	res.success('Hi Ramiro');
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

				var User = Parse.Object.extend("_User");
				var user = new User();
				user.id = request.params.userObjectId;
				rate.set("user", user);
				rate.set("userObjectId", user.id);

				var Video = Parse.Object.extend("Video");
				var video = new Video();
				video.id = request.params.videoObjectId;
				rate.set("video", video);
				rate.set("videoObjectId", video.id);

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
	query.find({
		success: function(results) {
			if (results.length > 0) {
				var rate = results[0];
				rate.destroy({
					success: function(rate) {
						response.success('Rate removed with objectId: ' + rate.id);
					},
					error: function(rate, error) {
						response.error('Failed to remove rate, with error code: ' + error.message);
					}
				});
			} else {
				response.error("Not found rate object");
			};
		},
		error: function(error) {
			response.error("Error: " + error.code + " " + error.message);
		}
	});
});