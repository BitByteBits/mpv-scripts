/**
 * https://github.com/BitByteBits/mpv-scripts
 *
 * MPV Toggle Windows Loudness Equalization
 *
 * Deactivate loudness equalization on start to not ruin ffmpeg audio filters applied and will activate it on exit.
 * Using TLE exe from https://forums.mydigitallife.net/threads/req-script-to-enable-disable-windows-built-in-loudness-equalization.53479/#post-952089
 * TLE exe might not work on some machines. Tested on Realtek 2.79 (6.0.1.7541)
 */

var exe = mp.command_native(["expand-path", "~/scripts/misc/ToggleLoudnessEqualization/ToggleLoudnessEqualization.exe"]);

// 0 = off | 1 = on
function toggleLoudnessEqualization(toggle) {
    var args = [exe, parseInt(toggle, 10).toString()];
    mp.command_native_async({
        name: 'subprocess',
        playback_only: false,
        capture_stderr: true,
        capture_stdout: true,
        args: args
    }, function (success, result, error) {
		if (success) {
			var res = parseInt(result.stdout, 10);
            if (res === "1") {
                print("Loudness Equalization Activated");
            } else {
                print("Loudness Equalization Deactivated");
            }
        } else {
            mp.msg.error(error);
        }
    });
}

mp.register_event("file-loaded", function() { toggleLoudnessEqualization(0) });
mp.register_event("shutdown", function() { toggleLoudnessEqualization(1) });
