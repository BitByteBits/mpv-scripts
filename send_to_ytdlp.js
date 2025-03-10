/**
 * https://github.com/BitByteBits/mpv-scripts
 *
 * Download the currently playing video using yt-dlp. Using CTRL+ALT+D shortcut by default.
 * Make sure yt-dlp is in %PATH% and set all the options in yt-dlp.conf then:
 *
 * - Adjust dest to your download directory (by default it'll download to your mpv directory) or by setting
 *   script-opts-append=send_to_ytdlp-destination=X:/Destination
 * - For custom shortcut add: KEY script-binding send_to_ytdlp
 * - If using UOSC find controls=menu in uosc.conf and add this inside: <video>command:file_download:script-binding send_to_ytdlp?Download
 *
 */

var o = {
	destination: "~~/"
}
mp.options.read_options(o);

function displayOverlay(text) {
	var a = mp.create_osd_overlay("ass-events");
	a.data = "{\\an2\\bord10\\1c&HFFFFFF&\\3c&H000000&}" + text;
	a.update();
	setTimeout(function() {
		a.remove();
	}, mp.get_property("osd-duration"));
}

function sendToYTDLP() {
	var path = mp.get_property("path");
	var dest = o.destination;
		dest = mp.command_native(["expand-path", dest]);
		dest = mp.command_native(["normalize-path", dest]);

	if (!path.match(/^https?:\//)) {
		displayOverlay("Invalid URL");
		return;
	}

	displayOverlay("Downloading " + path + " to " + dest);
	var args = ["yt-dlp.exe", "--paths", dest, path];
	mp.command_native_async({
		name: "subprocess",
		playback_only: false,
		capture_stderr: true,
		capture_stdout: true,
		args: args,
	},
		function (success, result, error) {
		if (success) {
			if (result.status == 0) {
				displayOverlay("Downloaded to " + dest);
				print(result.stdout);
			} else {
				displayOverlay("Something went wrong");
			}
		} else {
			mp.msg.error(error);
		}
	});
}

mp.add_key_binding("ctrl+alt+d", "send_to_ytdlp", sendToYTDLP);
