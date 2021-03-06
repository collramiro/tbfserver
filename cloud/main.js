
Parse.Cloud.define('hello', function(req, res) {
	query = new Parse.Query("Fighter");

	query.each(function(fighter){
		console.log("Updating object: " + fighter.id);

		var promise = Parse.Promise.as();

		var factorTotal = 0.0;
		var count = 0;

		promise = promise.then(function() {

			var videoQuery = new Parse.Query("Video");
			videoQuery.equalTo("fighter", fighter);

			factorTotal = 0.0;
			count = 0;

			return videoQuery.each(function(video) {

				factorTotal = factorTotal + video.get("factor");
				count++;

			});

		}).then(function() {
			console.log("factorTotal = " + factorTotal);
			console.log("count = " + count);
			if (count > 0) {
				fighter.set("factor", factorTotal/count);
			}else{
				fighter.set("factor", 0);
			}

			return fighter.save()
		}).then(function(savedFighter) {
			// console.log("figtherFactor = " + savedFighter.get("factor"));
		});

		return promise;

	}).then(function(result) {
		query = new Parse.Query("Fighter");
		query.descending("factor");
		return query.find();
		// res.success('Hi Ramiro');
	}).then(function(fighters) {
		var index;
		for (index = 0; index < fighters.length; ++index) {
			var currentFighter = fighters[index];
			console.log("figtherFactor = " + currentFighter.get("factor"));
			currentFighter.set("previousRanking", currentFighter.get("ranking"));
			currentFighter.set("ranking", index+1);
			currentFighter.save();
		}

		res.success('Hi Ramiro');
	}, function(error) {
		res.error("There was an error" + error);
	});
});

/*
	return event.save().then(function(fighter) {
		console.log("Updated object: " + fighter.id);
		return fighter;
	}, function(error) {
		response.error('Failed to update fighter, with error code: ' + error.message);
	});*/

Parse.Cloud.define("videoViewed", function(request, response) {
	var Video = Parse.Object.extend("Video");
	var video = new Video();

	query = new Parse.Query("Video");

	query.get(request.params.videoObjectId).then(function(videoResult){
		video = videoResult;
		video.increment("loops");
		return Parse.Cloud.run('estimateVideoFactor', { likes: video.get("likes"), loops: video.get("loops"), shares: 0 });
	}).then(function(factor) {
		video.set("factor", factor);
		return video.save();
	}).then(function(savedVideo) {
		query = new Parse.Query("Fighter");
		return query.get(video.get("fighter").id);
	}).then(function(fighter) {
		fighter.increment("loops");
		return fighter.save(null, {useMasterKey:true});
	}).then(function(result) {
		response.success('Succesfully updated loops for video with objectId: ' + video.id);
	}, function(error) {
		response.error('Failed to update loops, with error code: ' + error.message);
	});
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
						//SEND PUSH
						var query = new Parse.Query(Parse.Installation);
						query.equalTo("objectId", user.installationObjectId);
						Parse.Push.send({
						where: query,
						// Parse.Push requires a dictionary, not a string.
						data: {
						"alert": "A " + user.name + " le a gustado el video que has subido"
						},
						}, { success: function() {
		 		  		console.log("#### PUSH OK");
						}, error: function(error) {
		  			 	console.log("#### PUSH ERROR" + error.message);
						}, useMasterKey: true});	
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

	var Video = Parse.Object.extend("Video");
	var video = new Video();

	query = new Parse.Query("Video");

	query.get(request.object.get("video").id).then(function(videoResult){
		video = videoResult;
		var relation = video.relation("likesRelations");
		relation.add(request.object);
		video.increment("likes");
		return Parse.Cloud.run('estimateVideoFactor', { likes: video.get("likes"), loops: video.get("loops"), shares: 0 });
	}).then(function(factor) {
		video.set("factor", factor);
		return video.save();
	}).then(function(savedVideo) {
		query = new Parse.Query("_User");
		return query.get(request.object.get("user").id);
	}).then(function(user) {
		var relation = user.relation("likedVideos");
		relation.add(request.object);
		user.increment("likes");
		
		return user.save(null, {useMasterKey:true});
	}).then(function(result) {
	
	}, function(error) {
		console.error("Got an error " + error.code + " : " + error.message);
	});
/*
	query.get(request.object.get("video").id, {
		success: function(video) {
			var relation = video.relation("likesRelations");
			relation.add(request.object);
			video.increment("likes");

			Parse.Cloud.run('estimateVideoFactor', { likes: video.get("likes"), loops: video.get("loops"), shares: 0 }, {
				success: function(factor) {
					video.set("factor", factor);
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

				}
			});
		},
		error: function(error) {
			console.error("Got an error " + error.code + " : " + error.message);
		}
	});*/
});

