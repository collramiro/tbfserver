
Parse.Cloud.define('hello', function(req, res) {
	res.success('Hi Ramiro');
});

Parse.Cloud.define("likeVideo", function(request, response) {
	var query = new Parse.Query("Like");
	query.equalTo("videoObjectId", request.params.videoObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);

	query.find({
		success: function(results) {
			if (results.length > 0) {
				var like = results[0];
				response.success('Already Liked: ' + like.id);
			} else {
				var Like = Parse.Object.extend("Like");
				var like = new Like();

				var User = Parse.Object.extend("_User");
				var user = new User();
				user.id = request.params.userObjectId;
				like.set("user", user);
				like.set("userObjectId", user.id);

				var Video = Parse.Object.extend("Video");
				var video = new Video();
				video.id = request.params.videoObjectId;
				like.set("video", video);
				like.set("videoObjectId", video.id);

				like.save(null, {
					success: function(like) {
						response.success('New like created with objectId: ' + like.id);
					},
					error: function(like, error) {
						response.error('Failed to create new like, with error code: ' + error.message);
					}
				});
			};
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.define("unlikeVideo", function(request, response) {
	var query = new Parse.Query("Like");
	query.equalTo("videoObjectId", request.params.videoObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);
	query.find({
		success: function(results) {
			if (results.length > 0) {
				var like = results[0];
				like.destroy({
					success: function(like) {
						response.success('Like removed with objectId: ' + like.id);
					},
					error: function(like, error) {
						response.error('Failed to remove like, with error code: ' + error.message);
					}
				});
			} else {
				response.error("Not found like object");
			};
		},
		error: function(error) {
			response.error("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.afterSave("Like", function(request) {
  query = new Parse.Query("Video");
  query.get(request.object.get("video").id, {
    success: function(video) {
      video.increment("likes");
      video.save();
    },
    error: function(error) {
      console.error("Got an error " + error.code + " : " + error.message);
    }
  });
});

Parse.Cloud.afterDelete("Like", function(request) {
  query = new Parse.Query("Video");
  query.get(request.object.get("video").id, {
    success: function(video) {
      video.increment("likes", -1);
      video.save();
    },
    error: function(error) {
      console.error("Got an error " + error.code + " : " + error.message);
    }
  });
});