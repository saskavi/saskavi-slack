// app.js
// Main slack handler
//

var ferb = require('ferb')();
var pm2 = require('pm2');
var request = require('request');

var getProcessList = function(cb) {
	pm2.connect(function(err) {
		if (err) return cb(err);

		pm2.list(function(err, lst) {
			if (err) return cb(err);

			cb(null, lst.map(function(p) {
				return {
					name: p.name,
					memory: p.monit.memory,
					cpu: p.monit.cpu,
					status: p.pm2_env.status
				};
			}));
		});

		console.log(err);
	});
};

var postMessage = function(obj, cb) {
	request.post("https://fresk.slack.com/services/hooks/incoming-webhook?token=M7b4ztUdilxOYpu8IuCwnegL", {
		form: {payload: JSON.stringify(obj)}
	}, function(err, r, body) {
		if (err) return cb(err);
		cb();
	});
};

var sendProcsInfo = function() {
	getProcessList(function(err, list) {
		if (err) return;

		var mem = function(v) {
			return (v / 1000000.0).toFixed(2) + "MB";
		};

		var s = list.map(function(v) {
			return "```" + v.name + ": " + v.status + ", mem: " +
				mem(v.memory) + ", cpu: " + v.cpu + "%" + "```";
		}).join(", ");

		if (s.length === 0)
			s = "```No processes```";

		postMessage({text: s, username: "SASSY BOT", icon_emoji: ":rage2:"}, function(){});
	});
};

var validToken = function(key) {
	var keys = ["44sZ0zSY2SrdPSxEhNCSPu5p"];
	for (var i in keys) {
		if (keys[i] === key)
			return true;
	}

	return false;
};


ferb.post("/", function(req, res) {
	var key = req.body.token;
	if (!validToken(key)) {
		return res.json(403, "This command is not authorized!");
	}

	if (req.body.command === "/procs")
		process.nextTick(sendProcsInfo);

	res.send(200, "Hold on a second while I fetch stuff");
});

ferb.listen(process.env.PORT || 16999);