Parse.Cloud.afterDelete("Like", function(request) {
	var Video = Parse.Object.extend("Video");
	var video = new Video();

	query = new Parse.Query("Video");

	query.get(request.object.get("video").id).then(function(videoResult){
		video = videoResult;
		var relation = video.relation("likesRelations");
		relation.remove(request.object);
		video.increment("likes", -1);
		return Parse.Cloud.run('estimateVideoFactor', { likes: video.get("likes"), loops: video.get("loops"), shares: 0 });
	}).then(function(factor) {
		video.set("factor", factor);
		return video.save();
	}).then(function(savedVideo) {
		query = new Parse.Query("_User");
		return query.get(request.object.get("user").id);
	}).then(function(user) {
		var relation = user.relation("likedVideos");
		relation.remove(request.object);
		user.increment("likes", -1);
		return user.save(null, {useMasterKey:true});
	}).then(function(result) {

	}, function(error) {
		console.error("Got an error " + error.code + " : " + error.message);
	});
/*
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
	});*/
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

Parse.Cloud.define('estimateVideoFactor', function(request, response) {
	var likes = request.params.likes;
	var loops = request.params.loops;
	var shares = request.params.shares;
	var factor = (likes + loops + shares) / 100;
	response.success(factor);
});

Parse.Cloud.define('estimateFighterFactor', function(request, response) {
	var likes = request.params.likes;
	var loops = request.params.loops;
	var shares = request.params.shares;
	var factor = (likes + loops + shares) / 100;
	response.success(factor);
});

Parse.Cloud.job("rankFighters", function(request, status) {
  // the params passed through the start request
  var params = request.params;
  // Headers from the request that triggered the job
  var headers = request.headers;

  // get the parse-server logger
  var log = request.log;

  // Update the Job status message
  status.message("I just started");

  query = new Parse.Query("Fighter");

  query.each(function(fighter){
  	console.log("Updating object: " + fighter.id);

  	var promise = Parse.Promise.as();

  	var factorTotal = 0.0;
  	var count = 0;

  	promise = promise.then(function() {

  		var videoQuery = new Parse.Query("Video");
  		videoQuery.equalTo("fighter", fighter);

  		factorTotal = 0.0;
  		count = 0;

  		return videoQuery.each(function(video) {

  			factorTotal = factorTotal + video.get("factor");
  			count++;

  		});

  	}).then(function() {
  		console.log("factorTotal = " + factorTotal);
  		console.log("count = " + count);
  		if (count > 0) {
  			fighter.set("factor", factorTotal/count);
  		}else{
  			fighter.set("factor", 0);
  		}

  		return fighter.save()
  	}).then(function(savedFighter) {
			// console.log("figtherFactor = " + savedFighter.get("factor"));
		});

  	return promise;

  }).then(function(result) {
  	query = new Parse.Query("Fighter");
  	query.descending("factor");
  	return query.find();
		// res.success('Hi Ramiro');
	}).then(function(fighters) {
		var index;
		for (index = 0; index < fighters.length; ++index) {
			var currentFighter = fighters[index];
			currentFighter.set("previousRanking", currentFighter.get("ranking"));
			currentFighter.set("ranking", index+1);
			console.log("id = " + currentFighter.id + " ranking = " + currentFighter.get("ranking") + " factor = " + currentFighter.get("factor"));
			currentFighter.save();
		}

		status.success("I just finished");
	}, function(error) {
		status.error("There was an error");
	});
});

Parse.Cloud.define("followFighter", function(request, response) {
	var query = new Parse.Query("Follow");
	query.equalTo("fighterObjectId", request.params.fighterObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);

	query.find({
		success: function(results) {
			if (results.length > 0) {
				var follow = results[0];
				response.success('Already Followed: ' + follow.id);
			} else {
				var Follow = Parse.Object.extend("Follow");
				var follow = new Follow();

				var User = Parse.Object.extend("_User");
				var user = new User();
				user.id = request.params.userObjectId;
				follow.set("user", user);
				follow.set("userObjectId", user.id);

				var Fighter = Parse.Object.extend("Fighter");
				var fighter = new Fighter();
				fighter.id = request.params.fighterObjectId;
				follow.set("fighter", fighter);
				follow.set("fighterObjectId", fighter.id);
				var pushQuery = new Parse.Query(Parse.Installation);
				follow.save(null, {
					success: function(follow) {
						/*Parse.Push.send({
							where: pushQuery,
							data: { 
								"title": "Ant-man",
								"alert": "This is awesome. It is awesome."
							}
						}, { useMasterKey: true });*/
						response.success('New follow created with objectId: ' + follow.id);
					},
					error: function(follow, error) {
						response.error('Failed to create new follow, with error code: ' + error.message);
					}
				});
			};
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.define('pingReply', function(request, response) {
	var params = request.params;
	var customData = params.customData;
  
	if (!customData) {
	  response.error("Missing customData!")
	}
  
	var sender = JSON.parse(customData).sender;
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("objectId", sender);
	Parse.Push.send({
	where: query,
	// Parse.Push requires a dictionary, not a string.
	data: {
		"title": "Ant-man",		
		"alert": "The Giants scored!"
	},
	}, { success: function() {
	   console.log("#### PUSH OK");
	}, error: function(error) {
	   console.log("#### PUSH ERROR" + error.message);
	}, useMasterKey: true});
  
	response.success('success');
  });

Parse.Cloud.define("unfollowFighter", function(request, response) {
	var query = new Parse.Query("Follow");
	query.equalTo("fighterObjectId", request.params.fighterObjectId);
	query.equalTo("userObjectId", request.params.userObjectId);
	query.find({
		success: function(results) {
			if (results.length > 0) {
				var follow = results[0];
				follow.destroy({
					success: function(follow) {
						response.success('Follow removed with objectId: ' + follow.id);
					},
					error: function(follow, error) {
						response.error('Failed to remove follow, with error code: ' + error.message);
					}
				});
			} else {
				response.error("Not found follow object");
			};
		},
		error: function(error) {
			response.error("Error: " + error.code + " " + error.message);
		}
	});
});

Parse.Cloud.afterSave("Follow", function(request) {
	var Fighter = Parse.Object.extend("Fighter");
	var fighter = new Fighter();

	query = new Parse.Query("Fighter");

	query.get(request.object.get("fighter").id).then(function(fighterResult){
		fighter = fighterResult;
		var relation = fighter.relation("followsRelations");
		relation.add(request.object);
		fighter.increment("follows");
		return fighter.save();
	}).then(function(savedFighter) {
		query = new Parse.Query("_User");
		return query.get(request.object.get("user").id);
	}).then(function(user) {
		var relation = user.relation("followedRelations");
		relation.add(request.object);
		user.increment("followeds");
		return user.save(null, {useMasterKey:true});
	}).then(function(result) {

	}, function(error) {
		console.error("Got an error " + error.code + " : " + error.message);
	});
});

Parse.Cloud.afterDelete("Follow", function(request) {
	var Fighter = Parse.Object.extend("Fighter");
	var fighter = new Fighter();

	query = new Parse.Query("Fighter");

	query.get(request.object.get("fighter").id).then(function(fighterResult){
		fighter = fighterResult;
		var relation = fighter.relation("followsRelations");
		relation.remove(request.object);
		fighter.increment("follows", -1);
		return fighter.save();
	}).then(function(savedFighter) {
		query = new Parse.Query("_User");
		return query.get(request.object.get("user").id);
	}).then(function(user) {
		var relation = user.relation("followedRelations");
		relation.remove(request.object);
		user.increment("followeds", -1);
		return user.save(null, {useMasterKey:true});
	}).then(function(result) {

	}, function(error) {
		console.error("Got an error " + error.code + " : " + error.message);
	});
});

Parse.Cloud.define("getUserFeed", function(request, response) {
	var query = new Parse.Query("Follow");
	query.equalTo("userObjectId", request.params.userObjectId);

	query.find().then(function(followsResult){
		if (followsResult.length == 0) {
			response.error('The user is not following to any user.');
		} else {
			var Fighter = Parse.Object.extend("Fighter");
			var fighters = [];
			var fighter = {};
			var index;
			/*
			for (index = 0; index < followsResult.length; ++index) {
				var currentFollow = followsResult[index];
				fighter = new Fighter();
				fighter.id = currentFollow.get("fighterObjectId");
				fighters.push(fighter);
				fighter = {};
			}*/
			for (index = 0; index < followsResult.length; ++index) {
				var currentFollow = followsResult[index];
				fighters.push(currentFollow.get("fighter"));
			}

			var videoQuery = new Parse.Query("Video");
			videoQuery.containedIn("fighter", fighters);
			videoQuery.include("fighter");
			videoQuery.include("uploadedBy");
			query.descending("createdAt");
			return videoQuery.find();
		}
	}).then(function(videoResult){
		response.success(videoResult);
	}, function(error) {
		response.error("Error: " + error.code + " " + error.message);
	});
});