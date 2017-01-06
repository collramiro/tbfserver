
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
			var relation = video.relation("likesRelations");
			relation.add(request.object);
			video.increment("likes");
			video.save();

			query = new Parse.Query("_User");
			query.get(request.object.get("user").id, {
				success: function(user) {
					var relation = user.relation("likedVideos");
					relation.add(request.object);
					user.save(null, {useMasterKey:true});
				},
				error: function(error) {
					console.error("Got an error " + error.code + " : " + error.message);
				}
			});
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
			var relation = video.relation("likesRelations");
			relation.remove(request.object);
			video.increment("likes", -1);
			video.save();

			query = new Parse.Query("_User");
			query.get(request.object.get("user").id, {
				success: function(user) {
					var relation = user.relation("likedVideos");
					relation.remove(request.object);
					user.save(null, {useMasterKey:true});
				},
				error: function(error) {
					console.error("Got an error " + error.code + " : " + error.message);
				}
			});
		},
		error: function(error) {
			console.error("Got an error " + error.code + " : " + error.message);
		}
	});
});

Parse.Cloud.define("reportVideo", function(request, response) {
	var query = new Parse.Query("VideoReport");
	query.equalTo("videoObjectId", request.params.videoObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);

	query.find({
		success: function(results) {
			if (results.length > 0) {
				var report = results[0];
				response.success('Already Reported: ' + report.id);
			} else {
				var Report = Parse.Object.extend("VideoReport");
				var report = new Report();

				var User = Parse.Object.extend("_User");
				var user = new User();
				user.id = request.params.userObjectId;
				report.set("user", user);
				report.set("userObjectId", user.id);

				var Video = Parse.Object.extend("Video");
				var video = new Video();
				video.id = request.params.videoObjectId;
				report.set("video", video);
				report.set("videoObjectId", video.id);

				report.save(null, {
					success: function(report) {
						response.success('New report created with objectId: ' + report.id);
					},
					error: function(report, error) {
						response.error('Failed to create new report, with error code: ' + error.message);
					}
				});
			};
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.afterSave("VideoReport", function(request) {
	query = new Parse.Query("Video");
	query.get(request.object.get("video").id, {
		success: function(video) {
			var relation = video.relation("reportsRelations");
			relation.add(request.object);
			video.increment("reports");
			var reports = video.get("reports");
			if (reports > 2) {
				video.set("blocked", true);
			};
			video.save();
		},
		error: function(error) {
			console.error("Got an error " + error.code + " : " + error.message);
		}
	});
});

Parse.Cloud.define("reportComment", function(request, response) {
	var query = new Parse.Query("CommentReport");
	query.equalTo("commentObjectId", request.params.commentObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);

	query.find({
		success: function(results) {
			if (results.length > 0) {
				var report = results[0];
				response.success('Already Reported: ' + report.id);
			} else {
				var Report = Parse.Object.extend("CommentReport");
				var report = new Report();

				var User = Parse.Object.extend("_User");
				var user = new User();
				user.id = request.params.userObjectId;
				report.set("user", user);
				report.set("userObjectId", user.id);

				var Comment = Parse.Object.extend("Comment");
				var comment = new Comment();
				comment.id = request.params.commentObjectId;
				report.set("comment", comment);
				report.set("commentObjectId", comment.id);

				report.save(null, {
					success: function(report) {
						query = new Parse.Query("Comment");
						query.get(request.object.get("comment").id, {
							success: function(comment) {
								var relation = comment.relation("reportsRelations");
								relation.add(request.object);
								comment.increment("reports");
								var reports = comment.get("reports");
								if (reports > 2) {
									comment.set("blocked", true);
								};
								comment.save();
							},
							error: function(error) {
								console.error("Got an error " + error.code + " : " + error.message);
							}
						});
						response.success('New report created with objectId: ' + report.id);
					},
					error: function(report, error) {
						response.error('Failed to create new report, with error code: ' + error.message);
					}
				});
			};
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.afterSave("CommentReport", function(request) {

});
